#!/usr/bin/env node
// Sonda pro průzkum aplikace Docházka Demo.
// Projde obrazovky pro zadané role a jazyky, uloží screenshot a strom UI (maestro hierarchy)
// a vytvoří inventuru prvků + report s kandidáty na nálezy (přístupnost, překlady, formáty data).
//
// Použití:  node probe.mjs                      (všechny role a jazyky)
//           node probe.mjs --roles employee --langs cs   (rychlý zkušební běh)

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FLOWS = join(HERE, 'flows');

// ---------- konfigurace ----------
const PASSWORD = 'Demo2026!';
const ROLES = {
  employee: { email: 'jan.novak@demo.cz', screens: ['overview', 'timesheet', 'manual-entry', 'requests', 'new-request', 'settings'] },
  // Vedoucí má v aplikaci jen taby Schvalování a Nastavení.
  manager: { email: 'vedouci@demo.cz', screens: ['approvals', 'settings'] },
};
const LANGS = ['cs', 'sk', 'en'];
const SCREENS = {
  overview: { tab: 'tab-overview', open: 'none' },
  timesheet: { tab: 'tab-timesheet', open: 'none' },
  'manual-entry': { tab: 'tab-timesheet', open: 'btn-manual-entry', modal: true },
  requests: { tab: 'tab-requests', open: 'none' },
  'new-request': { tab: 'tab-requests', open: 'btn-new-request', modal: true },
  approvals: { tab: 'tab-approvals', open: 'none' },
  settings: { tab: 'tab-settings', open: 'none' },
};
// Text, který se mezi jazyky měnit nemá (nehlásit jako nepřeložený).
const NOT_TRANSLATED_OK = /^(Čeština|Slovenčina|English|Docházka Demo|[\w.+-]+@[\w.-]+|[\d\s:.,/hmin–-]*)$/i;
const DATE_TIME = /\b\d{1,2}\.\s?\d{1,2}\.\s?\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}:\d{2}\b/;
// Prvky mimo aplikaci (stavový řádek Androidu a obalové kontejnery). Jejich podstromy se přeskakují.
const SKIP_SUBTREE = /^com\.android\.systemui:/;
const SKIP_NODE = /^(android:id\/content|cz\.demo\.dochazka:id\/action_bar_root)$/;
// Java na Windows posílá výstup v kódování systému. Vynutíme UTF-8 a pro jistotu umíme dekódovat i cp1250.
const JAVA_ENV = { ...process.env, JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8' };
function decode(buf) {
  const utf8 = buf.toString('utf8');
  if (!utf8.includes('\uFFFD')) return utf8;
  try { return new TextDecoder('windows-1250').decode(buf); } catch { return utf8; }
}

// ---------- argumenty ----------
const args = process.argv.slice(2);
const argList = (name, all) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1].split(',') : all;
};
const roles = argList('roles', Object.keys(ROLES));
const langs = argList('langs', LANGS);

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = resolve(HERE, 'output', stamp);
mkdirSync(join(OUT, 'screenshots'), { recursive: true });
mkdirSync(join(OUT, 'hierarchy'), { recursive: true });

// ---------- pomocné funkce ----------
const q = (s) => `"${s}"`;

function maestroTest(flow, env) {
  const envArgs = Object.entries(env).map(([k, v]) => `-e ${k}=${q(v)}`).join(' ');
  const cmd = `maestro test ${envArgs} ${q(join(FLOWS, flow))}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const r = spawnSync(cmd, { shell: true, env: JAVA_ENV, maxBuffer: 50 * 1024 * 1024 });
    if (r.status === 0) return true;
    // Varování Javy (WARNING: sun.misc.Unsafe…) nejsou chyba, vynecháváme je.
    const lines = (decode(r.stdout) + '\n' + decode(r.stderr)).split(/\r?\n/)
      .map((l) => l.trim()).filter((l) => l && !/^WARNING:|JAVA_TOOL_OPTIONS/.test(l));
    const relevant = lines.filter((l) => /error|fail|not found|timeout|assert|exception|offline/i.test(l));
    console.warn(`  ! ${flow} selhal (pokus ${attempt}):\n      ${(relevant.length ? relevant : lines).slice(-5).join('\n      ')}`);
  }
  return false;
}

function hierarchy() {
  const r = spawnSync('maestro hierarchy', { shell: true, env: JAVA_ENV, maxBuffer: 100 * 1024 * 1024 });
  const out = decode(r.stdout || Buffer.alloc(0));
  const start = out.indexOf('{');
  if (start < 0) throw new Error(`maestro hierarchy nevrátil JSON: ${(out + decode(r.stderr || Buffer.alloc(0))).slice(0, 300)}`);
  return JSON.parse(out.slice(start));
}

function screenshot(file) {
  const r = spawnSync('adb', ['exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 50 * 1024 * 1024 });
  if (r.status === 0 && r.stdout.length > 0) writeFileSync(file, r.stdout);
  else console.warn('  ! screenshot se nepodařil');
}

// Projde strom a vrátí ploché pole prvků. Atribut se hledá pod více názvy, protože se mezi verzemi Maestra liší.
const pick = (a, ...keys) => { for (const k of keys) if (a[k] !== undefined && a[k] !== '') return String(a[k]); return ''; };
function flatten(node, out = [], depth = 0) {
  const a = node.attributes || {};
  const rid = pick(a, 'resource-id', 'resourceId', 'id');
  if (SKIP_SUBTREE.test(rid)) return out;
  if (SKIP_NODE.test(rid)) { for (const c of node.children || []) flatten(c, out, depth + 1); return out; }
  const el = {
    depth,
    id: pick(a, 'resource-id', 'resourceId', 'id'),
    text: pick(a, 'text'),
    a11y: pick(a, 'accessibilityText', 'content-desc', 'contentDescription'),
    hint: pick(a, 'hintText', 'hint'),
    clickable: pick(a, 'clickable') === 'true',
    enabled: pick(a, 'enabled') !== 'false',
    checked: pick(a, 'checked'),
    bounds: pick(a, 'bounds'),
    keys: Object.keys(a),
    descText: '',
  };
  out.push(el);
  const start = out.length;
  for (const c of node.children || []) flatten(c, out, depth + 1);
  // Text potomků: TalkBack u tlačítka přečte i texty uvnitř.
  el.descText = out.slice(start).map((d) => d.text || d.a11y).filter(Boolean).join(' ');
  return out;
}

const isInteractive = (e) => e.clickable || /^(btn|tab|approve|reject|entry-delete|request-cancel|toggle|login-submit|manual-save|request-submit|month)-?/.test(e.id);
const isInteresting = (e) => e.id || e.text || e.a11y || e.hint || e.clickable;
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
const md = (v) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

// ---------- běh ----------
const results = []; // { role, lang, screen, ok, elements }
for (const role of roles) {
  const cfg = ROLES[role];
  if (!cfg) { console.warn(`Neznámá role: ${role}`); continue; }
  for (const lang of langs) {
    let needSetup = true;
    for (const screen of cfg.screens) {
      const s = SCREENS[screen];
      const key = `${role}_${lang}_${screen}`;
      console.log(`→ ${key}`);
      if (needSetup) {
        console.log('    spouštím aplikaci a přihlašuji…');
        if (!maestroTest('setup.yaml', { EMAIL: cfg.email, PASSWORD, PROBE_LANG: lang })) {
          results.push({ role, lang, screen, ok: false, elements: [] });
          continue;
        }
        needSetup = false;
      }
      console.log('    přecházím na obrazovku…');
      if (!maestroTest('nav.yaml', { TAB: s.tab, OPEN: s.open })) {
        results.push({ role, lang, screen, ok: false, elements: [] });
        needSetup = true;
        continue;
      }
      console.log('    ukládám screenshot a strom UI…');
      screenshot(join(OUT, 'screenshots', `${key}.png`));
      try {
        const tree = hierarchy();
        writeFileSync(join(OUT, 'hierarchy', `${key}.json`), JSON.stringify(tree, null, 2));
        results.push({ role, lang, screen, ok: true, elements: flatten(tree).filter(isInteresting) });
      } catch (err) {
        console.warn(`  ! ${err.message}`);
        results.push({ role, lang, screen, ok: false, elements: [] });
      }
      // Formulář se nezavírá tlačítkem zpět (riziko odchodu z aplikace), další obrazovka začne čistým startem.
      if (s.modal) needSetup = true;
    }
  }
}

// ---------- inventura (CSV) ----------
const header = ['role', 'jazyk', 'obrazovka', 'testID', 'text', 'popisek_ctecky', 'hint', 'klikatelny', 'povoleny', 'text_potomku', 'bounds'];
const rows = [header.join(',')];
for (const r of results) for (const e of r.elements)
  rows.push([r.role, r.lang, r.screen, e.id, e.text, e.a11y, e.hint, e.clickable, e.enabled, e.descText, e.bounds].map(csvCell).join(','));
writeFileSync(join(OUT, 'inventory.csv'), '﻿' + rows.join('\n'), 'utf8');

// ---------- report (Markdown) ----------
const L = [];
L.push(`# Sonda Docházka Demo – ${stamp}`, '');
L.push('Automaticky generovaný přehled. Všechno v sekcích „kandidáti" je potřeba ověřit ručně, sonda jen ukazuje, kam se podívat.', '');

L.push('## Běh', '', '| Role | Jazyk | Obrazovka | Stav | Prvků |', '|---|---|---|---|---|');
for (const r of results) L.push(`| ${r.role} | ${r.lang} | ${r.screen} | ${r.ok ? 'OK' : '**SELHALO**'} | ${r.elements.length} |`);
L.push('');

L.push('## Inventura obrazovek (čeština)', '');
for (const r of results.filter((x) => x.ok && x.lang === (langs.includes('cs') ? 'cs' : langs[0]))) {
  L.push(`### ${r.role} / ${r.screen}`, '', '| testID | Text | Popisek pro čtečku | Hint | Klikatelný | Povolený |', '|---|---|---|---|---|---|');
  for (const e of r.elements) L.push(`| ${md(e.id)} | ${md(e.text)} | ${md(e.a11y)} | ${md(e.hint)} | ${e.clickable ? 'ano' : ''} | ${e.enabled ? '' : 'NE'} |`);
  L.push('');
}

L.push('## Kandidáti: přístupnost (bod 21)', '');
L.push('Interaktivní prvky, které nemají text, popisek pro čtečku ani text uvnitř. TalkBack u nich nemá co přečíst.', '');
L.push('| Role | Jazyk | Obrazovka | testID | Bounds |', '|---|---|---|---|---|');
let a11yCount = 0;
for (const r of results) for (const e of r.elements)
  if (isInteractive(e) && !e.text && !e.a11y && !e.descText) { L.push(`| ${r.role} | ${r.lang} | ${r.screen} | ${md(e.id) || '(bez id)'} | ${e.bounds} |`); a11yCount++; }
if (!a11yCount) L.push('| – | – | – | žádní kandidáti | – |');
L.push('');

L.push('## Kandidáti: nepřeložené texty (bod 19)', '');
L.push('Texty, které jsou ve slovenštině nebo angličtině stejné jako v češtině. Jména, e-maily, čísla a názvy jazyků jsou vynechané.', '');
L.push('| Role | Obrazovka | Jazyk | Text |', '|---|---|---|---|');
let trCount = 0;
for (const r of results.filter((x) => x.ok && x.lang !== 'cs')) {
  const cs = results.find((x) => x.ok && x.lang === 'cs' && x.role === r.role && x.screen === r.screen);
  if (!cs) continue;
  const csTexts = new Set(cs.elements.map((e) => e.text).filter(Boolean));
  for (const t of new Set(r.elements.map((e) => e.text).filter(Boolean)))
    if (csTexts.has(t) && /\p{L}{3,}/u.test(t) && !NOT_TRANSLATED_OK.test(t.trim())) { L.push(`| ${r.role} | ${r.screen} | ${r.lang} | ${md(t)} |`); trCount++; }
}
if (!trCount) L.push('| – | – | – | žádní kandidáti |');
L.push('');

L.push('## Datum a čas podle jazyka (bod 19)', '');
L.push('Všechny texty, které vypadají jako datum nebo čas, vedle sebe. Hledej, jestli se formát s jazykem opravdu mění.', '');
L.push('| Role | Obrazovka | Jazyk | Text |', '|---|---|---|---|');
for (const r of results.filter((x) => x.ok))
  for (const t of new Set(r.elements.flatMap((e) => [e.text, e.hint]).filter((t) => t && DATE_TIME.test(t))))
    L.push(`| ${r.role} | ${r.screen} | ${r.lang} | ${md(t)} |`);
L.push('');

const allKeys = new Set(results.flatMap((r) => r.elements.flatMap((e) => e.keys)));
L.push('## Technické', '', `Atributy, které Maestro v hierarchii vrátil: \`${[...allKeys].sort().join('`, `')}\``, '');
L.push('Kompletní stromy jsou ve složce `hierarchy/`, screenshoty ve `screenshots/`, všechny prvky v `inventory.csv`.');

writeFileSync(join(OUT, 'report.md'), L.join('\n'), 'utf8');
const failed = results.filter((r) => !r.ok).length;
console.log(`\nHotovo: ${results.length - failed}/${results.length} obrazovek. Výstup: ${OUT}`);

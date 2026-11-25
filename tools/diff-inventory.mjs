#!/usr/bin/env node
// Porovnani dvou inventur ze sondy (tools/probe/output/<datum>/inventory.csv).
//
//   node tools/diff-inventory.mjs                    nejstarsi (baseline 1.0) vs nejnovejsi beh
//   node tools/diff-inventory.mjs <novy>             <novy> vs nejstarsi
//   node tools/diff-inventory.mjs <stary> <novy>     slozky behu nebo primo inventory.csv
//   volby: --all-langs  porovna texty ve vsech jazycich (vychozi jen cs)
//
// Vypise zmeny v obrazovkach, testID, textech a prvcich bez popisku pro TalkBack,
// u odebranych testID uvede, ktere flow v tests/ je pouzivaji.
// Vystup se ulozi do slozky noveho behu jako diff-vs-<stary>.md.

import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(HERE, 'probe', 'output');
const TESTS = resolve(HERE, '..', 'tests');

const argv = process.argv.slice(2);
const allLangs = argv.includes('--all-langs');
const pos = argv.filter((a) => !a.startsWith('--'));

// ---------- CSV ----------
function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const clean = rows.filter((r) => r.length > 1 || r[0] !== '');
  const [head, ...body] = clean;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// ---------- vstupy ----------
function runDirs() {
  if (!existsSync(OUT_ROOT)) return [];
  return readdirSync(OUT_ROOT)
    .filter((d) => existsSync(join(OUT_ROOT, d, 'inventory.csv')))
    .sort()
    .map((d) => join(OUT_ROOT, d));
}
function resolveInput(arg) {
  const p = resolve(arg);
  if (!existsSync(p)) throw new Error(`Neexistuje: ${p}`);
  if (statSync(p).isDirectory()) return { csv: join(p, 'inventory.csv'), dir: p };
  return { csv: p, dir: dirname(p) };
}
const dirs = runDirs();
let oldIn, newIn;
try {
  if (pos.length >= 2) { oldIn = resolveInput(pos[0]); newIn = resolveInput(pos[1]); }
  else if (pos.length === 1) {
    if (!dirs.length) throw new Error('V tools/probe/output nic neni.');
    oldIn = resolveInput(dirs[0]); newIn = resolveInput(pos[0]);
  } else {
    if (dirs.length < 2) throw new Error('Potrebuju aspon dva behy sondy v tools/probe/output (baseline 1.0 a novy).');
    oldIn = resolveInput(dirs[0]); newIn = resolveInput(dirs[dirs.length - 1]);
  }
  if (!existsSync(oldIn.csv) || !existsSync(newIn.csv)) throw new Error('inventory.csv nenalezen.');
  if (resolve(oldIn.csv) === resolve(newIn.csv)) throw new Error('Stary a novy beh jsou stejny soubor.');
} catch (e) {
  console.error('CHYBA: ' + e.message);
  process.exit(2);
}
const oldRows = parseCsv(readFileSync(oldIn.csv, 'utf8'));
const newRows = parseCsv(readFileSync(newIn.csv, 'utf8'));

// ---------- pomocne ----------
const normText = (s) => s.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
const normId = (s) =>
  s
    .replace(/\d{4}-\d{2}-\d{2}/g, '<datum>')
    .replace(/^(entry-delete|entry|request-state|request-cancel|approve|reject)-.+$/, '$1-<id>');
const screenKey = (r) => `${r.role}/${r.obrazovka}`;
const setDiff = (a, b) => [...a].filter((x) => !b.has(x)).sort();

function group(rows, keyFn, valFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r), v = valFn(r);
    if (v === '' || v == null) continue;
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(v);
  }
  return m;
}
function diffMaps(oldM, newM) {
  const out = [];
  for (const k of [...new Set([...oldM.keys(), ...newM.keys()])].sort()) {
    const a = oldM.get(k) ?? new Set(), b = newM.get(k) ?? new Set();
    const added = setDiff(b, a), removed = setDiff(a, b);
    if (added.length || removed.length) out.push({ k, added, removed });
  }
  return out;
}
const version = (rows) => rows.find((r) => r.testID === 'app-version')?.text || '(nenalezena)';

// testy pouzivajici testID (jen odebrane)
function testsFiles() {
  if (!existsSync(TESTS)) return [];
  return readdirSync(TESTS, { recursive: true })
    .filter((f) => String(f).endsWith('.yaml'))
    .map((f) => ({ file: String(f).replaceAll('\\', '/'), text: readFileSync(join(TESTS, String(f)), 'utf8') }));
}
const yamls = testsFiles();
function usedBy(normalizedId) {
  const needle = normalizedId.split('<')[0];
  if (needle.length < 4) return [];
  return yamls.filter((y) => y.text.includes(needle)).map((y) => y.file);
}

// ---------- analyza ----------
const L = [];
const cap = (arr, n = 12) => (arr.length > n ? [...arr.slice(0, n), `... a dalsich ${arr.length - n}`] : arr);
const bullet = (arr, prefix) => cap(arr).map((x) => `  - ${prefix}\`${x}\``).join('\n');

const oldScreens = new Set(oldRows.map((r) => `${r.role}/${r.jazyk}/${r.obrazovka}`));
const newScreens = new Set(newRows.map((r) => `${r.role}/${r.jazyk}/${r.obrazovka}`));
const missingScreens = setDiff(oldScreens, newScreens);
const addedScreens = setDiff(newScreens, oldScreens);

const idDiff = diffMaps(
  group(oldRows, screenKey, (r) => (r.testID ? normId(r.testID) : '')),
  group(newRows, screenKey, (r) => (r.testID ? normId(r.testID) : '')),
);
const langFilter = (r) => allLangs || r.jazyk === 'cs';
const textKey = (r) => `${r.role}/${r.jazyk}/${r.obrazovka}`;
const textVals = (r) => [r.text, r.popisek_ctecky, r.text_potomku].map(normText).filter(Boolean);
function textGroup(rows) {
  const m = new Map();
  for (const r of rows.filter(langFilter)) {
    const k = textKey(r);
    if (!m.has(k)) m.set(k, new Set());
    for (const v of textVals(r)) m.get(k).add(v);
  }
  return m;
}
const textDiff = diffMaps(textGroup(oldRows), textGroup(newRows));

const noLabel = (rows) => {
  const m = new Map();
  for (const r of rows.filter((x) => x.jazyk === 'cs' && x.klikatelny === 'true')) {
    if (r.popisek_ctecky || r.text_potomku || r.text) continue;
    const k = screenKey(r);
    if (!m.has(k)) m.set(k, new Set());
    m.get(k).add(r.testID ? normId(r.testID) : `(bez testID) ${r.bounds}`);
  }
  return m;
};
const a11yDiff = diffMaps(noLabel(oldRows), noLabel(newRows));

// SELHALO v reportu sondy
const failedScreens = (dir) => {
  const f = join(dir, 'report.md');
  if (!existsSync(f)) return null;
  return readFileSync(f, 'utf8').split('\n').filter((l) => /SELHALO/.test(l)).map((l) => l.trim());
};
const newFailed = failedScreens(newIn.dir);

// ---------- vypis ----------
const verOld = version(oldRows), verNew = version(newRows);
L.push('# Porovnani inventur ze sondy', '');
L.push(`- Stary beh: \`${basename(oldIn.dir)}\` (verze v aplikaci: ${verOld})`);
L.push(`- Novy beh: \`${basename(newIn.dir)}\` (verze v aplikaci: ${verNew})`);
L.push(`- Radku inventury: ${oldRows.length} -> ${newRows.length}`);
L.push(`- Texty porovnany v: ${allLangs ? 'vsech jazycich' : 'cestine (volba --all-langs pro vsechny)'}`, '');

const totalChanges = missingScreens.length + addedScreens.length + idDiff.length + textDiff.length + a11yDiff.length;
if (verOld === verNew) L.push('> Pozor: stejny text `app-version` v obou behech. Probehla sonda opravdu na nove verzi?', '');
if (!totalChanges) L.push('**Zadna zmena v obrazovkach, testID, textech ani popiscich.**', '');

L.push('## Obrazovky', '');
if (!missingScreens.length && !addedScreens.length) L.push('Beze zmeny.', '');
if (missingScreens.length) {
  L.push('Chybi v novem behu (zmizela, nebo se nenacetla):', bullet(missingScreens, ''), '');
}
if (addedScreens.length) L.push('Nove v novem behu:', bullet(addedScreens, ''), '');
if (newFailed && newFailed.length) L.push('Sonda v novem behu hlasi SELHALO:', ...cap(newFailed).map((x) => `  - ${x}`), '');

L.push('## testID (data a id zaznamu normalizovana na <datum> a <id>)', '');
if (!idDiff.length) L.push('Beze zmeny.', '');
for (const d of idDiff) {
  L.push(`**${d.k}**`);
  if (d.removed.length) {
    L.push('  odebrano:');
    for (const id of cap(d.removed)) {
      const u = id.startsWith('... ') ? [] : usedBy(id);
      L.push(`  - \`${id}\`${u.length ? ' <- pouzivaji: ' + u.join(', ') : ''}`);
    }
  }
  if (d.added.length) L.push('  pridano:', bullet(d.added, ''));
  L.push('');
}

L.push('## Texty (cisla nahrazena #)', '');
if (!textDiff.length) L.push('Beze zmeny.', '');
for (const d of textDiff) {
  L.push(`**${d.k}**`);
  if (d.removed.length) L.push('  zmizelo:', bullet(d.removed, ''));
  if (d.added.length) L.push('  nove:', bullet(d.added, ''));
  L.push('');
}

L.push('## Klikaci prvky bez popisku pro TalkBack (cs, bod 21)', '');
if (!a11yDiff.length) L.push('Beze zmeny.', '');
for (const d of a11yDiff) {
  L.push(`**${d.k}**`);
  if (d.added.length) L.push('  nove bez popisku:', bullet(d.added, ''));
  if (d.removed.length) L.push('  uz popisek maji:', bullet(d.removed, ''));
  L.push('');
}

L.push('## Jak to cist', '');
L.push('- Odebrany testID, ktery pouziva flow, znamena rozbity test. Oprava selektoru je v poradku, ocekavane hodnoty a tagy known-bug se neupravuji bez rozhodnuti.');
L.push('- Zmizely nebo nove texty a prvky jsou kandidati na zmeny v release notes. Porovnej s nimi a pak teprve pust testy.');
L.push('- Strom UI obsahuje jen to, co je videt na obrazovce, a texty jsou heuristika. Zmenu je potreba potvrdit ve screenshotech sondy.');

const md = L.join('\n') + '\n';
console.log(md);
const outFile = join(newIn.dir, `diff-vs-${basename(oldIn.dir)}.md`);
try {
  writeFileSync(outFile, md, 'utf8');
  console.log(`Ulozeno: ${outFile}`);
} catch (e) {
  console.error('Nepodarilo se ulozit vystup: ' + e.message);
}
process.exit(totalChanges ? 1 : 0);

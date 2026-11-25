# Runbook: nová verze aplikace na druhém kole

Cíl: za pár minut vědět, co se v nové verzi změnilo, a teprve potom pouštět testy. Rozhoduje člověk, skripty jen třídí.

## 0. Než začneš (5 min)

| Kontrola | Příkaz | Čekáno |
|---|---|---|
| Java 17+ | `java -version` | verze 17 nebo vyšší |
| Emulátor běží | `adb devices` | `emulator-5554  device` |
| Maestro | `maestro --version` | 2.12.1 |
| Node (sonda, diff) | `node -v` | 18+ |
| Pásmo emulátoru = pásmo PC | hodiny v emulátoru vs. PC | stejný čas |
| Softwarová klávesnice | `adb shell settings put secure show_ime_with_hard_keyboard 1` | |

Repo: `git clone https://github.com/tcoudi-afk/dochazka-demo-qa` (nebo ZIP z mobilu). Na cizím notebooku chybí něco z tabulky? Pak nejdřív ruční část (bod 6), nástroje doinstaluj, jen když zbyde čas.

## 1. Instalace nové verze (2 min)

`adb install -r <cesta>\nova.apk`. Jiný podpis: nejdřív `adb uninstall cz.demo.dochazka`.
Zapiš si verzi z Nastavení (`app-version`) a přečti release notes.

## 2. Sonda (10–15 min, rychle `--roles employee --langs cs` ~3 min)

`cd tools\probe` → `node probe.mjs`. Sonda a testy nesmí běžet zároveň, sdílejí emulátor.

## 3. Co se změnilo (1 min)

`node tools\diff-inventory.mjs` porovná nejstarší běh (1.0) s nejnovějším. Čti: obrazovky, odebrané testID (u nich je vidět, které flow je používá), změněné texty, prvky bez popisku pro TalkBack. Porovnej s release notes.

## 4. Sada testů (~32 min, bez login ~21 min)

`powershell -ExecutionPolicy Bypass -File tools\run-all.ps1 -Apk <cesta>\nova.apk`
Kratší: `-Suites manual-entry,requests`. Nepiš na klávesnici PC, když má fokus emulátor.

## 5. Třídění

| Verdikt | Význam | Další krok |
|---|---|---|
| OK | očekávané jako na 1.0 | nic |
| ZMĚNA: prošel, hlídá chybu | chyba možná opravena | ověř ručně, shoda s release notes? |
| ZMĚNA: selhal, bez known-bug | regrese, změna UI nebo dat | `<ID>\maestro.log`, screenshot |
| PROSTŘEDÍ | výpadek emulátoru | pusti ten test znovu samostatně |

Smím měnit: selektory, navigaci, čekání. Očekávané hodnoty, kontroly a tagy `known-bug` jen s rozhodnutím (nová verze mohla chování změnit záměrně). Na místě je neupravuju.

## 6. Ručně (vždy, nezávisle na nástrojích)

`adb shell pm clear cz.demo.dochazka` před každým blokem, jeden uživatel (BUG-007).
Ověř ručně: opravené chyby podle release notes (BUG-012, 009, 014, 015…), jestli neopravené chyby nezměnily chování, a nové funkce z release notes.

## Když to nejde

| Problém | Řešení |
|---|---|
| `device offline` | zopakuj; `adb kill-server`, `adb devices` |
| klávesnice zakrývá tlačítka | restart emulátoru, zkontroluj bod 0 |
| testy selhávají hned na datu | kontrola oken „kdy nespouštět“ v `tests/README.md`, pásmo |
| `ExecutionPolicy` | spouštěj s `-ExecutionPolicy Bypass` |
| výpadek všeho | použij ruční část 6 a přines diff z bodu 3 |

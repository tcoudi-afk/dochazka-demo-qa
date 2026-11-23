# Automatizované testy – Docházka Demo (Maestro)

Regresní testy Android aplikace Docházka Demo 1.0 (`cz.demo.dochazka`) v nástroji [Maestro](https://maestro.mobile.dev).
Testy pracují s nainstalovaným APK jako černá skříňka, zdrojové kódy aplikace nepotřebují.

```
tests/
  flows/manual-entry/  13 regresních testů: ruční záznam, validace a výpočty ve Výkazu
  flows/requests/      5 testů žádostí o dovolenou a schvalování (R01–R05)
  flows/offline/       1 test práce bez sítě (O01)
  flows/login/         7 testů přihlášení: blokace po 5 pokusech, zápis e-mailu (L01–L07)
  subflows/            opakované kroky (přihlášení, vyplnění záznamu a žádosti, čtení součtu a zůstatku)
  scripts/             dates.js (data relativně k dnešku), parse-duration.js ("X h YY min" → minuty),
                       parse-balance.js ("8 dní" → 8)
  investigate/         diagnostika BUG-007 (nad rámec zadání, není součástí regresní sady)
```

## 1. Spuštění na čistém PC

### Co je potřeba

| Nástroj | Verze použitá při vývoji | Poznámka |
|---|---|---|
| Java (JDK) | Temurin 25.0.5 | Maestro potřebuje JDK 17 nebo novější |
| Android SDK + emulátor | Android Studio, emulátor Pixel 7, API 35 (Android 15) | stačí i jen command-line tools |
| Maestro CLI | 2.12.1 | |
| APK aplikace | Docházka Demo 1.0, soubor `dochazka-demo-1.0.apk` | https://github.com/BiLLGcz/dochazka-demo/releases |

Doporučení: obraz emulátoru **Google APIs** (ne Google Play). Na obrazu s Google Play nefunguje `adb root`
a čas zařízení jde měnit jen ručně. Testy byly vyvíjené na obrazu s Google Play.

### Windows

1. Java: nainstalovat Temurin JDK 17+ (např. `winget install EclipseAdoptium.Temurin.17.JDK`).
   Ověření: `java -version` vypíše verzi 17 nebo vyšší.
2. Android Studio → Device Manager → vytvořit zařízení Pixel 7, API 35, a spustit ho.
   Do PATH přidat `%LOCALAPPDATA%\Android\Sdk\platform-tools`. Ověření: `adb devices` vypíše `emulator-5554  device`.
3. Nastavení emulátoru (jednou, v Nastavení Androidu; systém emulátoru může zůstat anglicky):
   - **Časové pásmo stejné jako na počítači.** Settings → System → Date & time → vypnout automatické
     časové pásmo → Time zone → vybrat pásmo počítače (při vývoji Europe/Prague).
     Ověření: hodiny v emulátoru ukazují stejný čas jako počítač. Důvod: `dates.js` počítá „dnes“
     podle počítače, aplikace podle emulátoru. Emulátor ve výchozím stavu běží v UTC, při rozdílném pásmu
     se data kolem půlnoci liší o den (v Praze 0:00–1:00 v zimním čase, 0:00–2:00 v letním) a hraniční
     testy 02, 03, 04 a O01 testují jiný den.
   - **Softwarová klávesnice.** Z příkazové řádky (emulátor musí běžet):
     `adb shell settings put secure show_ime_with_hard_keyboard 1`
     Ověření: `adb shell settings get secure show_ime_with_hard_keyboard` vypíše `1`. Je to prevence: bez toho se
     Gboard po stisku klávesy na PC přepne do plovoucí lišty, která může zakrýt prvky obrazovky.
     Testy `hideKeyboard` nepoužívají (viz Pravidla), klávesnici zavírají klepnutím na neinteraktivní text.
     Když se lišta přesto objeví, pomůže restart emulátoru.
4. Maestro: stáhnout `maestro.zip` z https://github.com/mobile-dev-inc/maestro/releases (verze 2.12.1),
   rozbalit a složku `maestro\bin` přidat do PATH. Ověření: `maestro --version`.
5. Instalace aplikace: `adb install -r <cesta k dochazka-demo-1.0.apk>`.
6. Spuštění ze složky `tests` (během běhu nepsat na klávesnici PC, když má fokus okno emulátoru,
   text by se vepsal do vyplňovaného pole):
   ```
   maestro test --test-output-dir ..\docs\test-runs\posledni flows\manual-entry
   maestro test --test-output-dir ..\docs\test-runs\posledni flows\requests
   maestro test --test-output-dir ..\docs\test-runs\posledni flows\login
   maestro test --test-output-dir ..\docs\test-runs\posledni flows\offline
   ```

### Linux / macOS

```bash
# Java 17+ (balíčkovačem systému), Android SDK s emulátorem a platform-tools v PATH
export MAESTRO_VERSION=2.12.1
curl -fsSL "https://get.maestro.mobile.dev" | bash      # Maestro do ~/.maestro/bin
export PATH="$PATH:$HOME/.maestro/bin"

# Emulátor nastavit stejně jako ve Windows, krok 3 (časové pásmo, softwarová klávesnice)
adb install -r <cesta k dochazka-demo-1.0.apk>
cd tests
maestro test --test-output-dir ../docs/test-runs/posledni flows/manual-entry
maestro test --test-output-dir ../docs/test-runs/posledni flows/requests
maestro test --test-output-dir ../docs/test-runs/posledni flows/login
maestro test --test-output-dir ../docs/test-runs/posledni flows/offline
```

Postup pro Linux/macOS jsem nezkoušel, testy běžely jen na Windows.

### Očekávaný výsledek na verzi 1.0

Na 1.0 selže 10 testů s tagem `known-bug` (sekce 5). Červená sada je v pořádku, pokud selhaly právě
tyto testy a každý na kontrole ze sekce 5. Tabulka je z běhu 23. 11. v 9:47, všechny čtyři sady jedním
příkazem na Windows (emulátor s HW akcelerací): `docs/test-runs/posledni/2026-11-23_094739`.

| Sada | Testů | Prošlo | Selhalo (`known-bug`) | Doba |
|---|---|---|---|---|
| `flows/manual-entry` | 13 | 9 | 4: 01b, 07, 10, 11 | ~16 min |
| `flows/requests` | 5 | 3 | 2: R02, R03 | ~5 min |
| `flows/login` | 7 | 4 | 3: L01, L04, L06 | ~9 min |
| `flows/offline` | 1 | 0 | 1: O01 | ~2 min |
| **celkem** | **26** | **16** | **10** | **~32 min** |

### Kdy testy nespouštět

Testy počítají data relativně k dnešku. Výkaz v aplikaci ukazuje jen aktuální měsíc a test ho zatím
neumí přepnout dozadu. Žádosti se drží v aktuálním roce, v pracovních dnech bez svátků. V těchto
obdobích proto testy selžou kvůli datu, ne kvůli aplikaci:

| Kdy | Co selže | Na čem |
|---|---|---|
| 1.–2. den v měsíci | 01a, 01b, 01c, 10, 11 | „Den … je v aktuálním měsíci“ (předevčírem je v minulém měsíci) |
| 1.–7. den v měsíci | 02 | „Záznam 7 dní zpětně je ve Výkazu“ (záznam je v minulém měsíci) |
| od pondělí 7. 12. do konce roku | R03 (`known-bug`) | „Letos jsou ještě dva celé týdny Po–Pá bez svátků“ |
| od pondělí 14. 12. do konce roku | R02 (`known-bug`) | „Letos je ještě rozsah středa až pondělí bez svátků“ |
| posledních pár dní v roce (2026: od 30. 12.) | R01, R04, R05 | „Letos je ještě pracovní den za 2 a více dní“ |
| kolem půlnoci, když má emulátor jiné pásmo než počítač | hraniční testy 02, 03, 04, O01 | testují jiný den, než si myslí |

Pozor u R02 a R03: mají tag `known-bug`, takže selhání kvůli datu vypadá jako očekávané. Proto je
potřeba zkontrolovat krok, na kterém test selhal (sekce 5). Data pro prosinec jsou dopočítaná ze
`scripts/dates.js` pro rok 2026, ne ověřená během. Středa 25. 11. 2026 do žádného okna nespadá.

### Užitečné příkazy (z adresáře `tests`)

| Co | Příkaz |
|---|---|
| jeden test | `maestro test flows/manual-entry/01b-preruseni-lekar.yaml` |
| jen testy bez známých chyb | `maestro test --exclude-tags known-bug flows/manual-entry` |
| jen testy známých chyb | `maestro test --include-tags known-bug flows/manual-entry` |
| report pro CI | `maestro test --format junit --output report.xml flows/manual-entry` |
| žádosti a schvalování | `maestro test flows/requests` |
| práce bez sítě | `maestro test flows/offline` |
| přihlášení (L03 čeká přes 65 s) | `maestro test flows/login` |

Na Windows jdou cesty psát s `\` i `/`.

### Pravidla a známé problémy prostředí

- **Vždy spouštět s `--test-output-dir`.** Bez něj ukládá `takeScreenshot` snímky do
  `%USERPROFILE%\.maestro\tests\<datum-čas>` (Linux: `~/.maestro/tests`), ne k projektu.
- **`name:` ve flow nesmí obsahovat dvojtečku.** Maestro z názvu dělá složku výstupu a na Windows dvojtečka
  v názvu složky nejde. Proto jsou názvy testů bez diakritiky a bez `:`.
- **Pásmo emulátoru a softwarová klávesnice** viz Windows, krok 3.
- **Bez `hideKeyboard`.** Na emulátoru 23. 11. selhával („Couldn't hide the keyboard“) i se zapnutou
  softwarovou klávesnicí. Subflow proto klávesnici zavírají klepnutím na neinteraktivní text formuláře
  (nadpis „Ruční záznam“, „Nová žádost“, „Docházka Demo“, popisek „Typ“), formulář je v ScrollView
  a klepnutí mimo pole klávesnici zavře. Popisky polí, které mají stejný text jako nápověda v poli
  (Datum, Poznámka…), se nepoužívají, klepnutí by pole znovu aktivovalo.
- **Varování `WARNING: sun.misc.Unsafe…`** z Maestra je neškodné. První spuštění v relaci občas hlásí
  `device offline`, pomůže opakování.
- **Jazyk.** Testy cílí na české texty (typy záznamu, stavy, hlášky). Aplikace jazyk systému nepřebírá:
  po `clearState` je česky i na emulátoru s anglickým systémem (ověřeno), jazyk systému se tedy měnit nemusí.

## 2. Proč Maestro

- **Černá skříňka nad APK.** Máme jen APK, ne zdrojové kódy. Maestro ovládá nainstalovanou aplikaci přes
  accessibility strom, nic se do aplikace nepřidává ani nepřekládá.
- **testID z React Native jsou vidět.** Aplikace je React Native (Expo). Její `testID` se na Androidu
  propisují jako `resource-id`, takže testy cílí na stabilní ID (`manual-save`, `day-total-2026-11-17`),
  ne na texty nebo souřadnice. To je důležité pro novou verzi aplikace na druhém kole.
- **Čitelnost.** Flow v YAML přečte i člověk, který Maestro nezná. Opakované kroky jsou v `subflows/`
  (obdoba Page Objectů).
- **Automatické čekání a jednoduché CI.** Maestro sám čeká na prvky a animace. Pro CI stačí jeden CLI příkaz
  s JUnit reportem.

Proč ne jiné nástroje:

- **Espresso:** potřebuje zdrojové kódy a instrumentovaný build, je jen pro nativní Android.
- **Detox:** šedá skříňka, aplikace se musí sestavit s Detoxem. Ze samotného APK to nejde.
- **Appium:** jde použít i nad APK, ale potřebuje server, drivery a klientský kód. Na 26 testů je to
  zbytečně těžké a čekání se musí víc řešit ručně.

## 3. Co je automatizované a proč

Automatizované jsou čtyři oblasti:

1. **ruční záznam ve Výkazu a výpočty denního součtu** (body 7, 9, 10, 11, 12 specifikace, `flows/manual-entry`),
2. **žádosti o dovolenou a schvalování** (zůstatek, zrušení, zamítnutí, schválení, `flows/requests`),
3. **přihlášení** (body 1 a 2: blokace a zápis e-mailu, `flows/login`),
4. **práce bez sítě**, jen částečně (bod 17: opakované obnovení sítě, `flows/offline`).

Jádro jsou první dvě oblasti:

- je to deterministické: časy záznamu a data žádostí zadává test, nečeká se na reálný čas,
- výpočty jdou přímo do mezd a čerpání dovolené, takže regrese tu má největší dopad,
- data jsou relativní k dnešku (`dates.js`), testy fungují i jiný den.

Přihlášení a práce bez sítě jsou doplněk k ručnímu testování, každá z nich hlídá konkrétní nalezenou
chybu a pravidla bodu 2. Popis a omezení jsou u každé sady níže.

Principy:

- **Každý test začíná čistými daty** (`clearState` + přihlášení jako Jan). Testy na sobě nezávisí
  a obchází BUG-007 (po přepnutí účtu se zobrazují data předchozího uživatele).
- **Výpočty se ověřují přírůstkem.** Test přečte denní součet před a po akci a porovná rozdíl.
  Nezávisí tak na předvyplněných datech.
- **Čtení součtu hlídá samo sebe** (`subflows/capture-day-total.yaml`). Den, který má existovat a chybí,
  test selže. Nula pro prázdný den platí jen tehdy, když je jisté, že se hledalo ve správném měsíci
  a od začátku Výkazu. U textu, který nejde převést na minuty, test taky selže (žádná tichá nula).
- **Testovací záznamy jsou v 17:00–21:00**, mimo předvyplněná data, aby se nepřekrývaly (BUG-009).
- **Selektory jsou testID.** Textem se cílí jen tam, kde testID není: typy záznamu (Práce, Oběd…),
  poznámky záznamů a chybové hlášky.

| Soubor | Co ověřuje | Bod spec. |
|---|---|---|
| 01a-preruseni-obed | Oběd uvnitř Práce se odečte (−30 min) | 7 |
| 01b-preruseni-lekar | Lékař uvnitř Práce se neodečte (`known-bug`, BUG-012) | 7 |
| 01c-preruseni-cesta | Služební cesta uvnitř Práce se neodečte | 7 |
| 02-hranice-7-dni-projde | záznam 7 dní zpětně se uloží | 10 |
| 03-hranice-8-dni-odmitnuto | záznam 8 dní zpětně aplikace odmítne | 10 |
| 04-budouci-datum | záznam na zítřek aplikace odmítne | 10 |
| 05-bez-poznamky | záznam bez poznámky aplikace odmítne | 10 |
| 06-poznamka-jen-mezery | poznámka jen z mezer se nebere jako vyplněná | 10 |
| 07-konec-pred-zacatkem | konec před začátkem aplikace odmítne (`known-bug`, BUG-014) | 11 |
| 08-konec-rovny-zacatku | konec rovný začátku projde (náš předpoklad) | 11 |
| 09-datum-spatny-format | datum DD.MMRRRR aplikace odmítne | 10 |
| 10-smazani-prepocet | po smazání se denní součet vrátí, v dni zůstává kotevní záznam (`known-bug`, BUG-015) | 12 |
| 11-prekryv-zaznamu | překrývající se záznamy se nezapočítají dvakrát (`known-bug`, BUG-009) | 7, 9 |

**Test 10 maže druhý ze dvou záznamů**, první (`T10-KOTVA`) zůstává. BUG-015 se projeví, jen když v dni
zůstanou další záznamy. Bez kotvy test 23. 11. (pondělí, předevčírem sobota) falešně prošel, s kotvou
selhal na očekávané kontrole (`docs/test-runs/posledni/2026-11-23_090519`).

**Žádosti a schvalování (`flows/requests`).** Pravidla vychází z odpovědi firmy z 20. 11.: dovolená se odečte
při odeslání, zrušení a zamítnutí dny vrací, žádost do minusu se neodešle, čekající žádost jde zrušit
do dne před začátkem.

- **Zůstatek se ověřuje rozdílem před a po** (`subflows/capture-balance.yaml` + `scripts/parse-balance.js`).
  U textu, který nejde převést na číslo, test selže. Testy proto nezávisí na výchozím zůstatku Jana
  (8 dní, BUG-006).
- **Data žádostí počítá `dates.js`**, vždy v aktuálním roce, jen pracovní dny a bez státních svátků ČR
  v celém rozsahu (jak počítat svátky v žádosti, specifikace neříká). Když letos vhodné datum není
  (konec prosince), test hned na začátku selže s vysvětlením. V aktuálním roce se testy drží kvůli
  předpokladu „dny se strhávají z roku, do kterého spadají“ (list Předpoklady, Přelom roku). Žádost
  do příštího roku zatím nikdo netestoval.
- **Dynamická ID** (`request-state-<id>`, `request-cancel-<id>`, `approve-<id>`, `reject-<id>`) se hledají
  regexem. Po `clearState` je žádost v seznamu jediná.
- **R04 a R05 přepínají účet bez `clearState`** (Jan → vedoucí → Jan), jinak by žádost zmizela.
  Žádosti BUG-007 nezasahuje.
- **Popisky pro čtečku:** u vedoucího se ověří, že `approve-*` a `reject-*` mají text pro TalkBack
  (náhrada za ruční kontrolu, bod 21).

| Soubor | Co ověřuje |
|---|---|
| R01-dovolena-1-den-zruseni | 1denní dovolená odečte 1 den, zrušení ho vrátí, stav Zrušeno |
| R02-dovolena-pres-vikend | dovolená středa–pondělí odečte jen 4 pracovní dny (`known-bug`, BUG-017) |
| R03-dovolena-nad-zustatek | žádost na 10 pracovních dní při zůstatku 8 se neodešle, ukáže chybu, zůstatek beze změny (`known-bug`, BUG-016) |
| R04-zamitnuti-vrati-dny | vedoucí žádost vidí a zamítne, u Jana stav Zamítnuto a den zpět v zůstatku |
| R05-schvaleni-neodecita | vedoucí žádost schválí, u Jana stav Schváleno a zůstatek se už nemění |

**Práce bez sítě (`flows/offline`), částečně.** Výpadek se simuluje přepínačem v Nastavení
(`toggle-network-outage`), ne režimem letadla. Příchod a Odchod se dělají na Přehledu, takže délka záznamu
je obvykle 0 min. Test proto nepočítá součet, ale **počet záznamů dneška** (`subflows/count-day-entries.yaml`):
zkouší `entry-<id>` uvnitř `day-<dnes>` s indexem 0 až 9. Že počítání funguje, ověří test sám:
po prvním odeslání musí přibýt právě jeden záznam.

| Soubor | Co ověřuje |
|---|---|
| O01-offline-zaznam-se-nezdvoji | Příchod a Odchod za výpadku, po obnovení sítě „Vše odesláno“ a jeden záznam; po dalších dvou výpadcích a obnoveních se počet záznamů ani denní součet nezmění (`known-bug`, BUG-021) |

**Přihlášení (`flows/login`).** Bod 2 (blokace po 5 pokusech na 1 minutu) a bod 1 (u e-mailu nezáleží
na velikosti písmen). Ostatní pravidla jsou předpoklady z listu Předpoklady: blokace se počítá na účet,
úspěšné přihlášení počítadlo nuluje, během blokace neprojde ani správné heslo, restart aplikace blokaci
neobejde. Ověřuje se **přihlášen** (`tab-overview` nebo `tab-approvals` vidět) a **nepřihlášen**
(`login-submit` vidět).

- **Každý pokus se zaznamená** (`subflows/login-submit-record.yaml`): screenshot s názvem podle pokusu,
  text `login-error` do `output.lastError` a do logu Maestra řádek `[LOGIN] …`. Když hláška není vidět,
  zapíše se „login-error není vidět“.
- **Čekání na výsledek pokusu** je nejvýš 5 s a skončí, jakmile je vidět `login-error` nebo tab
  po přihlášení.
- **Začátek blokace** je odeslání prvního pokusu, jehož hláška obsahuje „zablokované“ (text z běhu
  22. 11. 20:30: „Přihlášení je na 1 minutu zablokované.“). Uloží se do `output.blockedAt` a od něj se
  počítají sekundy v L03 a L05. Špatná hláška zní „Nesprávný e-mail nebo heslo.“.
- **Zablokování Jana** (`subflows/login-block-jan.yaml`) posílá špatné pokusy, dokud se blokace neobjeví,
  nejvýš 6. Počet se neurčuje předem, protože aplikace blokuje dřív než podle bodu 2 (BUG-022).
- **Čekání do určité sekundy je záměrné** (`subflows/wait-fixed.yaml`): Maestro nemá pauzu, proto se čeká
  na prvek, který neexistuje, s `optional: true`. Varování v logu je u tohoto kroku v pořádku.
- **Hranice času v L03** jdou nastavit na jednom místě, v hlavičce souboru (`BLOCK_CHECK_S: 50`,
  `BLOCK_END_S: 65`).

| Soubor | Co ověřuje | Bod spec. |
|---|---|---|
| L01-blokace-po-5-pokusech | pokusy 1–4 bez blokace, nejpozději 6. pokus správným heslem je zablokovaný (`known-bug`, BUG-022) | 2 |
| L02-blokace-je-na-ucet | zablokovaný Jan neblokuje Evu | 2 |
| L03-konec-blokace | správné heslo ~50 s od začátku blokace neprojde, ~65 s projde | 2 |
| L04-uspech-nuluje-pocitadlo | 4× špatně, přihlášení, odhlášení, 4× špatně, 5. pokus správným heslem projde (`known-bug`, BUG-022) | 2 |
| L05-restart-neobejde-blokaci | `stopApp` + `launchApp` během blokace, správné heslo neprojde | 2 |
| L06-email-velkymi-pismeny | `JAN.NOVAK@DEMO.CZ` se přihlásí (`known-bug`, BUG-023) | 1 |
| L07-email-s-mezerami | e-mail s mezerou na začátku a konci se přihlásí (vlastní předpoklad, nízká priorita) | 1 |

**Výklad bodu 2 v L01.** „Po 5 neúspěšných pokusech se přihlášení zablokuje“ neříká, jestli hlášku
o blokaci ukáže už 5. pokus, nebo až ten další. L01 proto ověřuje, že pokusy 1–4 blokaci nemají, u 5. pokusu
nic neověřuje a 6. pokus správným heslem už musí být zablokovaný. Na 1.0 L01 selže na „Pokus 3 bez
blokace (BUG-022)“.

L04 má tag `known-bug` (BUG-022). Nulování počítadla zůstává na 1.0 neověřené, protože blokace přijde dřív
(BUG-022). Ověří se až po opravě. Test selže na kontrole „Kolo A, po 4 špatných pokusech bez blokace
(jinak BUG-022)“ ještě před prvním správným heslem, takže je z výsledku vidět, proč nic dalšího neověřil.

Průzkumný běh přihlášení 22. 11. ve 20:30 (`docs/test-runs/posledni/2026-11-22_203010`) nic neověřil:
pokus trval asi 31 s a minutová blokace během testu vypršela. Odtud pochází čekání nejvýš 5 s na výsledek
pokusu a měření od skutečného začátku blokace.

## 4. Co automatizované není a proč

| Oblast | Proč ne | Jak testováno |
|---|---|---|
| Příchod/Odchod a přerušení na Přehledu v reálném čase | čeká se na skutečné minuty, pomalé a křehké | ručně (BUG-012, BUG-013) |
| Směna přes půlnoc (bod 20), hranice dnů podle času zařízení | skutečný čas emulátoru s Google Play nejde z testu měnit (`adb root` nefunguje). Ruční záznam přes půlnoc (přepínač „Konec následující den“) jde automatizovat. Neautomatizováno kvůli časovému rámci zadání. | zatím netestováno ani ručně (`docs/poznamky.md`) |
| Žádosti: půlden, Lékař a Home office, zrušení schválené žádosti, hranice zrušení „den před začátkem“ | Neautomatizováno kvůli časovému rámci zadání, přednost dostal odečet, zrušení, zamítnutí a schválení (R01–R05). Půlden navíc naráží na čtení zůstatku v celých dnech (sekce 7) | ručně: Lékař a Home office zůstatek nemění (správně), půlden se odečte jako celý den (BUG-024), zrušení den před začátkem; důkazy `docs/evidence/zadosti/`, `docs/evidence/BUG-024/` |
| Žádosti: svátky v rozsahu, žádost přes konec roku | svátky specifikace neřeší (otevřená otázka), přes konec roku jen předpoklad „dny se strhávají z roku, do kterého spadají“ (list Předpoklady) | ručně: svátky v rozsahu se do čerpání nepočítají (správně, `docs/evidence/zadosti/`, `docs/evidence/BUG-017/`). Přelom roku netestováno |
| Práce bez sítě (bod 17), mimo O01 | Neautomatizováno kvůli časovému rámci zadání, automatizovaný je jen O01 (opakované obnovení sítě, BUG-021). Režim letadla se nesimuluje, aplikace má pro výpadek přepínač (bod 18) | ručně: záznamy za výpadku, opakované přepínání, restart aplikace (BUG-021), důkazy `docs/evidence/offline/` |
| TalkBack (bod 21) | čtečka se automaticky ověřit nedá, jen jestli prvky mají popisky | popisky sondou a v R04/R05 (Schválit, Zamítnout). Čtečka ručně jen na obrazovce vedoucího (popisky, pořadí, aktivace). Hlavní tok zaměstnance neověřen (emulátor čte češtinu anglickým hlasem, potřeba telefon s češtinou) |
| Jazyky (bod 19) | jednorázová kontrola, ne regrese | sonda + ruční ověření (BUG-003 až 005) |
| Přihlášení: blokace přes restart zařízení, další kombinace zápisu e-mailu | restart zařízení Maestro z testu neudělá (restart aplikace ověřuje L05). Další kombinace zápisu e-mailu mají nízkou prioritu, bod 1 pokrývá L06 (velká písmena) | netestováno |
| Exploratorní testování | z principu ručně | ručně |

## 5. Tag `known-bug`

Test s tagem `known-bug` hlídá nahlášenou chybu. **Na verzi 1.0 má selhat**, po opravě chyby má projít.
Každý takový test hlídá právě jednu chybu, aby bylo z výsledku vidět, která oprava se povedla.

| Test | Chyba | Na čem selže na 1.0 |
|---|---|---|
| 01b | BUG-012 | „Lékař se neodečetl (přírůstek 0)“ |
| 07 | BUG-014 | „Aplikace záznam odmítla a ukázala chybu“ |
| 10 | BUG-015 | „Po smazání se denní součet vrátil na původní hodnotu“ |
| 11 | BUG-009 | „Překryv se nezapočítal dvakrát (přírůstek nejvýš 3 h)“ |
| R02 | BUG-017 | „Odečetly se jen 4 pracovní dny, víkend ne“ |
| R03 | BUG-016 | „Aplikace žádost odmítla a ukázala chybu“ |
| O01 | BUG-021 | „Opakované obnovení sítě záznam nezdvojilo“ |
| L01 | BUG-022 | „Pokus 3 bez blokace (BUG-022)“ |
| L04 | BUG-022 | „Kolo A, po 4 špatných pokusech bez blokace (jinak BUG-022)“ |
| L06 | BUG-023 | „Přihlášen (vidí Přehled nebo Schvalování)“ |

U selhaného testu je potřeba zkontrolovat, na kterém kroku selhal. Selhání v měření (kroky „je ve Výkazu“,
„jde přečíst“, „je v aktuálním měsíci“) znamená chybu testu nebo prostředí, ne aplikace.

V CI se sada spouští dvakrát:

- `--exclude-tags known-bug`: musí projít, jinak je build červený,
- `--include-tags known-bug`: výsledek se jen ukládá. Když některý z těchto testů projde, chyba je
  pravděpodobně opravená a test patří do běžné sady (odebrat tag).

Poslední běhy jsou v tabulce v sekci 1, starší výstupy v `docs/test-runs/posledni/`.

## 6. CI (GitHub Actions)

Workflow je v `.github/workflows/maestro.yml`. První běhy 23. 11. odpovídají lokálnímu výsledku:

- [45153010088](https://github.com/tcoudi-afk/dochazka-demo-qa/actions/runs/45153010088) (dva pokusy): build červený kvůli testu 05. V CI klepnutí na nadpis
  formuláře nezavřelo klávesnici a tlačítko Uložit zůstalo pod ní. Test 05 nově před uložením klepne na popisek
  „Typ“ (commit `2588cdd`).
- [45178523665](https://github.com/tcoudi-afk/dochazka-demo-qa/actions/runs/45178523665) po opravě: build zelený, všech 16 testů bez `known-bug` prošlo, všech
  10 `known-bug` testů selhalo.
- [45184593533](https://github.com/tcoudi-afk/dochazka-demo-qa/actions/runs/45184593533) po commitu `c7f2442`
  (změna jen v README): build červený kvůli opakovaným výpadkům emulátoru na runneru („device offline“), regresní
  testy 01a, 04, 06, 08, 09 a L03 selhaly bez souvislosti s aplikací.

Vyhodnocení `known-bug` je jednoduché: běh zaznamená jen to, že test selhal, ne na kterém kroku. Selhání na
očekávané kontrole se tak nerozliší od selhání z jiného důvodu, například výpadku emulátoru. Emulátor na runneru
v každém pokusu aspoň jednou ohlásil `device offline` a test pak selhal během několika sekund. V druhém pokusu
prvního běhu takhle selhal R02 a kontrolu BUG-017 neověřil, v posledním běhu stejně R03 a L01. V prvním pokusu
selhal na výpadku i test 03 (bez `known-bug`), v druhém prošel. Dál viz review (K1, CI1–CI6) v sekci 7.

Jak má běžet:

1. Ubuntu runner se zapnutým KVM, Java 17, Maestro 2.12.1.
2. Stažení APK z releases repozitáře aplikace.
3. Emulátor API 35 přes `reactivecircus/android-emulator-runner`.
4. Sady `flows/manual-entry`, `flows/requests` a `flows/login`: `maestro test --exclude-tags known-bug
   --format junit` (musí projít). Potom pro všechny čtyři sady včetně `flows/offline`
   `--include-tags known-bug` (jen pro informaci).
5. JUnit reporty a výstupy (screenshoty, logy) se uloží jako artefakt běhu.

Runner i emulátor běží v UTC, takže problém s půlnocí z lokálního prostředí tam nenastane.

`flows/offline` má zatím jen O01 s tagem `known-bug`, proto běží jen v běhu s `--include-tags known-bug`
(v běhu s `--exclude-tags known-bug` by výběr byl prázdný). Jedna červená sada stačí, aby byl job červený,
ostatní sady přesto doběhnou.
`flows/login` trvá několik minut (L03 čeká přes 65 s). L01, L04 a L06 mají `known-bug`, v běhu
s `--exclude-tags known-bug` zůstávají L02, L03, L05 a L07.

## 7. Známá omezení a co dál

### Co se může projevit na nové verzi aplikace

- **Data relativně k dnešku.** Výkaz ukazuje jen aktuální měsíc a test ho neumí přepnout dozadu, žádosti se
  drží v aktuálním roce. Na začátku měsíce a v prosinci proto některé testy selžou kvůli datu (okna jsou
  v sekci 1, Kdy testy nespouštět). `dates.js` navíc bere datum z počítače, ne z emulátoru.
- **Krok selhání se kontroluje ručně.** U `known-bug` testu vypadá selhání kvůli datu nebo prostředí stejně
  jako očekávané. Je potřeba porovnat krok selhání s tabulkou v sekci 5.
- **Zůstatek jen v celých dnech.** `scripts/parse-balance.js` přečte „-5 dní“ správně, ale „7,5 dne“ nepřečte
  a test selže na kontrole „Zůstatek dovolené jde přečíst“. Na 1.0 se půlden odečte jako celý den (BUG-024).
  Po opravě BUG-024 může být zůstatek desetinný a script bude potřeba rozšířit. Tvar „7,5 dní“ by přečetl
  chybně jako 5.
- **Detekce blokace podle slova „zablokované“.** Když opravená verze změní znění hlášky, L01 a pomocné
  subflow blokaci nepoznají a selžou na kontrole blokace. Pak upravit text v `subflows/login-submit-record.yaml`.
- **Pevná čekání.** O01 čeká na případnou kopii záznamu nejvýš 5 s, L03 a L05 měří sekundy od klepnutí na
  Přihlásit, ne od chvíle, kdy aplikace blokaci zapsala (odchylka jednotky sekund). Pomalejší verze aplikace
  může výsledek posunout.
- **Znění chybových hlášek.** Test 07 hledá v hlášce slovo „konec“. Na 1.0 se hláška vůbec nezobrazí, po opravě
  BUG-014 může mít jiné znění a test selže, i když je chyba opravená.

### Neautomatizováno kvůli časovému rámci zadání (4–6 h)

- **Regresní test BUG-007 (review P1).** Nejvážnější chyba (Eva po přepnutí účtu vidí a přepíše data Jana)
  má jen diagnostiku `investigate/bug-007-isolation.yaml` s `optional` kroky, která vždy doběhne. Oprava se
  na nové verzi automaticky neověří. Návrh: `known-bug` test z kroků diagnostiky bez `optional`.
- **Ověření vybraného typu záznamu (review F2).** `subflows/fill-manual-entry.yaml` klepne na typ podle textu,
  ale neověří, že se vybral, a Práci neklepe vůbec. Po opravě BUG-009 by 01c (po opravě BUG-012 i 01b) mohl
  projít, i když se typ nevybral. Návrh: `assertVisible` s `checked: true` jako v `subflows/fill-request.yaml`.

### Další návrhy z review

Plné znění je v [`docs/review-testu.md`](../docs/review-testu.md), nejdůležitější:

- **Kontrola kroku selhání v CI (K1).** Tabulku ze sekce 5 převést do `tests/known-bugs.json` a v CI z JUnit
  vypsat, jestli `known-bug` test selhal na očekávaném kroku, jinde, nebo prošel.
- **Negativní testy (F4).** Ověřit i to, že se odmítnutý záznam neuložil, ne jen viditelnou chybu.
- **Pokrytí (P2–P7).** Směna přes půlnoc přes „Konec následující den“, Lékař a Home office bez vlivu na
  zůstatek, dvojklik na Příchod (BUG-013) přes `doubleTapOn`, restart aplikace za výpadku sítě.
- **CI (CI1–CI6).** Rozdělit sady do `matrix` kvůli době běhu, zafixovat verzi APK, workflow jednou spustit.
- **Údržba (S1, C2–C5).** Texty hlášek na jednom místě, méně duplicit mezi testy, `tests/config.yaml`.

## 8. Nad rámec zadání

- **`tools/probe/` – sonda.** Node skript, který přes Maestro projde obrazovky pro obě role a tři jazyky
  a uloží screenshot a strom UI. Z toho vytvoří inventuru prvků (`inventory.csv`) a report s kandidáty
  na chyby: chybějící popisky pro TalkBack, nepřeložené texty, formáty data. Použitý na průzkum aplikace
  a ověření testID. Návod v `tools/probe/README.md`.
- **`tests/investigate/bug-007-isolation.yaml`** – diagnostika oddělení dat mezi uživateli (BUG-007).
  Spuštění z `tests`:
  ```
  maestro test --test-output-dir ../docs/evidence/BUG-007 investigate/bug-007-isolation.yaml
  ```
  Kroky s popiskem „varování = SPRÁVNĚ“ mají skončit varováním (záznam nenalezen), kroky s popiskem
  „varování = CHYBA“ mají projít.

  | Krok | Správné chování | Chyba |
  |---|---|---|
  | 2a / 2b | 2a ⚠️, 2b ✅ | 2a ✅, 2b ⚠️: Eva vidí záznam Jana |
  | 4a | ✅ | ⚠️: Janovi zmizel vlastní záznam |
  | 4b / 4c | 4b ⚠️, 4c ✅ | 4b ✅, 4c ⚠️: Jan vidí záznam Evy |
- **Workflow pro GitHub Actions** (`.github/workflows/maestro.yml`) – první běhy 23. 11. odpovídají lokálnímu
  výsledku, vyhodnocení `known-bug` je jednoduché (sekce 6).

# Review testovací sady – Docházka Demo (Maestro)

Nezávislé code review před odesláním. Datum: 22. 11. 2026.
Čteno: `tests/` (flows, subflows, scripts, investigate, README), `.github/workflows/maestro.yml`,
`docs/specifikace.md` a logy běhů v `docs/test-runs/posledni/`. Testy jsem **nespouštěl**. Délky testů
a výsledek O01 jsou vyčtené z `logs/maestro.log` jednotlivých běhů.

> **Poznámka autora (22.–23. 11., po přečtení review).** Text review nechávám beze změny, opravuji jen fakta:
> - Druhé kolo je ve středu 25. 11., ne „za 1–2 týdny“. Okna z N1 se ho netýkají, jsou v README jako „Kdy testy nespouštět“.
> - S2 neplatí: systém emulátoru je anglicky a aplikace je po `clearState` česky, jazyk systému nepřebírá.
> - Manual-entry trvá podle logu asi 14 min, ne 16.
>
> - Opraveno: F1 (kotevní záznam v testu 10, ověřeno během 23. 11.: původní verze ráno prošla falešně,
>   opravená selhala na očekávané kontrole), K2 (výklad 5. pokusu v L01), R1–R4 (README), N1 a N2
>   zdokumentované v README („Kdy testy nespouštět“, nastavení pásma a klávesnice).
> - Vědomě odloženo kvůli časovému rámci zadání: `tests/README.md`, sekce 7.
> - Čísla řádků v review odkazují na stav souborů 22. 11. večer.

Závažnost: **blokuje** = opravit před odesláním · **opravit** = mělo by se opravit · **drobnost**.

---

## Celkový dojem

Sada je nadprůměrná. Na úrovni seniora má to podstatné:

- Výpočty se ověřují **přírůstkem** (před/po) a čtecí subflow se **samy hlídají** (`capture-day-total`
  s `EXPECT`, parse skripty vrací `null` místo tiché nuly, `count-day-entries` má horní pojistku).
- Každý test začíná `clearState` a cílí přes testID.
- Data se počítají relativně k dnešku, včetně svátků ČR a Velikonoc.
- Tag `known-bug` má v README tabulku s krokem, na kterém má test selhat.
- README přiznává omezení (sekce 7), místo aby je schovávalo.

Hlavní slabiny: několik testů **závisí na dni v týdnu nebo v měsíci**. U `known-bug` testů se to projeví
nejhůř, protože špatné selhání vypadá stejně jako očekávané. Některé `known-bug` testy by **po správné
opravě zůstaly červené** (L01, 07). README má nevyplněná místa. CI koncept se nejspíš nevejde do 60 minut.

---

## 1. Falešně zelené testy

**F1 · `tests/flows/manual-entry/10-smazani-prepocet.yaml:10-15` · opravit (vysoká priorita)**
Výsledek závisí na tom, jestli má předevčírem předvyplněná data. README (ř. 268–270) to samo popisuje:
19. 11. test prošel, protože předevčírem (17. 11., svátek) byl prázdný den a po smazání zmizel celý.
Předvyplněná data jsou jen v pracovní dny (O01 v neděli 22. 11. našel dnešek prázdný: `before = 0`).
Na 1.0 tedy test **projde v pondělí a v úterý** (předevčírem je víkend) a den po svátku + 1.
Kdyby firma pustila sadu v pondělí, `known-bug` test projde a vyjde z toho „BUG-015 opravený“.
**Návrh:** před mazaným záznamem přidat kotvu, např. `Práce 17:00–18:00, T10-KOTVA`, a mazat druhý
záznam `19:00–21:00`. Den pak má vždy aspoň jeden další záznam bez ohledu na předvyplněná data.

**F2 · `tests/subflows/fill-manual-entry.yaml:25-29` · opravit**
Typ záznamu se klepne textem, ale neověří se, že je vybraný. `fill-request.yaml:16-19` to přitom
s `checked: true` dělá. 01b a 01c ověřují „přírůstek 0“. Když se typ nevybere a záznam zůstane Práce
19:00–19:30 uvnitř Práce 17:00–21:00, rozhodne o výsledku jen zpracování překryvu. Dnes ho BUG-009
sečte (+30) a test zčervená. **Po opravě BUG-009 se překryv nezapočítá, přírůstek bude 0 a 01c
(a po opravě BUG-012 i 01b) projde, i když se Lékař ani cesta nikdy nezadaly.** Práce se neklepe
vůbec (ř. 27) a spoléhá na výchozí volbu.
**Návrh:** po klepnutí `assertVisible: {text: ${TYPE}, checked: true, childOf: {id: manual-type}}`
a klepnout i na Práce. Je to kopie hotového kódu z `fill-request.yaml`.

**F3 · `tests/flows/manual-entry/02-hranice-7-dni-projde.yaml:12-16`, `08-konec-rovny-zacatku.yaml:13-17` · opravit**
Ověřuje se jen to, že poznámka je *někde* ve Výkazu, ne že je ve správném dni. Kdyby aplikace uložila
záznam k jinému datu (posun pásma, záměna DD/MM), test projde.
**Návrh:** `scrollUntilVisible` s `childOf: {id: "day-${output.sevenDaysAgoIso}"}`, nebo rovnou přírůstek
přes `capture-day-total` (+60 min). U 08 stačí, že den existuje a přírůstek je 0.

**F4 · `tests/subflows/expect-manual-entry-error.yaml:13-19` · opravit**
Negativní testy (03–07, 09) ověřují jen to, že je vidět chyba. Neověřují, že se záznam neuložil.
Aplikace, která chybu ukáže a záznam stejně uloží, projde. U 07 (BUG-014 = uloží se záporný čas)
je to přesně ten typ chyby, který hlídáme.
**Návrh:** do subflow přidat parametr `ISO` a po chybě ověřit přírůstek 0 přes `capture-day-total`.
Druhá varianta: `assertNotVisible` poznámky v `day-<ISO>`.

**F5 · `tests/flows/manual-entry/04-budouci-datum.yaml:12` (`ERR: ".+"`) · drobnost**
Projde s jakoukoli chybou, třeba s chybou formátu. **Návrh:** regex na smysl hlášky („budoucí“,
„dnes“), nebo aspoň F4, aby se ověřilo, že nic nevzniklo.

**F6 · `tests/flows/manual-entry/06-poznamka-jen-mezery.yaml:11` · drobnost** (známé, README ř. 328)
Když `inputText: "   "` nic nevepíše, je 06 jen kopie 05. **Návrh:** po zadání `copyTextFrom: id: manual-note`
a `assertTrue: ${maestro.copiedText.length == 3}`. To jsou dva řádky.

**F7 · `tests/flows/manual-entry/10-smazani-prepocet.yaml:45-47` · opravit** (známé, README ř. 317)
`assertNotVisible T10-SMAZAT` běží po `capture-day-total`, které Výkaz posouvá. Když je záznam mimo
obrazovku, kontrola projde naprázdno. **Návrh:** přesunout ji hned za `tapOn` (ř. 34–37), dokud je
Výkaz na stejném místě.

**F8 · `tests/flows/offline/O01-offline-zaznam-se-nezdvoji.yaml:80-92` · opravit**
- Čekání na kopii je `optional` a trvá jen 5 s. Když kopie přijde později, `known-bug` test projde.
- Komentář „dnešek po clearState nemá jiné záznamy, kopie by měla index 1“ platí jen o víkendu
  a ve svátek. V pracovní den bude mít dnešek pravděpodobně předvyplněné záznamy (ověřit). Index 1
  pak existuje hned a čekání neproběhne vůbec.

Běh 22. 11. 21:42 (`docs/test-runs/posledni/2026-11-22_214207`) ukázal `before 0 → synced 1 → after 3`,
kopie tedy přišly okamžitě. Riziko je zatím teoretické.
**Návrh:** čekat na index `${output.synced}` (ne natvrdo 1) a timeout zvýšit na 15 s.

**F9 · `tests/subflows/submit-request.yaml:15-17` · drobnost**
`assertNotVisible request-error` hned po klepnutí projde dřív, než se chyba stihne vykreslit. Situaci
zachraňuje až následné čekání na `request-state-.*`, takže to není falešně zelené, jen je kontrola
zbytečná. **Návrh:** smazat, nebo přesunout za `extendedWaitUntil`.

**F10 · `tests/subflows/decide-request.yaml:12-17` · drobnost**
„Jan Novák“ a „Dovolená“ se hledají kdekoli na obrazovce, ne u žádosti, kterou test schvaluje.
Na 1.0 je žádost jediná, takže to funguje (viz S3).

**F11 · `optional` kroky celkově · v pořádku**
`wait-fixed.yaml` a čekání v `login-submit-record.yaml:16-21` jsou záměrné a v README vysvětlené.
`investigate/bug-007-isolation.yaml` je mimo regresní sadu. Tohle je správné rozdělení.

---

## 2. Nestabilita

**N1 · kalendářní okna (`scripts/dates.js:11-15`, `subflows/capture-day-total.yaml:13-15`) · opravit (vysoká priorita)**
Výkaz ukazuje jen aktuální měsíc a test do minulého měsíce neumí. Sada proto na 1.0 selhává podle data:

| Kdy se spustí | Co selže | Typ |
|---|---|---|
| 1.–2. den v měsíci | 01a, 01c (regrese), 01b, 10, 11 | „Den … je v aktuálním měsíci“ |
| 1.–7. den v měsíci | 02 (regrese) | záznam se nenajde |
| od pondělí 7. 12. | R03 (`known-bug`) | `vacTwoWeeksFrom == null` |
| od pondělí 14. 12. | R02 (`known-bug`) | `vacWeekendFrom == null` |
| od ~29. 12. | R01, R04, R05 | `vacDay == null` |

(Data pro R02/R03 jsem dopočítal ručně podle `dates.js:76-103` pro rok 2026.)
Druhé kolo bude zhruba za 1–2 týdny. **1.–7. prosinec v tom okně reálně je.** U R02 a R03 je to
zákeřné: jsou `known-bug`, takže selhání vypadá jako očekávané.
**Návrh:** minimálně tabulku výše dát do README (sekce 1, „Kdy testy nespouštět“). Pořádné řešení:
v `capture-day-total` a v testu 02 klepnout `month-prev`, když `ISO` není v aktuálním měsíci.
Navigaci jde ověřit už teď na předvyplněném dni v říjnu. U R03 stačí rozsah s `workdays > before`
(9 dní), ne přesně 10, a okno se tím rozšíří.

**N2 · datum z PC vs. z emulátoru (`scripts/dates.js:3-5`, README ř. 85-87) · opravit**
README říká „nespouštět mezi 0:00 a 1:00“. To platí jen v zimním čase a jen pro PC v Praze. V letním
čase jsou to 0:00–2:00 a na PC v jiném pásmu jiný interval. Na druhém kole pustí testy cizí člověk.
**Návrh:** v README jeden konkrétní krok „nastav pásmo emulátoru na pásmo PC“ (Nastavení → Systém →
Datum a čas, nebo přes `adb`, ověřit na obrazu s Google Play). Lepší je brát „dnes“ ze zařízení
(`adb shell date +%Y-%m-%d` → `-e TODAY=…`), jak navrhuje README ř. 324–325.

**N3 · `tests/flows/login/L03-konec-blokace.yaml:26-32` a `L05-restart-neobejde-blokaci.yaml:15-20` · opravit**
Časové testy nemají pojistku, že test sám nebyl pomalý. Na pomalém emulátoru (CI se swiftshader)
může L05 udělat restart + vyplnění až po 60 s. Blokace mezitím vyprší, správné heslo projde a výsledek
vypadá jako „restart obešel blokaci“ (falešná chyba aplikace). U L03 platí totéž, když `waitMs` vyjde
0 a skutečný čas je už přes 60 s.
**Návrh:** těsně před odesláním `assertTrue: ${Date.now() - output.blockedAt < 58000}` s popiskem
„Test stihl pokus uvnitř blokace (jinak je pomalé prostředí, ne chyba aplikace)“. U L03 analogicky
ověřit, že pokus „po konci“ neodešel dřív než za 60 s.

**N4 · `tests/subflows/login-submit-record.yaml:16-30` · drobnost** (známé, README ř. 364–367)
Stará hláška `login-error` může zůstat vidět a přečíst se znovu. **Návrh:** v `login-fill.yaml` po
`eraseText` ověřit `assertNotVisible: id: login-error`, pokud aplikace hlášku při psaní maže. Pokud ne,
nechat to tak a jen to zdokumentovat (to už je).

**N5 · `hideKeyboard` (`subflows/fill-manual-entry.yaml:24,37`, `fill-request.yaml:26`, `login-fill.yaml:18`) · drobnost**
Hlavní zdroj lokálních pádů (plovoucí Gboard). **Návrh:** místo `hideKeyboard` klepnout na neinteraktivní
prvek formuláře (nadpis), nebo v README popsat přesné nastavení klávesnice (zatím je jen v CLAUDE.md ř. 66–70).

**N6 · pořadí testů · v pořádku**
Žádný test nezávisí na jiném. Stav blokace, výpadku sítě i žádostí smaže `clearState`.

---

## 3. Nezávislost a čistý stav

**I1 · v pořádku.** Všech 26 testů začíná `launchApp: clearState: true`, buď přímo (login) nebo přes
`start-as-jan.yaml:5-6`. Sloty `output` se před čtením nulují (`capture-*.yaml:7/10`) a `blockedAt` se
nastavuje v každém login testu. Defenzivní a správně.

**I2 · `R04`/`R05:26-36` · v pořádku, jen pozor.** Přepnutí účtu bez `clearState` je nutné a zdůvodněné.

**I3 · skrytý důsledek `clearState` · opravit (souvisí s P1).** Protože každý test začíná na čisto,
sada **z principu nevidí BUG-007** (nejvážnější chybu: únik a přepsání dat mezi účty). README to
uvádí jako výhodu („obchází BUG-007“). Je potřeba aspoň jeden test, který tu chybu naopak cíleně hlídá.

---

## 4. Selektory a odolnost proti nové verzi

**S1 · texty jsou rozeseté po souborech · opravit**
testID se používají důsledně. Textů, na kterých testy stojí, je ale dost a každý je na jiném místě:
- stavy `"Mimo práci"`, `"V práci"` (O01:26,33,41), `"Čeká"` (`submit-request.yaml:26`), `"Zrušeno"`,
  `"Zamítnuto"`, `"Schváleno"` (R01:29, R04:43, R05:43), `"Vše odesláno"` (`wait-all-sent.yaml:9`),
  `"Čeká na odeslání.*"` (O01:46,61),
- regexy chyb `"7 dní"`, `"[Pp]oznámk"`, `"[Kk]onec"`, `"DD.MM.RRRR"` (03, 05, 06, 07, 09),
  `'zablokované'` (`login-submit-record.yaml:32`),
- formáty `"X h YY min"` a `"N dní"` (parse skripty), `"Jan Novák"`, `"Dovolená"`, typy záznamů.

Když nová verze změní znění, testy zčervenají na kontrole, která vypadá jako chyba aplikace.
**Návrh:** (a) texty dát na jedno místo (`scripts/texts.js` → `output.txt.*`, nebo `env` v hlavičce),
aby změna znamenala jednu úpravu. (b) Kde text nerozlišuje důvod, stačí `manual-error` s neprázdným
textem. Konkrétní znění kontrolovat jen tam, kde odlišuje důvod (03 „7 dní“ vs. 09 formát).

**S2 · jazyk aplikace vs. jazyk zařízení · opravit (ověřit, 10 min)**
README ř. 92 tvrdí, že po `clearState` je aplikace česky. Vývojový emulátor má ale české systémové
nastavení (CLAUDE.md cituje „Nastavení Androidu → Systém → Klávesnice“). Neověřil jsem, jestli aplikace
přebírá jazyk systému. Emulátor v CI i u firmy bude nejspíš `en-US`. Pokud jazyk přebírá, selže
**skoro celá sada** (S1).
**Návrh:** přepnout emulátor na angličtinu a pustit jeden test. Pokud aplikace přejde do EN, přidat
do `start-as-jan.yaml` výběr češtiny v Nastavení, nebo krok do README a CI.

**S3 · dynamická ID přes regex (`decide-request.yaml:10,24,28,32`, `submit-request.yaml:22,25`, R01:26) · opravit**
`approve-.*` vezme první shodu. Když nová verze přinese předvyplněné čekající žádosti (např. Evy),
test schválí cizí žádost. **Návrh:** hledat tlačítko uvnitř karty, která obsahuje datum `vacDay`
(`childOf` + `containsChild: {text: ".*${output.vacDay}.*"}`, formát data na Schvalování ještě ověřit).

**S4 · `tapOn: ${TYPE}` textem (`fill-manual-entry.yaml:29`, `fill-request.yaml:15`) · drobnost**
Text „Práce“ nebo „Oběd“ se může vyskytnout i jinde. **Návrh:** `childOf: {id: manual-type}` / `request-type`.

**S5 · `entry-delete-.*` + `below` (`10-smazani-prepocet.yaml:34-37`) · drobnost** (známé)
**Návrh:** `childOf` záznamu, který `containsChild` poznámku.

---

## 5. Strategie `known-bug`

**Co je dobré:** jeden test = jedna chyba, tabulka „na čem padá na 1.0“ (README ř. 241–252), dva běhy
v CI (bez tagu musí projít, s tagem jen informace) a poctivá poznámka, že L04 na 1.0 nic neověří.
Princip je srozumitelný a dá se obhájit.

**K1 · CI nekontroluje, *na čem* test selhal · opravit**
`maestro.yml:80` končí `|| true`. Červený `known-bug` test tak může znamenat „chyba trvá“, ale stejně
dobře „1. prosince“ (N1), „jiný jazyk“ (S2) nebo „nová verze změnila text“ (S1). Na druhém kole
s novou verzí je to právě ta otázka, na kterou se firma bude ptát.
**Návrh:** tabulku z README ř. 241–252 převést do `tests/known-bugs.json` (test → očekávaný popisek
kroku). Krátký krok v CI pak z JUnit vytáhne zprávu o selhání a vypíše do `$GITHUB_STEP_SUMMARY`
tři stavy: „selhal na očekávaném kroku“, „**selhal jinde – prověřit**“, „**prošel – chyba možná opravená,
odebrat tag**“. Ten poslední stav dnes nikdo neuvidí, protože artefakt si nikdo nestáhne.

**K2 · L01 po správné opravě zůstane červený · `flows/login/L01-blokace-po-5-pokusech.yaml:43-49` · opravit**
Na 1.0 vrací hlášku „zablokované“ přímo **3. špatný pokus**. BUG-022 to popisuje jako „blokace po
3. pokusu“. Správná oprava (práh 3 → 5) tedy nejspíš vrátí „zablokované“ na **5. pokus**. L01 ale na
5. pokusu tvrdí „Pokus 5 bez blokace“, takže selže i na opravené aplikaci.
**Návrh:** pokusy 1–4 bez blokace a blokace nastane při 5. pokusu, nebo nejpozději u 6. pokusu
správným heslem (`output.blockedAt > 0` po 6. pokusu, bez podmínky na 5.). L04 tímhle netrpí. Výklad
„po 5 pokusech“ zapsat do Předpokladů.

**K3 · 07 po opravě nejspíš zůstane červený · `07-konec-pred-zacatkem.yaml:13` · opravit** (známé, README ř. 329)
`ERR: ".*[Kk]onec.*"`. Znění hlášky z opravené verze nikdo nezná. **Návrh:** `ERR: ".+"` + F4
(nic se neuložilo). Smysl testu je „záznam se neuložil“, ne „hláška obsahuje slovo konec“.

**K4 · R03 tvrdě čeká viditelnou chybu · `subflows/expect-request-error.yaml:13-16` · drobnost**
Oprava, která zablokuje tlačítko Odeslat (bez hlášky), je taky správná, ale test zůstane červený.
Podstatné je, že žádost nevznikla a zůstatek se nezměnil, a to test ověřuje (ř. 23-25, R03:29-31).
**Návrh:** viditelnou chybu brát jako doplňkovou kontrolu, ne jako podmínku.

**K5 · F1 a F8** (výše) jsou opačný případ: `known-bug` test projde **bez** opravy.

**K6 · regresní kroky uvnitř `known-bug` testů se ignorují · drobnost**
Např. „Práce přidala 4 h“ v 01b nebo vytvoření žádosti v R02. Pokud tam něco rozbije nová verze,
uvidí se to jen v ignorovaném běhu. Dnes to pokrývají 01a a R01, takže je to v pořádku. Stojí za to
to zmínit při prezentaci.

**K7 · tag `regression` je i na `known-bug` testech (01b:4-6, 07, 10, 11, O01) a login testy ho nemají · drobnost**
CI filtruje podle složek, takže to nevadí. Kdo ale pustí `--include-tags regression`, dostane výsledek,
který nečeká. **Návrh:** `regression` odebrat, nebo ho dát důsledně všem kromě `known-bug`.

---

## 6. Čitelnost a údržba

**C1 · v pořádku:** komentáře v hlavičkách vysvětlují *proč*, popisky kroků (`label`) jsou česky
a čitelné v reportu. Názvy souborů jsou popisné.

**C2 · duplicity · drobnost**
- 01a/01b/01c se liší jen typem a očekávaným přírůstkem → jeden subflow `interruption-check.yaml`
  s `TYPE` a `DELTA`.
- R04 a R05 ř. 26-36 jsou identické (odhlásit → vedoucí → rozhodnout → odhlásit → Jan) →
  subflow `switch-user.yaml`.
- L01 ř. 15-49 jsou 5× stejné bloky → `repeat` jako v `login-block-jan.yaml`.
- `count-day-entries.yaml:38-128` je 10× stejný blok. Je to vědomé (komentář ř. 6) a dá se to obhájit.
- `start-as-jan.yaml` a `login.yaml` dohromady dosazují heslo `Demo2026!` na 10 místech → `env`
  v `config.yaml`, nebo `-e PASSWORD=…`. Je to demo účet, takže nejde o bezpečnost, jen o údržbu.

**C3 · JS v YAML · drobnost**
Většina je v pořádku (krátké `evalScript`). Výjimka je `login-submit-record.yaml:32-33`: dva dlouhé
ternární výrazy na jednom řádku, kterým cizí člověk neporozumí. **Návrh:** přesunout do
`scripts/login-record.js` s komentáři. `dates.js` je dlouhý, ale dobře okomentovaný.

**C4 · konvence pojmenování · drobnost**
Prefixy `01a…11`, `R01`, `O01`, `L01` – manual-entry jako jediná sada nemá písmeno. Pro prezentaci
stačí `M01…M11`. Nic víc.

**C5 · chybí `tests/config.yaml` · drobnost**
Workspace config Maestra (`flows`, `includeTags`/`excludeTags`, `env`) by umožnil spustit všechno
jedním příkazem `maestro test .` a sjednotil by heslo a další `env`.

---

## 7. README – jde podle něj spustit testy na čistém PC?

Spíš ano, pro člověka, který Android SDK zná. Pro „čisté PC“ chybí několik věcí a pár míst působí
nedokončeně.

**R1 · nevyplněná místa `TODO` · blokuje**
`tests/README.md:24` (verze Javy), `:27` (název APK), `:227-233` (pět `TODO: doplnit`
v tabulce „Co automatizované není“), `:274` (výsledek O01). Hodnotitel začne číst právě tady.
**Návrh:** vyplnit, nebo řádek smazat. Výsledek O01 už existuje: běh 22. 11. 21:42
(`docs/test-runs/posledni/2026-11-22_214207`) skončil `before 0 → synced 1 → after 3` a selhal na
„Opakované obnovení sítě záznam nezdvojilo“, tedy přesně podle očekávání. CLAUDE.md ř. 116
i README ř. 274 o tom pořád píšou „nespuštěný“.

**R2 · nesrovnalosti · blokuje (rychlá oprava)**
- `:110` „Na 18 testů“ – testů je 26 (13 + 5 + 1 + 7).
- `:115` „Automatizované jsou dvě oblasti“ – jsou čtyři (+ offline, přihlášení).
- `:41-46` a `:55-60` hlavní postup spouští jen manual-entry, requests a offline. **Chybí `flows/login`**,
  i když je ve stromu (ř. 11) i v CI.

**R3 · chybí očekávaný výsledek a doba běhu · opravit**
Cizí člověk uvidí 10 červených testů a nebude vědět, jestli je to dobře. **Návrh:** v sekci 1 krátká
tabulka „sada → očekávaně prošlo / selhalo (`known-bug`) → doba“. Lokálně: manual-entry 9/4,
~16 min, requests 3/2, ~5 min, login 4/3, ~8,5 min, offline 0/1, ~2 min. Zdroj: logy běhů 22. 11.

**R4 · chybí nastavení emulátoru · opravit**
- pásmo emulátoru (N2) – jak ho nastavit, ne jen že na něm záleží,
- klávesnice – přesná cesta v Nastavení (dnes jen v CLAUDE.md ř. 66–70),
- jazyk zařízení (S2),
- „kdy nespouštět“ (tabulka z N1).

**R5 · drobnosti**
- Doporučuje obraz Google APIs, ale testy na něm nikdy neběžely. Poctivě to uvést (zčásti je to tam, ř. 30).
- Node je potřeba jen pro `tools/probe` – zmínit to tam.

---

## 8. CI koncept (`.github/workflows/maestro.yml`)

Je proveditelný a má správnou kostru: udev pravidlo pro KVM je postup, který GitHub dokumentuje pro
Linux runnery, a `reactivecircus/android-emulator-runner` s `google_apis` + `x86_64` je běžná volba.
Poznámka o jednom volání `bash` (ř. 69) je správná, protože runner spouští každý řádek `script` zvlášť.
Slabá místa:

**CI1 · `timeout-minutes: 60` (ř. 28) nejspíš nestačí · opravit**
Lokálně na emulátoru s HW akcelerací trvá všech 26 testů ~31 min (R3). V CI se počítá navíc start
emulátoru bez snapshotu (jednotky minut) a softwarové GPU (`swiftshader_indirect`), které bývá
znatelně pomalejší. Odhad je 45–90 min.
**Návrh:** `matrix` po sadách (4 paralelní joby, každý s vlastním emulátorem), cache AVD snapshotu
(`actions/cache` + `force-avd-creation: false`, jak ukazuje README akce) a timeout 90. `known-bug` běh
spouštět jen na `workflow_dispatch`/`schedule`.

**CI2 · jazyk a pásmo emulátoru v CI · opravit**
Emulátor bude `en-US`/UTC. Pásmo je v pořádku a záměrné (ř. 13-14). Jazyk viz S2.

**CI3 · stažení APK (ř. 51-58) · opravit**
`--pattern "*.apk"` z posledního release: když release obsahuje víc APK, `adb install -r app/*.apk`
(ř. 75) dostane víc souborů a selže. Bez pevného tagu se navíc nedá zopakovat běh nad konkrétní
verzí. **Návrh:** `workflow_dispatch` vstup `app_tag` (výchozí `latest`) a přesný název souboru.

**CI4 · stabilita Maestra v CI · drobnost**
Na pomalých emulátorech se běžně zvyšuje `MAESTRO_DRIVER_STARTUP_TIMEOUT` (např. 120000) a vypíná
analytika (`MAESTRO_CLI_NO_ANALYTICS=1`). Doporučuji obojí, ale v tomto projektu jsem to neověřoval.

**CI5 · výsledky nejsou vidět bez stažení artefaktu · drobnost**
**Návrh:** JUnit reporter akce (např. `mikepenz/action-junit-report`) nebo souhrn do
`$GITHUB_STEP_SUMMARY` (spojit s K1).

**CI6 · workflow nikdy neběžel · opravit, pokud se odevzdává přes GitHub**
Složka projektu není git repozitář. Pokud odevzdání pojede přes GitHub, stojí za to pustit workflow
jednou ručně (`workflow_dispatch`). I červený běh s vysvětlením je silnější důkaz než „neověřený koncept“.
Pokud se odevzdává ZIP, nechat to tak, jak je – poctivě označené (ř. 3-4).

---

## 9. Pokrytí rizik ze specifikace

Dělení „deterministické výpočty a validace automaticky, reálný čas, jazyky a TalkBack ručně“ je
rozumné a dobře zdůvodněné. Mezery (seřazené podle rizika):

**P1 · bod 3 / BUG-007 (vysoká priorita, únik a přepsání dat) · opravit**
Existuje jen diagnostika s `optional` (`investigate/bug-007-isolation.yaml:44-53, 82-98`), která vždy
„projde“. Nejvážnější nalezená chyba tak nemá regresní test a na nové verzi se oprava neověří.
**Návrh:** `flows/isolation/I01-eva-nevidi-zaznam-jana.yaml` jako `known-bug`: zkopírovat kroky 1–2
a 4, odebrat `optional`. Je to asi 20 minut práce.

**P2 · bod 20 (směna přes půlnoc, výslovné upřesnění firmy) · opravit**
README ř. 227 tvrdí, že to nejde, protože se nedá měnit čas emulátoru. Ruční záznam ale má
`manual-next-day` (strom ze sondy `employee_cs_manual-entry.json`). Záznam `22:00–06:00` předevčírem
s „Konec následující den“ a dvakrát `capture-day-total` (+120 min předevčírem, +360 min včera) je
deterministický a čas zařízení nepotřebuje. Firma tuhle otázku sama zodpověděla, takže to
pravděpodobně bude kontrolovat. Podle CLAUDE.md (★2) to zatím nebylo ověřené ani ručně.

**P3 · bod 13 (půlden – BUG-024, Lékař a Home office nemění zůstatek) · opravit**
Všechny potřebné subflow existují (`submit-request` s `TYPE`, `capture-balance`). Lékař a Home office
jsou dva krátké testy. Půlden potřebuje přepínač a narazí na celá čísla v `parse-balance.js`
(známé omezení).

**P4 · bod 5 / BUG-013 (dvojklik na Příchod) · drobnost**
`doubleTapOn: id: btn-attendance` + `count-day-entries`. Subflow na počítání už existuje z O01.

**P5 · bod 9 (měsíční součet) · drobnost**
`month-total` se kontroluje jen jako viditelný (`capture-day-total.yaml:23-24`), nikdy jeho hodnota.
Stačí přidat přírůstek měsíčního součtu do 01a (stejný parse skript).

**P6 · bod 16 (zrušení schválené žádosti „den před“) · drobnost**
Hranice jde zčásti automatizovat bez změny času: žádost od zítřka zrušit jde, žádost od dneška ne
(pokud ji aplikace dovolí vytvořit). V README chybí důvod, proč to automatizované není (ř. 228).

**P7 · bod 17 (restart za výpadku) · drobnost**
README ř. 340 uvádí, že se neautomatizuje. `stopApp` + `launchApp` bez `clearState` ale v L05 funguje,
takže to jde.

Ruční zůstávají rozumně: TalkBack (21), jazyky (19), reálné přerušení na Přehledu (6, 7), BUG-006
(nárok 20 dní).

---

## Pět věcí před zítřejším odesláním

Seřazeno podle poměru přínos / čas.

1. **README: vyplnit nebo smazat `TODO`, opravit „18 testů“ a „dvě oblasti“, doplnit `flows/login` do
   postupu a výsledek O01 z běhu 21:42** (R1, R2). ~20 min. Hodnotitel začne číst tady a nevyplněná
   místa působí nedodělaně. Stejný fakt opravit v CLAUDE.md ř. 116.
2. **Test 10: přidat kotevní záznam** (F1). ~10 min + 1,5 min běh. Bez toho `known-bug` test na 1.0
   v pondělí a v úterý projde a tvrdí, že je BUG-015 opravený.
3. **`fill-manual-entry`: ověřit vybraný typ přes `checked: true`, klepnout i na Práce** (F2). ~10 min
   + běh manual-entry na pozadí (~16 min). Kód už je hotový ve `fill-request.yaml`.
4. **Ověřit jazyk aplikace na emulátoru s angličtinou** (S2). ~10 min. Když aplikace jazyk zařízení
   přebírá, selže u firmy i v CI skoro všechno. Oprava je pak jeden krok v `start-as-jan.yaml`.
   Když ho nepřebírá, stačí jedna věta do README.
5. **Do README tabulku „kdy testy nespouštět“ (N1) a nastavení pásma emulátoru (N2)**. ~15 min.
   Druhé kolo může padnout na 1.–7. prosinec. Pak test 02 selže a R03 selže „očekávaně“ ze špatného
   důvodu. Hodnotitel by měl vědět předem proč.

Hned potom (pokud zbude čas, jinak uvést v README jako „co dál“): L01 výklad 5. pokusu (K2, ~15 min),
regresní `known-bug` test BUG-007 (P1, ~20 min), bod 20 přes `manual-next-day` (P2, ~30 min),
kontrola kroku selhání `known-bug` v CI (K1).

---

## Co jsem neověřoval

- Testy jsem nespouštěl. Chování aplikace beru z logů v `docs/test-runs/` a z CLAUDE.md.
- Jestli má dnešek v pracovní den předvyplněné záznamy (F8) a jestli aplikace přebírá jazyk systému
  (S2) – obojí je potřeba ověřit.
- Kalendářní okna u R02/R03 (N1) jsem dopočítal ručně z `dates.js` pro rok 2026, ne během.
- Odhad doby CI (CI1) vychází z lokálních časů, ne z běhu na GitHubu.

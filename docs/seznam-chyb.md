# Seznam chyb – Docházka Demo 1.0

Stav k 23. 11. 2026. Odkazy „bod N“ se vztahují ke specifikaci (`docs/specifikace.md`).
Stejná data jako tabulka: `docs/seznam-chyb.xlsx`.

**Prostředí (pro všechny nálezy):** Docházka Demo 1.0 (`cz.demo.dochazka`), emulátor Pixel 7, Android 15 (API 35),
obraz s Google Play. Časy ve screenshotech pořízených do 22. 11. jsou v UTC (o hodinu méně než v Praze).
**Účty:** Jan (`jan.novak@demo.cz`), Eva (`eva.svobodova@demo.cz`), vedoucí (`vedouci@demo.cz`), heslo `Demo2026!`.
**Výchozí stav:** každý report začíná `adb shell pm clear cz.demo.dochazka` a přihlášením jako Jan, pokud není uvedeno jinak.
**Data v krocích:** „pracovní den s daty“ = poslední pracovní den před dneškem (ne víkend ani svátek, nejvýš 7 dní zpět).
Jan tam má po `pm clear` předvyplněno Práce 8:00–16:30 a Oběd 12:00–12:30, denní součet 8 h 00 min.
Data žádostí volte jako pracovní dny po dnešku v aktuálním roce. Konkrétní data v závorkách jsou z původního testování.

**Typ:** Chyba = rozpor se specifikací nebo zjevně chybné chování. UX / vylepšení = specifikace to nevyžaduje, návrh pro produkt.
**Priorita** = závažnost dopadu na uživatele a mzdy z pohledu testera. O pořadí oprav rozhoduje tým.
**Automaticky** = chybu hlídá automatický test s tagem `known-bug` (na verzi 1.0 selže, po opravě projde).

## Přehled

Detaily jsou níže (na GitHubu se rozbalí kliknutím na název).

| ID | Název | Priorita | Kategorie | Bod | Automaticky |
|---|---|---|---|---|---|
| BUG-007 | Po přepnutí účtu je vidět Výkaz jiného uživatele | Vysoká | Oprávnění a role | 3, 17 | diagnostický test |
| BUG-009 | Překrývající se záznamy Práce se sečtou | Vysoká | Výpočty | 7, 9, 10 | M11 |
| BUG-011 | Denní a měsíční součty neodpovídají záznamům ve Výkazu | Vysoká | Výpočty | 9 | – |
| BUG-012 | Přerušení Lékař se odečítá z odpracovaného času jako Oběd | Vysoká | Výpočty | 7 | M01b |
| BUG-013 | Dvojklik na Příchod vytvoří dva záznamy | Vysoká | Funkčnost | 5 | – |
| BUG-014 | Ruční záznam s koncem před začátkem uloží záporný čas | Vysoká | Validace vstupů | 11 | M07 |
| BUG-015 | Po smazání záznamu se denní součet nepřepočítá | Vysoká | Výpočty | 12 | M10 |
| BUG-016 | Žádost o dovolenou projde i při nedostatečném zůstatku | Vysoká | Validace vstupů | 15 | R03 |
| BUG-017 | Do čerpání dovolené se počítají víkendy | Vysoká | Výpočty | 14, 15 | R02 |
| BUG-021 | Záznam z offline Příchodu se zdvojí při každém obnovení sítě | Vysoká | Offline a synchronizace | 17 | O01 |
| BUG-024 | Půlden dovolené se odečte jako celý den | Vysoká | Výpočty | 13, 15 | – |
| BUG-002 | Chybí výběr data a času | Střední | UI/UX (vylepšení) | – | – |
| BUG-003 | Typy žádosti Dovolená a Lékař nejsou přeložené do SK a EN | Střední | Lokalizace | 19 | – |
| BUG-005 | V angličtině se datum zobrazuje v českém formátu | Střední | Lokalizace | 19 | – |
| BUG-006 | Zůstatek dovolené Jana je 8 dní bez žádostí | Střední | Výpočty | 3, 15 | – |
| BUG-019 | Žádost o dovolenou přijme i datum 1. 1. 1900 | Střední | Validace vstupů | 13, 16 | – |
| BUG-022 | Přihlášení se zablokuje už po 3. špatném pokusu | Střední | Přihlášení a bezpečnost | 2 | L01, L04 |
| BUG-023 | E-mail zadaný velkými písmeny se nepřihlásí | Střední | Přihlášení a bezpečnost | 1 | L06 |
| BUG-001 | Pole data a času otevírají textovou klávesnici | Nízká | UI/UX | – | – |
| BUG-004 | Název měsíce ve Výkazu se nepřekládá do SK a EN | Nízká | Lokalizace | 19 | – |
| BUG-008 | Aplikace neukazuje, kdo je přihlášený | Nízká | UI/UX (vylepšení) | – | – |
| BUG-018 | Vedoucí nemá potvrzení ani historii vyřízených žádostí | Nízká | UI/UX (vylepšení) | 16 | – |
| BUG-020 | Neexistující datum (31. 2.) hlásí chybu formátu | Nízká | Validace vstupů | – | – |

23 nálezů: 11 vysoká, 7 střední, 5 nízká. Tři z nich (BUG-002, 008, 018) jsou návrhy na vylepšení, ne rozpor
se specifikací. Testy: `M` = `tests/flows/manual-entry`, `R` = `requests`, `O` = `offline`, `L` = `login`.
BUG-010 se nereprodukoval a v seznamu není (viz konec).

---

## Vysoká priorita

<details><summary><b>BUG-007</b> Po přepnutí účtu je vidět Výkaz jiného uživatele</summary>

**Oblast:** Výkaz · **Kategorie:** Oprávnění a role · **Bod:** 3, 17 · **Stav:** Ověřeno

**Kroky:**
1. Jako Jan: Výkaz → Ruční záznam na pracovní den s daty, `07:00`–`08:00`, Práce, poznámka `ZAZNAM-JAN`. Uložit.
2. Odhlásit se, přihlásit jako Eva, otevřít Výkaz.
3. Ruční záznam na tentýž den, `09:00`–`10:00`, Práce, poznámka `ZAZNAM-EVA`. Uložit.
4. Odhlásit se, přihlásit jako Jan, otevřít Výkaz.

Automaticky (diagnostika, mimo regresní sadu): `maestro test tests/investigate/bug-007-isolation.yaml`

**Očekávaný výsledek:** Eva v kroku 2 nevidí ZAZNAM-JAN. Jan v kroku 4 vidí ZAZNAM-JAN a nevidí ZAZNAM-EVA.

**Skutečný výsledek:** Eva v kroku 2 vidí celý Výkaz Jana (jeho předvyplněná data i ZAZNAM-JAN). Jan v kroku 4
vidí celý Výkaz Evy včetně ZAZNAM-EVA, jeho vlastní záznamy nejsou vidět. Opakovatelné vždy.
Žádosti zůstávají oddělené správně.

**Důkaz:** `docs/evidence/BUG-007/` (maestro-vystup.png, bug007-2-eva-hledani-jan.png, bug007-4-jan-hledani-eva.png)

**Poznámka:** Únik osobních dat (bod 3). Z UI nejde poznat, jestli jsou Janovy záznamy smazané, nebo jen skryté.
Pokud smazané, jde i o ztrátu záznamů, kterou bod 17 vylučuje. Pravděpodobně stejná příčina jako BUG-011.

</details>

<details><summary><b>BUG-009</b> Překrývající se záznamy Práce se sečtou</summary>

**Oblast:** Výkaz · **Kategorie:** Výpočty · **Bod:** 7, 9, 10 · **Stav:** Ověřeno

**Kroky:**
1. Výkaz, pracovní den s daty: Práce 8:00–16:30, Oběd 12:00–12:30, součet 8 h 00 min.
2. Ruční záznam na tentýž den: `6:00`–`11:00`, Práce, libovolná poznámka. Uložit.

Automaticky: test M11.

**Očekávaný výsledek:** Překrývající se záznam je odmítnut, nebo se překryv započítá jen jednou
(6:00–16:30 bez oběda = 10 h 00 min).

**Skutečný výsledek:** Záznam se uloží a denní součet je 13 h 00 min (5 h + 8 h 30 min − 0 h 30 min).
Čas 8:00–11:00 je započítaný dvakrát, stejně naroste součet za měsíc.

**Důkaz:** `docs/evidence/BUG-009/t11-vykaz.png`

**Poznámka:** U žádostí aplikace překryv hlídá, u záznamů docházky ne.

</details>

<details><summary><b>BUG-011</b> Denní a měsíční součty neodpovídají záznamům ve Výkazu</summary>

**Oblast:** Výkaz · **Kategorie:** Výpočty · **Bod:** 9 · **Stav:** Pozorováno, spolehlivý postup nenalezen

**Kroky:** Nastalo po střídání účtů Jan ↔ Eva s ručními záznamy (kroky jako u BUG-007), bez `pm clear` mezi nimi.

**Očekávaný výsledek:** Denní součet = součet záznamů dne bez oběda, měsíční součet = součet dní.

**Skutečný výsledek:** Ve Výkazu Evy: 19. 11. jediný záznam 6:00–7:30 (1 h 30 min), denní součet 10 h 30 min.
18. 11. záznamy 8 h 30 min + 2 h 00 min, denní součet 26 h 30 min. Měsíc celkem 71 h 00 min.

**Důkaz:** pozorováno ručně 19. 11. ve Výkazu Evy, screenshot se nedochoval. Čísla jsou z poznámek z testování.

**Poznámka:** Nejspíš projev BUG-007 (součty z dat jiného uživatele). Po jeho opravě ověřit znovu, priorita do té doby
podle BUG-007. Nesouvisí s BUG-015, ten se projevuje i na čistém stavu s jedním účtem.

</details>

<details><summary><b>BUG-012</b> Přerušení Lékař se odečítá z odpracovaného času jako Oběd</summary>

**Oblast:** Přehled, Výkaz · **Kategorie:** Výpočty · **Bod:** 7 · **Stav:** Ověřeno

**Kroky:**
1. Přehled → Příchod, počkat 2–3 min.
2. Oběd, počkat 3–4 min, Ukončit oběd.
3. Lékař, počkat 3–4 min a sledovat „Odpracováno dnes“, Ukončit.
4. Odchod, otevřít Výkaz.

Automaticky: test M01b (ruční záznam se známými časy, bez čekání).

**Očekávaný výsledek:** Během Oběda „Odpracováno dnes“ stojí, během Lékaře roste. Odečte se jen Oběd (bod 7).

**Skutečný výsledek:** Během Lékaře „Odpracováno dnes“ stojí. Výkaz: Práce 0 h 13 min, Oběd 0 h 04 min,
Lékař 0 h 04 min, denní součet 0 h 04 min. Správně by bylo asi 0 h 09 min.

**Důkaz:** `docs/evidence/BUG-012/` (6 screenshotů), výstup testu M01b

**Poznámka:** Časy se zobrazují v celých minutách bez sekund, proto součet ručního běhu nesedí na minutu přesně
(13 − 4 − 4 ≠ 4). Test M01b chybu potvrzuje na přesných časech. Služební cesta se správně neodečítá.

</details>

<details><summary><b>BUG-013</b> Dvojklik na Příchod vytvoří dva záznamy</summary>

**Oblast:** Přehled, Výkaz · **Kategorie:** Funkčnost · **Bod:** 5 · **Stav:** Ověřeno

**Kroky:**
1. Přehled, stav „Mimo práci“: rychle dvakrát klepnout na Příchod.
2. Po několika minutách Odchod, otevřít Výkaz.

**Očekávaný výsledek:** Vznikne jeden záznam (bod 5: jedno ťuknutí = jeden záznam).

**Skutečný výsledek:** Vzniknou dva záznamy Práce se stejným začátkem. Stav „V práci“ duplicitu neukáže,
jen „Odpracováno dnes“ roste dvojnásobně (za 4 min o 8 min). Odchod uzavře oba záznamy a oba zůstanou v součtu.
Dvojklik na Odchod vytvoří jeden záznam správně.

**Důkaz:** `docs/evidence/BUG-013/` (vykaz-dva-prichody-2135.png, prehled-2141.png, vykaz-dvojity-soucet-2141.png)

**Poznámka:** Každá minuta se započítá dvakrát.

</details>

<details><summary><b>BUG-014</b> Ruční záznam s koncem před začátkem uloží záporný čas</summary>

**Oblast:** Výkaz · **Kategorie:** Validace vstupů · **Bod:** 11 · **Stav:** Ověřeno

**Kroky:** Výkaz → Ruční záznam na pracovní den s daty, Začátek `18:00`, Konec `17:00`, Práce, poznámka,
„Konec následující den“ nezaškrtnuto. Uložit.

Automaticky: test M07.

**Očekávaný výsledek:** Chyba, záznam se neuloží (bod 11).

**Skutečný výsledek:** Uloží se „Práce 18:00–17:00, −1 h 00 min“, denní i měsíční součet klesne o hodinu.

**Důkaz:** `docs/evidence/BUG-014/t07-konec-pred-zacatkem.png`

**Poznámka:** Noční směna zadaná bez zaškrtnutí „Konec následující den“ tiše odečte hodiny místo chyby.

</details>

<details><summary><b>BUG-015</b> Po smazání záznamu se denní součet nepřepočítá</summary>

**Oblast:** Výkaz · **Kategorie:** Výpočty · **Bod:** 12 · **Stav:** Ověřeno

**Kroky:**
1. Výkaz, pracovní den s daty: Práce 8:00–16:30 a Oběd, součet 8 h 00 min.
2. Ruční záznam na tentýž den: `17:00`–`19:00`, Práce, poznámka `T10-SMAZAT`. Součet 10 h 00 min.
3. U záznamu T10-SMAZAT klepnout na Smazat, přepnout tab a vrátit se na Výkaz.

Automaticky: test M10.

**Očekávaný výsledek:** Záznam zmizí a součet se vrátí na 8 h 00 min, měsíční součet klesne o 2 h (bod 12).

**Skutečný výsledek:** Záznam zmizí, denní součet zůstane 10 h 00 min i po přepnutí tabu.

**Důkaz:** `docs/evidence/BUG-015/t10-po-smazani.png`, běhy `docs/test-runs/posledni/2026-11-22_180146`
a `2026-11-23_090519` (v den zůstal jen kotevní záznam 1 h, denní součet 3 h)

**Poznámka:** Projeví se jen tehdy, když v dni zůstanou jiné záznamy. Smazáním posledního záznamu zmizí celý den.
Neověřeno: restart aplikace, smazání automatického záznamu.

</details>

<details><summary><b>BUG-016</b> Žádost o dovolenou projde i při nedostatečném zůstatku</summary>

**Oblast:** Žádosti · **Kategorie:** Validace vstupů · **Bod:** 15 · **Stav:** Ověřeno

**Kroky:** Žádosti (zůstatek 8 dní) → Nová žádost: Dovolená na dva celé týdny Po–Pá
(původně `23.11.2026`–`05.12.2026`). Odeslat.

Automaticky: test R03.

**Očekávaný výsledek:** Žádost se neodešle (upřesnění firmy 20. 11.: žádost do minusu se neodešle).

**Skutečný výsledek:** Žádost se odešle, zůstatek „-5 dní“ (odečteno 13 dní včetně víkendů, viz BUG-017).
Vedoucí zůstatek nevidí a žádost jde schválit. I v minusu jde podat další žádost.

**Důkaz:** `docs/evidence/BUG-016/` (zadost-23-11-5-12-zustatek-minus-5.png, jan-schvaleno-zustatek-minus-5.png, dalsi-zadost-v-minusu-6.png)

</details>

<details><summary><b>BUG-017</b> Do čerpání dovolené se počítají víkendy</summary>

**Oblast:** Žádosti · **Kategorie:** Výpočty · **Bod:** 14, 15 · **Stav:** Ověřeno

**Kroky:**
1. Žádosti: podat a nechat 1denní žádost, aby byl zůstatek 7 dní.
2. Nová žádost: Dovolená středa až pondělí přes víkend (původně `25.11.2026`–`30.11.2026`). Odeslat.

Automaticky: test R02.

**Očekávaný výsledek:** Odečtou se jen 4 pracovní dny (bod 14), zůstatek 3 dny.

**Skutečný výsledek:** Odečte se 6 dní včetně soboty a neděle, zůstatek 1 den.
Kontrola se svátky: 23.–28. 12. odečte 3 dny. Svátky 24.–26. 12. vynechá správně, neděli 27. 12. započte.

**Důkaz:** `docs/evidence/BUG-017/` (zadost-25-30-11-zustatek-1-den.png, dovolena-23-28-12-svatky-zustatek-5.png)

**Poznámka:** Zaměstnanec přijde o 2 dny za každý víkend v rozsahu.

</details>

<details><summary><b>BUG-021</b> Záznam z offline Příchodu se zdvojí při každém obnovení sítě</summary>

**Oblast:** Přehled, Výkaz · **Kategorie:** Offline a synchronizace · **Bod:** 17 · **Stav:** Ověřeno

**Kroky:**
1. Nastavení → zapnout Simulovat výpadek sítě. Přehled → Příchod, po chvíli Odchod.
2. Vypnout výpadek („Vše odesláno“, ve Výkazu 1 záznam).
3. Bez další akce výpadek zapnout a vypnout, otevřít Výkaz. Opakovat.

Automaticky: test O01.

**Očekávaný výsledek:** Každý záznam se odešle jednou, další přepínání nic nepřidá (bod 17).

**Skutečný výsledek:** Po každém dalším obnovení sítě přibude kopie záznamu (po dvou obnoveních třikrát),
součty rostou. Záznam s Příchodem zadaným online se nezdvojí. Restart aplikace na výsledek nemá vliv.

**Důkaz:** `docs/evidence/offline/` (C1-bez-restartu-offline-zaznam-3x.png, o01-po-dvou-vypadcich.png), běh `docs/test-runs/posledni/2026-11-22_214207`

**Poznámka:** Při jediném obnovení sítě chyba není vidět. Kopie přibývají bez omezení a jdou přímo do mezd.

</details>

<details><summary><b>BUG-024</b> Půlden dovolené se odečte jako celý den</summary>

**Oblast:** Žádosti · **Kategorie:** Výpočty · **Bod:** 13, 15 · **Stav:** Ověřeno

**Kroky:**
1. Žádosti (zůstatek 8 dní) → Nová žádost: Dovolená, Od = Do = nejbližší pracovní den po dnešku, zapnout Půlden. Odeslat.
2. Zrušit žádost, pak podat dva půldny na dva různé pracovní dny.

**Očekávaný výsledek:** Krok 1: 7,5 dne. Krok 2: dva půldny = 1 den, zůstatek 7.

**Skutečný výsledek:** Krok 1: „7 dní“. Krok 2: zůstatek 6. Každý půlden odečte celý den.

**Důkaz:** `docs/evidence/BUG-024/` (pulden-1-24-11-zustatek-7.png, pulden-5-dva-pulden-zustatek-6.png)

**Poznámka:** Nejde o zaokrouhlení zobrazení, dva půldny by pak daly 7, ne 6. Označení půldne i odmítnutí
půldne přes víc dní funguje.

</details>

---

## Střední priorita

<details><summary><b>BUG-002</b> Chybí výběr data a času</summary>

**Oblast:** Žádosti, Výkaz · **Kategorie:** UI/UX · **Typ:** UX / vylepšení · **Stav:** Ověřeno

**Kroky:** Žádosti → Nová žádost, klepnout do Od/Do. Výkaz → Ruční záznam, klepnout do Datum/Začátek/Konec.

**Očekávaný výsledek:** Datum z kalendáře, čas z výběru času (běžný vzor na Androidu).

**Skutečný výsledek:** Výběr se neotevře, datum i čas jen ručně (DD.MM.RRRR, HH:MM). Na mobilu náchylné k překlepům.

**Poznámka:** Specifikace to nevyžaduje, rozhoduje produkt. Souvisí s BUG-001.

</details>

<details><summary><b>BUG-003</b> Typy žádosti Dovolená a Lékař nejsou přeložené do SK a EN</summary>

**Oblast:** Žádosti · **Kategorie:** Lokalizace · **Bod:** 19 · **Stav:** Ověřeno

**Kroky:** Nastavení → Slovenčina (poté English), Žádosti → Nová žádost.

**Očekávaný výsledek:** SK Dovolenka, Lekár; EN Vacation, Doctor.

**Skutečný výsledek:** V SK i EN zůstávají české popisky Dovolená a Lékař, zbytek formuláře je přeložený.

**Důkaz:** `docs/evidence/BUG-003/` (employee_sk_new-request.png, employee_en_new-request.png)

</details>

<details><summary><b>BUG-005</b> V angličtině se datum zobrazuje v českém formátu</summary>

**Oblast:** Výkaz, Žádosti · **Kategorie:** Lokalizace · **Bod:** 19 · **Stav:** Ověřeno

**Kroky:** Nastavení → English, otevřít Timesheet.

**Očekávaný výsledek:** Datum ve formátu angličtiny (předpoklad: britský, 18/11/2026).

**Skutečný výsledek:** „18. 11. 2026“ jako v češtině. Pole pro datum v EN čekají DD.MM.YYYY.

**Důkaz:** `docs/evidence/BUG-005/employee_en_timesheet.png`

**Poznámka:** Závisí na předpokladu o formátu, specifikace říká jen „formát zvoleného jazyka“.

</details>

<details><summary><b>BUG-006</b> Zůstatek dovolené Jana je 8 dní bez žádostí</summary>

**Oblast:** Žádosti · **Kategorie:** Výpočty · **Bod:** 3, 15 · **Stav:** Nový

**Kroky:** Jako Jan otevřít Žádosti. Pro srovnání totéž jako Eva.

**Očekávaný výsledek:** Bez žádostí 20 dní (nárok podle bodu 15).

**Skutečný výsledek:** Jan „Zbývá dovolené: 8 dní“ a „Zatím nemáte žádné žádosti“. Eva ve stejné situaci 20 dní.
12 dní čerpání nejde v aplikaci dohledat.

**Důkaz:** `docs/evidence/BUG-006/employee_cs_requests.png`

**Poznámka:** Buď chybný výchozí stav, nebo čerpání mimo žádosti, které aplikace neukazuje. Odečítání jako takové
funguje (1denní žádost 8 → 7). Uživatel si zůstatek nemůže ověřit.

</details>

<details><summary><b>BUG-019</b> Žádost o dovolenou přijme i datum 1. 1. 1900</summary>

**Oblast:** Žádosti · **Kategorie:** Validace vstupů · **Bod:** – (souvisí s 13, 16) · **Stav:** Ověřeno

**Kroky:** Nová žádost: Dovolená, Od a Do `01.01.1900`. Odeslat.

**Očekávaný výsledek:** Nesmyslné datum odmítnuto, rozumná mez jako u ručního záznamu (dnes − 7).

**Skutečný výsledek:** Žádost se uloží jako Čeká, vedoucí ji může schválit. Zůstatek se nezmění, kdežto žádost
na včerejšek odečte 1 den.

**Důkaz:** `docs/evidence/BUG-019/` (zadost-1-1-1900-ceka.png; jan-zadost-vcera-zustatek-minus-6.png je ze stavu po BUG-016, zůstatek před žádostí −5)

**Poznámka:** Zda jsou zpětné žádosti povolené, je otázka ke specifikaci. Chybou je chybějící mez a nekonzistence.

</details>

<details><summary><b>BUG-022</b> Přihlášení se zablokuje už po 3. špatném pokusu</summary>

**Oblast:** Přihlášení · **Kategorie:** Přihlášení a bezpečnost · **Bod:** 2 · **Stav:** Ověřeno

**Kroky:** E-mail `jan.novak@demo.cz`, 5× za sebou špatné heslo, po každém pokusu zapsat hlášku.

Automaticky: testy L01, L04.

**Očekávaný výsledek:** Pokusy 1–4 „Nesprávný e-mail nebo heslo.“, blokace nejpozději po 5. pokusu (bod 2).

**Skutečný výsledek:** Pokus 3 už hlásí „Přihlášení je na 1 minutu zablokované.“ Stejně ve všech testech, které
blokaci vyvolávají (L01–L05). Zbytek bodu 2 funguje: blokace trvá asi minutu, správné heslo během ní neprojde,
restart ji neobejde, jiný účet neblokuje.

**Důkaz:** `docs/evidence/BUG-022/l01-3-pokus-zablokovano.png`, běh `docs/test-runs/posledni/2026-11-22_211301`

</details>

<details><summary><b>BUG-023</b> E-mail zadaný velkými písmeny se nepřihlásí</summary>

**Oblast:** Přihlášení · **Kategorie:** Přihlášení a bezpečnost · **Bod:** 1 · **Stav:** Ověřeno

**Kroky:** E-mail `JAN.NOVAK@DEMO.CZ`, heslo `Demo2026!`, Přihlásit.

Automaticky: test L06.

**Očekávaný výsledek:** Přihlášení projde (bod 1).

**Skutečný výsledek:** „Nesprávný e-mail nebo heslo.“ Mezery kolem e-mailu se naopak ořezávají (L07 prošel).

**Důkaz:** `docs/evidence/BUG-023/l06-email-velkymi-odmitnut.png`, běh `docs/test-runs/posledni/2026-11-22_211301`

**Poznámka:** Klávesnice na telefonu často dá první písmeno velké a špatný pokus se navíc počítá do blokace (BUG-022).

</details>

---

## Nízká priorita

<details><summary><b>BUG-001</b> Pole data a času otevírají textovou klávesnici</summary>

**Oblast:** Žádosti, Výkaz · **Kategorie:** UI/UX · **Stav:** Ověřeno

**Kroky:** Nová žádost (Od, Do) a Ruční záznam (Datum, Začátek, Konec), u každého pole
`adb shell dumpsys input_method | findstr inputType`.

**Očekávaný výsledek:** Číselná klávesnice (inputType číslo nebo datum/čas).

**Skutečný výsledek:** Všech pět polí má `inputType=0x80001` (text). Pole přihlášení mají typ správně (e-mail, heslo).

**Důkaz:** hodnoty `inputType` jsou přímo v reportu, výstup `dumpsys` se neukládal. Ověření trvá pár sekund příkazem z kroků.

</details>

<details><summary><b>BUG-004</b> Název měsíce ve Výkazu se nepřekládá do SK a EN</summary>

**Oblast:** Výkaz · **Kategorie:** Lokalizace · **Bod:** 19 · **Stav:** Ověřeno

**Kroky:** Nastavení → Slovenčina / English, otevřít Výkaz.

**Očekávaný výsledek:** SK „november 2026“, EN „November 2026“.

**Skutečný výsledek:** Ve všech jazycích „Listopad 2026“.

**Důkaz:** `docs/evidence/BUG-004/` (employee_sk_timesheet.png, employee_en_timesheet.png)

</details>

<details><summary><b>BUG-008</b> Aplikace neukazuje, kdo je přihlášený</summary>

**Oblast:** všechny obrazovky · **Kategorie:** UI/UX · **Typ:** UX / vylepšení · **Stav:** Ověřeno

**Kroky:** Přihlásit se, projít všechny taby.

**Očekávaný výsledek:** Někde (Nastavení, záhlaví) je jméno nebo e-mail uživatele.

**Skutečný výsledek:** Nikde. Uživatel neověří, pod kým je přihlášený.

**Poznámka:** Podstatné u sdílených zařízení a ve spojení s BUG-007.

</details>

<details><summary><b>BUG-018</b> Vedoucí nemá potvrzení ani historii vyřízených žádostí</summary>

**Oblast:** Schvalování · **Kategorie:** UI/UX · **Typ:** UX / vylepšení · **Bod:** 16 · **Stav:** Ověřeno

**Kroky:** Jan podá žádost, vedoucí → Schvalování → Schválit.

**Očekávaný výsledek:** Potvrzení akce a možnost dohledat vyřízené žádosti.

**Skutečný výsledek:** Žádost jen zmizí. Vedoucí nemá historii, omyl (Schválit místo Zamítnout) nezjistí ani neopraví.

**Poznámka:** Bod 16 schvalování popisuje, potvrzení ani historii nevyžaduje, proto vylepšení. Tlačítka jsou vedle
sebe a akce je okamžitá bez potvrzení.

</details>

<details><summary><b>BUG-020</b> Neexistující datum (31. 2.) hlásí chybu formátu</summary>

**Oblast:** Žádosti · **Kategorie:** Validace vstupů · **Stav:** Ověřeno

**Kroky:** Nová žádost: Dovolená, Od `31.02.2027`, Do `01.03.2027`. Odeslat.

**Očekávaný výsledek:** Žádost se neodešle s hláškou typu „Zadané datum neexistuje.“

**Skutečný výsledek:** Neodešle se správně, ale hláška zní „Zadejte datum ve formátu DD.MM.RRRR.“, přestože formát je správný.

**Důkaz:** `docs/evidence/BUG-020/zadost-31-02-2027-hlaska-format.png`

</details>

---

## Nereprodukováno (nehlášeno)

**BUG-010** Ruční záznam přijme datum bez tečky (18.112026). Původní ruční pozorování se automatickým testem M09
nepotvrdilo, aplikace formát správně odmítla. Test M09 zůstává jako regresní test validace formátu.


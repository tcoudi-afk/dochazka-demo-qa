# Specifikace – Docházka Demo 1.0

Přepis přílohy zadání (PDF) kvůli práci v projektu. Odkazy „bod N“ v testech, tabulce a dokumentech
se vztahují k tomuto číslování.

## Přihlášení
1. Uživatel se přihlašuje e-mailem a heslem. U e-mailu nezáleží na velkých a malých písmenech.
2. Po 5 neúspěšných pokusech se přihlášení na 1 minutu zablokuje.
3. Každý uživatel vidí jen svoje záznamy a žádosti.

## Záznam docházky
4. Na úvodní obrazovce je tlačítko **Příchod** (když zaměstnanec není v práci) nebo **Odchod** (když v práci je).
5. Jedno ťuknutí vytvoří jeden záznam.
6. Přerušení (Oběd, Lékař, Služební cesta) se zahajuje a ukončuje tlačítkem na úvodní obrazovce.
7. Odpracovaný čas je součet doby mezi příchodem a odchodem bez přerušení typu Oběd. Lékař a Služební cesta se do odpracovaného času počítají.
8. Směna může přecházet přes půlnoc. Odpracovaný čas se celý započítá do dne příchodu.

## Výkaz
9. Výkaz ukazuje záznamy po dnech, denní součty a součet za měsíc.
10. Ruční záznam lze přidat nejvýše 7 dní zpětně a musí mít poznámku.
11. Konec intervalu nesmí být dřív než jeho začátek.
12. Záznam lze smazat. Součty se hned přepočítají.

## Žádosti o nepřítomnost
13. Typy žádostí: Dovolená, Lékař, Home office. Dovolenou lze žádat v celých dnech nebo v půldnech.
14. Do čerpání dovolené se nepočítají víkendy a státní svátky.
15. Nárok na dovolenou je 20 dní ročně. Zůstatek nesmí klesnout pod nulu.
16. Žádost schvaluje vedoucí. Schválenou žádost může zaměstnanec zrušit nejpozději den před jejím začátkem.

## Práce bez sítě
17. Bez sítě se záznamy uloží v telefonu a po obnovení sítě se odešlou. Žádný záznam se nesmí ztratit ani zdvojit.
18. Pro účely úkolu má aplikace v Nastavení přepínač **Simulovat výpadek sítě**.

## Ostatní
19. Aplikace je v češtině, slovenštině a angličtině. Datum a čas se zobrazují ve formátu zvoleného jazyka.
20. Odpracovaný čas se vždy počítá do kalendářního dne, ve kterém byl skutečně odpracován.
21. Aplikace musí jít ovládat se zapnutou čtečkou obrazovky (TalkBack).

## Upřesnění od firmy (e-mail 20. 11. 2026)
- Body 8 a 20: platí bod 20, čas se o půlnoci rozdělí (22:00–6:00 = 2 h dni příchodu, 6 h následujícímu dni).
  Z bodu 8 platí jen, že směna smí přecházet přes půlnoc.
- Vedoucí vidí čekající žádosti Jana i Evy, jejich výkazy ne, vlastní docházku ani žádosti nemá.
- Zůstatek se sníží při odeslání žádosti, zamítnutí nebo zrušení dny vrátí, žádost do minusu se neodešle.
  Čekající žádost jde zrušit také jen do dne před začátkem. Lékař a Home office zůstatek neovlivňují.
- Dny podle data a časového pásma telefonu; ruční záznam dnes − 7 až dnes; budoucí dny ne;
  zrušení schválené žádosti nejpozději ve 23:59 den před začátkem.

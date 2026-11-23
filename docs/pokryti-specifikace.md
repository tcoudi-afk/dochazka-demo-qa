# Pokrytí specifikace – Docházka Demo 1.0

Každý bod specifikace (`docs/specifikace.md`): jak byl testovaný a co se našlo.
Testy: `M` = `tests/flows/manual-entry`, `R` = `requests`, `O` = `offline`, `L` = `login`.
**Výsledek:** ✅ odpovídá specifikaci · ❌ chyba · ⚠️ testováno jen částečně · — netestováno

| Bod | Požadavek | Ručně | Automaticky | Výsledek | Chyby |
|---|---|---|---|---|---|
| 1 | E-mail bez ohledu na velikost písmen | ano | L06, L07 | ❌ | BUG-023 |
| 2 | Blokace po 5 pokusech na 1 minutu | ano | L01–L05 | ❌ práh 3 místo 5, délka a rozsah blokace OK | BUG-022 |
| 3 | Každý vidí jen svoje záznamy a žádosti | ano | diagnostický test BUG-007 | ❌ Výkaz, žádosti oddělené správně | BUG-007, BUG-011 |
| 4 | Tlačítko Příchod / Odchod podle stavu | ano | O01 (nepřímo) | ✅ | – |
| 5 | Jedno ťuknutí = jeden záznam | ano | – | ❌ u Příchodu, Odchod OK | BUG-013 |
| 6 | Přerušení se zahajuje a ukončuje na úvodní obrazovce | ano | – | ✅ | – |
| 7 | Odpracovaný čas bez Oběda, Lékař a cesta se počítají | ano | M01a, M01b, M01c | ❌ Lékař se odečítá | BUG-012 |
| 8 | Směna přes půlnoc smí přecházet | – | – | — (podle firmy platí bod 20) | – |
| 9 | Výkaz: záznamy po dnech, denní a měsíční součty | ano | M01a–c, M10, M11 (denní součet) | ❌ | BUG-009, BUG-011 |
| 10 | Ruční záznam max. 7 dní zpětně, povinná poznámka | ano | M02–M06, M09 | ✅ | – |
| 11 | Konec nesmí být před začátkem | ano | M07, M08 | ❌ | BUG-014 |
| 12 | Smazání záznamu, součty se hned přepočítají | ano | M10 | ❌ | BUG-015 |
| 13 | Typy žádostí, celé dny a půldny | ano | R01 | ❌ půlden jako celý den | BUG-024 |
| 14 | Víkendy a svátky se nečerpají | ano | R02 | ❌ víkendy se čerpají, svátky OK | BUG-017 |
| 15 | Nárok 20 dní, zůstatek ne pod nulu | ano | R01, R03, R04 | ❌ | BUG-016, BUG-006 |
| 16 | Schvalování vedoucím, zrušení nejpozději den před | ano | R01, R04, R05 | ⚠️ zrušení v den začátku neověřeno | BUG-018, BUG-019 |
| 17 | Bez sítě se nic neztratí ani nezdvojí | ano | O01 | ❌ | BUG-021 |
| 18 | Přepínač Simulovat výpadek sítě | ano | O01 | ✅ | – |
| 19 | CS, SK, EN, formát data podle jazyka | ano (sonda + ručně) | – | ❌ | BUG-003, BUG-004, BUG-005 |
| 20 | Čas do kalendářního dne, kdy byl odpracován | – | – | — riziko, viz poznámky | – |
| 21 | Ovládání s TalkBackem | částečně (vedoucí) | – | ⚠️ tok zaměstnance netestován | – |

Mimo specifikaci (bez bodu ve specifikaci): BUG-001, BUG-002, BUG-008, BUG-020.

**Souhrn:** 21 bodů, 19 testovaných aspoň částečně, 15 automatizovaně (body 3, 4 a 18 jen diagnosticky nebo nepřímo). Chyba ve 13 bodech, ✅ ve 4, ⚠️ ve 2, netestované body 8 a 20.

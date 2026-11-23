# Docházka Demo 1.0 – domácí úkol QA (Alveno / IRESOFT)

Testování Android aplikace Docházka Demo 1.0 podle zadané specifikace (21 bodů).
Autor: Tomáš Koudelka, listopad 2026.

## Co je kde

| Co | Soubor |
|---|---|
| **Seznam chyb** (23 nálezů, 11 s vysokou prioritou; BUG-010 nereprodukován, nehlášen) | [`docs/seznam-chyb.md`](docs/seznam-chyb.md), tabulka [`docs/seznam-chyb.xlsx`](docs/seznam-chyb.xlsx) |
| **Poznámky:** co jsem testoval ručně, rizika, otázky ke specifikaci | [`docs/poznamky.md`](docs/poznamky.md) |
| Pokrytí specifikace: každý bod, jak testován, výsledek | [`docs/pokryti-specifikace.md`](docs/pokryti-specifikace.md) |
| **Automatické testy:** spuštění, proč Maestro, co je a není automatizované, CI | [`tests/README.md`](tests/README.md) |
| **Použití AI** | [`docs/pouziti-ai.md`](docs/pouziti-ai.md) |
| Review testů samostatnou instancí AI a co jsem s ním udělal | [`docs/review-testu.md`](docs/review-testu.md) |
| Specifikace (přepis zadání), na kterou odkazují „body N“ | [`docs/specifikace.md`](docs/specifikace.md) |
| Důkazy k chybám (screenshoty) a výstupy běhů testů | [`docs/evidence/`](docs/evidence/), [`docs/test-runs/`](docs/test-runs/) |

## Nejzávažnější nálezy

1. **Výkaz jiného uživatele (BUG-007).** Po přepnutí účtu vidí Eva celý Výkaz Jana. Když uloží záznam,
   Jan pak vidí Výkaz Evy a své záznamy ne. Únik osobních údajů a riziko ztráty záznamů pro mzdy.
2. **Kopie záznamů po výpadku sítě (BUG-021).** Záznam vzniklý offline se po každém dalším obnovení sítě
   objeví znovu (po dvou obnoveních třikrát). Kopie přibývají bez omezení.
3. **Dvojklik na Příchod (BUG-013).** Vzniknou dva záznamy a každá minuta se počítá dvakrát. Na Přehledu
   je to poznat jen podle toho, že „Odpracováno dnes“ roste dvojnásobnou rychlostí.
4. **Výpočet odpracovaného času:** Lékař se odečítá jako Oběd (BUG-012), překryv se sečte (BUG-009),
   konec před začátkem dá záporný čas (BUG-014), smazání nepřepočítá součet (BUG-015).
5. **Dovolená:** žádost projde i do minusu (BUG-016), odečítají se víkendy (BUG-017), půlden se odečte
   jako celý den (BUG-024).

## Automatické testy ve zkratce

26 testů v Maestru ve čtyřech sadách: ruční záznam a výpočty, žádosti a schvalování, práce bez sítě, přihlášení.
Na verzi 1.0 jich **16 projde a 10 selže na nahlášených chybách** (tag `known-bug`). To je očekávaný
výsledek, po opravě chyby test projde. Který test na čem selže: [`tests/README.md`](tests/README.md), sekce 5.
Celý běh trvá asi 30 minut.

Potřeba: Android emulátor (API 35), Java 17+, Maestro CLI 2.12.1, nainstalované APK. Pak ze složky `tests`:

```
maestro test --test-output-dir ../docs/test-runs/posledni flows/manual-entry
maestro test --test-output-dir ../docs/test-runs/posledni flows/requests
maestro test --test-output-dir ../docs/test-runs/posledni flows/login
maestro test --test-output-dir ../docs/test-runs/posledni flows/offline
```

Podrobný postup včetně nastavení emulátoru a toho, kdy testy nespouštět, je v [`tests/README.md`](tests/README.md).

## Rozsah a rozšíření nad rámec zadání

Zadání počítá se 4–6 hodinami. Jádro podle zadání: seznam chyb, testy ručního záznamu a žádostí, README
k testům, poznámky. Nad doporučený čas a označené jako rozšíření:

- testy přihlášení a práce bez sítě, diagnostický test BUG-007,
- sonda obrazovek ([`tools/probe/`](tools/probe/)): projde obrazovky ve všech rolích a jazycích a uloží strom UI,
  výstup sloužil jako seznam kandidátů na chyby, které jsem pak ověřoval ručně,
- CI workflow pro GitHub Actions ([`.github/workflows/maestro.yml`](.github/workflows/maestro.yml)):
  první běhy 23. 11. odpovídají lokálnímu výsledku, vyhodnocení `known-bug` je jednoduché (nerozliší
  selhání na očekávané kontrole od výpadku emulátoru), podrobnosti v [`tests/README.md`](tests/README.md), sekce 6,
- matice pokrytí specifikace a review testů samostatnou instancí AI.

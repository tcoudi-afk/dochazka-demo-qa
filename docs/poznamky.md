# Poznámky k testování – Docházka Demo 1.0

**Doporučení: verzi 1.0 nevydávat.** Aplikace ukazuje Výkaz jiného uživatele (BUG-007) a několik chyb mění
odpracovaný čas a zůstatek dovolené, tedy podklady pro mzdy. Podmínka pro vydání: opravit 11 chyb s vysokou
prioritou a znovu pustit sadu, testy `known-bug` musí projít.

Emulátor Pixel 7, Android 15. Detaily: `docs/seznam-chyb.md`, `docs/pokryti-specifikace.md`.

## Co jsem testoval ručně

- **Docházka a Výkaz (body 4–12):** Příchod/Odchod, přerušení, živý součet, dvojklik, překryv, konec před
  začátkem, smazání. Hranice a validace hlídají automatické testy.
- **Role a žádosti (body 3, 13–16):** přepínání Jan ↔ Eva, pohled vedoucího, odečet a vracení dnů, půlden,
  víkendy a svátky, schválení, zamítnutí, zrušení.
- **Bez sítě (17), přihlášení (1–2), jazyky (19), TalkBack (21, jen vedoucí).** Kopie po výpadku vyvolá jen
  Příchod zadaný offline.

## Rizika: pravděpodobné příčiny (hypotézy z černé skříňky)

| Pravděpodobná příčina | Chyby | Dopad |
|---|---|---|
| Výkaz není vázaný na uživatele | 007, 011 | únik dat, ztráta záznamů |
| Chybí kontrola duplicit a překryvů | 009, 013, 021 | čas se počítá vícekrát |
| Součty se ukládají, nepočítají | 011, 015 | součty ≠ záznamy |
| Dovolená: kalendářní a celé dny, bez kontroly zůstatku | 016, 017, 024 | chybný zůstatek |
| Lékař se zřejmě zpracovává jako Oběd | 012 | kratší odpracovaný čas |

## Otázky ke specifikaci

Otevřené i po odpovědi firmy z 20. 11.:

- **Noční směna začatá dnes:** část připadá na zítřek, kam ruční záznam nejde (bod 10). Kam patří?
- **Bod 14:** 24.–26. 12. jsou podle zákona ostatní svátky, ne státní. Aplikace je do čerpání nepočítá.
  Formulaci doporučuji upřesnit.
- **Zpětné žádosti o dovolenou:** jsou povolené, a do kdy? (BUG-019)
- **Výchozí zůstatek Jana 8 dní:** testovací data, nebo chyba? (BUG-006)

## Rozsah a co dál

Jádro podle zadání, rozšíření nad doporučených 4–6 h jsou označená (seznam v `README.md`).

- **Netestováno:** bod 20, přechod letního a zimního času, aktualizace z 1.0 na novější verzi, TalkBack
  v toku zaměstnance.
- **Dál:** regresní test BUG-007, kontrola „denní součet = součet záznamů“ po každé akci, bod 20 (od vývoje
  potřebuji nastavitelný čas aplikace). Výpočty patří spíš do jednotkových testů, UI testy jen na kritické toky.

# Sonda (průzkumný nástroj)

Pomocný nástroj pro průzkum aplikace, ne testovací sada. Projde obrazovky aplikace jako zaměstnanec a jako vedoucí
ve všech třech jazycích a na každé uloží screenshot a strom UI (`maestro hierarchy`). Z toho vytvoří:

- `inventory.csv`: všechny prvky (testID, text, popisek pro čtečku, hint, klikatelnost), otevře se v Excelu
- `report.md`: inventura obrazovek a kandidáti na nálezy:
  - interaktivní prvky bez popisku pro TalkBack (bod 21 specifikace)
  - texty, které zůstaly po přepnutí jazyka česky (bod 19)
  - data a časy vedle sebe podle jazyka (bod 19)
- `screenshots/` a `hierarchy/`: podklady pro ruční ověření

Kandidáti jsou heuristika. Každý je potřeba ověřit ručně, než se z něj stane nález.

## Spuštění

Předpoklady: běžící emulátor s nainstalovanou aplikací, `maestro` a `adb` v PATH, Node.js 18+.

```
cd tools/probe
node probe.mjs                                  # všechno (zhruba 10–15 minut)
node probe.mjs --roles employee --langs cs      # rychlý zkušební běh
```

Výstup je ve `output/<datum-čas>/`. Složka `output/` se do gitu neukládá.

## Jak to funguje

1. `flows/setup.yaml` spustí aplikaci s čistými daty, přihlásí uživatele a přepne jazyk.
2. `flows/nav.yaml` přejde na jednu obrazovku (tab, případně otevře formulář).
3. `probe.mjs` po každém přechodu uloží screenshot (`adb exec-out screencap`) a strom UI (`maestro hierarchy`).
   Po formuláři začne další obrazovka znovu čistým startem, aby se formulář nemusel zavírat tlačítkem zpět.

Selže-li krok, zkusí se ještě jednou (první spuštění Maestra v relaci někdy hlásí `device offline`).
Neúspěšné obrazovky jsou v reportu označené jako SELHALO a běh pokračuje.

## Omezení

- Strom UI obsahuje jen to, co je právě vidět na obrazovce. Dlouhé seznamy (Výkaz) sonda neposouvá, takže záznamy pod okrajem v inventuře nejsou.
- Stavový řádek Androidu se z reportu vynechává. V surových souborech v `hierarchy/` zůstává.

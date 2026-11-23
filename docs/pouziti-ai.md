# Použití AI

Při práci jsem používal Claude (Anthropic) jako asistenta ve dvou nástrojích: v chatu na rozbor, ruční testování
a dokumenty, v Claude Code na testy a skripty v projektu. Všechny výstupy jsem četl, ověřoval na emulátoru
a rozhodoval o nich.

## K čemu jsem AI použil

- **Rozbor zadání a specifikace:** shrnutí 21 bodů, hledání míst, kde si body odporují nebo něco neříkají
  (např. bod 8 vs. bod 20 u směny přes půlnoc). Z toho vznikly čtyři otázky na firmu. AI pomohla e-mail
  formulovat, výklady, které jsem k otázkám připsal, jsou moje.
- **Návrh testů a Maestro flow:** struktura `flows/`, `subflows/`, `scripts/`, princip „ověřit přírůstek
  denního součtu“, data relativně k dnešku, první verze YAML flow a pomocných skriptů. Maestro jsem se
  při tomto úkolu učil, AI mi vysvětlovala příkazy a chybové hlášky.
- **Sonda (`tools/probe/`):** skript, který projde obrazovky ve všech rolích a jazycích a uloží strom UI.
  Výstup jsou kandidáti na chyby, které jsem pak ručně ověřoval.
- **Dekompilace JS bundlu (Hermes) jen kvůli struktuře a testID.** Z bundlu jsem s AI zjistil názvy obrazovek
  a `testID`, aby testy mohly cílit na stabilní ID. **Dekompilaci jsem nepoužil k hledání chyb.**
  Chyby jsem hledal černou skříňkou na emulátoru a každou jsem tam ověřil.
- **Vedení nálezů:** pracovní tabulka (chyby, poznámky, předpoklady), do které AI zapisovala podle mých
  výsledků a screenshotů. Z ní vznikl export `docs/seznam-chyb.md` a matice `docs/pokryti-specifikace.md`.
  Obsah (kroky, časy, screenshoty) je z mého testování.
- **Postupy ručních kontrol:** AI navrhovala konkrétní kroky (např. půlden, svátky v rozsahu žádosti).
  Testoval jsem sám a závěry jsem nechával kontrolovat. Fungovalo to i obráceně: u svátků jsem AI opravil,
  že 24.–26. 12. nejsou státní, ale ostatní svátky, a z toho vznikla otázka ke specifikaci.
- **Seskupení chyb podle pravděpodobné příčiny** v poznámkách: návrh od AI, ověřený proti nálezům.
  Jsou to hypotézy z testování černou skříňkou a tak jsou označené.
- **Review testů, dvakrát:**
  1. Během práce AI procházela testy a výstupy běhů a našla slabá místa, např. čtení denního součtu mohlo
     tiše vrátit 0 nebo skript převádějící „-1 h 00 min“ ztrácel znaménko.
  2. Před odevzdáním jsem nechal sadu zrevidovat **samostatnou instancí bez historie práce**
     (`docs/review-testu.md`). Našla mimo jiné test 10, který v pondělí a úterý projde falešně (předevčírem je víkend bez dat).
     Ověřil jsem to během 23. 11. ráno (test prošel, přestože chyba trvá) a opravil. Co jsem z review opravil a co
     vědomě odložil, je v `tests/README.md`, sekce 7.

  O tom, které opravy udělat a v jakém pořadí, jsem rozhodoval já.
- **Koncepty dokumentů:** README, tento dokument, poznámky, návrh CI workflow. Koncepty jsem upravil a doplnil.
  Jazykovou a stylistickou kontrolu dokumentace dělala další samostatná instance.

## Co jsem dělal a rozhodoval sám

- **Ruční testování** na emulátoru: průchody aplikací, ověřování každého nálezu, screenshoty a časy.
- **Ověření nálezů:** žádná chyba není v seznamu jen proto, že ji navrhla AI nebo sonda. Nález, který
  se při ověření nepotvrdil, nehlásím (BUG-010: moje ruční pozorování, automatický test ho nepotvrdil).
- **Priority** chyb a rozhodnutí, co je chyba a co návrh na vylepšení.
- **Výklad specifikace** a předpoklady tam, kde specifikace mlčí.
- **Otázky firmě** a práce s odpovědí (např. směna přes půlnoc podle bodu 20).
- **Co automatizovat a co ne** a rozsah práce vzhledem k časovému rámci zadání.

## Kde jsem AI nevěřil bez ověření

- Každý výsledek testu jsem kontroloval ve výstupu běhu, ne jen podle shrnutí od AI.
- Když AI a nezávislé review tvrdily něco o chování aplikace (jazyk systému, prázdné dny bez dat),
  ověřil jsem to na emulátoru. Jedno tvrzení z review se tím vyvrátilo (aplikace jazyk systému nepřebírá).

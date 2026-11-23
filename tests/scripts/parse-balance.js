// Převede text zůstatku dovolené (posledně zkopírovaný přes copyTextFrom) na celé číslo dní
// a uloží ho do output[SLOT].
// Příklady: "Zbývá dovolené: 8 dní" = 8, "1 den" = 1, "2 dny" = 2, "-5 dní" = -5 (BUG-016).
// Bere i typografické mínus (U+2212). Tvar slova (den/dny/dní) se nekontroluje, jen že tam je.
// Když text tvar "<číslo> den|dny|dní" na konci nemá, uloží null. Volající (capture-balance) pak selže,
// místo aby tiše počítal s nulou.
var t = String(maestro.copiedText || '').replace(/−/g, '-');
var m = t.match(/(^|[^\d-])(-?)\s*(\d+)\s*(den|dny|dní)\s*$/);
if (m) {
  var v = parseInt(m[3], 10);
  output[SLOT] = m[2] === '-' ? -v : v;
} else {
  output[SLOT] = null;
}

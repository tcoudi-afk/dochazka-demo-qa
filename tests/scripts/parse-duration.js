// Převede text denního součtu (posledně zkopírovaný přes copyTextFrom) na minuty a uloží do output[SLOT].
// Umí i záporný čas: "-1 h 00 min" = -60 (BUG-014). Znaménko platí pro celou hodnotu.
// Když text formát "X h YY min" nemá, uloží null. Volající (capture-day-total) pak selže,
// místo aby tiše počítal s nulou.
var t = String(maestro.copiedText || '').replace(/\u2212/g, '-');
var m = t.match(/^\s*(-?)\s*(\d+)\s*h\s*(\d+)\s*min\s*$/);
if (m) {
  var v = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  output[SLOT] = m[1] === '-' ? -v : v;
} else {
  output[SLOT] = null;
}

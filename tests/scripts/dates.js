// Data relativně k dnešku, aby testy fungovaly i jiný den (třeba na druhém kole).
// Formát DD.MM.RRRR (jak ho chce aplikace) a ISO RRRR-MM-DD (jak ho používají testID day-*).
// Pozor: počítá se podle času počítače, ne emulátoru. Kolem půlnoci se může lišit.
function p(n) { return (n < 10 ? '0' : '') + n; }
function shift(n) { var d = new Date(); d.setDate(d.getDate() + n); return d; }
function cz(d) { return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }
function iso(d) { return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }

output.today = cz(shift(0));
output.tomorrow = cz(shift(1));
output.twoDaysAgo = cz(shift(-2));
output.twoDaysAgoIso = iso(shift(-2));
output.sevenDaysAgo = cz(shift(-7));
output.sevenDaysAgoIso = iso(shift(-7));
output.eightDaysAgo = cz(shift(-8));
// Datum se špatně umístěnou tečkou (DD.MMRRRR), pro kontrolu formátu
var d2 = shift(-2);
output.twoDaysAgoBadFormat = p(d2.getDate()) + '.' + p(d2.getMonth() + 1) + d2.getFullYear();
// Aktuální měsíc RRRR-MM: Výkaz ukazuje jen ten, capture-day-total podle něj hlídá, že hledá na správném místě.
output.thisMonthIso = iso(shift(0)).substring(0, 7);

// ---------------------------------------------------------------------------------------------------
// Žádosti o dovolenou (tests/flows/requests). Jen přidané hodnoty, výše uvedené se nemění.
// Pravidla:
// - jen aktuální rok: předpoklad „dny se strhávají z roku, do kterého spadají“ (list Předpoklady,
//   Přelom roku). Žádost do příštího roku netestujeme, proto ji testy nepoužívají,
// - jen pracovní dny bez státních svátků ČR (mimo jiné 24.–26. 12. a 1. 1.). Jak se mají počítat
//   svátky v rozsahu žádosti, specifikace neříká, proto se jim testy vyhýbají celým rozsahem.
// Když vhodné datum letos není (konec prosince), hodnota je null a test selže na první kontrole
// s vysvětlením. Skript nikdy nevyhazuje výjimku, protože dates.js používají i testy manual-entry.
function easterSunday(y) {
  // gregoriánský výpočet Velikonoc (anonymní algoritmus)
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function isHolidayCz(d) {
  var md = p(d.getMonth() + 1) + '-' + p(d.getDate());
  var fixed = ['01-01', '05-01', '05-08', '07-05', '07-06', '09-28', '10-28', '11-17', '12-24', '12-25', '12-26'];
  if (fixed.indexOf(md) >= 0) return true;
  var easter = easterSunday(d.getFullYear());
  var goodFriday = addDays(easter, -2), easterMonday = addDays(easter, 1);
  return iso(d) === iso(goodFriday) || iso(d) === iso(easterMonday);
}
function isWorkdayCz(d) { var w = d.getDay(); return w !== 0 && w !== 6 && !isHolidayCz(d); }
// Rozsah je celý v aktuálním roce a žádný jeho den není svátek
function rangeUsable(from, to, year) {
  if (from.getFullYear() !== year || to.getFullYear() !== year) return false;
  for (var d = from; d <= to; d = addDays(d, 1)) { if (isHolidayCz(d)) return false; }
  return true;
}
function countWorkdays(from, to) {
  var n = 0;
  for (var d = from; d <= to; d = addDays(d, 1)) { if (isWorkdayCz(d)) n++; }
  return n;
}
(function () {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var year = today.getFullYear();
  // Pondělí příštího týdne (v neděli je to zítřek, v pondělí za týden)
  var nextMonday = addDays(today, ((8 - today.getDay()) % 7) || 7);

  // R01, R04, R05: nejbližší pracovní den za 2 a více dní (zrušit jde jen do dne před začátkem)
  output.vacDay = null;
  for (var i = 2; i <= 40; i++) {
    var d = addDays(today, i);
    if (d.getFullYear() !== year) break;
    if (isWorkdayCz(d)) { output.vacDay = cz(d); break; }
  }

  // R02: středa až pondělí následujícího týdne = 6 kalendářních dní, z toho 4 pracovní (víkend uvnitř).
  // Začíná se příštím týdnem, když je v rozsahu svátek, zkusí se další týden.
  output.vacWeekendFrom = null;
  output.vacWeekendTo = null;
  output.vacWeekendWorkdays = null;
  for (var w = 0; w < 6; w++) {
    var wed = addDays(nextMonday, 7 * w + 2), mon = addDays(wed, 5);
    if (rangeUsable(wed, mon, year) && countWorkdays(wed, mon) === 4) {
      output.vacWeekendFrom = cz(wed);
      output.vacWeekendTo = cz(mon);
      output.vacWeekendWorkdays = 4;
      break;
    }
  }

  // R03: dva celé týdny Po–Pá = 10 pracovních dní (12 kalendářních, víkend uvnitř).
  output.vacTwoWeeksFrom = null;
  output.vacTwoWeeksTo = null;
  output.vacTwoWeeksWorkdays = null;
  for (var t = 0; t < 6; t++) {
    var mo = addDays(nextMonday, 7 * t), fr = addDays(mo, 11);
    if (rangeUsable(mo, fr, year) && countWorkdays(mo, fr) === 10) {
      output.vacTwoWeeksFrom = cz(mo);
      output.vacTwoWeeksTo = cz(fr);
      output.vacTwoWeeksWorkdays = 10;
      break;
    }
  }
})();

// Dnešek ve tvaru ISO (pro day-<ISO> a day-total-<ISO>), používá tests/flows/offline.
output.todayIso = iso(shift(0));

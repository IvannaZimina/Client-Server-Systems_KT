// C04 Ex6 — ETTE ANTUD. Metamärgi vaste MIME-tüüpide vahel.
//
// Miks ta ette antakse: `*/*` ja `text/*` võrdlemine on sõnetöö, mitte
// läbirääkimise loogika. Ex6 õpetab q-väärtusi ja eelistusjärjestust —
// see fail on ainult abiline, mida sa kutsud.
//
//   matches('*/*',       'application/json')  -> true
//   matches('text/*',    'text/csv')          -> true
//   matches('text/*',    'application/json')  -> false
//   matches('text/csv',  'text/csv')          -> true

export function matches(wanted, offered) {
  if (wanted === '*/*') return true;
  if (wanted.endsWith('/*')) return offered.startsWith(wanted.slice(0, -1));
  return wanted === offered;
}

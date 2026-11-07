// C03 Ex6 — ETTE ANTUD. Dünaamilise impordi sihtmoodul.
//
// Miks ta ette antakse: Ex6 õpetab DÜNAAMILIST IMPORTI, mitte saaliplaani
// joonistamist. Saaliplaan ise on C08 teema. Siin on ta ainult selleks, et
// import() saaks päriselt midagi laadida — tema ainus roll on OLLA SUUR JA
// HILISEM.
//
// ★ Pane tähele viimast rida: moodul ütleb laadimise hetkel enda kohta
//   midagi välja. Just seda sa Network-paanil vaatad — kas ta laeb kohe
//   lehe avamisel (siis on import staatiline) või alles nupuvajutusel.

export const ROWS = 12;
export const SEATS_PER_ROW = 18;

// Ühe koha ruut. Väike puhas funktsioon, et fail oleks päris moodul.
function seat(row, nr, free) {
  const d = document.createElement('button');
  d.className = 'seat' + (free ? '' : ' seat--sold');
  d.disabled = !free;
  d.dataset.seat = `${row}-${nr}`;
  d.textContent = nr;
  return d;
}

export function drawSeatmap(host, eventId, sold = new Set()) {
  const rows = [];
  for (let r = 1; r <= ROWS; r += 1) {
    const row = document.createElement('div');
    row.className = 'seatmap__row';
    for (let n = 1; n <= SEATS_PER_ROW; n += 1) {
      row.append(seat(r, n, !sold.has(`${r}-${n}`)));
    }
    rows.push(row);
  }
  host.replaceChildren(...rows);
  return { eventId, seats: ROWS * SEATS_PER_ROW };
}

console.info('seatmap.js laetud');   // näed Console-paanil, MILLAL ta tuli

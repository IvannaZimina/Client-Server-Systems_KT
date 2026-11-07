// C03 Ex3 — ETTE ANTUD joonistaja. Seda faili sa ei kirjuta.
//
// ★ MIKS SEE SINULE ANTAKSE. Loeng 3 näitas juba, kuidas olekust vaade
//   sünnib: replaceChildren, kolm olekut, textContent. Sama uuesti
//   kirjutada ei õpeta midagi juurde. Sinu töö on see pool, mida loeng
//   EI näidanud — TULETIS: millised read üldse joonistatakse.
//
//   olek  --forView-->  rows  --draw-->  DOM
//     ^                   ^                |
//     |               SINU TÖÖ             |
//     +--------------- sündmus ------------+

import { row } from './row-builder.js';

/**
 * Paneb valmis rows DOM-i. EI filtreeri ega sordi — see on sinu töö.
 *
 * @param {Array}  rows   juba filtreeritud ja sorditud sündmused
 * @param {string} state   'ready' | 'loading' — kolmas olek tuleb tühjast massiivist
 */
export function draw(rows, state = 'ready') {
  const host = document.querySelector('#events');
  const count = document.querySelector('#count');

  // ★ replaceChildren asendab kogu sisu ÜHE kutsega
  //   ega jäta vana sisu alles.
  host.replaceChildren(...rows.map(row));

  // Kolm olekut, mitte üks. Tühi tulemus EI OLE viga.
  if (state === 'loading') count.textContent = 'Laadin sündmusi…';
  else if (rows.length === 0) count.textContent = 'Ükski sündmus ei vasta otsingule.';
  else count.textContent = `${rows.length} sündmust`;
}

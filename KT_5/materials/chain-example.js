// C05 Ex2 — ETTE ANTUD ahel. Seda faili sa ei kirjuta.
//
// ★ MIKS SEE SINULE ANTAKSE. Loeng 5 näitas then/catch/finally ahelat juba
//   läbi. Sama uuesti kirjutada ei õpeta midagi juurde. Tema on siin
//   ETALONINA: sinu chainWithAwait() peab andma TÄPSELT sama jälje ja sama
//   tulemuse. Kui nad lahknevad, siis üks kahest ei tee seda, mida arvad.
//
// ★ KOLM ASJA, MIDA TA NÄITAB — kontrolli neid jälje pealt üle:
//   1. then TAGASTAB uue lubaduse, seepärast saab neid ahelasse panna;
//   2. catch püüab KÕIK talle eelnevad vead, mitte ainult vahetult eelmise;
//   3. finally jookseb alati ja EI MUUDA väärtust — tema tagastust
//      ignoreeritakse täielikult, kuigi ta siin sõne tagastab.

import { delayedValue } from './async-helpers.js';

export function chain(id) {
  const trace = [];
  return delayedValue({ id, name: 'Sügiskontsert' }, 5)
    .then((s) => { trace.push('sain sündmuse'); return { ...s, price: 24 }; })
    .then((s) => { trace.push('lisasin hinna'); return s; })
    .catch((err) => { trace.push('err: ' + err.message); return null; })
    .finally(() => { trace.push('finally'); return 'seda ignoreeritakse'; })
    .then((s) => ({ result: s, trace }));
}

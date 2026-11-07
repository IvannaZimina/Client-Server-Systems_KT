// C03 Ex4 — ETTE ANTUD mõõteriist ja koristuse näide.
//
// Ta logib IGA klõpsu hõive faasis — ka need, mille mõni käsitleja hiljem
// stopPropagation()-iga kinni peatab — ja klõpsu #events-i sees kõigis
// kolmes faasis. Jooksuta, klõpsa rea nuppu ja vaata readLog()-i.

// ★ setState() on SINU funktsioon Ex3-st (public/view.js). Ilma selle
// impordita viskaks allpool olev kuulaja klikil ReferenceErrori.
import { setState } from '../public/view.js';

const el = (v) => document.querySelector(v);
const log = [];

// ── 1. FAASIDE JÄLGIJA ──────────────────────────────────────────────────
// Iga kuulaja kirjutab logisse, MIS faasis ja KELLE peal ta käivitus.
// Klõps #events-i sees annab viis rida: hõive #events, hõive li, sihtmärk,
// mullitus li, mullitus #events.
const PHASE = { 1: 'capture', 2: 'target', 3: 'bubble' };
const label = (node) => (node.id ? `#${node.id}` : node.tagName.toLowerCase());
const probe = (e) => {
  log.push({ what: 'phase', phase: PHASE[e.eventPhase], at: label(e.currentTarget) });
};

el('#events').addEventListener('click', probe, { capture: true });
el('#events').addEventListener('click', probe);

// ★ Hõive faasis kuulamine on haruldane, aga tal on üks päris kasutus:
//   püüda sündmus ENNE, kui laps ta kinni peatab. Siin logime kõik klõpsud
//   ka siis, kui mõni käsitleja kutsub stopPropagation().
//   Read ja nupud joonistatakse iga kord uuesti, seega saavad li ja sihtmärk
//   oma kuulajad alles siin, sama sündmuse hõivefaasis: kuulaja, mis lisatakse
//   teele jäävale sõlmele enne, kui sündmus temani jõuab, käivitub.
document.addEventListener('click', (e) => {
  log.push({ what: 'click', target: e.target.tagName, phase: 'capture' });
  const li = e.target.closest?.('#events li');
  if (!li) return;
  if (li !== e.target) {
    li.addEventListener('click', probe, { capture: true, once: true });
    li.addEventListener('click', probe, { once: true });
  }
  e.target.addEventListener('click', probe, { once: true });
}, { capture: true });

export const readLog = () => [...log];


// ── 3. KUULAJATE KUHJUMINE ──────────────────────────────────────────────
// Kolm viisi, kuidas kuulaja ise ära kaob:
//   { once: true }        pärast esimest korda
//   AbortSignal          kui signaal katkestatakse
//   delegeerimine        kuulajat ei olegi elemendil
const controller = new AbortController();

el('#clear').addEventListener('click', () => {
  setState({ search: '', sort: 'start', dir: 'asc' });
}, { signal: controller.signal });

export function leave() {
  controller.abort();                             // KÕIK selle signaaliga kuulajad
}


export { log, controller };

// C03 Ex5 — ETTE ANTUD. Viivitusega salvestus ja sessioonihoidla.
//
// Sama muster mis sinu draft.js-is, aga teise elueaga hoidla peal.

import { save } from './draft.js';
// ── VIIVITUSEGA SALVESTUS ───────────────────────────────────────────────
// Iga klahvivajutuse peale kirjutamine on sünkroonne ketta-operatsioon.
// 400 ms viivitus teeb sadadest kirjutustest ühe.
let timer;
export function saveLater(data, delay = 400) {
  clearTimeout(timer);
  timer = setTimeout(() => save(data), delay);
}

// ── SESSIOONIHOIDLA: sama API, teine eluiga ─────────────────────────────
// localStorage   püsib kuni kustutamiseni, JAGATUD kõigi vahelehtede vahel
// sessionStorage kaob vahelehe sulgemisel, EI OLE jagatud
//
// Koha ajutine valik kuulub sessioonihoidlasse: kaks vahelehte ei tohi
// teineteise valikut üle kirjutada.
const SELECTION = 'piletikassa:selection';

export function setSelection(seats) {
  try { sessionStorage.setItem(SELECTION, JSON.stringify(seats)); } catch { /* ei ole */ }
}
export function readSelection() {
  try { return JSON.parse(sessionStorage.getItem(SELECTION) ?? '[]'); } catch { return []; }
}


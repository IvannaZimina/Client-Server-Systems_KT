// C05 Ex1 — ETTE ANTUD mõõteriist. Seda faili sa ei kirjuta.
//
// Ta ei tee rakenduse jaoks midagi — ta NÄITAB, mis järjekorras JavaScript
// asju teeb. Ennusta iga jooksu tulemus ENNE jooksutamist ja kirjuta oma
// ennustus üles. Alles siis jooksuta.
//
//   node queue-tool.js
//
// ★ ÜKS LÕIM. JavaScriptil on brauseris üks lõim. „Asünkroonne“ ei tähenda
//   „paralleelne“ — see tähendab „pane järjekorda ja jätka“.

const log = [];
export const write = (what) => log.push(what);
export const readLog = () => [...log];
export const reset = () => { log.length = 0; };

// ── 1. KOLM JÄRJEKORDA ──────────────────────────────────────────────────
// Sünkroonne kood  -> jookseb KOHE, lõpuni
// Mikroülesanne    -> lubaduse .then, queueMicrotask
// Makroülesanne    -> setTimeout, setInterval, I/O
//
// Reegel: kutsepinu tühjeneb -> KÕIK mikroülesanded -> ÜKS makroülesanne.
export function threeQueues() {
  reset();
  write('1 sünkroonne algus');
  setTimeout(() => write('5 setTimeout 0'), 0);
  Promise.resolve().then(() => write('3 mikroülesanne'));
  queueMicrotask(() => write('4 queueMicrotask'));
  write('2 sünkroonne lõpp');
  return new Promise((r) => setTimeout(() => r(readLog()), 10));
}

// ── 2. MIKROÜLESANDED SÖÖVAD JÄRJEKORRA ÄRA ─────────────────────────────
// ★ Kõik mikroülesanded jooksevad ENNE järgmist makroülesannet — ka need,
//   mis tekkisid alles teiste mikroülesannete sees.
export function microBeforeMacro() {
  reset();
  setTimeout(() => write('makro 1'), 0);
  Promise.resolve()
    .then(() => { write('mikro 1'); return Promise.resolve(); })
    .then(() => write('mikro 2'))
    .then(() => write('mikro 3'));
  setTimeout(() => write('makro 2'), 0);
  return new Promise((r) => setTimeout(() => r(readLog()), 10));
}

// ── 3. BLOKEERIV TSÜKKEL ────────────────────────────────────────────────
// ★ Sünkroonne tsükkel EI LASE ühelgi ülesandel joosta ja külmutab lehe.
//   Just see on põhjus, miks pikk arvutus ei tohi olla peamises lõimes.
export function block(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) { /* tahtlikult tühi */ }
  return Date.now() - start;
}

// setTimeout(f, 100) EI tähenda „100 ms pärast“ — ta tähendab „mitte varem
// kui 100 ms pärast, ja alles siis, kui lõim on vaba“.
export function delay(allowed, blockMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    setTimeout(() => resolve({ allowed, actual: Date.now() - start }), allowed);
    block(blockMs);
  });
}

// ── 4. TAGASIKUTSETE PÜRAMIID ───────────────────────────────────────────
// Kolm pesastatud tagasikutset: iga samm on üks tase sügavamal.
export function pyramid(callback) {
  setTimeout(() => {
    setTimeout(() => {
      setTimeout(() => callback(null, 'valmis'), 5);
    }, 5);
  }, 5);
}

if (globalThis.process?.argv?.[1]?.includes('queue-tool')) {
  console.log('threeQueues():', await threeQueues());
  console.log('microBeforeMacro():', await microBeforeMacro());
  console.log('delay(100, 250):', await delay(100, 250));
}

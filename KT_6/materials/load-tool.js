// C06 Ex6 — ETTE ANTUD mõõteriist. Seda faili sa EI kirjuta.
//
// Ta paneb püsti KAKS serverit, mis teevad SAMA rasket tööd kahel eri viisil,
// ja mõõdab, mis juhtub KERGE päringu ootejärjekorraga, kui raske töö käib.
//
//   node load-tool.js
//
// ★ MÕÕDETAV ON LATENTS, MITTE LÄBILASKEVÕIME. Küsimus ei ole „mitu rasket
//   päringut sekundis“, vaid „kaua ootab KERGE päring, kui raske käib“.
//   Just seda kasutaja tunneb.

import http from 'node:http';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

// Raske töö: sünkroonne arvutus, mis EI OLE I/O. Just seda ei aita
// async/await — lõim on hõivatud, mitte ootel.
export function heavyWork(times = 5e6) {
  let s = 0;
  for (let i = 0; i < times; i += 1) s += Math.sqrt(i) % 7;
  return Math.round(s);
}

const WORKER_URL = new URL('./worker.js', import.meta.url);

function workInWorker(times) {
  return new Promise((resolve, defer) => {
    const w = new Worker(fileURLToPath(WORKER_URL), { workerData: { times } });
    w.once('message', (v) => { resolve(v); w.terminate(); });
    w.once('error', defer);
  });
}

export function makeServers() {
  const blocking = http.createServer((req, res) => {
    if (req.url === '/light') return res.end('ok');
    return res.end(String(heavyWork()));
  });

  const withWorker = http.createServer(async (req, res) => {
    if (req.url === '/light') return res.end('ok');
    return res.end(String(await workInWorker(5e6)));
  });

  return { blocking, withWorker };
}

/** Saadab N kerget päringut ja tagastab nende latentsid.
 *
 * ★ SOOJENDUS ON KOHUSTUSLIK. Mõõdetud: ESIMENE fetch maksab 47 ms
 *   (ühenduse ja fetch-i enda ülesseadmine), järgmiste mediaan on 0,7 ms.
 *   Ilma soojenduseta oli p95 kümne proovi peal 53 ms ja mõõtmine näitas
 *   MÕÕTERIISTA, mitte serverit. See viga oli mul sees ja tuli välja alles
 *   siis, kui number ei olnud seletatav.
 */
export async function measureLight(base, n = 20, gap = 10) {
  for (let i = 0; i < 5; i += 1) await fetch(`${base}/light`).then((v) => v.text());
  const durations = [];
  for (let i = 0; i < n; i += 1) {
    const t = process.hrtime.bigint();
    await fetch(`${base}/light`).then((v) => v.text());
    durations.push(Number(process.hrtime.bigint() - t) / 1e6);
    await new Promise((r) => setTimeout(r, gap));
  }
  return durations;
}

/** Hoiab rasket tööd PIDEVALT käimas, kuni `until()` on tõene. */
export async function holdLoad(base, until) {
  let n = 0;
  while (!until()) {
    await fetch(`${base}/heavy`).then((v) => v.text());
    n += 1;
  }
  return n;
}

export const p95 = (rows) => {
  const s = [...rows].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))];
};

const invokedPath = process.argv[1]?.replaceAll('\\', '/');
if (invokedPath && decodeURIComponent(import.meta.url).endsWith(invokedPath)) {
  const { blocking, withWorker } = makeServers();
  const listenOn = (s) => new Promise((r) =>
    s.listen(0, () => r(`http://localhost:${s.address().port}`)));
  const bUrl = await listenOn(blocking);
  const wUrl = await listenOn(withWorker);

  console.log('tuumi masinas:', os.cpus().length, '\n');
  for (const [name, url] of [['blokeeriv', bUrl], ['worker_threads', wUrl]]) {
    const quiet = await measureLight(url, 20);
    let ready = false;
    const load = holdLoad(url, () => ready);
    const all = await measureLight(url, 20);
    ready = true;
    const heavyCount = await load;
    console.log(`${name.padEnd(15)} kerge p95: vaikselt ${p95(quiet).toFixed(1).padStart(6)} ms` +
                `   koormuse all ${p95(all).toFixed(1).padStart(8)} ms` +
                `   (${heavyCount} rasket)`);
  }
  blocking.close(); withWorker.close();
}

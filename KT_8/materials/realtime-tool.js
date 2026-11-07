// C08 Ex1 — ETTE ANTUD mõõteriist. Seda faili sa EI kirjuta.
//
// Neli serverit, sama ülesanne: „ütle kliendile, kui vabade kohtade arv
// muutub“. Mõõdetakse KOLME asja:
//
//   päringuid    mitu HTTP-päringut server sai
//   latents      kui kaua muutuse ja teate vahel läks
//   baite        kui palju liikus võrgus: socket.bytesRead + bytesWritten
//                iga TCP-ühenduse kohta, mõlemas suunas
//
//   node realtime-tool.js
//
// ★ MÕÕTERIIST EI TOHI OLLA MÕÕDETAV OSA. Esimesel katsel oli minu SSE
//   latents 76 ms — see EI OLNUD serveri latents, vaid MINU ENDA 100 ms
//   sisemine taimer, mis muutusi otsis. Server lükkab nüüd sündmuse kohe,
//   kui ta tekib, ja latents on 1 ms.

import http from 'node:http';
import { WebSocketServer } from 'ws';

// Jagatud „andmebaas“: vabade kohtade arv, mis aeg-ajalt muutub.
export function createSource() {
  const listeners = new Set();
  let free = 302;
  let changedAt = Date.now();
  return {
    get free() { return free; },
    // ★ MUUTUSE AEG, mitte vastuse aeg. Kui polling paneks vastusesse värske
    //   Date.now(), mõõdaks ta serveri vastamise kiirust, MITTE seda, kui kaua
    //   klient muutusest teadmata oli. Esimesel katsel andis see 1 ms ja
    //   „polling on sama kiire kui WebSocket“ — mis on ilmselgelt vale.
    get changedAt() { return changedAt; },
    change(next) {
      free = next;
      changedAt = Date.now();
      for (const f of listeners) f(next, changedAt);   // KOHE, mitte taimeriga
    },
    listen(f) { listeners.add(f); return () => listeners.delete(f); },
  };
}

// ── 1. PERIOODILINE KÜSITLEMINE ─────────────────────────────────────────
export function pollingServer(source, counter) {
  return http.createServer((req, res) => {
    counter.requests += 1;
    const body = JSON.stringify({ free: source.free, at: source.changedAt });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  });
}

// ── 2. PIKK KÜSITLEMINE ─────────────────────────────────────────────────
// Server HOIAB päringut lahti, kuni midagi muutub (või ajalõpp).
export function longPollingServer(source, counter) {
  return http.createServer((req, res) => {
    counter.requests += 1;
    let done = false;
    const send = (free, at) => {
      if (done) return;
      done = true;
      finish();
      const body = JSON.stringify({ free, at });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    };
    const finish = source.listen(send);
    const clock = setTimeout(() => send(source.free, source.changedAt), 5000);
    res.on('close', () => { clearTimeout(clock); finish(); });
  });
}

// ── 3. SERVER-SENT EVENTS ───────────────────────────────────────────────
export function sseServer(source, counter) {
  return http.createServer((req, res) => {
    counter.requests += 1;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    // ★ SAADA KOHE MIDAGI. MÕÕDETUD: Node EI SAADA päiseid enne esimest
    //   KIRJUTUST — ainult writeHead()-i kutsuv server jätab kliendi
    //   rippuma kuni ajalõpuni. `retry:` on siin kaks korda kasulik: ta on
    //   esimene kirjutus JA ta ütleb kliendile taasühenduse viivituse.
    res.write('retry: 3000\n\n');
    const finish = source.listen((free, at) => {
      const message = `data: ${JSON.stringify({ free, at })}\n\n`;
      res.write(message);
    });
    res.on('close', finish);
  });
}

// ── 4. WEBSOCKET ────────────────────────────────────────────────────────
export function wsServer(source, counter) {
  const http_ = http.createServer();
  const wss = new WebSocketServer({ server: http_ });
  wss.on('connection', (ws) => {
    counter.requests += 1;
    const finish = source.listen((free, at) => {
      const message = JSON.stringify({ free, at });
      ws.send(message);
    });
    ws.on('close', finish);
  });
  return http_;
}

export const newCounter = () => ({ requests: 0, bytes: 0 });


// ── MÕÕTMINE: node realtime-tool.js ────────────────────────────────────
// Neli serverit, sama aken ja samad muutused. Käivitub AINULT siis, kui
// see fail jooksutatakse otse — imporditult jääb ta teegiks.
//
// ★ LATENTS ON MUUTUSE JA TEATE VAHE, mitte päringu kestus. Iga teade
//   kannab `at`-välja, mis on MUUTUSE aeg (vt createSource ülalpool);
//   klient lahutab ta oma kellast.

const WINDOW_MS = 3000;          // ms, mille jooksul muutused toimuvad
const CHANGES_N = 6;
const POLLING = 250;       // pollingu samm
const SETTLE = 500;         // aeg pärast viimast muutust, et teade kohale jõuaks
// ★ NIHE HOIAB MUUTUSED KÜSITLUSE VÕRE PEALT ÄRA. Ilma temata langeks iga
//   muutus (500 ms) täpselt pollingu sammu (250 ms) peale ja klient näeks
//   teda peaaegu kohe — MÕÕDETUD 52 ms, mis teeks pollingu kunstlikult heaks.
//   Arv 137 ei jagu 250-ga; keskmine ootus on siis pool sammu ehk ~125 ms.
const OFFSET = 137;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Muutused ühtlaselt üle akna. `free` jääb KOLMEKOHALISEKS, et keha pikkus
// oleks iga teate juures sama — muidu ei ole baidid võrreldavad.
function schedule(source) {
  const clocks = [];
  for (let i = 1; i <= CHANGES_N; i += 1) {
    clocks.push(setTimeout(() => source.change(302 - i * 3), (WINDOW_MS / CHANGES_N) * i + OFFSET));
  }
  return () => clocks.forEach(clearTimeout);
}

const newResult = () => ({ messages: 0, latencies: [] });

function record(result, at, seen) {
  if (seen.has(at)) return;
  seen.add(at);
  result.messages += 1;
  result.latencies.push(Date.now() - at);
}

// ★ BAIDID LOETAKSE SOKLIST, mitte hinnatakse. Iga TCP-ühendus jätab
//   bytesRead (klient -> server) ja bytesWritten (server -> klient) alles ka
//   pärast sulgemist; summa on see, mis päriselt võrgus liikus — päised,
//   käepigistus ja raamid kaasa arvatud.
async function listenAnd(server, port, counter) {
  const sockets = new Set();
  server.on('connection', (socket) => sockets.add(socket));
  await new Promise((r) => server.listen(port, r));
  return () => new Promise((r) => {
    server.close(() => {
      for (const s of sockets) counter.bytes += s.bytesRead + s.bytesWritten;
      r();
    });
    server.closeAllConnections();
  });
}

async function measurePolling(source, counter, port) {
  const result = newResult();
  const seen = new Set();
  const server = pollingServer(source, counter);
  const close = await listenAnd(server, port, counter);
  const ask = async () => {
    try {
      const v = await fetch(`http://localhost:${port}/`);
      const { at } = await v.json();
      record(result, at, seen);
    } catch { /* server suletud */ }
  };
  seen.add(source.changedAt);        // algseis ei ole muutus
  await ask();                        // esimene päring: mida me juba teame
  const clock = setInterval(ask, POLLING);
  const finish = schedule(source);
  await wait(WINDOW_MS + SETTLE);
  clearInterval(clock); finish(); await close();
  return result;
}

async function measureLongPolling(source, counter, port) {
  const result = newResult();
  const seen = new Set([source.changedAt]);
  const server = longPollingServer(source, counter);
  const close = await listenAnd(server, port, counter);
  let running = true;
  const scenario = new AbortController();
  const round = (async () => {
    while (running) {
      try {
        const v = await fetch(`http://localhost:${port}/`, { signal: scenario.signal });
        const { at } = await v.json();
        record(result, at, seen);
      } catch { break; }                // katkestatud või server kinni
    }
  })();
  const finish = schedule(source);
  await wait(WINDOW_MS + SETTLE);
  running = false; scenario.abort(); finish();
  await round.catch(() => {});
  await close();
  return result;
}

async function measureSse(source, counter, port) {
  const result = newResult();
  const seen = new Set([source.changedAt]);
  const server = sseServer(source, counter);
  const close = await listenAnd(server, port, counter);
  const scenario = new AbortController();
  const v = await fetch(`http://localhost:${port}/`, { signal: scenario.signal });
  const reader = v.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const reads = (async () => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let i;
        while ((i = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, i); buffer = buffer.slice(i + 2);
          if (chunk.startsWith('data: ')) record(result, JSON.parse(chunk.slice(6)).at, seen);
        }
      }
    } catch { /* katkestatud */ }
  })();
  const finish = schedule(source);
  await wait(WINDOW_MS + SETTLE);
  scenario.abort(); finish();
  await reads; await close();
  return result;
}

async function measureWs(source, counter, port) {
  const { WebSocket } = await import('ws');
  const result = newResult();
  const seen = new Set([source.changedAt]);
  const server = wsServer(source, counter);
  const close = await listenAnd(server, port, counter);
  const ws = new WebSocket(`ws://localhost:${port}/`);
  await new Promise((r) => ws.on('open', r));
  ws.on('message', (t) => record(result, JSON.parse(t.toString()).at, seen));
  const finish = schedule(source);
  await wait(WINDOW_MS + SETTLE);
  ws.close(); finish(); await close();
  return result;
}

async function measureAll() {
  const rows = [];
  const attempts = [
    ['polling', measurePolling, 3181],
    ['long polling', measureLongPolling, 3182],
    ['SSE', measureSse, 3183],
    ['WebSocket', measureWs, 3184],
  ];
  for (const [name, measureFn, port] of attempts) {
    const source = createSource();
    const counter = newCounter();
    const result = await measureFn(source, counter, port);
    const latency = result.latencies.length
      ? Math.round(result.latencies.reduce((a, b) => a + b, 0) / result.latencies.length)
      : 0;
    rows.push({ name, ...counter, messages: result.messages, latency });
  }

  const widths = [13, 10, 8, 8, 8];
  const row = (v) => '| ' + v.map((x, i) => String(x).padEnd(widths[i])).join(' | ') + ' |';
  console.log(`## MÕÕDETUD: ${WINDOW_MS / 1000} s aken, ${CHANGES_N} muutust, `
              + `küsitlus iga ${POLLING} ms`);
  console.log(row(['viis', 'päringuid', 'baite', 'teateid', 'latents']));
  console.log('|' + widths.map((w) => '-'.repeat(w + 2)).join('|') + '|');
  for (const r of rows) printRow(r);
  function printRow(r) {
    console.log(row([r.name, r.requests, r.bytes, r.messages, r.latency + ' ms']));
  }

  const p = rows[0];
  const sse = rows.find((x) => x.name === 'SSE');
  const ws = rows.find((x) => x.name === 'WebSocket');
  // ★ Järeldused ARVUTATAKSE mõõdetust, et nad ei saaks arvudest lahku minna.
  console.log('');
  const times = (p.bytes / sse.bytes).toFixed(1).replace('.', ',');
  console.log(`Polling: ${times} korda rohkem baite ja `
    + `${sse.latency ? Math.round(p.latency / sse.latency) : p.latency} korda suurem latents.`);
  console.log(sse.bytes < ws.bytes
    ? `SSE saatis VÄHEM baite kui WebSocket (${sse.bytes} vs ${ws.bytes}).`
    : `WebSocket saatis VÄHEM baite kui SSE (${ws.bytes} vs ${sse.bytes}) — `
      + 'raami päis on lühem kui SSE „data:“-rida.');
}

if (globalThis.process?.argv?.[1]?.includes('realtime-tool')) {
  await measureAll();
}

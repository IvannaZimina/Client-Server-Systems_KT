// C05 — ETTE ANTUD piletikassa API. Seda faili sa EI kirjuta.
//
// Loeng 5 on ASÜNKROONSE KLIENDI kohta. Server on siin mõõteriist: ta oskab
// olla aeglane, katki, tühi ja tõrkuv — sest just neid nelja olukorda peab
// sinu klient taluma. Serveri enda kirjutamine tuleb loengus 6.
//
//   node server.js      -> http://localhost:3055
//
// Port on 3055, MITTE 3005: C04 server kuulab korraga 3004 ja 3005 peal,
// ja kui ta on veel lahti, vastab TEMA. (Mind pettis see juba ära.)
//
// ★ TAHTLIKUD TÕRKED. Iga tee võtab neid päringustringi kaudu:
//
//     ?slow=1200      vastus tuleb 1200 ms pärast
//     ?err            500 Internal Server Error
//     ?broken         200, aga keha EI OLE kehtiv JSON
//     ?empty          200 ja tühi massiiv (see EI OLE viga)
//     ?loss=0.5       50% tõenäosusega 503 (kordamise katsetamiseks)
//     ?retry          iga N-s päring õnnestub (vt /api/retry/status)
//
// Neid saab kombineerida: /api/events?slow=800&loss=0.3

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3055;

const events = [
  { id: 1, name: 'Sügiskontsert', venue: 'Vanemuine',  start: '2026-10-04T19:00',
    seats: 420, sold: 118, price: 24.0 },
  { id: 2, name: 'Talveball',     venue: 'Estonia',    start: '2026-12-13T20:00',
    seats: 900, sold: 900, price: 45.0 },
  { id: 3, name: 'Improteater',   venue: 'Von Krahl',  start: '2026-10-19T21:00',
    seats: 120, sold:  37, price: 15.0 },
  { id: 4, name: 'Lastehommik',   venue: 'Nukuteater', start: '2026-11-01T11:00',
    seats: 200, sold:   0, price:  8.0 },
];

const seatmaps = {
  1: { rows: 12, seatsPerRow: 18, sold: ['3-4', '3-5', '7-1'] },
  3: { rows: 8, seatsPerRow: 15, sold: ['1-1'] },
};

let nextOrderId = 5001;
const orders = [];
let retryCounter = 0;

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
                 '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function send(res, code, content, headers = {}) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    // Katsetusala elab teisel pordil — CORS on siin meelega LAHTI, et
    // ülesanne ei jääks CORS-i taha kinni (seda mõõdeti C04 Ex4-s).
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Ticket-Id',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    ...headers,
  });
  res.end(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
}

/** Rakendab tahtlikud tõrked. Tagastab true, kui vastus on juba saadetud. */
async function failures(req, res, url) {
  const slow = Number(url.searchParams.get('slow') ?? 0);
  if (slow > 0) await wait(Math.min(slow, 15000));

  if (url.searchParams.has('err')) {
    send(res, 500, { err: 'Andmebaas ei vasta' });
    return true;
  }
  const loss = Number(url.searchParams.get('loss') ?? 0);
  if (loss > 0 && Math.random() < loss) {
    send(res, 503, { err: 'Teenus ajutiselt hõivatud' }, { 'Retry-After': '1' });
    return true;
  }
  if (url.searchParams.has('retry')) {
    // Iga KOLMAS päring õnnestub. Kordamise (retry) katsetamiseks, ilma
    // juhuslikkuseta — nii on tulemus korratav.
    retryCounter += 1;
    if (retryCounter % 3 !== 0) {
      send(res, 503, { err: 'Proovi uuesti', attempt: retryCounter }, { 'Retry-After': '1' });
      return true;
    }
  }
  if (url.searchParams.has('broken')) {
    // 200 OK, aga keha ei ole JSON. ★ See on koht, kus response.ok on TRUE
    //   ja json() viskab ikkagi — kaks eri viga ühe päringu sees.
    send(res, 200, '{"events": [ KATKINE');
    return true;
  }
  return false;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const t = url.pathname;

  if (req.method === 'OPTIONS') { send(res, 204, ''); return; }
  if (await failures(req, res, url)) return;

  const empty = url.searchParams.has('empty');

  if (t === '/api/events') {
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const rows = empty ? [] : events.filter((s) => s.name.toLowerCase().includes(search));
    return send(res, 200, rows);
  }

  if (t.startsWith('/api/events/')) {
    const id = Number(t.split('/')[3]);
    const s = events.find((x) => x.id === id);
    if (!s) return send(res, 404, { err: 'Sellist sündmust ei ole', id });
    return send(res, 200, s);
  }

  if (t.startsWith('/api/seatmap/')) {
    const id = Number(t.split('/')[3]);
    const p = seatmaps[id];
    if (!p) return send(res, 404, { err: 'Saaliplaani ei ole', id });
    return send(res, 200, p);
  }

  if (t === '/api/orders' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    let data;
    try { data = JSON.parse(body); } catch { return send(res, 400, { err: 'vigane JSON' }); }
    if (!data.event || !data.qty) {
      return send(res, 422, { err: 'Puuduvad väljad', fields: ['event', 'qty'] });
    }
    const order = { id: nextOrderId++, ...data, time: new Date().toISOString() };
    orders.push(order);
    return send(res, 201, order, { Location: `/api/orders/${order.id}` });
  }

  if (t === '/api/orders') return send(res, 200, empty ? [] : orders);

  // Üks pilet: tekib ostuga ja ei muutu enam. Teda on vaja uksel ka võrguta —
  // seepärast tohib teenustöötaja teda hoida. Ostude NIMEKIRI muutub iga
  // ostuga ja jääb võrk-ainult.
  if (t.startsWith('/api/tickets/')) {
    const id = Number(t.split('/')[3]);
    const o = orders.find((x) => x.id === id);
    if (!o) return send(res, 404, { err: 'Sellist piletit ei ole', id });
    return send(res, 200, { id: o.id, event: o.event, qty: o.qty, code: `PK-${o.id}` });
  }

  if (t === '/api/retry/status') return send(res, 200, { counter: retryCounter });
  if (t === '/api/retry/reset') { retryCounter = 0; return send(res, 200, { counter: 0 }); }

  // staatika
  let route = decodeURIComponent(t);
  if (route.endsWith('/')) route += 'index.html';
  const file = path.join(ROOT, 'public', route);
  if (!file.startsWith(path.join(ROOT, 'public'))) return send(res, 403, { err: 'Ei tohi' });
  fs.readFile(file, (err, content) => {
    if (err) return send(res, 404, { err: 'Ei leidnud', route });
    return send(res, 200, content, { 'Content-Type': TYPES[path.extname(file)] ?? 'text/plain' });
  });
}

http.createServer((req, res) => {
  handle(req, res).catch((v) => send(res, 500, { err: v.message }));
}).listen(PORT, () => console.log(`piletikassa API (C05) kuulab: http://localhost:${PORT}`));

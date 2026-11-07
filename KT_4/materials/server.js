// C04 — ETTE ANTUD piletikassa server. Seda faili sa EI kirjuta.
//
// Miks ta ette antakse: loeng 4 on HTTP PROTOKOLLI kohta, mitte serveri
// kirjutamise kohta (see tuleb loengus 6, Expressiga). Siin on server
// mõõteriist — sina saadad talle päringuid ja loed vastuseid.
//
//   node server.js
//   -> http://localhost:3004   (ja http://localhost:3005 sama server,
//                               teine port — päritolu katseteks)
//
// KÕIK teed on nähtavad aadressil http://localhost:3004/
//
// ★ Server on TAHTLIKULT lihtne: ei ole Expressi, ei ole raamistikku, ei ole
//   andmebaasi. Kogu olek elab mälus ja kaob taaskäivitusel — see on siin
//   TUNNUS, mitte puudus: iga katse algab puhtalt lehelt.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORTS = [3004, 3005];

// ── ANDMED ──────────────────────────────────────────────────────────────
// Väike piletikassa: sündmused, kohad ja ostud. Kõik mälus.
let nextOrderId = 1001;
const orders = [];

const events = [
  { id: 1, name: 'Sügiskontsert',      venue: 'Vanemuine',    start: '2026-10-04T19:00',
    seats: 420, sold: 118, price: 24.0 },
  { id: 2, name: 'Talveball',          venue: 'Estonia',      start: '2026-12-13T20:00',
    seats: 900, sold: 900, price: 45.0 },
  { id: 3, name: 'Improteater',        venue: 'Von Krahl',    start: '2026-10-19T21:00',
    seats: 120, sold:  37, price: 15.0 },
  { id: 4, name: 'Lastehommik',        venue: 'Nukuteater',   start: '2026-11-01T11:00',
    seats: 200, sold:   0, price:  8.0 },
];

// Iga sündmuse versioon kasvab iga muudatusega. ETag ehitatakse SELLEST,
// mitte kellaajast — kellaaeg annaks iga sekund uue sildi.
const versions = new Map(events.map((s) => [s.id, 1]));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

// ── ABID ────────────────────────────────────────────────────────────────
function tag(content) {
  return '"' + crypto.createHash('sha1').update(content).digest('hex').slice(0, 16) + '"';
}

function readBody(req) {
  return new Promise((resolve) => {
    let k = '';
    req.on('data', (t) => { k += t; });
    req.on('end', () => resolve(k));
  });
}

function send(res, code, content, headers = {}) {
  // ★ CONTENT-LENGTH ON SIIN MEELEGA. Ilma temata saadab Node vastuse
  //   TÜKKIDENA (Transfer-Encoding: chunked) ja Content-Length puudub HOOPIS.
  //   Ex1 peab näitama, et HEAD annab SAMAD päised mis GET — seda ei saa
  //   näidata päisega, mida kumbki vastus ei kanna.
  res.writeHead(code, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(content ?? ''),
    ...headers,
  });
  res.end(content);
}

function json(res, code, data, headers = {}) {
  const content = JSON.stringify(data, null, 2);
  send(res, code, content, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
}

// ── 1. PEEGEL: näitab päringut TÄPSELT nii, nagu server ta sai ──────────
// Ex1 mõõteriist. Iga päis, mille brauser ise lisas, on siin näha.
async function mirror(req, res, url) {
  const body = await readBody(req);
  const type = req.headers['content-type'] ?? '';

  let bodyParsed = body;
  if (type.startsWith('application/x-www-form-urlencoded')) {
    bodyParsed = Object.fromEntries(new URLSearchParams(body));
  } else if (type.startsWith('application/json') && body) {
    try { bodyParsed = JSON.parse(body); } catch { bodyParsed = '(vigane JSON) ' + body; }
  } else if (type.startsWith('multipart/')) {
    // Multipart EI OLE JSON: ta on mitmeosaline sõnum eraldajaga. Siin
    // näidatakse ta toorelt, et eraldaja ja osade päised oleksid nähtavad.
    bodyParsed = body.split('\r\n').slice(0, 24);
  }

  json(res, 200, {
    method: req.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    version: 'HTTP/' + req.httpVersion,
    headers: req.headers,
    body_type: type || '(puudub)',
    body_bytes: Buffer.byteLength(body),
    body: bodyParsed || '(tühi)',
  });
}

// ── 2. OLEKUKOODID: /api/status/404 vastab koodiga 404 ────────────────────
// Ex2 mõõteriist. 3xx puhul lisatakse ka Location, et suunamist näha.
function statusCode(req, res, url) {
  const code = Number(url.pathname.split('/').pop());
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    return send(res, 400, 'Kood peab olema 100..599');
  }
  const headers = {};
  if (code >= 300 && code < 400) headers.Location = '/api/events';
  if (code === 401) headers['WWW-Authenticate'] = 'Bearer realm="piletikassa"';
  if (code === 405) headers.Allow = 'GET, HEAD, OPTIONS';
  if (code === 429) headers['Retry-After'] = '5';
  return send(res, code, `Server vastas koodiga ${code}.`, headers);
}

// ── 3. KÜPSISED: atribuudid ükshaaval nähtavaks ─────────────────────────
// Ex4 mõõteriist. Iga küpsis on TAHTLIKULT erinevate atribuutidega.
function cookies(req, res, url) {
  // ★ TUNNUSTEGA (credentialed) CORS on RANGEM kui tavaline. Kaks lisanõuet:
  //   1. Access-Control-Allow-Credentials: true peab olema
  //   2. Allow-Origin EI TOHI olla "*" — peab olema konkreetne päritolu
  //   Ilma nendeta blokeerib brauser vastuse, kuigi server vastas 200.
  const extra = {};
  if (url.searchParams.has('allowed') && req.headers.origin) {
    extra['Access-Control-Allow-Origin'] = req.headers.origin;
    extra['Access-Control-Allow-Credentials'] = 'true';
    extra.Vary = 'Origin';
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, extra);
    return res.end();
  }
  if (url.searchParams.has('set')) {
    return send(res, 200, 'Viis küpsist seatud. Vaata Application-paneelilt.', {
      ...extra,
      'Set-Cookie': [
        'simple=1; Path=/',
        'httponly=2; Path=/; HttpOnly',
        'short=3; Path=/; Max-Age=10',
        'same_site=4; Path=/; SameSite=Strict',
        'cross_site=5; Path=/; SameSite=None; Secure',
      ],
    });
  }
  return json(res, 200, {
    ...{},
    cookie_header: req.headers.cookie ?? '(brauser ei saatnud ühtki küpsist)',
    note: 'HttpOnly-küpsis ON siin nimekirjas — server näeb teda alati. '
         + 'JavaScript document.cookie kaudu teda EI näe.',
  }, extra);
}

// ── 4. VAHEMÄLU: Cache-Control ükshaaval ────────────────────────────────
// Ex1/Ex5 mõõteriist. ?kind=... valib päise.
function cache(req, res, url) {
  const kind = url.searchParams.get('kind') ?? 'none';
  const headers = { 'X-Time': new Date().toISOString() };
  if (kind === 'short') headers['Cache-Control'] = 'max-age=10';
  if (kind === 'long') headers['Cache-Control'] = 'max-age=31536000, immutable';
  if (kind === 'nostore') headers['Cache-Control'] = 'no-store';
  if (kind === 'revalidate') headers['Cache-Control'] = 'no-cache';
  return send(res, 200, `kind=${kind}  aeg=${headers['X-Time']}`, headers);
}

// ── 5. SÜNDMUSED: ETag ja tingimuslikud päringud ────────────────────────
// Ex5 mõõteriist JA siht. Server käitub ÕIGESTI — sinu ülesanne on see
// käitumine kõigepealt MÕÕTA ja siis oma koodis järele teha.
function eventsTag() {
  return tag(JSON.stringify(events.map((s) => [s.id, versions.get(s.id)])));
}

async function eventsApi(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean);   // ['api','events',id?]
  const id = parts[2] ? Number(parts[2]) : null;

  if (id === null) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'Nimekirja ei saa muuta.', { Allow: 'GET, HEAD' });
    }
    const s = eventsTag();
    // Tingimuslik päring: kui klient juba teab seda silti, saadame 304
    // ILMA kehata. 304 on kõige odavam vastus, mida server anda saab.
    if (req.headers['if-none-match'] === s) {
      res.writeHead(304, { ETag: s, 'Cache-Control': 'no-cache' });
      return res.end();
    }
    return json(res, 200, events, { ETag: s, 'Cache-Control': 'no-cache' });
  }

  const s = events.find((x) => x.id === id);
  if (!s) return json(res, 404, { error: 'Sellist sündmust ei ole', id });
  const ownTag = tag(`${s.id}:${versions.get(s.id)}`);

  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.headers['if-none-match'] === ownTag) {
      res.writeHead(304, { ETag: ownTag });
      return res.end();
    }
    return json(res, 200, s, { ETag: ownTag });
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    // ★ OPTIMISTLIK LUKUSTUS. Kaks korraldajat avavad sama sündmuse ja
    //   muudavad hinda. Ilma If-Matchita võidab see, kes salvestab VIIMASENA,
    //   ja esimese muudatus kaob vaikselt. If-Match teeb kaotuse NÄHTAVAKS.
    const wanted = req.headers['if-match'];
    if (!wanted) {
      return json(res, 428, { error: 'If-Match on kohustuslik', tag: ownTag });
    }
    if (wanted !== ownTag) {
      return json(res, 412, {
        error: 'Keegi teine muutis seda sündmust enne sind',
        your_tag: wanted, current_tag: ownTag,
      });
    }
    const body = await readBody(req);
    let change = {};
    try { change = JSON.parse(body || '{}'); }
    catch { return json(res, 400, { error: 'vigane JSON' }); }
    if (change.price !== undefined) s.price = Number(change.price);
    if (change.name !== undefined) s.name = String(change.name);
    versions.set(s.id, versions.get(s.id) + 1);
    return json(res, 200, s, { ETag: tag(`${s.id}:${versions.get(s.id)}`) });
  }

  return send(res, 405, 'Lubatud: GET, HEAD, PUT, PATCH', { Allow: 'GET, HEAD, PUT, PATCH' });
}

// ── 6. OSTUD: kolm keha vormingut ühe teega ─────────────────────────────
// Ex3 mõõteriist. Sama ost, kolm eri Content-Type'i.
async function orderApi(req, res, url) {
  if (req.method === 'GET') return json(res, 200, orders);
  if (req.method !== 'POST') {
    return send(res, 405, 'Lubatud: GET, POST', { Allow: 'GET, POST' });
  }
  const body = await readBody(req);
  const type = (req.headers['content-type'] ?? '').split(';')[0];
  let data;

  if (type === 'application/json') {
    try { data = JSON.parse(body); } catch { return json(res, 400, { error: 'vigane JSON' }); }
  } else if (type === 'application/x-www-form-urlencoded') {
    data = Object.fromEntries(new URLSearchParams(body));
  } else if (type === 'multipart/form-data') {
    data = {};
    for (const part of body.split('--').slice(1, -1)) {
      const m = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
      if (m) data[m[1]] = m[2];
    }
  } else {
    return json(res, 415, { error: 'Toetamata Content-Type', received: type || '(puudub)' });
  }

  const order = {
    id: nextOrderId++, event: Number(data.event), qty: Number(data.qty),
    buyer: String(data.buyer ?? ''), format: type,
  };
  orders.push(order);
  // 201 Created + Location: kus uus asi nüüd ON. See on 201 mõte.
  return json(res, 201, order, { Location: `/api/orders/${order.id}` });
}

// ── 7. CORS: teine päritolu ja eelkontroll ──────────────────────────────
// Ex4 mõõteriist. ?allowed=1 lisab CORS-päised, muidu brauser blokeerib.
function cors(req, res, url) {
  const allowed = url.searchParams.has('allowed');
  const headers = {};
  if (allowed) {
    headers['Access-Control-Allow-Origin'] = req.headers.origin ?? '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Ticket-Id';
    headers['Access-Control-Max-Age'] = '60';
  }
  if (req.method === 'OPTIONS') {          // eelkontroll (preflight)
    res.writeHead(allowed ? 204 : 403, headers);
    return res.end();
  }
  return json(res, 200, { allowed, origin: req.headers.origin ?? '(sama päritolu)' }, headers);
}

// ── 8. ARUANNE: sisu läbirääkimine ja Range ─────────────────────────────
// Ex6 mõõteriist. Sama ressurss kolmes esituses; suur fail tükkidena.
const REPORT = events.map((s) => ({
  id: s.id, name: s.name, sold: s.sold, seats: s.seats,
  revenue: Math.round(s.sold * s.price * 100) / 100,
}));

function report(req, res) {
  const accept = req.headers.accept ?? '*/*';
  // Lihtsustatud läbirääkimine: q-väärtusi siin ei arvestata (see on Ex6
  // ülesanne). Server vaatab AINULT esimest sobivat tüüpi.
  if (accept.includes('text/csv')) {
    const lines = ['id,name,sold,seats,revenue'];
    for (const r of REPORT) lines.push(`${r.id},${r.name},${r.sold},${r.seats},${r.revenue}`);
    return send(res, 200, lines.join('\n'),
        { 'Content-Type': 'text/csv; charset=utf-8', Vary: 'Accept' });
  }
  if (accept.includes('application/json') || accept.includes('*/*')) {
    return json(res, 200, REPORT, { Vary: 'Accept' });
  }
  return send(res, 406, 'Ei oska ühtki soovitud tüüpi anda. Proovi Accept: application/json');
}

// Suur tekst Range-katseks. ★ PUHVER, MITTE SÕNE: Range on defineeritud
// BAITIDES, aga JavaScripti sõne pikkus loeb UTF-16 koodiühikuid. Mõõdetud:
// sama tekst on 14 499 märki ja 15 499 baiti — mõttekriips („—“) on UTF-8-s
// kolm baiti. Sõnega arvutades valetaks Content-Range 1000 baiti.
const BIG = Buffer.from(
  Array.from({ length: 500 },
    (_, i) => `rida ${String(i + 1).padStart(4, '0')} — piletikassa logi`).join('\n'),
  'utf8');

function partial(req, res) {
  const range = req.headers.range;
  if (!range) {
    return send(res, 200, BIG, {
      'Accept-Ranges': 'bytes', 'Content-Type': 'text/plain; charset=utf-8' });
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!m || (m[1] === '' && m[2] === '')) {
    return send(res, 416, 'Vigane Range', { 'Content-Range': `bytes */${BIG.length}` });
  }
  let start; let end;
  if (m[1] === '') {                       // bytes=-500 -> VIIMASED 500 baiti
    start = Math.max(0, BIG.length - Number(m[2]));
    end = BIG.length - 1;
  } else {
    start = Number(m[1]);
    // ★ Liiga suurt LÕPPU ei lükata tagasi, vaid KÄRBITAKSE (RFC 9110).
    end = Math.min(m[2] === '' ? BIG.length - 1 : Number(m[2]), BIG.length - 1);
  }
  if (start < 0 || start >= BIG.length || start > end) {
    return send(res, 416, 'Vahemik väljaspool faili',
        { 'Content-Range': `bytes */${BIG.length}` });
  }
  return send(res, 206, BIG.subarray(start, end + 1), {
    'Content-Range': `bytes ${start}-${end}/${BIG.length}`,
    'Accept-Ranges': 'bytes',
    'Content-Type': 'text/plain; charset=utf-8',
  });
}

// ── STAATIKA ────────────────────────────────────────────────────────────
function serveStatic(req, res, url) {
  let filePath = decodeURIComponent(url.pathname);
  if (filePath.endsWith('/')) filePath += 'index.html';
  const file = path.join(ROOT, 'public', filePath);
  if (!file.startsWith(path.join(ROOT, 'public'))) return send(res, 403, 'Ei tohi');
  fs.readFile(file, (err, content) => {
    if (err) return send(res, 404, 'Ei leitud: ' + filePath);
    return send(res, 200, content,
        { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  });
}

// ── SUUNAMINE ───────────────────────────────────────────────────────────
async function handle(req, res) {
  const url = new URL(req.url, `http://localhost:${req.socket.localPort}`);
  const t = url.pathname;

  if (t === '/api/mirror') return mirror(req, res, url);
  if (t.startsWith('/api/status/')) return statusCode(req, res, url);
  if (t.startsWith('/api/cookie')) return cookies(req, res, url);
  if (t.startsWith('/api/cache')) return cache(req, res, url);
  if (t.startsWith('/api/events')) return eventsApi(req, res, url);
  if (t.startsWith('/api/orders')) return orderApi(req, res, url);
  if (t.startsWith('/api/cors')) return cors(req, res, url);
  if (t === '/api/report') return report(req, res);
  if (t === '/api/log') return partial(req, res);
  return serveStatic(req, res, url);
}

for (const port of PORTS) {
  http.createServer((req, res) => {
    handle(req, res).catch((v) => send(res, 500, 'Serveri viga: ' + v.message));
  }).listen(port, () => console.log(`piletikassa (C04) kuulab: http://localhost:${port}`));
}

// C07 Ex6 — ETTE ANTUD proovijooks.  node check-connection.js
import { createHash } from 'node:crypto';
import * as U from '../server/connection.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. baas-URL tuleb KESKKONNAST: API_URL ja PORT
on('arenduses localhost:3000', U.baseUrl({}), 'http://localhost:3000/api/v1');
on('arenduse port tuleb PORT-ist', U.baseUrl({ PORT: '3007' }), 'http://localhost:3007/api/v1');
on('★ tootmises SUHTELINE (CORS-i ei ole vaja)',
   U.baseUrl({ API_URL: '/api/v1' }), '/api/v1');
on('API_URL võidab',
   U.baseUrl({ API_URL: 'https://api.piletikassa.ee/v1', PORT: '3007' }),
   'https://api.piletikassa.ee/v1');
on('lõpukaldkriips lõigatakse', U.baseUrl({ API_URL: 'https://x.ee/v1/' }), 'https://x.ee/v1');
on('ka suhtelisel teel', U.baseUrl({ API_URL: '/api/v1/' }), '/api/v1');

// 2. CORS
const empty = U.corsOptions({});
const configured = U.corsOptions({ CORS_ORIGINS: 'https://piletikassa.ee, http://localhost:5173' });
on('lubatud päritolu läbib', U.isAllowed(configured, 'https://piletikassa.ee'), true);
on('teine lubatud läbib', U.isAllowed(configured, 'http://localhost:5173'), true);
on('★ tundmatu päritolu EI läbi', U.isAllowed(configured, 'https://kuri.ee'), false);
on('päritoluta päring (curl) läbib', U.isAllowed(configured, undefined), true);
on('★ ilma seadistuseta ei lubata ÜHTKI', U.isAllowed(empty, 'https://piletikassa.ee'), false);
on('★ credentials AINULT konkreetsete päritoludega', empty.credentials, false);
on('credentials seatuna on lubatud', configured.credentials, true);
on('Location on exposedHeaders-is', configured.exposedHeaders.includes('Location'), true);
on('eelkontroll vahemällu', configured.maxAge, 600);
on('OPTIONS on lubatud meetodite hulgas', configured.methods.includes('OPTIONS'), true);

// 3. kolm stiili piletikassa kolmel toimingul
// ★ Õiged vastused on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul käes,
//   ja tabel on sinu arvutada. Vale lahtri korral ütleb kontroll, MIS lahter.
const STYLE_NAMES = ['REST', 'GraphQL', 'gRPC'];
const OPERATIONS = ['events', 'seatmap', 'buyTickets'];
const ANSWERS = {
  'REST.events': '9a614e6dde15',
  'REST.seatmap': '0b8875c253b3',
  'REST.buyTickets': '1d33c5c192cd',
  'GraphQL.events': 'ef1e60b046dc',
  'GraphQL.seatmap': '58db903e94d3',
  'GraphQL.buyTickets': '5fa6ecbbcd50',
  'gRPC.events': '310d46ba9868',
  'gRPC.seatmap': 'e39189ab79cb',
  'gRPC.buyTickets': '1172227544f4',
};
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};
const cell = (style, op) => (U.STYLES?.[style]?.[op]) ?? {};

on('kolm stiili', Object.keys(U.STYLES ?? {}).sort(), [...STYLE_NAMES].sort());
for (const style of STYLE_NAMES) {
  on(`${style}: kolm toimingut`, Object.keys(U.STYLES?.[style] ?? {}).sort(),
     [...OPERATIONS].sort());
}
const unexplained = STYLE_NAMES.flatMap((style) => OPERATIONS
  .filter((op) => String(cell(style, op).why ?? '').trim().split(/\s+/).length < 2)
  .map((op) => `${style}.${op}`));
on('iga lahter ütleb mõne sõnaga, miks (why)', unexplained, []);
for (const style of STYLE_NAMES) {
  for (const op of OPERATIONS) {
    const { requests, httpCache } = cell(style, op);
    const right = Number.isInteger(requests) && typeof httpCache === 'boolean'
      && fingerprint(`${style}.${op}:${requests}:${httpCache}`) === ANSWERS[`${style}.${op}`];
    if (right) ok++;
    else broken.push(`${style} · ${op}: requests ${JSON.stringify(requests)}, `
      + `httpCache ${JSON.stringify(httpCache)} — vähemalt üks neist ei pea paika`);
  }
}

// Stiili soovitus: juhtum nimetatakse, vastus on sinu otsus.
cellOk('stiil', 'browser', U.suggestStyle({ client: 'browser' }), '6a0b71eb6879');
cellOk('stiil', 'serviceLatency',
       U.suggestStyle({ client: 'service', latencySensitive: true }), '5cafc02a4f01');
cellOk('stiil', 'mobileDeep',
       U.suggestStyle({ client: 'mobile', entityDepth: 5 }), '1ccca680c9e5');
cellOk('stiil', 'mobileFlat',
       U.suggestStyle({ client: 'mobile', entityDepth: 1 }), '698b8e725a54');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

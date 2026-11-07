// C07 Ex2 — ETTE ANTUD proovijooks.  node check-rest.js
import { createHash } from 'node:crypto';
import * as R from '../server/rest.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// ★ Õiged meetodid ja koodid on siin SÕRMEJÄLJENA, mitte kirjas: see fail on
//   sul käes, ja otsused on sinu teha. Vale lahtri korral ütleb kontroll, MIS lahter.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

// 1. URL-id: nimisõnad mitmuses, tegusõna EI OLE
on('kollektsioon', R.ROUTES.events, '/api/events');
on('üksik', R.ROUTES.event(3), '/api/events/3');
on('pesastatud', R.ROUTES.seatmap(3), '/api/events/3/seatmap');
on('tühistamine on nimisõna', R.ROUTES.cancellation(7), '/api/orders/7/cancellation');
const allRoutes = [R.ROUTES.events, R.ROUTES.event(1), R.ROUTES.seatmap(1),
                   R.ROUTES.orders, R.ROUTES.order(1), R.ROUTES.cancellation(1)];
const VERBS = ['get', 'create', 'update', 'remove', 'delete', 'add', 'cancel/'];
on('★ ükski URL EI SISALDA tegusõna',
   allRoutes.filter((t) => VERBS.some((v) => `${t.toLowerCase()}/`.includes(v))), []);
on('★ ükski URL ei ole ainsuses',
   allRoutes.filter((t) => /\/event\/|\/order\//.test(t)), []);

// 2. lubatud meetodid IGAL aadressil
const ADDRESSES = ['events', 'event', 'seatmap', 'orders', 'order', 'cancellation'];
const METHODS = {
  events: 'e02507ed45b2',
  event: 'd65d04ec07ab',
  seatmap: 'ff8098a5382d',
  orders: 'ac1564fd68e8',
  order: 'dbf1d638fc05',
  cancellation: 'ccdce8f09df4',
};
on('kuus aadressi', Object.keys(R.ALLOWED ?? {}).sort(), [...ADDRESSES].sort());
for (const addr of ADDRESSES) {
  cellOk('meetodid', addr, [...(R.ALLOWED?.[addr] ?? [])].sort().join(','), METHODS[addr]);
}

// 3. PUT vs PATCH
const exists = { id: 3, name: 'Improteater', venue: 'Von Krahl', price: 15, note: 'vana' };
const put = R.applyPut(exists, { name: 'Uus', venue: 'X', price: 20 });
on('★ PUT ASENDAB: note KADUS', put.note, undefined);
on('PUT säilitab id', put.id, 3);
on('PUT ei luba id-d muuta', R.applyPut(exists, { id: 99, name: 'Uus' }).id, 3);
const patch = R.applyPatch(exists, { price: 20 });
on('★ PATCH säilitab teised väljad', patch.note, 'vana');
on('PATCH muudab antud välja', patch.price, 20);
on('PATCH ei luba id-d muuta', R.applyPatch(exists, { id: 99 }).id, 3);
// idempotentsus: PUT kaks korda -> sama seis
on('★ PUT on idempotentne',
   R.applyPut(R.applyPut(exists, { name: 'A' }), { name: 'A' }),
   R.applyPut(exists, { name: 'A' }));

// 4. koodid piletikassa olukordadele
const SITUATIONS = {
  brokenJson: '59841565d57f',
  negativeCount: 'b509c11eefa8',
  unknownEventInOrder: 'f24485ce36ea',
  eventGone: 'fabf059e5713',
  seatTaken: '53147117ed23',
  tooManyTickets: 'c4e5b9c1df46',
  cancelledTwice: 'c5df721685d5',
  noLogin: 'b464b374f871',
  notOrganizer: 'f13a53bfc3cf',
};
on('üheksa olukorda', Object.keys(R.STATUS ?? {}).sort(), Object.keys(SITUATIONS).sort());
for (const [situation, expected] of Object.entries(SITUATIONS)) {
  cellOk('kood', situation, R.STATUS?.[situation], expected);
}
on('★ katkine JSON -> 400', R.inputCode(false, false), 400);
on('★ loetav JSON, vigased väärtused -> 422', R.inputCode(true, false), 422);
on('kõik korras -> null', R.inputCode(true, true), null);

// 5. 405 koos Allow-päisega, mis tuleb SINU tabelist
const res = { code: 0, headers: {}, body: null,
  status(k) { this.code = k; return this; },
  set(n, v) { this.headers[n] = v; return this; },
  json(x) { this.body = x; return this; } };
R.wrongMethod(res, R.ALLOWED.seatmap);
on('vale meetod -> 405', res.code, 405);
const seatmapAllow = R.ALLOWED.seatmap.join(', ');
on('★ 405 KOOS Allow-päisega saaliplaani meetoditest', res.headers.Allow, seatmapAllow);

// 6. versioonimine
on('versioon URL-is', R.versioned('/api/events'), '/api/v1/events');
on('versioon ei dubleeri /api-t', R.versioned('/api/orders/7'), '/api/v1/orders/7');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

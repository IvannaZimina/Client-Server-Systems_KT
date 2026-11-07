// C07 Ex5 — ETTE ANTUD proovijooks.  node check-contract.js
import * as L from '../server/contract.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const EVENT = { id: 1, name: 'Sügiskontsert', venue: 'Vanemuine',
  start: '2030-10-04T19:00', seats: 420, sold: 118, price: 24 };

// 1. skeemikontroll
on('terve sündmus läbib', L.checkSchema(L.CONTRACT, 'Event', EVENT), []);
const { price, ...withoutPrice } = EVENT;
on('puuduv nõutud väli', L.checkSchema(L.CONTRACT, 'Event', withoutPrice),
   ['puudub nõutud väli: price']);
on('vale tüüp', L.checkSchema(L.CONTRACT, 'Event', { ...EVENT, seats: 'palju' }),
   ['seats: ootasin integer, sain string']);
// ★ TUNDMATU VÄLI ON VIGA — just tema kaudu lekib serveri sisemus
on('★ lepingus puuduv väli on VIGA',
   L.checkSchema(L.CONTRACT, 'Event', { ...EVENT, passwordHash: 'x' }),
   ['lepingus puuduv väli: passwordHash']);
on('integer kõlbab number-väljale',
   L.checkSchema(L.CONTRACT, 'Event', { ...EVENT, price: 24 }), []);
on('null valikulisel väljal lubatud',
   L.checkSchema(L.CONTRACT, 'Error', { err: 'x', code: 'Y', detail: null }), []);
on('★ null NÕUTUD väljal on viga',
   L.checkSchema(L.CONTRACT, 'Event', { ...EVENT, price: null }),
   ['price: ootasin number, sain null']);
on('tundmatu skeem annab vea',
   L.checkSchema(L.CONTRACT, 'Missing', {}), ['tundmatu skeem: Missing']);

// 2. vastuse kontroll
on('200 sündmus läbib',
   L.checkResponse(L.CONTRACT, '/events/{id}', 'GET', 200, EVENT), []);
on('404 viga läbib',
   L.checkResponse(L.CONTRACT, '/events/{id}', 'GET', 404,
      { err: 'Ei ole', code: 'NOT_FOUND' }), []);
on('lepingus puuduv kood',
   L.checkResponse(L.CONTRACT, '/events/{id}', 'GET', 418, {}),
   ['lepingus ei ole vastust 418 teele GET /events/{id}']);
on('lepingus puuduv tee',
   L.checkResponse(L.CONTRACT, '/password', 'GET', 200, {}), ['lepingus ei ole: GET /password']);
// ★ nõutud PÄIS on osa lepingust
const ORDER = { id: 7001, event: 3, qty: 2, createdAt: '2026-09-06T10:00:00Z' };
on('201 ilma Location-ita KUKUB',
   L.checkResponse(L.CONTRACT, '/orders', 'POST', 201, ORDER, {}),
   ['puudub nõutud päis: Location']);
on('201 koos Location-iga läbib',
   L.checkResponse(L.CONTRACT, '/orders', 'POST', 201, ORDER,
                   { location: '/api/orders/7001' }), []);

// 3. mock tehakse LEPINGUST
const mock = L.createMock(L.CONTRACT, {
  Event: EVENT,
  List: { total: 0, page: 1, per: 20, pages: 1, rows: [] },
  Order: ORDER,
});
on('mock annab lepingu esimese koodi', mock('GET', '/events/{id}').code, 200);
on('mock annab skeemikohase keha', mock('GET', '/events/{id}').body.name, 'Sügiskontsert');
on('mock: POST /orders annab 201', mock('POST', '/orders').code, 201);
on('mock: tundmatu tee 404', mock('GET', '/missing').code, 404);
// ★ mocki vastus peab ISE lepingut jargima
on('★ mocki vastus läbib lepingutesti',
   L.checkSchema(L.CONTRACT, 'Event', mock('GET', '/events/{id}').body), []);

// 4. murdvad ja mittemurdvad muudatused
on('vastusesse lisamine on ohutu', L.changeKind('response', 'add'), 'safe');
on('★ vastusest eemaldamine MURRAB', L.changeKind('response', 'remove'), 'BREAKING');
on('päringusse VALIKULISE lisamine ohutu', L.changeKind('request', 'add', false), 'safe');
on('★ päringusse NÕUTUD välja lisamine MURRAB', L.changeKind('request', 'add', true), 'BREAKING');
// ★ Päringu skeem on server poolel RANGE (Ex4 OrderSchema .strict()): vana
//   klient, kes saadab eemaldatud välja, saab 422.
on('★ päringust eemaldamine MURRAB', L.changeKind('request', 'remove'), 'BREAKING');
on('tüübi muutmine MURRAB', L.changeKind('type', 'update'), 'BREAKING');

// 5. kahe lepingu võrdlus
const next = structuredClone(L.CONTRACT);
next.schemas.Event.fields.image = 'string';                 // ohutu
next.schemas.NewOrder.fields.coupon = 'string';
next.schemas.NewOrder.required.push('coupon');            // MURDEV
delete next.schemas.List.fields.pages;                   // MURDEV
next.schemas.Order.fields.receipt = 'string';
next.schemas.Order.required.push('receipt');             // ohutu: VASTUS
delete next.schemas.NewOrder.fields.note;                // MURDEV: range päring
next.schemas.Event.fields.price = 'string';              // MURDEV: tüüp
const m = L.compareContracts(L.CONTRACT, next);
const find = (schema, field) => m.find((x) => x.schema === schema && x.field === field);
on('lisatud valikuline väli on ohutu', find('Event', 'image').kind, 'safe');
on('lisatud NÕUTUD väli MURRAB', find('NewOrder', 'coupon').kind, 'BREAKING');
on('eemaldatud väli MURRAB', find('List', 'pages').kind, 'BREAKING');
on('★ vastusesse NÕUTUD välja lisamine on ohutu', find('Order', 'receipt').kind, 'safe');
on('★ päringust välja eemaldamine MURRAB', find('NewOrder', 'note').kind, 'BREAKING');
on('★ tüübi muutmine leitakse ja MURRAB', find('Event', 'price')?.kind, 'BREAKING');
on('murdvaid muudatusi kokku 4', m.filter((x) => x.kind === 'BREAKING').length, 4);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

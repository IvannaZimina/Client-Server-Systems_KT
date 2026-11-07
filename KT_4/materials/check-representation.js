// C04 — ETTE ANTUD proovijooks. Seda faili sa EI kirjuta.
//
// Ta on ÜLESANDE TÄPSUSTUS: iga kontroll ütleb ühe lause selle kohta,
// mida sinu funktsioon tegema peab. Jooksuta teda tihti.
//
//   node check-representation.js
//
// Roheline EI TÄHENDA valmis: kontrollid katavad reeglid, mitte sinu
// koodi loetavust ega kommentaare.
import * as E from '../server/representation.js';
import { range } from '../server/range.js';   // ETTE ANTUD, kopeeritud server/ kausta
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);
const OFFERED = ['application/json', 'text/csv', 'text/plain'];

// 1. Accept lahtivõtmine
on('q puudumine tähendab q=1', E.parseAccept('text/csv')[0].q, 1);
on('q loetakse', E.parseAccept('text/csv;q=0.4')[0].q, 0.4);
on('tühi Accept -> */*', E.parseAccept('')[0].type, '*/*');
on('järjestus q järgi',
   E.parseAccept('text/csv;q=0.2, application/json;q=0.9').map((x) => x.type),
   ['application/json', 'text/csv']);
on('võrdse q juures võidab TÄPSEM',
   E.parseAccept('*/*, text/*, application/json').map((x) => x.type),
   ['application/json', 'text/*', '*/*']);

// 2. valik
on('täpne vaste', E.pickRepresentation('text/csv', OFFERED), 'text/csv');
on('*/* annab esimese pakutava', E.pickRepresentation('*/*', OFFERED), 'application/json');
on('text/* annab esimese text-i', E.pickRepresentation('text/*', OFFERED), 'text/csv');
on('q otsustab',
   E.pickRepresentation('application/json;q=0.1, text/csv;q=0.9', OFFERED), 'text/csv');
on('q=0 on KEELD', E.pickRepresentation('application/json;q=0, text/csv', OFFERED), 'text/csv');
on('q=0 kõigel -> null',
   E.pickRepresentation('application/json;q=0, text/csv;q=0',
                        ['application/json', 'text/csv']), null);
on('sobimatu -> null', E.pickRepresentation('image/png', OFFERED), null);
on('brauseri päris Accept',
   E.pickRepresentation('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', OFFERED),
   'application/json');
on('Vary on alati kaasas', E.representationHeaders('text/csv').Vary, 'Accept');

// 3. päised antud range() peale — pikkus 15499 baiti (mõõdetud)
const P = 15499;
on('206 kood', E.rangeHeaders(range('bytes=0-49', P)).code, 206);
on('206 Content-Range', E.rangeHeaders(range('bytes=0-49', P)).headers['Content-Range'],
   `bytes 0-49/${P}`);
on('206 Content-Length on 50',
   E.rangeHeaders(range('bytes=0-49', P)).headers['Content-Length'], '50');
on('416 kood', E.rangeHeaders(range('bytes=99999-', P)).code, 416);
on('200 terve peale', E.rangeHeaders(range(null, P)).code, 200);

on('416 Content-Range annab PÄRIS pikkuse',
   E.rangeHeaders(range('bytes=99999-', P)).headers['Content-Range'], `bytes */${P}`);
on('416 vigase Range peal ka',
   E.rangeHeaders(range('bytes=abc', P)).headers['Content-Range'], `bytes */${P}`);

// 4. keha: BAIDID, mitte märgid. 'ab—cd' on 7 baiti (mõttekriips = 3 baiti).
const T = 'ab—cd';
const B = Buffer.byteLength(T);
on('rangeBody lõikab baite: 2-4 on mõttekriips',
   String(E.rangeBody(T, range('bytes=2-4', B))), '—');
on('rangeBody pikkus = Content-Length',
   E.rangeBody(T, range('bytes=-3', B)).length,
   Number(E.rangeHeaders(range('bytes=-3', B)).headers['Content-Length']));
on('rangeBody terve peale annab kõik baidid', E.rangeBody(T, range(undefined, B)).length, B);
on('rangeBody vigase peale on tühi', E.rangeBody(T, range('bytes=99-', B)).length, 0);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

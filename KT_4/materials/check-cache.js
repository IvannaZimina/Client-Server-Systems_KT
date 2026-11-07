// C04 — ETTE ANTUD proovijooks. Seda faili sa EI kirjuta.
//
// Ta on ÜLESANDE TÄPSUSTUS: iga kontroll ütleb ühe lause selle kohta,
// mida sinu funktsioon tegema peab. Jooksuta teda tihti.
//
//   node check-cache.js
//
// Roheline EI TÄHENDA valmis: kontrollid katavad reeglid, mitte sinu
// koodi loetavust ega kommentaare.
import * as V from '../server/cache.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const s = { id: 1, name: 'Sügiskontsert', price: 24 };

// 1. silt on deterministlik ja võtmete järjekorrast sõltumatu
on('sama sisu -> sama silt', V.stateTag(s), V.stateTag({ ...s }));
on('võtmete järjekord ei loe',
   V.stateTag({ a: 1, b: 2 }), V.stateTag({ b: 2, a: 1 }));
on('eri sisu -> eri silt', V.stateTag(s) !== V.stateTag({ ...s, price: 26 }), true);
on('silt on jutumärkides', /^"[0-9a-f]{16}"$/.test(V.stateTag(s)), true);

// 2. nõrk ja tugev
on('tugev: W/ ei klapi', V.tagsEqual('W/"a"', '"a"'), false);
on('nõrk: W/ klapib', V.tagsEqual('W/"a"', '"a"', { weak: true }), true);
on('* klapib alati', V.tagsEqual('*', '"anything"'), true);
on('tühi ei klapi', V.tagsEqual('', '"a"'), false);

// 3. lugemine
const tag = V.stateTag(s);
on('ilma If-None-Match -> 200', V.answerRead({}, s).code, 200);
on('õige silt -> 304', V.answerRead({ 'if-none-match': tag }, s).code, 304);
on('304 keha on null', V.answerRead({ 'if-none-match': tag }, s).body, null);
on('vale silt -> 200', V.answerRead({ 'if-none-match': '"wrong"' }, s).code, 200);
on('mitu silti, üks klapib -> 304',
   V.answerRead({ 'if-none-match': `"x", ${tag}, "y"` }, s).code, 304);

// 3b. kuupäevapõhine tingimus — ja sildi ülimuslikkus
const TIME = '2026-09-10T12:00:00.000Z';
const later = new Date(Date.parse(TIME) + 60000).toUTCString();
const earlier = new Date(Date.parse(TIME) - 60000).toUTCString();
on('Last-Modified on vastuses',
   V.answerRead({}, s, { modified: TIME }).headers['Last-Modified'],
   new Date(TIME).toUTCString());
on('ilma muutmisajata ei ole Last-Modified',
   V.answerRead({}, s).headers['Last-Modified'], undefined);
on('If-Modified-Since hiljem -> 304',
   V.answerRead({ 'if-modified-since': later }, s, { modified: TIME }).code, 304);
on('If-Modified-Since varem -> 200',
   V.answerRead({ 'if-modified-since': earlier }, s, { modified: TIME }).code, 200);
on('silt võidab: klappiv silt JA varem -> 304',
   V.answerRead({ 'if-none-match': tag, 'if-modified-since': earlier }, s,
                     { modified: TIME }).code, 304);
on('silt võidab: vale silt JA hiljem -> 200',
   V.answerRead({ 'if-none-match': '"wrong"', 'if-modified-since': later }, s,
                     { modified: TIME }).code, 200);

// 4. kirjutamine
on('ilma If-Match -> 428', V.answerWrite({}, s, { price: 26 }).code, 428);
on('vale If-Match -> 412',
   V.answerWrite({ 'if-match': '"old"' }, s, { price: 26 }).code, 412);
const v = V.answerWrite({ 'if-match': tag }, s, { price: 26 });
on('õige If-Match -> 200', v.code, 200);
on('muudatus rakendus', v.body.price, 26);
on('silt MUUTUS pärast kirjutamist', v.headers.ETag !== tag, true);
on('nõrk silt kirjutamisel -> 412',
   V.answerWrite({ 'if-match': 'W/' + tag }, s, { price: 26 }).code, 412);

// 5. Cache-Control
// Visatud viga loetakse vastuseks: nii tuleb KATKI, mitte kokkuvõtteta katkestus.
const header = (kind) => {
  try { return V.cacheHeader(kind); } catch (e) { return e.constructor.name; }
};
on('muutumatu', header('immutable'), 'public, max-age=31536000, immutable');
on('lühiajaline on max-age=60', header('short'), 'public, max-age=60');
on('kontrolli on no-cache', header('revalidate'), 'no-cache');
on('saladus on no-store', header('secret'), 'no-store, private');
let thrown = null;
try { V.cacheHeader('bogus'); } catch (e) { thrown = e.constructor.name; }
on('tundmatu laad viskab', thrown, 'RangeError');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

// C08 Ex5 — ETTE ANTUD proovijooks.  node check-cache.js
import { createHash } from 'node:crypto';
import * as V from '../server/cache.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Otsused (millal sulgeda, mida EI TOHI vahemällu) on siin SÕRMEJÄLJENA,
//   mitte kirjas: see fail on sul käes, ja otsus on sinu teha. Vale lahtri
//   korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};
// Kas tekst sisaldab sõna, mille sõrmejälg on antud (suurtähed ei loe).
const mentions = (text, expected) => {
  const s = String(text ?? '').toLowerCase();
  for (let n = 3; n <= 24; n += 1) {
    for (let i = 0; i + n <= s.length; i += 1) {
      if (fingerprint(`reason:${s.slice(i, i + n)}`) === expected) return true;
    }
  }
  return false;
};

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. tagasisurve strateegiad
const makeStream = (strategy, cap = 3) => {
  const out = [];
  return { stream: V.createStream({ strategy, cap, send: (t) => out.push(t) }), out };
};

let { stream, out } = makeStream('last_only');
[1, 2, 3, 4, 5].forEach((x) => stream.add(x));
on('last_only: pending 1', stream.pending(), 1);
stream.clear(10);
on('★ last_only saadab AINULT viimase', out, [5]);
on('vahepealsed loetakse kaotatuks', stream.lost(), 4);

({ stream, out } = makeStream('drop_new', 3));
[1, 2, 3, 4, 5].forEach((x) => stream.add(x));
stream.clear(10);
on('★ drop_new hoiab VANU', out, [1, 2, 3]);
on('kaks uut kadus', stream.lost(), 2);

({ stream, out } = makeStream('drop_old', 3));
[1, 2, 3, 4, 5].forEach((x) => stream.add(x));
stream.clear(10);
on('★ drop_old hoiab UUSI', out, [3, 4, 5]);

({ stream, out } = makeStream('buffer', 3));
[1, 2, 3, 4, 5].forEach((x) => stream.add(x));
on('★ buffer EI VISKA midagi (mälu kasvab)', stream.pending(), 5);
on('puhverdades ei kao midagi', stream.lost(), 0);

// aeglane klient: tühjendame vahekaupa
({ stream, out } = makeStream('drop_old', 10));
[1, 2, 3, 4, 5].forEach((x) => stream.add(x));
on('aeglane klient saab 2', stream.clear(2), 2);
on('pending jääb 3', stream.pending(), 3);

// millal klient maha visata
cellOk('sulgeda?', 'smallBuffer', String(V.shouldClose(1000)), '284d557ae5b4');
cellOk('★ sulgeda?', 'largeBuffer', String(V.shouldClose(2e6)), '62d1e16aea29');

// strateegiate tabel
on('last_only kaotab vahepealsed',
   V.STRATEGIES.last_only.loses, 'vahepealsed seisud');
on('buffer ei sobi tootmisse',
   V.STRATEGIES.buffer.fits.includes('mitte kunagi'), true);

// 2. serveri vahemälu
let at = 0;
const c = V.createCache({ ttl: 100, cap: 3, clock: () => at });
on('tühi -> undefined', c.read('a'), undefined);
c.write('a', { x: 1 }, ['event:3']);
on('loeb tagasi', c.read('a'), { x: 1 });
on('stats: 1 tabamus 1 möödalask', c.stats().hits, 1);
at = 150;
on('★ AEGUNUD kirje -> undefined', c.read('a'), undefined);
on('aegunud kirje kustutati', c.size(), 0);

// LRU: lagi 3
at = 200;
c.write('1', 'a'); c.write('2', 'b'); c.write('3', 'c');
c.read('1');                                  // 1 läheb LÕPPU
c.write('4', 'd');                         // 2 peaks välja langema
on('lagi peab', c.size(), 3);
on('★ LOETUD kirje jääb alles', c.read('1'), 'a');
on('★ lugemata VANIM langes välja', c.read('2'), undefined);

// sildipõhine kehtetuks muutmine
const c2 = V.createCache({ ttl: 1e6, clock: () => 0 });
c2.write('list', [1], ['event:3', 'event:4']);
c2.write('search:x', [1], ['event:3']);
c2.write('report', [1], ['event:9']);
on('★ silt viskab KÕIK seotud', c2.evictTag('event:3'), 2);
on('sidumata jäi alles', c2.read('report'), [1]);
on('seotud kadusid', c2.read('list'), undefined);

// 3. mida EI TOHI vahemällu
cellOk('vahemällu lubatud?', 'secret',
       String(V.mayCache({ secret: true }).allowed), 'bdf747e24eb0');
cellOk('★ vahemällu lubatud?', 'perUser',
       String(V.mayCache({ perUser: true }).allowed), '940d4352e45d');
const perUserReason = V.mayCache({ perUser: true }).reason;
if (mentions(perUserReason, '976d4059a1e7')) ok++;
else broken.push(`kasutajapõhise põhjus: ${JSON.stringify(perUserReason)} `
  + '— ei nimeta, MIKS see vahemällu ei sobi');
on('tihti muutuv: lühike TTL', V.mayCache({ changesOften: true }).ttl, 5e3);
on('stabiilne: pikk TTL', V.mayCache({}).ttl, 300e3);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

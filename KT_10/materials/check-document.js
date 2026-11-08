// C10 Ex1 — ETTE ANTUD proovijooks.  node check-document.js
//
// ★ SEE JOOKS EI VAJA ANDMEBAASI. Modelleerimisotsused on koodis ja neid
//   saab kontrollida ilma serverita — täpselt nagu C09 Ex2 puhta osa.
import { createHash } from 'node:crypto';
import * as D from '../nosql/document.js';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Osa kuju valikuid on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul
//   käes, ja otsus on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
const fingerprint = (s) => createHash('sha256').update(s).digest('hex').slice(0, 12);
const cellOk = (label, key, value, expected) => {
  if (fingerprint(`${key}:${value}`) === expected) ok++;
  else broken.push(`${label} ${key}: ${JSON.stringify(value)} ei pea paika`);
};

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// ── 1. NELI PEREKONDA ───────────────────────────────────────────────────
on('★ „NoSQL“ on NELI eri asja, mitte üks', Object.keys(D.FAMILIES).length, 4);
for (const [name, p] of Object.entries(D.FAMILIES)) {
  on(`${name}: on example, fits JA bad_for`,
     [p.example, p.fits, p.bad_for].every((x) => typeof x === 'string' && x.length > 10), true);
}
on('★ dokumendiandmebaas EI SOBI palju-mitmele seostele',
   D.FAMILIES.document.bad_for.includes('mitmele'), true);
on('★ võti-väärtus ei oska pärida', D.FAMILIES.key_value.bad_for.includes('päring'), true);

// ── 2. SAMA ANDMED, KAKS KUJU ───────────────────────────────────────────
const event = { id: 's1', name: 'Sügiskontsert', startsAt: '2026-10-04T19:00:00Z',
                  price: 24, venueId: 't1', venueName: 'Vanemuine', venueCity: 'Tartu' };
const seats = Array.from({ length: 12 }, (_, i) => ({
  id: `k${i}`, row: Math.floor(i / 4) + 1, number: (i % 4) + 1, sold: i < 3 }));

const norm = D.normalized(event, seats);
const denorm = D.denormalized(event, seats);

on('normalized hoiab KAKS kollektsiooni', Object.keys(norm).sort(), ['events', 'seats']);
on('★ denormalized hoiab ÜHE', Object.keys(denorm), ['events']);
on('seatCount ei kadunud kummaltki',
   [norm.seats.length, denorm.events[0].seats.length], [12, 12]);
on('★ denormalized kannab toimumiskoha KOOPIAT, mitte viidet',
   denorm.events[0].venue, { name: 'Vanemuine', city: 'Tartu' });
on('   normalized kannab VIIDET',
   [norm.events[0].venueId, norm.events[0].venue], ['t1', undefined]);

// ★ SEE ONGI KOGU VAHE: mitu LUGEMIST läheb ühe sündmuselehe jaoks.
const fieldCount = (shape) => Object.keys(shape).length;
console.log(`   sündmuseleht: normalized ${fieldCount(norm)} kollektsiooni, ` +
            `denormalized ${fieldCount(denorm)}`);
on('★★ denormalized leht tuleb ÜHE kollektsiooni pealt', fieldCount(denorm), 1);

// ── 3. DUBLEERIMINE ON ARVE ─────────────────────────────────────────────
const hall = D.duplicationCost({ copies: 2000, changesPerDay: 1,
                                 readsPerDay: 50000 });
const free = D.duplicationCost({ copies: 1, changesPerDay: 5000,
                                 readsPerDay: 3000 });
console.log(`   saali nimi: ${hall.writes} kirjutust vs ${hall.savedReads} lugemist`);
on('★ saali nimi: muutub harva, loetakse tihti -> koopia tasub', hall.worth, true);
on('★ vabade kohtade arv: muutub tihedamini kui loetakse -> viide', free.worth, false);
on('põhjendus tuleb kaasa, mitte ainult tõeväärtus', typeof hall.reason, 'string');

// ── 4. DOKUMENDIL ON LAGI ───────────────────────────────────────────────
on('lagi on 16 MB', D.DOC_LIMIT, 16 * 1024 * 1024);
on('väike dokument mahub', D.checkSize(denorm.events[0]).fits, true);

// ★ MITU KOMMENTAARI MAHUB ÜHTE SÜNDMUSSE? Mõõdame, mitte arvame.
const comment = { user: 'user@piletikassa.ee', createdAt: '2026-10-04T20:11:00Z',
                     text: 'Väga hea kontsert, aga saal oli külm.' };
const oneSize = D.checkSize(comment).bytes;
const fits = Math.floor(D.DOC_LIMIT / oneSize);
console.log(`   üks kommentaar ${oneSize} B  ->  ~${fits} tükki mahub ühte dokumenti`);
on('★ kommentaare mahub PALJU, aga ARV ON OLEMAS', fits > 1000 && fits < 500000, true);

const big = { _id: 'x', comments: Array.from({ length: fits + 1000 }, () => comment) };
on('★★ ja kui ta täis saab, siis ta EI MAHU', D.checkSize(big).fits, false);

on('★ kasvav massiiv ilma piirajata -> oma kollektsioon',
   D.growingArray({ name: 'comments', growsPerDay: 50, bounded: false }).advice,
   'own collection');
on('piiratud massiiv võib pesastuda',
   D.growingArray({ name: 'seats', growsPerDay: 0, bounded: true }).advice,
   'can nest');

// ── 5. VALIK ────────────────────────────────────────────────────────────
on('★ kohad: loetakse koos, arv on fikseeritud -> pesastatud',
   D.pickShape({ readTogether: true, childrenAvg: 12, childrenGrow: false }), 'nested');
on('★ comments: kasvavad -> viide',
   D.pickShape({ readTogether: true, childrenAvg: 12, childrenGrow: true }), 'reference');
cellOk('★ kuju', 'queriedAlone',
       D.pickShape({ readTogether: true, childrenAvg: 5, childrenGrow: false,
                     childrenQueriedAlone: true }), '622a95a8edbf');
cellOk('kuju', 'manyChildren',
       D.pickShape({ readTogether: true, childrenAvg: 500, childrenGrow: false }),
       'de99f5fb5ce3');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

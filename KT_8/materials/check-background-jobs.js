// C08 Ex4 — ETTE ANTUD proovijooks.  node check-background-jobs.js
import * as T from '../server/background-jobs.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. idempotentsusvõti
let at = 1000;
const idem = T.createIdempotency({ ttl: 5000, clock: () => at });
on('esimene kord: uus', idem.start('v1', 'hash-a').kind, 'next');
on('★ sama võti, sama keha, pooleli -> running', idem.start('v1', 'hash-a').kind, 'running');
idem.finish('v1', { id: 7001 });
const repeat = idem.start('v1', 'hash-a');
on('★ kordus annab SAMA vastuse', repeat.kind, 'repeat');
on('response on salvestatud', repeat.response.id, 7001);
on('★ sama võti, ERI keha -> KONFLIKT', idem.start('v1', 'hash-b').kind, 'conflict');
on('teine võti on uus', idem.start('v2', 'hash-c').kind, 'next');
idem.abort('v2');
on('katkestatud võti vabaneb', idem.start('v2', 'hash-c').kind, 'next');
at += 10000;
on('★ vana kirje AEGUB', idem.start('v1', 'hash-a').kind, 'next');

// 2. järjekord
let clock = 0;
const j = T.createQueue({ maxAttempts: 3, clock: () => clock });
j.add('email', { target: 'a@b.ee' });
j.add('pdf', { order: 1 });
on('pending 2', j.pending(), 2);
const handlers = { email: async () => 'sent', pdf: async () => 'done' };
let r = await j.process(handlers);
on('esimene töötles', r.ok, true);
on('result tuleb tagasi', r.result, 'sent');
await j.process(handlers);
on('pending 0', j.pending(), 0);
on('done 2', j.done(), 2);

// korduvusvõti: sama tööd EI LISATA teist korda
const j2 = T.createQueue({ clock: () => clock });
on('esimene lisatakse', j2.add('email', {}, { idempotencyKey: 'order:1' }) !== null, true);
on('★ sama korduvusvõtmega EI lisata', j2.add('email', {}, { idempotencyKey: 'order:1' }), null);
on('pending ikka 1', j2.pending(), 1);

// korduskatsed ja surnukirjad
const j3 = T.createQueue({ maxAttempts: 3, clock: () => clock });
j3.add('failing', {});
const failingHandlers = { failing: async () => { throw new Error('SMTP maas'); } };
let last;
for (let i = 0; i < 3; i += 1) last = await j3.process(failingHandlers);
on('kolmas katse EI korda enam', last.retried, false);
on('★ töö läheb SURNUKIRJADESSE, mitte kaob', j3.dead().length, 1);
on('surnud töö kannab viga', j3.dead()[0].err, 'SMTP maas');
on('surnud töö kannab katsete arvu', j3.dead()[0].attempts, 3);
on('järjekord on tühi', j3.pending(), 0);

// 3. e-kiri
const job = T.mailJob({ id: 7001, email: 'mari@example.ee' }, { name: 'Sügiskontsert' });
on('kirja kind', job.kind, 'email');
on('target', job.data.target, 'mari@example.ee');
on('topic sisaldab sündmust', job.data.topic.includes('Sügiskontsert'), true);
on('★ korduvusvõti seob OSTUGA', job.data.idempotencyKey, 'email:order:7001');

// 4. ajaakna võti (cron-i idempotentsus)
const T0 = 1_700_000_000_000;
on('★ sama tunni sees SAMA võti',
   T.windowKey('expired', T0, 3600e3), T.windowKey('expired', T0 + 1800e3, 3600e3));
on('järgmises tunnis ERI võti',
   T.windowKey('expired', T0, 3600e3) !== T.windowKey('expired', T0 + 3700e3, 3600e3), true);

// 5. aegunud hoiud
const holds = [
  { id: 1, state: 'pending', expiresAt: 100 },
  { id: 2, state: 'pending', expiresAt: 500 },
  { id: 3, state: 'purchased', expiresAt: 100 },
  { id: 4, state: 'expired', expiresAt: 50 },
];
const released = T.releaseExpiredHolds(holds, 200);
on('aegunud pending hoid vabaneb', released, [1]);
on('★ OSTETUD hoid EI vabane, kuigi aeg möödas', holds[2].state, 'purchased');
on('tulevikus hoid jääb', holds[1].state, 'pending');
on('★ teine jooks EI tee midagi (idempotentne)', T.releaseExpiredHolds(holds, 200), []);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

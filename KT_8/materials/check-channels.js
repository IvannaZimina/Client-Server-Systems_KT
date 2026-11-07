// C08 Ex2 — ETTE ANTUD proovijooks.  node check-channels.js
import * as K from '../server/channels.js';
import { createFakeConnection } from './fake-connection.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. kanalid
const hub = K.createHub();
const a = createFakeConnection('a'), b = createFakeConnection('b'), c = createFakeConnection('c');
hub.join(a, 'event:1'); hub.join(b, 'event:1'); hub.join(c, 'event:2');
on('kanaleid 2', hub.channelCount(), 2);
on('event:1 members 2', hub.members('event:1'), 2);
on('★ teade läheb AINULT kanalisse', hub.send('event:1', { free: 5 }), 2);
on('c EI saanud', c.sent.length, 0);
on('a sai', JSON.parse(a.sent[0]).free, 5);
on('tundmatu kanal -> 0', hub.send('event:99', {}), 0);

hub.leave(a, 'event:1');
on('lahkumise järel 1 liige', hub.members('event:1'), 1);
hub.leave(b, 'event:1');
on('★ TÜHI kanal KUSTUTATAKSE (mäluleke)', hub.channelCount(), 1);

// mitmes kanalis korraga + leaveAll
const d = createFakeConnection('d');
hub.join(d, 'x'); hub.join(d, 'y'); hub.join(d, 'z');
on('d on kolmes kanalis', hub.channelsOf(d).sort(), ['x', 'y', 'z']);
hub.leaveAll(d);
on('leaveAll puhastas', hub.channelsOf(d), []);
on('kõik d kanalid kustusid', hub.channelCount(), 1);

// suletud ühendusele EI saadeta
const e = createFakeConnection('e');
hub.join(e, 'k'); e.close(1000);
on('suletule ei saadeta', hub.send('k', {}), 0);

// 2. autentimine
const verify = (m) => (m === 'hea' ? { id: 7 } : null);
on('cookie läbib', K.authConnection({ cookie: 'hea' }, verify).via, 'cookie');
on('vigane cookie -> 4401', K.authConnection({ cookie: 'paha' }, verify).code, 4401);
on('esimene sõnum läbib',
   K.authConnection({ firstMessage: { kind: 'auth', token: 'hea' } }, verify).via, 'message');
on('ilma millegita -> autentimata', K.authConnection({}, verify).ok, false);

// 3. sulgemiskoodid: mis tasub korrata
on('unauthenticated -> ÄRA proovi', K.shouldReconnect(K.CLOSE_CODES.unauthenticated), false);
on('forbidden -> ÄRA proovi', K.shouldReconnect(K.CLOSE_CODES.forbidden), false);
on('healthy -> ÄRA proovi', K.shouldReconnect(K.CLOSE_CODES.healthy), false);
on('★ overload -> PROOVI', K.shouldReconnect(K.CLOSE_CODES.overload), true);
on('server shuttingDown -> PROOVI', K.shouldReconnect(K.CLOSE_CODES.shuttingDown), true);
on('1006 (ühendus kadus) -> PROOVI', K.shouldReconnect(1006), true);

// 4. taasühendus
const t = K.createReconnector({ base: 500, factor: 2, cap: 30000, jitter: 0 });
on('1. katse', t.nextDelay(), 500);
on('2. katse', t.nextDelay(), 1000);
on('3. katse', t.nextDelay(), 2000);
on('katseid loetakse', t.attempts(), 3);
t.succeeded();
on('★ õnnestumine NULLIB', t.attempts(), 0);
on('pärast nullimist algusest', t.nextDelay(), 500);
const load = K.createReconnector({ base: 500, cap: 3000, jitter: 0 });
for (let i = 0; i < 10; i += 1) load.nextDelay();
on('lagi kehtib', load.nextDelay(), 3000);
const j = K.createReconnector({ base: 1000, jitter: 0.3 });
const v = j.nextDelay();
on('jitter jääb vahemikku', v >= 700 && v <= 1300, true);

// 5. elusoleku kontroll
const heartbeat = K.createHeartbeat();
const p = createFakeConnection('p'), q = createFakeConnection('q');
heartbeat.add(p); heartbeat.add(q);
on('esimene ring: keegi ei sure', heartbeat.round(), []);
on('★ ping saadeti mõlemale', [p.pings.length, q.pings.length], [1, 1]);
heartbeat.pong(p);                       // ainult p vastas
on('★ vastamata jätnud SUREB', heartbeat.round().map((x) => x.name), ['q']);
on('p jäi ellu', heartbeat.round().map((x) => x.name), ['p']);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

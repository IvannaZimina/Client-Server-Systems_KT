// C08 Ex6 — ETTE ANTUD proovijooks.  node check-scaling.js
import * as S from '../server/scaling.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. mälus olek
on('kuus tuntud probleemi', Object.keys(S.IN_MEMORY_STATE).length, 6);
on('session: symptom on juhuslik väljalogimine',
   S.IN_MEMORY_STATE.session.symptom, 'juhuslik väljalogimine');
on('★ cron mälus -> kaks kirja',
   S.IN_MEMORY_STATE.scheduled_job.symptom.includes('kaks kirja'), true);
on('fail kettal -> 404 iga teine kord',
   S.IN_MEMORY_STATE.uploaded_file.symptom.includes('404'), true);

const app = { session: 'in-memory', cache: 'redis', websocket: 'in-memory',
                   counter: 'database', scheduled_job: 'in-memory',
                   uploaded_file: 'object_store' };
const p = S.findProblems(app);
on('leiab kolm probleemi', p.map((x) => x.name).sort(), ['scheduled_job', 'session', 'websocket']);
on('iga probleem kannab lahendust', p.every((x) => x.fix.length > 0), true);
on('puhas rakendus -> tühi', S.findProblems({ session: 'redis' }), []);

// 2. hoidlad
on('objektihoidla: kõik eksemplarid näevad SAMA faili',
   S.STORES.object_store.pros.includes('SAMA faili'), true);
on('★ objektihoidla ei sobi väikesele muutuvale olekule',
   S.STORES.object_store.cons.includes('terve objekt'), true);
on('redis: TTL sisse ehitatud', S.STORES.redis.pros.includes('TTL'), true);
on('andmebaas koormab iga päringuga',
   S.STORES.database.cons.includes('iga päringuga'), true);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

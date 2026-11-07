// C06 Ex5 — ETTE ANTUD proovijooks.  node check-streams.js
//
// ★ MÄLU MÕÕDETAKSE ERALDI PROTSESSIS. Sama protsessi sees jääb eelmise
//   katse mälu prügikorjajat ootama ja arvud segunevad.
import { makeBigCsv } from './make-big-file.js';
import * as V from '../server/streams.js';
import { Writable } from 'node:stream';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 120000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

const BIG = await makeBigCsv(120);
const sizeMb = fs.statSync(BIG).size / 1024 / 1024;

// --- väike fail loogika kontrolliks ---
const small = path.join(os.tmpdir(), 'c06-small.csv');
fs.writeFileSync(small, 'date,event,tickets\n2026-10-04,1,2\n2026-10-05,2,3\n2026-10-06,1,1');
on('streamRows loeb read', await V.streamRows(small), 4);
on('allInMemory loeb sama', await V.allInMemory(small), 4);
const kv = await V.summary(small);
on('summary: kolm rida (päis välja)', kv.rows, 3);
on('summary: tickets liidetud', kv.tickets, 6);
// ★ VIIMANE RIDA ilma reavahetuseta EI TOHI kaduda
on('viimane rida ilma \n loeti', kv.rows, 3);

// --- tükipiiri lõks: rida katkeb TÄPSELT tüki peal ---
const toChunks = (text, n) => {
  const r = [];
  for (let i = 0; i < text.length; i += n) r.push(Buffer.from(text.slice(i, i + n)));
  return r;
};
const collected = [];
const collector = new Writable({ objectMode: true, write(x, _k, c) { collected.push(x); c(); } });
const t = V.csvToRows();
t.pipe(collector);
for (const j of toChunks('date,event,tickets\n2026-10-04,1,2\n2026-10-05,2,3\n', 7)) t.write(j);
t.end();
await new Promise((r) => collector.once('finish', r));
on('tükipiiril katkenud read on terved', collected,
   [['2026-10-04','1','2'], ['2026-10-05','2','3']]);

// --- tagasisurve ---
let written = 0;
const slow = new Writable({ highWaterMark: 1024,
  write(t2, _k, c) { written += t2.length; setTimeout(c, 1); } });
const result = await V.writeWithBackpressure(slow,
    Array.from({ length: 200 }, () => Buffer.alloc(256, 65)));
on('kõik tükid kirjutati', result.chunks, 200);
on('★ tagasisurve PEATAS kirjutamise', result.pauses > 0, true);
on('baidid jõudsid kohale', written, 200 * 256);

// --- MÄLU: eraldi protsessides ---
const measure = (method) => {
  const script = `
    // Windowsis peab import saama file:// URL-i, mitte D:\... teed.
    import * as V from ${JSON.stringify(new URL('../server/streams.js', import.meta.url).href)};
    const before = process.memoryUsage().rss;
    const n = await V.${method}(${JSON.stringify(BIG)});
    const peak = process.memoryUsage().rss;
    console.log(JSON.stringify({ rows: n, mb: Math.round((peak - before) / 1048576) }));
  `;
  const f = path.join(os.tmpdir(), `c06-measure-${method}.mjs`);
  fs.writeFileSync(f, script);
  // ★★ SÜNKROONNE LAPS VAJAB OMA AJALÕPPU. Valvur on `setTimeout`, aga
  //    `execFileSync` blokeerib sündmustsükli — valvuri taimer EI SAA
  //    tema ajal tulistada. Piir tuleb anda lapsele endale.
  const v = JSON.parse(execFileSync(process.execPath, [f],
                                    { encoding: 'utf8', timeout: WATCHDOG_MS / 2 }));
  fs.unlinkSync(f);
  return v;
};

const inMemory = measure('allInMemory');
const stream = measure('streamRows');
on('mõlemad loevad SAMA arvu ridu', inMemory.rows, stream.rows);
on('★ voog kasutab OLULISELT vähem mälu', stream.mb < inMemory.mb / 4, true);

console.log(`\n   [MÕÕDETUD] fail ${sizeMb.toFixed(0)} MB, `
            + `${inMemory.rows.toLocaleString('et')} rida`);
console.log(`   allInMemory : ${String(inMemory.mb).padStart(4)} MB`);
const ratio = (inMemory.mb / Math.max(stream.mb, 1)).toFixed(1);
console.log(`   streamRows  : ${String(stream.mb).padStart(4)} MB   (${ratio}x vähem)\n`);

fs.unlinkSync(small);
console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

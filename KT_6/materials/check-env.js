// C06 Ex1 — ETTE ANTUD proovijooks.  node check-env.js
import * as K from '../server/env.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

const WATCHDOG_MS = Number(process.env.WATCHDOG_MS ?? 60000);
setTimeout(() => {
  console.log(`   !! JOOKS RIPUB üle ${WATCHDOG_MS / 1000} s.`);
  process.exit(1);
}, WATCHDOG_MS);

// 1. keskkonna vahed
const v = K.envVars();
on('Node-is EI OLE document', v.browserOnly.document, false);
on('Node-is EI OLE window', v.browserOnly.window, false);
on('Node-is EI OLE localStorage', v.browserOnly.localStorage, false);
on('Node-is ON process', v.nodeOnly.process, true);
on('Node-is ON Buffer', v.nodeOnly.Buffer, true);
on('ESM-is EI OLE __dirname', v.nodeOnly.__dirname_in_module, false);
on('fetch on MÕLEMAS', v.inBoth.fetch, true);
on('URL on mõlemas', v.inBoth.URL, true);

// 2. ESM-i asendus __dirname-ile
on('HERE on absoluutne tee', path.isAbsolute(K.HERE), true);
on('HERE osutab server-kausta', path.basename(K.HERE), 'server');

// 3. semantiline versioon
on('^5.1.0 lubab 5.2.0', K.versionRange('^5.1.0', '5.2.0'), true);
on('^5.1.0 lubab 5.1.9', K.versionRange('^5.1.0', '5.1.9'), true);
on('^5.1.0 EI luba 6.0.0', K.versionRange('^5.1.0', '6.0.0'), false);
on('^5.1.0 EI luba 5.0.9', K.versionRange('^5.1.0', '5.0.9'), false);
on('~5.1.0 lubab 5.1.9', K.versionRange('~5.1.0', '5.1.9'), true);
on('~5.1.0 EI luba 5.2.0', K.versionRange('~5.1.0', '5.2.0'), false);
on('5.1.0 on täpne', K.versionRange('5.1.0', '5.1.1'), false);
on('^0.3.1 EI luba 0.4.0 (0.x puhul murrab minoor)', K.versionRange('^0.3.1', '0.4.0'), false);
on('^0.0.4 EI luba 0.0.5', K.versionRange('^0.0.4', '0.0.5'), false);
let thrown = null;
try { K.versionRange('jama', '1.0.0'); } catch (e) { thrown = e.constructor.name; }
on('tundmatu nõue viskab', thrown, 'RangeError');

// 4. failisüsteem
// fileURLToPath, MITTE .pathname: tee sisaldab tühikuid (OneDrive) ja
// pathname jätaks nad %20 kujule.
const DATA = fileURLToPath(new URL('./events.json', import.meta.url));
const rows = await K.readEvents(DATA);
on('luges neli sündmust', rows.length, 4);
on('esimese nimi', rows[0].name, 'Sügiskontsert');

const target = path.join(os.tmpdir(), 'c06-report-' + Date.now() + '.csv');
const reportLength = await K.writeReport(target, rows);
const written = await fs.readFile(target, 'utf8');
on('kirjutas CSV', written.split('\n').length, 5);
on('pikkus klapib', reportLength, written.length);
on('paisrida', written.split('\n')[0], 'id,name,sold,seats');
// ★ ATOMAARSUS: ajutist faili EI TOHI järele jääda
let tempExists = true;
try { await fs.access(target + '.tmp'); } catch { tempExists = false; }
on('ajutine fail on kustunud', tempExists, false);
await fs.unlink(target);

// 5. protsess
const p = K.processInfo();
on('node versioon algab v-ga', p.node.startsWith('v'), true);
on('cores on vähemalt 1', p.cores >= 1, true);
on('mälu on mõõdetud', p.mem_mb > 0, true);

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

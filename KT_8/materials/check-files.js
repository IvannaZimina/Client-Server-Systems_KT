// C08 Ex3 — ETTE ANTUD proovijooks.  node check-files.js
import { createHash } from 'node:crypto';
import * as F from '../server/files.js';
let ok = 0; const broken = [];
const on = (t, a, b) => { (JSON.stringify(a) === JSON.stringify(b)) ? ok++
  : broken.push(`${t}: sain ${JSON.stringify(a)}, ootasin ${JSON.stringify(b)}`); };

// ★ Hoidla valik on siin SÕRMEJÄLJENA, mitte kirjas: see fail on sul käes, ja
//   valik on sinu teha. Vale lahtri korral ütleb kontroll, MIS juhtum.
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

const B = (...b) => Buffer.from(b);
const JPEG = Buffer.concat([B(0xff, 0xd8, 0xff), Buffer.alloc(50)]);
const PNG = Buffer.concat([B(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), Buffer.alloc(50)]);
const PDF = Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(50)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), B(0,0,0,0),
                            Buffer.from('WEBP'), Buffer.alloc(50)]);
const JUNK = Buffer.from('see ei ole pilt');

// 1. tüüp tuvastatakse SISUST
on('JPEG', F.detectType(JPEG), 'image/jpeg');
on('PNG', F.detectType(PNG), 'image/png');
on('PDF', F.detectType(PDF), 'application/pdf');
on('WEBP (RIFF....WEBP)', F.detectType(WEBP), 'image/webp');
on('praht -> null', F.detectType(JUNK), null);
// ★ RIFF ilma WEBP-ita EI OLE webp (nt .wav)
on('RIFF ilma WEBP-ita -> null',
   F.detectType(Buffer.concat([Buffer.from('RIFF'), B(0,0,0,0), Buffer.from('WAVE')])), null);

// 2. kolm kontrolli peavad KLAPPIMA
on('kõik klapib', F.checkFile({ claimedType: 'image/png', content: PNG }).ok, true);
on('★ väidetav ei klapi sisuga',
   F.checkFile({ claimedType: 'image/png', content: PDF }).errors[0].includes('ei klapi'), true);
on('tundmatu sisu', F.checkFile({ content: JUNK }).errors[0].includes('tundmatu'), true);
on('tühi fail', F.checkFile({ content: Buffer.alloc(0) }).errors.includes('fail on tühi'), true);
on('liiga suur', F.checkFile({ content: PNG, maxBytes: 10 }).ok, false);
on('tegelik tüüp tagastatakse', F.checkFile({ content: JPEG }).actual, 'image/jpeg');
on('★ laiend ei klapi sisuga',
   F.checkFile({ claimedType: 'image/png', fileName: 'x.jpg', content: PNG }).ok, false);
on('.jpeg on sama mis .jpg',
   F.checkFile({ claimedType: 'image/jpeg', fileName: 'foto.JPEG', content: JPEG }).ok, true);

// 3. failinimi
const n1 = F.safeName('../../etc/passwd', { type: 'image/png' });
on('★ teekäik ei jõua salvestusnimme', n1.storedName.includes('..'), false);
on('★ teekäik ei jõua kuvanimme', n1.displayName.includes('/'), false);
on('salvestusnimi on UUID + laiend', /^[0-9a-f-]{36}\.png$/.test(n1.storedName), true);
const n2 = F.safeName('pilt.jpg.php', { type: 'image/jpeg' });
on('★ topeltlaiend kaob', n2.storedName.endsWith('.jpg'), true);
on('kuvanimi säilib info', n2.displayName, 'pilt.jpg.php');
on('jutumärk kuvanimes asendatakse',
   F.safeName('a"b.png', { type: 'image/png' }).displayName.includes('"'), false);
on('tühi nimi saab vaikeväärtuse', F.safeName('', {}).displayName, 'file');
on('kaks kutset annavad ERI nime',
   F.safeName('x.png', { type: 'image/png' }).storedName
   !== F.safeName('x.png', { type: 'image/png' }).storedName, true);

// 4. ligipääs — KES tohib, ütleb antud mayRead() (file-access.js)
on('avalik fail: allow', F.accessDecision({ file: { isPublic: true }, user: null }).allow, true);
on('avalik: pikk cache',
   F.accessDecision({ file: { isPublic: true } }).cache.includes('immutable'), true);
on('kaitstud + anonüümne -> 401',
   F.accessDecision({ file: { isPublic: false, owner: 1 }, user: null }).code, 401);
on('★ mayRead ütleb ei -> 403',
   F.accessDecision({ file: { isPublic: false, owner: 1 },
                    user: { id: 2, role: 'buyer' } }).code, 403);
on('mayRead ütleb jah (omanik) -> luba',
   F.accessDecision({ file: { isPublic: false, owner: 1 }, user: { id: 1 } }).allow, true);
on('mayRead ütleb jah (korraldaja) -> luba',
   F.accessDecision({ file: { isPublic: false, owner: 1 },
                    user: { id: 2, role: 'organizer' } }).allow, true);
on('★ kaitstud fail: no-store',
   F.accessDecision({ file: { isPublic: false, owner: 1 },
                    user: { id: 1 } }).cache, 'private, no-store');

// 5. hoidla valik
cellOk('hoidla', 'oneInstanceSmall',
       F.suggestStore({ instances: 1, fileSizeMb: 2 }), '7bbc004ad2f7');
cellOk('★ hoidla', 'manyInstances',
       F.suggestStore({ instances: 3, fileSizeMb: 2 }), '8e39ab3b1918');
cellOk('hoidla', 'bigFile',
       F.suggestStore({ instances: 1, fileSizeMb: 50 }), '8353be1221e7');
cellOk('hoidla', 'transactionTiny',
       F.suggestStore({ instances: 1, fileSizeMb: 0.1, needsTransaction: true }), '2c0a702c5699');
on('★ ainult object_store ei koorma serverit allalaadimisel',
   F.STORES.object_store.download, 'otse hoidlast');

console.log(`${ok} kontrolli OK` + (broken.length ? `, ${broken.length} KATKI` : ''));
broken.forEach((x) => console.log('   !! ' + x));
process.exit(broken.length ? 1 : 0);

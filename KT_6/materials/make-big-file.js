// C06 Ex5 — ETTE ANTUD failigeneraator. Seda faili sa EI kirjuta.
//
//   node make-big-file.js [MB]      vaikimisi 120 MB
//
// Fail tehakse tmp-kausta, MITTE projekti — 120 MB ei kuulu OneDrive'i
// ega gitti. Ta jääb sinna alles ja järgmine käivitus kasutab teda uuesti.

import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export async function makeBigCsv(mb = 120) {
  const file = path.join(os.tmpdir(), `piletikassa-log-${mb}mb.csv`);
  if (fs.existsSync(file) && fs.statSync(file).size >= mb * 1024 * 1024 * 0.95) return file;

  const stream = fs.createWriteStream(file);
  stream.write('date,event,tickets\n');
  const target = mb * 1024 * 1024;
  let written = 0;
  let i = 0;
  // Tagasisurvega: generaator ise EI TOHI mälu täis kirjutada.
  while (written < target) {
    const row = `2026-10-04T19:${String(i % 60).padStart(2, '0')},${(i % 4) + 1},${(i % 5) + 1}\n`;
    written += row.length;
    i += 1;
    if (!stream.write(row)) {
      // ★★★ SIIN ON TAGASISURVE, ja ilma temata oleks see tsükkel vale:
      //   `write` tagastab false, kui puhver on täis. Kui me siis edasi
      //   kirjutame, kasvab puhver MÄLUS 120 MB-ni — täpselt see, mida
      //   voog vältima peaks. Seepärast ootame, kuni voog on tühjenenud.
      await once(stream, 'drain');
    }
  }
  stream.end();
  return new Promise((r) => stream.once('finish', () => r(file)));
}

const invokedPath = process.argv[1]?.replaceAll('\\', '/');
if (invokedPath && decodeURIComponent(import.meta.url).endsWith(invokedPath)) {
  const mb = Number(process.argv[2] ?? 120);
  const file = await makeBigCsv(mb);
  console.log('done:', file, (fs.statSync(file).size / 1024 / 1024).toFixed(1), 'MB');
}

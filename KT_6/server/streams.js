// C06 Ex5 — Vood ja tagasisurve

import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';

// 1. Kogu faili lugemine mällu (fs.readFile).
export async function allInMemory(file) {
  const content = await fs.readFile(file, 'utf8');
  return content.split('\n').filter((line) => line.length > 0).length;
}

// 2. Faili lugemine voona rida-realt (readline + createReadStream).
export async function streamRows(file) {
  const lines = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity
  });

  let count = 0;

  for await (const line of lines) {
    if (line.length > 0) {
      count += 1;
    }
  }

  return count;
}

// 6. CSV teisendamine ridadeks Transform-vooga.
export function csvToRows() {
  let remainder = '';
  let isHeader = true;

  return new Transform({
    readableObjectMode: true,

    transform(chunk, encoding, callback) {
      const text = remainder + chunk.toString();
      const lines = text.split('\n');

      remainder = lines.pop();

      for (const line of lines) {
        const cleanLine = line.replace(/\r$/, '');

        if (cleanLine.length === 0) continue;

        if (isHeader) {
          isHeader = false;
          continue;
        }

        this.push(cleanLine.split(','));
      }

      callback();
    },

    // 7. Viimase rea töötlemine ilma reavahetuseta.
    flush(callback) {
      const cleanLine = remainder.replace(/\r$/, '');

      if (cleanLine.length > 0 && !isHeader) {
        this.push(cleanLine.split(','));
      }

      callback();
    }
  });
}

// 6. Faili kokkuvõtte arvutamine CSV voo põhjal.
export async function summary(file) {
  let count = 0;
  let tickets = 0;

  const collectRows = new Writable({
    objectMode: true,
    write(row, encoding, callback) {
      count += 1;
      tickets += Number(row[2]);
      callback();
    }
  });

  await pipeline(
    createReadStream(file),
    csvToRows(),
    collectRows
  );

  return { rows: count, tickets };
}

// 8. Faili saatmine vastusevoona.
export async function sendAsStream(res, file) {
  await pipeline(
    createReadStream(file),
    res
  );
}

// 9. Tagasisurve käsitlemine kirjutamisel.
export async function writeWithBackpressure(writable, chunks) {
  let pauses = 0;
  let count = 0;

  for (const chunk of chunks) {
    const canContinue = writable.write(chunk);
    count += 1;

    if (!canContinue) {
      pauses += 1;
      await once(writable, 'drain');
    }
  }

  return {
    chunks: count,
    pauses
  };
}

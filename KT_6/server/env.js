// C06 Ex1 — Node ja brauser kõrvuti

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { versionRange } from '../materials/npm-semver.js';

export const HERE = path.dirname(fileURLToPath(import.meta.url));

// 1. Keskkonna globaalide kontroll
export function envVars() {
  return {
    browserOnly: {
      document: typeof globalThis.document !== 'undefined',
      window: typeof globalThis.window !== 'undefined',
      localStorage: typeof globalThis.localStorage !== 'undefined'
    },

    nodeOnly: {
      process: typeof globalThis.process !== 'undefined',
      Buffer: typeof globalThis.Buffer !== 'undefined',
      __dirname_in_module: typeof __dirname !== 'undefined'
    },

    inBoth: {
      fetch: typeof globalThis.fetch === 'function',
      URL: typeof globalThis.URL !== 'undefined',
      JSON: typeof globalThis.JSON !== 'undefined'
    }
  };
}

// 2. Sündmuste lugemine JSON-failist
export async function readEvents(file) {
  const content = await fs.readFile(file, 'utf8');
  return JSON.parse(content);
}

// 3. CSV-välja vormindamine
function csvCell(value) {
  const text = String(value ?? '');

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

// 4. Raporti kirjutamine ATOMAARSELT
export async function writeReport(target, rows) {
  const header = 'id,name,sold,seats';

  const lines = rows.map((event) =>
    [
      event.id,
      event.name,
      event.sold,
      event.seats
    ].map(csvCell).join(',')
  );

  const content = [header, ...lines].join('\n');
  const tempFile = target + '.tmp';

  try {
    await fs.writeFile(tempFile, content, 'utf8');

    await fs.rename(tempFile, target);
  } catch (error) {
    await fs.unlink(tempFile).catch(() => {});
    throw error;
  }

  return content.length;
}

// 5. Node.js protsessi informatsioon
export function processInfo() {
  return {
    node: process.version,
    cores: os.cpus().length,
    mem_mb: Math.round(process.memoryUsage().rss / 1024 / 1024)
  };
}

// 6. Semver-versioonide kontroll
export { versionRange };

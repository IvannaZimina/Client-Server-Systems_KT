
import { randomUUID } from 'node:crypto';
import { mayRead } from './file-access.js';

// 1. Genereeri salvestamiseks uus failinimi UUID abil.
// 2. Säilita algne failinimi eraldi väljana displayName.
export function safeName(originalName, { type } = {}) {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
  };

  const extension = extensions[type] ?? '';
  const displayName = String(originalName || 'file')
    .replace(/[\/\\]/g, '')
    .replace(/["\r\n]/g, '_');

  return {
    storedName: `${randomUUID()}${extension}`,
    displayName,
  };
}

// 3. Tuvasta faili tüüp esimeste baitide põhjal.
export function detectType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return 'image/png';
  }

  if (buffer.subarray(0, 5).toString() === '%PDF-') {
    return 'application/pdf';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === 'RIFF' &&
    buffer.subarray(8, 12).toString() === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

// 4. Kontrolli, et väidetav tüüp, laiend ja sisu klapivad.
// 5. RIFF üksi ei tähenda WEBP-d: kontrolli ka WEBP tunnust.
export function checkFile({
  claimedType,
  fileName,
  content,
  maxBytes = 10 * 1024 * 1024,
}) {
  const errors = [];

  if (!Buffer.isBuffer(content) || content.length === 0) {
    errors.push('fail on tühi');
    return { ok: false, errors };
  }

  if (content.length > maxBytes) {
    errors.push('fail on liiga suur');
  }

  const actual = detectType(content);

  if (!actual) {
    errors.push('tundmatu failitüüp');
  }

  if (claimedType && actual && claimedType !== actual) {
    errors.push('väidetud tüüp ei klapi sisuga');
  }

  const extensions = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
  };

  if (fileName && actual) {
    const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();

    if (!extensions[actual]?.includes(extension)) {
      errors.push('laiend ei klapi sisuga');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    actual,
  };
}

// 6. Kontrolli, kas kasutajal on õigus faili lugeda.
// 7. Kaitstud failile määra private, no-store.
export function accessDecision({ file, user }) {
  if (file.isPublic) {
    return {
      allow: true,
      cache: 'public, max-age=31536000, immutable',
    };
  }

  if (!user) {
    return {
      allow: false,
      code: 401,
      cache: 'private, no-store',
    };
  }

  if (!mayRead(user, file)) {
    return {
      allow: false,
      code: 403,
      cache: 'private, no-store',
    };
  }

  return {
    allow: true,
    cache: 'private, no-store',
  };
}

// 8. Võrdle failisüsteemi, andmebaasi ja objektihoidlat.
// 9. Objektihoidla võimaldab faile otse alla laadida ega koorma serverit.
export const STORES = {
  file_system: {
    scaling: 'üks server',
    backup: 'eraldi',
    download: 'sinu server',
  },
  database: {
    scaling: 'jah',
    backup: 'andmebaasi varukoopia',
    download: 'sinu server',
  },
  object_store: {
    scaling: 'jah',
    backup: 'hoidla varukoopia',
    download: 'otse hoidlast',
  },
};

export function suggestStore({
  instances,
  fileSizeMb,
  needsTransaction = false,
}) {
  if (needsTransaction && fileSizeMb <= 0.1) return 'database';
  if (instances > 1 || fileSizeMb >= 50) return 'object_store';
  return 'filesystem';
}

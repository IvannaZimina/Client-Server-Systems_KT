import { matches } from './mime-match.js';

// C04 Ex6, points 1-3: parse Accept preferences and rank MIME types.
export function parseAccept(header) {
  const value = header?.trim() || '*/*';
  return value.split(',').map((part, index) => {
    const [rawType, ...parameters] = part.trim().split(';');
    const qParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const q = qParameter ? Number(qParameter.trim().slice(2)) : 1;
    const type = rawType.trim().toLowerCase();
    const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2;
    return { type, q: Number.isFinite(q) ? q : 0, specificity, index };
  }).sort((a, b) => b.q - a.q || b.specificity - a.specificity || a.index - b.index);
}

export function pickRepresentation(acceptHeader, offered) {
  // C04 Ex6, points 1-3: choose the best offered representation or null.
  for (const wanted of parseAccept(acceptHeader)) {
    if (wanted.q === 0) continue;
    const found = offered.find((candidate) => matches(wanted.type, candidate));
    if (found) return found;
  }
  return null;
}

export function representationHeaders(type) {
  // C04 Ex6, points 4 and 5: identify Accept as the representation selector.
  return { 'Content-Type': type, Vary: 'Accept' };
}

export function rangeHeaders(value) {
  // C04 Ex6, points 7 and 8: build headers for complete, partial, and invalid ranges.
  if (value.kind === 'whole') {
    return { code: 200, headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(value.length) } };
  }
  if (value.kind === 'invalid') {
    return { code: 416, headers: { 'Content-Range': `bytes */${value.length}` } };
  }
  return {
    code: 206,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${value.start}-${value.end}/${value.length}`,
      'Content-Length': String(value.end - value.start + 1),
    },
  };
}

export function rangeBody(text, value) {
  // C04 Ex6, point 9: slice UTF-8 bytes rather than JavaScript string indexes.
  const bytes = Buffer.from(text, 'utf8');
  if (value.kind === 'whole') return bytes;
  if (value.kind === 'invalid') return Buffer.alloc(0);
  return bytes.subarray(value.start, value.end + 1);
}

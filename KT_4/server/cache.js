import crypto from 'node:crypto';

// C04 Ex5, points 1 and 2: make resource tags deterministic and comparable.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

export function stateTag(resource) {
  // C04 Ex5, point 1: key order must not change the ETag.
  const content = JSON.stringify(canonical(resource));
  return `"${crypto.createHash('sha1').update(content).digest('hex').slice(0, 16)}"`;
}

export function tagsEqual(a, b, { weak = false } = {}) {
  // C04 Ex5, points 3 and 7: support lists, wildcards, and weak read matching.
  if (!a || !b) return false;
  if (a.trim() === '*' || b.trim() === '*') return true;
  const stripWeak = (tag) => tag.trim().replace(/^W\//, '');
  return weak ? stripWeak(a) === stripWeak(b) : a.trim() === b.trim();
}

export function answerRead(headers, resource, { modified } = {}) {
  // C04 Ex5, points 2-5: implement conditional reads with ETag precedence.
  const etag = stateTag(resource);
  const resultHeaders = { ETag: etag };
  if (modified) resultHeaders['Last-Modified'] = new Date(modified).toUTCString();

  const ifNoneMatch = headers['if-none-match'];
  const matchedTag = ifNoneMatch?.split(',').some((value) => tagsEqual(value, etag, { weak: true }));
  if (matchedTag) return { code: 304, headers: resultHeaders, body: null };

  if (!ifNoneMatch && modified && headers['if-modified-since']) {
    const since = Date.parse(headers['if-modified-since']);
    if (Number.isFinite(since) && since >= Date.parse(modified)) {
      return { code: 304, headers: resultHeaders, body: null };
    }
  }
  return { code: 200, headers: resultHeaders, body: resource };
}

export function answerWrite(headers, resource, change) {
  // C04 Ex5, points 6 and 7: require a strong If-Match for safe updates.
  const current = stateTag(resource);
  const supplied = headers['if-match'];
  if (!supplied) return { code: 428, headers: { ETag: current }, body: resource };
  if (!tagsEqual(supplied, current)) {
    return { code: 412, headers: { ETag: current }, body: resource };
  }
  const updated = { ...resource, ...change };
  return { code: 200, headers: { ETag: stateTag(updated) }, body: updated };
}

export function cacheHeader(kind) {
  // C04 Ex5, point 8: map cache policies and reject unknown kinds.
  switch (kind) {
    case 'immutable': return 'public, max-age=31536000, immutable';
    case 'short': return 'public, max-age=60';
    case 'revalidate': return 'no-cache';
    case 'secret': return 'no-store, private';
    default: throw new RangeError(`Unknown cache kind: ${kind}`);
  }
}

export function httpDate(time) {
  // C04 Ex5, task specification: format Last-Modified as an HTTP date.
  return new Date(time).toUTCString();
}

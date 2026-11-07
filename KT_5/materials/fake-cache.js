// C05 Ex6 — ETTE ANTUD võltsitud Cache API ja teenustöötaja keskkond.
//
// Miks: `sw.js` kasutab `self`, `caches` ja `Response` — neid Node'is ei ole.
// See fail teeb nad ette ära, et sa saaksid strateegiaid testida ilma
// brauserita. Päris brauseris töötab sinu kood muutmata kujul.

export class FakeResponse {
  constructor(body, { status = 200, source = 'network' } = {}) {
    this._body = body; this.status = status;
    this.ok = status >= 200 && status < 300;
    this.source = source;                     // ainult testi jaoks
  }
  clone() { return new FakeResponse(this._body, { status: this.status, source: this.source }); }
  async text() { return String(this._body); }
  async json() { return this._body; }
}

export class FakeCache {
  constructor() { this.map = new Map(); }
  _v(p) { return typeof p === 'string' ? p : p.url; }
  async match(p) { const x = this.map.get(this._v(p)); return x ? x.clone() : undefined; }
  async put(p, v) { this.map.set(this._v(p), v); }
  async addAll(rows) { for (const r of rows) this.map.set(r, new FakeResponse('kest:' + r)); }
  async delete(p) { return this.map.delete(this._v(p)); }
  get size() { return this.map.size; }
}

export function setupEnv() {
  const stores = new Map();
  const events = {};
  const self_ = {
    addEventListener: (name, f) => { events[name] = f; },
    skipWaiting: async () => { self_.skipped = true; },
    clients: { claim: async () => { self_.claimed = true; } },
    skipped: false, claimed: false, events,
  };
  const caches_ = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new FakeCache());
      return stores.get(name);
    },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    _stores: stores,
  };
  globalThis.self = self_;
  globalThis.caches = caches_;
  return { self: self_, caches: caches_, stores };
}

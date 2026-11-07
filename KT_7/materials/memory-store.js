// C07 — ETTE ANTUD repositoorium. Seda faili sa EI kirjuta.
//
// ★ REPOSITOORIUM ON LIIDES, MITTE KLASS. Tema meetodid on ainus koht, mille
//   teenus teab. Loengus 9 tuleb sama kihipiir ja sama muster MySQL-i peal;
//   meetodid on seal sündmuse CRUD.
//
//   findAll({ search, ... })    -> massiiv
//   findById(id)                -> objekt või null
//   update(id, change)          -> objekt või null
//   addOrder({ event, qty })    -> ost
//   orders()                    -> massiiv

export function createMemoryStore(initial) {
  let rows = structuredClone(initial);
  let orders = [];
  let nextId = 7001;

  return {
    async findAll({ search = '' } = {}) {
      const o = search.toLowerCase();
      return rows.filter((s) => s.name.toLowerCase().includes(o));
    },
    async findById(id) { return rows.find((s) => s.id === id) ?? null; },
    async update(id, change) {
      const s = rows.find((x) => x.id === id);
      if (!s) return null;
      for (const [k, v] of Object.entries(change)) {
        if (k !== 'id') s[k] = v;
      }
      return s;
    },
    async addOrder({ event, qty }) {
      const s = rows.find((x) => x.id === event);
      s.sold += qty;
      const order = { id: nextId++, event, qty, createdAt: new Date().toISOString() };
      orders.push(order);
      return order;
    },
    async orders() { return orders; },
    async reset() { rows = structuredClone(initial); orders = []; nextId = 7001; },
  };
}

// ★ LOENDAV REPOSITOORIUM: võltsing, mis loeb kutseid. Temaga saab tõestada, et teenus kutsub
//   repositooriumi ÕIGE arv kordi ja ÕIGETE argumentidega — ja et ta ei tee
//   seda mitu korda seal, kus üks piisaks.
export function createCountingStore(base) {
  const calls = [];
  const wrapped = {};
  for (const [name, f] of Object.entries(base)) {
    wrapped[name] = async (...a) => { calls.push({ name, a }); return f(...a); };
  }
  wrapped.calls = calls;
  wrapped.callsNamed = (n) => calls.filter((k) => k.name === n).length;
  return wrapped;
}

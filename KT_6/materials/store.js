// C06 Ex3 — ETTE ANTUD andmeait. Seda faili sa EI kirjuta.
//
// Mälupõhine "andmebaas". Päris MySQL tuleb loengus 9; siin on store ainult
// selleks, et marsruudid saaksid millegagi rääkida. Iga meetod on ASÜNKROONNE
// juba praegu — nii ei pea sa hiljem marsruute ümber kirjutama.

export function createStore(initial) {
  let rows = structuredClone(initial);
  let orders = [];
  let nextId = 9001;

  return {
    async events(search = '') {
      const o = search.toLowerCase();
      return rows.filter((s) => s.name.toLowerCase().includes(o));
    },
    async event(id) {
      return rows.find((s) => s.id === id) ?? null;
    },
    async updateEvent(id, change) {
      const s = rows.find((x) => x.id === id);
      if (!s) return null;
      if (change.price !== undefined) s.price = Number(change.price);
      if (change.name !== undefined) s.name = String(change.name);
      return s;
    },
    async orders() { return orders; },
    async addOrder({ event, qty }) {
      const s = rows.find((x) => x.id === event);
      s.sold += qty;
      const order = { id: nextId++, event, qty, createdAt: new Date().toISOString() };
      orders.push(order);
      return order;
    },
    async removeOrder(id) {
      const i = orders.findIndex((o) => o.id === id);
      if (i < 0) return false;
      orders.splice(i, 1);
      return true;
    },
    async reset() { rows = structuredClone(initial); orders = []; nextId = 9001; },
  };
}

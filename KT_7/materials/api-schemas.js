// C07 Ex5 — ETTE ANTUD API-skeemid ja tüübikaart. Seda faili sa EI kirjuta.
//
// Skeemid on ANDMED, mitte loogika. Ex5 teema on see, kuidas lepingut
// MASINAGA KONTROLLIDA — mitte skeemide tippimine.
//
// ★ Pane tähele, et `required` ja `fields` on ERALDI: puuduv nõutud väli ja
//   lepingus puuduv väli on KAKS ERI viga. Teine neist on tähtsam — just
//   tema kaudu lekib serveri sisemus välja (parooliräsi, sisemised id-d).
//
// ★ null: selle lihtsustatud lepingu kokkulepe on, et VALIKULINE väli tohib
//   olla null, nõutud väli mitte.

export const SCHEMAS = {
  Event: {
    type: 'object',
    required: ['id', 'name', 'venue', 'start', 'seats', 'sold', 'price'],
    fields: {
      id: 'integer', name: 'string', venue: 'string', start: 'string',
      seats: 'integer', sold: 'integer', price: 'number',
    },
  },
  List: {
    type: 'object',
    required: ['total', 'page', 'per', 'pages', 'rows'],
    fields: {
      total: 'integer', page: 'integer', per: 'integer',
      pages: 'integer', rows: 'array',
    },
  },
  NewOrder: {
    type: 'object',
    required: ['event', 'qty', 'buyer', 'email'],
    fields: {
      event: 'integer', qty: 'integer', buyer: 'string',
      email: 'string', note: 'string',
    },
  },
  Order: {
    type: 'object',
    required: ['id', 'event', 'qty', 'createdAt'],
    fields: { id: 'integer', event: 'integer', qty: 'integer', createdAt: 'string' },
  },
  Error: {
    type: 'object',
    required: ['err', 'code'],
    fields: { err: 'string', code: 'string', fields: 'object', detail: 'object' },
  },
};

// Väärtuse tüüp OpenAPI sõnavaras. `integer` on `number` alamhulk, seega
// kontrollija peab neid eristama, aga `integer` kõlbab `number`-väljale.
export const toType = (v) => {
  if (Array.isArray(v)) return 'array';
  if (v === null) return 'null';
  if (Number.isInteger(v)) return 'integer';
  return typeof v === 'number' ? 'number' : typeof v;
};

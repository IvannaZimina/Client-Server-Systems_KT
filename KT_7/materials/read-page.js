// C07 Ex3 — ETTE ANTUD lehekülgede lugemine. Seda faili sa EI kirjuta:
// kopeeri ta server/ kausta ja ekspordi query.js-ist edasi.
//
// Liiga suur per KÄRBITAKSE lae PAGE_MAX peale; vigane või puuduv page ja
// per langevad vaikeväärtusele.
export const PAGE_DEFAULT = 20;
export const PAGE_MAX = 100;

export function readPage({ page, per } = {}) {
  const n = Math.max(1, Number.parseInt(page, 10) || 1);
  const k = Math.min(PAGE_MAX, Math.max(1, Number.parseInt(per, 10) || PAGE_DEFAULT));
  return { page: n, per: k, offset: (n - 1) * k };
}

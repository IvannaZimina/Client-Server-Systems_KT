// C07 Ex3 — ETTE ANTUD plaani rakendus mälus hoitud ridade peal. Seda sa EI
// kirjuta.
//
// ★ SEE KOOD ON VISATAV. Loengus 9 asendab teda SQL WHERE/ORDER BY/LIMIT.
//   PÜSIV osa on PLAAN ise: tema kuju ei muutu, kui salvestus vahetub.
//   Just see ongi kihilise arhitektuuri (Ex1) mõõdetav kasu.

// ── 6. PLAANI RAKENDAMINE (mälus; SQL tuleb loengus 9) ──────────────────
export function apply(rows, plan) {
  const free = (s) => s.seats - s.sold;
  let result = rows;

  if (plan.search) {
    const o = plan.search.toLowerCase();
    result = result.filter((s) => s.name.toLowerCase().includes(o)
                             || s.venue.toLowerCase().includes(o));
  }
  const f = plan.filters;
  if (f.venue) result = result.filter((s) => s.venue === f.venue);
  if (f.min_price !== undefined) result = result.filter((s) => s.price >= f.min_price);
  if (f.max_price !== undefined) result = result.filter((s) => s.price <= f.max_price);
  if (f.free_at_least !== undefined) result = result.filter((s) => free(s) >= f.free_at_least);

  // ★ KOKKU ARVUTATAKSE ENNE lehekülge, mitte pärast. Muidu ütleb vastus
  //   „kokku 20“, kuigi vasteid on 340 — ja klient ei oska lehti joonistada.
  const total = result.length;

  const { field, dir } = plan.sort;
  const key = (s) => (field === 'free' ? free(s) : s[field]);
  // ★ STABIILNE: võrdsete korral otsustab id. Ilma selleta võib sama päring
  //   anda eri järjekorra ja lehekülg 2 näitab sama rida mis lehekülg 1.
  result = [...result].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    if (x === y) return a.id - b.id;
    return (x > y ? 1 : -1) * dir;
  });

  return {
    total,
    page: plan.page,
    per: plan.per,
    pages: Math.max(1, Math.ceil(total / plan.per)),
    rows: result.slice(plan.offset, plan.offset + plan.per),
  };
}

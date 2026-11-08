// C09 Ex4 — ETTE ANTUD. Sündmused müüdud ja vabade kohtadega ÜHE päringuga.
// Seda faili sa EI kirjuta: kopeeri ta db/ kausta ja ekspordi relations.js-ist
// edasi.
//
// ★ See on võrdlusalus. Koondpäring (LEFT JOIN, COUNT, GROUP BY) on loengu 9
//   teema; siin on tema ülesanne anda vastus, millega sinu N+1 ja kaks
//   päringut peavad TÄPSELT kokku langema.
//
// ★ Ahel event -> seat -> ticket: COUNT loeb PILETEID (t.id), mitte kohti.
//   LEFT JOIN hoiab alles ka sündmuse, millel ühtki piletit ei ole.
export async function eventsJoin(pool, counter) {
  const [rows] = await pool.execute(`
    SELECT e.id, e.name, e.seat_count,
           COUNT(t.id) AS sold,
           e.seat_count - COUNT(t.id) AS free
      FROM event e
      LEFT JOIN seat s ON s.event_id = e.id
      LEFT JOIN ticket t ON t.seat_id = s.id
     GROUP BY e.id, e.name, e.seat_count
     ORDER BY e.id`);
  counter.queries += 1;
  return rows.map((r) => ({ ...r, sold: Number(r.sold), free: Number(r.free) }));
}

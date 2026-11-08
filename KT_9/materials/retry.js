// C09 — ETTE ANTUD. Ummikseisu kordamine. Seda faili sa EI kirjuta.
//
// ★ SAMA KORDAJA, MIS LOENGU 9 NÄITES (09_race/retry.js), ja lukkude
//   järjestaja. Sinu töö on järgmine kiht: MIDA korratakse (terve tehing,
//   mitte üks lause) ja mis on korratav (`retryable` tuleb sinu
//   `translateError`-ist).

const RETRYABLE = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);

export async function retryOnDeadlock(action, {
  attempts = 3,
  retryable = (err) => RETRYABLE.has(err?.code),
  wait = (ms) => new Promise((done) => setTimeout(done, ms)),
} = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await action();
    } catch (err) {
      if (!retryable(err) || attempt >= attempts) throw err;
      // Kasvav ja juhuslik ootamine: ilma juhuslikkuseta põrkuvad samad
      // tehingud uuesti kokku täpselt samal hetkel.
      await wait(20 * 2 ** (attempt - 1) + Math.random() * 20);
    }
  }
}

// Mitme koha ostmine: lukusta ALATI kasvavas id-järjekorras, duplikaadid välja.
// Kaks tehingut, mis lukustavad samu ridu samas järjekorras, ei saa teineteist
// ummikusse viia.
export function orderLocks(ids) {
  return [...new Set(ids)].sort((a, b) => a - b);
}

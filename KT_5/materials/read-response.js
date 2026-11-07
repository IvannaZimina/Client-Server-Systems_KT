// C05 Ex3 — ETTE ANTUD vastuse lugemine. Seda faili sa EI kirjuta.
//
// Sama keskosa, mis loengu 5 näites (04_errors_and_states): response.ok
// kontroll ja json() OMAETTE try sees. Ta viskab kahel juhul — HTTP-viga ja
// vigane keha — ja paneb veale koodi (status). LAADI ta ei pane: see on
// sinu readResponse() töö.
export async function readBody(response) {
  if (!response.ok) {
    // Veakeha on ka JSON — aga ta VÕIB olla ka HTML (nginxi veaproff).
    const detail = await response.json().catch(() => null);
    const err = new Error(detail?.err ?? `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  // response.ok on true JA json() viskab, kui keha ei ole kehtiv JSON.
  try {
    return await response.json();
  } catch {
    const err = new Error('Vastus ei ole kehtiv JSON');
    err.status = response.status;
    err.badBody = true;
    throw err;
  }
}

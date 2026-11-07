// C05 Ex3 — ETTE ANTUD veateadete tõlge. Seda faili sa EI kirjuta.
//
// Vea LAADIST kasutaja teateni on kaardistus, mitte loogika. Ex3 teema on
// see, KUST laad tuleb (võrk / server / klient / vorming) ja neli olekut.
//
// ★ Kasutajale ei öelda kunagi „TypeError: Failed to fetch“. Talle öeldakse,
//   mis edasi teha.

export function errorToState(err) {
  if (err.kind === 'format') return { state: 'err', message: 'Server saatis vigase vastuse.' };
  if (err.kind === 'server') {
    return { state: 'err', message: 'Server ei vasta. Proovi hiljem uuesti.' };
  }
  if (err.kind === 'client') return { state: 'err', message: err.message };
  // TypeError „Failed to fetch“ = võrk, mitte server.
  return { state: 'err', message: 'Ühendus puudub. Kontrolli võrku.' };
}

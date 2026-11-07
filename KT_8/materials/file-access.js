// C08 Ex3 — ETTE ANTUD. Kes tohib kaitstud faili lugeda. Seda faili sa EI
// kirjuta: kopeeri ta server/ kausta ja kasuta files.js-is.
//
// ★ Reegel ise (omanik, korraldaja roll) on loengu 11 teema. Loengu 8 töö on
//   see, mis ümber: kaitstud fail käib IGA kord läbi marsruudi, mis küsib
//   seda otsust, ja vastus sõltub sellest, mida otsus ütles.
export function mayRead(user, file) {
  return file.owner === user.id || user.role === 'organizer';
}

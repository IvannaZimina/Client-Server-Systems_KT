// C07 Ex1 — ETTE ANTUD. Kes tohib sündmust muuta. Seda faili sa EI kirjuta:
// kopeeri ta server/ kausta ja kasuta teenuses.
//
// ★ Reegel ise (roll, mis tuleb seansist) on loengu 11 teema. Loengu 7 töö on
//   see, mis ümber: teenus eristab kaks keeldu — kasutajat ei ole üldse, ja
//   kasutaja on, aga see otsus ütleb ei. Kumb vea liik kummale käib, on sinu valik.
export function canEdit(user) {
  return user.role === 'organizer';
}

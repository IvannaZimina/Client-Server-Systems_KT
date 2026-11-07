// C05 Ex6 — ETTE ANTUD näidisstrateegia. Seda faili sa EI kirjuta.
//
// `cache-first` on kolmest strateegiast lihtsaim ja ta on siin TÖÖNÄIDISENA:
// vaata, mis kuju on ühel strateegial, ja kirjuta ülejäänud kaks samasse
// kuju ise. Nii on ülesanne kahe strateegia kirjutamine, mitte kolme.
//
// cache-first — kest, logo, fondid. Kiire, aga VANANEB.
// Kasutaja näeb: kohe. Risk: vana sisu kuni järgmise versioonini.

export async function shellFirst(request, { cache, fetchFn }) {
  const present = await cache.match(request);
  if (present) return present;
  const response = await fetchFn(request);
  // ★ vastust saab lugeda AINULT ÜKS kord — seepärast clone() enne
  //   vahemällu panemist. Ilma temata on kutsuja vastus juba „ära joodud“.
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

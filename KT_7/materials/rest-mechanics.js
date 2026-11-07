// C07 Ex2 — ETTE ANTUD REST-i mehaanika. Seda faili sa EI kirjuta: kopeeri ta
// server/ kausta ja ekspordi rest.js-ist edasi.
//
// ★ Need on loengu 7 näiteserveri võtted: PUT asendab, PATCH muudab osa,
//   400 ja 422 on eri vead, 405 käib koos Allow-päisega. Sinu töö on
//   otsustada, MILLISED URL-id, meetodid ja koodid sinu API-l on — ja
//   proovijooksuga NÄIDATA, mida need funktsioonid teevad.

// PUT ASENDAB KOGU ressursi: väli, mida kehas ei ole, saab vaikeväärtuse
// või kaob. id jääb olemasolevalt ressursilt, ka siis, kui kehas on muu id.
export function applyPut(existing, body, { defaults = {} } = {}) {
  return { ...defaults, ...body, id: existing.id };
}

// PATCH muudab OSA: teised väljad jäävad, id ei muutu.
export function applyPatch(existing, body) {
  return { ...existing, ...body, id: existing.id };
}

// 400 = päringut ei saanud LUGEDA (katkine JSON); 422 = loetud, väärtused ei kõlba.
// (Vale või puuduv Content-Type on kolmas juht: 415, loeng 4.)
export function inputCode(jsonOk, validationOk) {
  if (!jsonOk) return 400;
  if (!validationOk) return 422;
  return null;
}

// 405 ilma Allow-päiseta on poolik vastus: klient ei tea, mida tohib.
export function wrongMethod(res, allowed) {
  return res.status(405).set('Allow', allowed.join(', '))
    .json({ err: 'Meetod ei ole lubatud', allowed });
}

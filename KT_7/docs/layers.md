# C07 — Ülesanne 1: Kihiline arhitektuur

## 1. Kirjuta teenus, mis saab repositooriumi ja kella ({ now }) PARAMEETRINA, mitte ei impordi.

Failis `server/layers.js` loodud funktsioon `createEventService(repository, { now })` saab repositooriumi ja kella parameetritena.
Teenus ei impordi repositooriumi ega loo seda ise. Kell võimaldab kasutada testides kindlat kuupäeva ja kellaaega.
Kui kella ei anta, kasutatakse praegust aega.

---

## 2. Pane ärireeglid teenusesse: vabu kohti, juba toimunud sündmus. 

Ärireeglid on realiseeritud teenuse funktsioonides:
- `buy()` kontrollib, et piletite kogus oleks positiivne täisarv.
- `buy()` kontrollib, kas sündmus on juba alanud.
- `buy()` kontrollib, kas vabu kohti on piisavalt.
- `update()` kontrollib, kas kasutaja on sisse logitud ja kas tal on muutmise õigus.

Need kontrollid asuvad teenuses, sest nende jaoks on vaja sündmuse andmeid ja kasutaja õigusi.

---

## 3. Viska antud ServiceError-it liigiga, mitte HTTP-koode. 

Failist `materials/service-errors.js` kasutatakse olemasolevat `ServiceError` klassi ja veatüüpide ning HTTP-koodide seostamist.
Teenus viskab veatüüpe, mitte HTTP-koode:

- `not_found` — sündmust ei leitud;
- `conflict` — sündmus on juba alanud või vabu kohti ei ole piisavalt;
- `invalid` — piletite kogus ei ole korrektne;
- `unauthenticated` — kasutaja ei ole sisse logitud;
- `forbidden` — kasutajal puudub muutmise õigus.

---

## 4. Kontrolli loendava repositooriumiga, mitu korda teenus repositooriumi kutsub. 

Kontrollimiseks kasutati failis `materials/memory-store.js` olevat loendavat repositooriumi.
Pileti ostmisel ühe pileti jaoks saadi järgmised tulemused:

| Repositooriumi meetod | Väljakutsete arv |
| --------------------- | ---------------: |
| `findById`            |                1 |
| `addOrder`            |                1 |
| `findAll`             |                0 |

Teenus kasutab andmete lugemiseks ja muutmiseks ainult repositooriumi meetodeid.

---

## 5. VIHJE: kui su teenuse test vajab Expressi, on midagi vales kihis. 

Failis `materials/check-layers.js` olev kontroll käivitab teenuse testid ilma Expressi ja HTTP-päringuteta.
Teenus ei kasuta `req` ega `res` objekte.
Samuti ei sõltu see andmebaasist ega süsteemi tegelikust kuupäevast, sest repositoorium ja kell antakse parameetritena.

---

## 6. Kirjuta kontroller, mis teeb TÄPSELT kolm asja: võtab, kutsub, tõlgib. 

Failis `server/layers.js` loodud `createEventsController()` kontroller täidab kolm ülesannet:
1. **Võtab päringu andmed.** Kasutab `req.params`, `req.body`, `req.query` ja vajadusel kasutaja infot (`req.user` või `req.session.user`).
2. **Kutsub teenust.** Kutsub vastavat teenuse meetodit: `list()`, `one()`, `buy()` või `update()`.
3. **Tagastab HTTP-vastuse.** Kasutab `res.json()`. Eduka pileti ostmise korral tagastab `201` ja `Location` päise.

---

## 7. Ühenda antud serviceErrorHandler(): vea liik saab koodi ÜHES kohas. 

Failist `materials/service-errors.js` kasutatakse olemasolevat `serviceErrorHandler()` funktsiooni.
Veatüübi ja HTTP-koodi seostamine toimub ühes kohas:

| Veatüüp           | HTTP-kood |
| ----------------- | --------: |
| `not_found`       |       404 |
| `conflict`        |       409 |
| `unauthenticated` |       401 |
| `invalid`         |       422 |
| `forbidden`       |       403 |

---

## 8. Näita proovijooksuga, et tundmatu viga läheb EDASI (next(err)).

Kontrollimiseks kasutati `TypeError` viga:

```js
handler(new TypeError('bug'), {}, fakeRes(), (v) => {
  passedOn = v.constructor.name;
});
```
Kontrollis veenduti, et `next(err)` saab edasi `TypeError` vea. Tundmatut viga ei teisendata teenuse veatüübiks ega käsitleta tavalise teenuse veana.

---

## 9. Kirjuta docs/layers.md: kus on SINU koodis iga reegel ja miks just seal. 

| Funktsioon                 | Reegel või ülesanne                                                  | Miks siin?                                                           |
| -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `list()`                   | Sündmuste loetelu ja nime järgi otsimine                             | Teenus kasutab selleks repositooriumi andmeid.                       |
| `one()`                    | Sündmuse otsimine ID järgi; puudumisel `not_found`                   | Sündmuse olemasolu kontrollimiseks on vaja repositooriumi.           |
| `buy()`                    | Piletite koguse, sündmuse algusaja ja vabade kohtade kontroll        | Need on pileti ostmise ärireeglid ja vajavad sündmuse andmeid.       |
| `update()`                 | Kasutaja olemasolu ja muutmisõiguse kontroll                         | Kasutaja õigused on ärireegel. Kasutaja info saadakse kontrollerist. |
| `createEventsController()` | Päringuandmete võtmine, teenuse kutsumine ja HTTP-vastuse koostamine | Kontroller vastutab päringu ja vastuse vahelise suhtluse eest.       |
| `serviceErrorHandler()`    | Teenuse veatüübi teisendamine HTTP-koodiks                           | Veatüübi ja HTTP-koodi seostamine peab olema ühes kohas.             |
| Repositoorium              | Andmete lugemine, muutmine ja tellimuse lisamine                     | Andmetega seotud toimingud kuuluvad repositooriumile.                |

---

## Oodatav tulemus

**Sõltuvuste suund on tõestatav**

- `check-layers.js` ei impordi Expressi ega HTTP-d.
- Teenus ei vaja andmebaasi ega süsteemi tegelikku kuupäeva.
- Repositoorium ja kell antakse teenusele parameetritena.
- Arhitektuuri suund: **Route → Controller → Service → Repository**.

**Teenus kutsub repositooriumi — mõõdetud tulemus**

| Meetod     | Väljakutsete arv |
| ---------- | ---------------: |
| `findById` |                1 |
| `addOrder` |                1 |
| `findAll`  |                0 |

**Veatüüp → HTTP-kood ühes kohas**

| Veatüüp           | HTTP-kood |
| ----------------- | --------: |
| `not_found`       |       404 |
| `conflict`        |       409 |
| `unauthenticated` |       401 |
| `invalid`         |       422 |
| `forbidden`       |       403 |

Kasutaja õigus on ärireegel, kuid kasutaja info tuleb kontrollerist.
**Kontrolli tulemus:** `26 kontrolli OK` — kõik 26 kontrolli läbisid edukalt.
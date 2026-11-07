# C07 — Ülesanne 2: REST-i kuju: ressursid ja meetodid

## 1. Kirjuta ROUTES nii, et ükski URL ei sisalda tegusõna ega ainsust.

Failis `server/rest.js` loodud `ROUTES` sisaldab kuut aadressi:

| Ressurss              | URL                            |
| --------------------- | ------------------------------ |
| Sündmuste loetelu     | `/api/events`                  |
| Üksik sündmus         | `/api/events/:id`              |
| Sündmuse saaliplaan   | `/api/events/:id/seatmap`      |
| Tellimuste loetelu    | `/api/orders`                  |
| Üksik tellimus        | `/api/orders/:id`              |
| Tellimuse tühistamine | `/api/orders/:id/cancellation` |

Kõik URL-id kasutavad nimisõnu. Kogude nimed on mitmuses (`events`, `orders`).
URL-ides ei kasutata tegusõnu nagu `get`, `delete` või `cancel`.

---

## 2. Kirjuta ALLOWED kõigile kuuele aadressile, ka saaliplaanile ja tühistamisele: mida piletikassa reeglid igal lubavad.

Failis `server/rest.js` loodud `ALLOWED` määrab lubatud HTTP-meetodid kõigile kuuele ressursile.

| Ressurss       | Lubatud meetodid                       | Mida need võimaldavad                                  |
| -------------- | -------------------------------------- | ------------------------------------------------------ |
| `events`       | GET, HEAD, OPTIONS, POST               | Sündmuste vaatamine ja uue sündmuse loomine            |
| `event`        | DELETE, GET, HEAD, OPTIONS, PATCH, PUT | Üksiku sündmuse vaatamine, muutmine ja kustutamine     |
| `seatmap`      | GET, HEAD, OPTIONS                     | Saaliplaani vaatamine                                  |
| `orders`       | GET, HEAD, OPTIONS, POST               | Tellimuste vaatamine ja uue tellimuse loomine          |
| `order`        | GET, HEAD, OPTIONS, PUT                | Üksiku tellimuse vaatamine ja täielik asendamine       |
| `cancellation` | DELETE, GET, HEAD, OPTIONS, POST       | Tühistamise ressursi vaatamine, loomine ja kustutamine |

Saaliplaani puhul on lubatud ainult lugemismeetodid, sest klient saab seda vaadata, mitte muuta. Tühistamine on eraldi ressurss, millele saab teha POST-päringu tühistamise loomiseks.

---

## 3. Näita antud applyPut() ja applyPatch() vahet: PUT-iga peab üks väli KADUMA.

Failis `server/rest-mechanics.js` olevad etteantud funktsioonid `applyPut()` ja `applyPatch()` näitavad kahe meetodi erinevust.

Algne objekt:
```js
{ id: 3, name: "Improteater", venue: "Von Krahl", price: 15, note: "vana" }
```

**PUT — asendab kogu ressursi.**
Päringu keha:
```js
{ name: "Uus", venue: "X", price: 20 }
```

Tulemus:
```js
{ id: 3, name: "Uus", venue: "X", price: 20 }
```
Väli `note` kadus, sest seda uues päringu kehas ei olnud. Olemasolev `id` säilis.

**PATCH — muudab ainult päringus antud välju.**
Päringu keha:
```js
{ price: 20 }
```

Tulemus:
```js
{ id: 3, name: "Improteater", venue: "Von Krahl", price: 20, note: "vana" }
```
Väli `price` muutus, teised väljad jäid alles.

---

## 4. Tõesta, et PUT on idempotentne: kaks korda annab sama lõppseisu.

Idempotentsust kontrolliti failis `materials/check-rest.js`.
Sama PUT-päring rakendati kaks korda:
```js
R.applyPut(
  R.applyPut(exists, { name: 'A' }),
  { name: 'A' }
);
```

Tulemust võrreldi ühe PUT-päringu tulemusega:
```js
R.applyPut(exists, { name: 'A' });
```
Mõlemad tulemused olid samad. Seega ei muuda sama PUT-päringu kordamine ressursi lõppseisu.

---

## 5. VIHJE: tegevus, mis ei ole CRUD, saab URL-is nimisõna ja on ise ressurss (.../cancellation).

Tellimuse tühistamine on esitatud eraldi ressursina:
`/api/orders/:id/cancellation`
Failis `server/rest.js` määrati selle aadressi lubatud meetodid `ALLOWED.cancellation` kaudu.
Tühistamine ei ole tegusõna URL-is. See on tellimusega seotud eraldi ressurss.

---

## 6. Kirjuta STATUS: kood igale üheksale piletikassa olukorrale, mille proovijooks nimetab — müüdud koht, tundmatu sündmus ostu kehas, tühistatud ostu tühistamine jt.

Failis `server/rest.js` loodud `STATUS` määrab HTTP-koodid üheksale olukorrale.

| Olukord                                    | STATUS-i võti         | HTTP-kood | Põhjendus                                              |
| ------------------------------------------ | --------------------- | --------: | ------------------------------------------------------ |
| Vigane JSON                                | `brokenJson`          |       400 | Päringu sisu ei saa lugeda.                            |
| Negatiivne piletite arv                    | `negativeCount`       |       422 | Päring on loetav, kuid väärtus ei sobi.                |
| Tellimuse kehas tundmatu sündmus           | `unknownEventInOrder` |       422 | Tellimuse andmed ei vasta nõuetele.                    |
| Sündmust ei leitud                         | `eventGone`           |       404 | Soovitud ressurssi ei ole olemas.                      |
| Koht on juba müüdud                        | `seatTaken`           |       409 | Ressursi praegune seis ei võimalda ostu.               |
| Soovitud pileteid on rohkem kui vabu kohti | `tooManyTickets`      |       409 | Ost on vastuolus vabade kohtade arvuga.                |
| Juba tühistatud ostu uuesti tühistamine    | `cancelledTwice`      |       409 | Sama toiming ei ole ressursi praeguse seisuga lubatud. |
| Kasutaja ei ole sisse logitud              | `noLogin`             |       401 | Kasutaja autentimine puudub.                           |
| Kasutaja ei ole korraldaja                 | `notOrganizer`        |       403 | Kasutaja on tuvastatud, kuid tal puudub vajalik õigus. |

Lisaks eristab etteantud `inputCode()` funktsioon kahte olukorda:
- `400` — JSON-i ei saa lugeda.
- `422` — JSON on loetav, kuid selle väärtused ei läbi kontrolli.

---

## 7. Anna antud wrongMethod()-ile saaliplaani ALLOWED: 405 KOOS Allow-päisega.

Failis `server/rest.js` eksporditakse etteantud `wrongMethod()` funktsioon failist `server/rest-mechanics.js`.
Saaliplaani puhul antakse sellele `ALLOWED.seatmap`:
```js
wrongMethod(res, ALLOWED.seatmap);
```

Kontrolli tulemus:
- HTTP-kood: `405`;
- `Allow` päis: `GET, HEAD, OPTIONS`;
- JSON-vastus sisaldab lubatud meetodeid.
Nii saab klient teada, milliseid HTTP-meetodeid saaliplaani ressursi puhul kasutada tohib.

---

## 8. v2 annab hinna sentides (priceCents). Vali versiooni koht ja kirjuta, mida piletikassa klient v2 tulekul teeb.

Failis `server/rest.js` loodud `versioned()` lisab API versiooni aadressi `/api` ja ressursi vahele.

Näited:

| Versioon 1         | Versioon 2         |
| ------------------ | ------------------ |
| `/api/v1/events`   | `/api/v2/events`   |
| `/api/v1/orders/7` | `/api/v2/orders/7` |

Versioon on URL-is, sest nii saab klient valida, millise API versiooniga ta suhtleb.
Versioonis v2 tagastatakse hind sentides välja `priceCents` kaudu. Näiteks 20 eurot on 2000 senti.
Kui piletikassa klient kasutab v2 versiooni, peab ta lugema välja `priceCents` ja teisendama selle kasutajale kuvamiseks eurodeks.
Vana klient saab jätkata v1 kasutamist. Nii ei muutu olemasoleva kliendi jaoks andmete tähendus ootamatult.

---

## 9. Kirjuta docs/rest.md põhjendustega, mitte definitsioonidega; lisa, mida teeb korratud ostu POST ja mis kaitse sobib piletikassale.

1. POST-päringu `/api/orders` korduv saatmine võib luua samadele piletitele teise tellimuse.
2. Kaitseks kasutatakse `Idempotency-Key` võtit:
   server salvestab esimese päringu tulemuse ja tagastab sama võtmega korduspäringu korral sama tellimuse.
   See takistab topelttellimuste loomist.

---

###  Oodatav tulemus

**PUT ja PATCH — mõõdetud**
Algne objekt:
```js
{ id: 3, name: "Improteater", note: "vana" }
```

| Meetod | Päringu keha                             | Kontrollitud tulemus |
| ------ | ---------------------------------------- | -------------------- |
| PUT    | `{ name: "Uus", venue: "X", price: 20 }` | `note` kadus         |
| PATCH  | `{ price: 20 }`                          | `note` jäi alles     |

PUT-i kaks korda rakendamine andis sama lõppseisu.

**Piletikassa olukorrad**
Kõigile üheksale olukorrale määrati HTTP-staatuse kood. Koodide vastavust kontrolliti proovijooksuga.

**405 koos Allow-päisega**
Saaliplaani lubatud meetodid tagastatakse `Allow` päises: `GET, HEAD, OPTIONS`.

**Kontrolli tulemus**
`37 kontrolli OK` — kõik 37 kontrolli läbisid edukalt.
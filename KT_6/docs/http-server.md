# C06 — Ülesanne 2: Puhas http-server ja keskkond

### 1. Kirjuta readConfig(): puuduv või tühi muutuja annab vea KÄIVITUSEL.
Failis `server/plain.js` loodi funktsioon `readConfig()`, mis kontrollib keskkonnamuutujaid enne serveri käivitamist.
Kohustuslikud muutujad on:
- `DB_URL` — andmebaasi ühenduse aadress.
- `SESSION_SECRET` — sessiooni salajane võti.
Kui muutuja puudub või selle väärtus on tühi, tekib viga.

Näiteks: `readConfig({ SESSION_SECRET: 's' })`
Tulemuseks on: `Puuduvad keskkonnamuutujad: DB_URL`
Vaikeväärtusena kasutatakse porti `3006` ja keskkonna tüüpi `development`.
Serveri käivitamisel tuleb funktsioon `readConfig()` välja kutsuda enne `listen()` meetodi kasutamist. Nii kontrollitakse keskkonnamuutujaid enne serveri käivitamist.

---

### 2. Nimeta veateates KÕIK puuduvad muutujad korraga, mitte esimene.
Funktsioonis `readConfig()` kontrollitakse kõiki kohustuslikke keskkonnamuutujaid korraga.
Puuduvad muutujad kogutakse massiivi ja lisatakse ühte veateatesse.
Kui puuduvad nii `DB_URL` kui ka `SESSION_SECRET`, saadakse järgmine tulemus:
`Puuduvad keskkonnamuutujad: DB_URL, SESSION_SECRET`
Selline lahendus näitab korraga kõiki puuduvaid väärtusi.

---

### 3. Kontrolli ka porti: vigane väärtus annab RangeError-i.
Porti kontrollitakse funktsioonis `readConfig()`.
Lubatud väärtus peab olema täisarv vahemikus 1 kuni 65535.
Kui port on tühi, ei ole number või jääb lubatud vahemikust välja, visatakse `RangeError`.
Näiteks väärtus `99999` ei ole lubatud port.
Vaikeväärtusena kasutatakse porti `3006`, kui `PORT` ei ole määratud.

---

### 4. Kirjuta configForLog(), mis peidab saladused enne logisse trükkimist.
Funktsioon `configForLog()` koostati selleks, et konfiguratsiooni logimisel ei avaldataks salajasi andmeid.
Logis peidetakse järgmised väärtused:
- `databaseUrl` asendatakse väärtusega `***`.
- `sessionKey` asendatakse väärtusega `***`.
Port ja keskkonna tüüp jäävad logis nähtavaks.
Nii saab konfiguratsiooni kontrollida ilma andmebaasi aadressi ja salajast võtit avaldamata.

---

### 5. VIHJE: .env EI lähe gitti; gitti läheb .env.example ilma saladusteta.
`.env` fail sisaldab keskkonnamuutujaid ja võimalikke salajasi väärtusi.
Seda faili ei lisata Git-i, sest saladused ei tohi sattuda versioonihaldusesse.
Git-i lisatakse `.env.example`, kus on ainult muutujate nimed ja näidisväärtused.
Näide `.env.example` failist:
```env
PORT=3006
DB_URL=
SESSION_SECRET=
NODE_ENV=development
```
`.gitignore` faili lisatakse:
```gitignore
.env
```
`.env.example` fail tuleb luua ja lisada Git-i. `.env` fail jääb versioonihaldusest välja.
Node.js alates versioonist 20.6 võimaldab kasutada keskkonnamuutujate laadimiseks käsku `--env-file=.env`.
Eraldi `dotenv` paketti ei ole vaja.

---

### 6. Kirjuta käsitleja kolmele marsruudile: nimekiri, üks sündmus ja poolik POST /api/orders.
Failis `server/plain.js` loodi eraldi funktsioon `createHandler(data)`.
Käsitleja toetab kolme peamist marsruuti.

**GET /api/events**
Tagastab kõik sündmused JSON-vormingus.
Edukalt töödeldud päringu vastuse kood on `200`.

**GET /api/events/:id**
Tagastab ühe sündmuse vastavalt URL-is olevale ID-le.
Kui sündmust ei leita, tagastatakse `404`.
Marsruudi parameetri leidmiseks kasutatakse etteantud funktsiooni `match()`.

**POST /api/orders**
Võtab vastu tellimuse JSON-andmed.
Näiteks:
```json
{
  "event": 3,
  "qty": 2
}
```
Kui tellimuse andmed on korrektsed, tagastatakse vastuse kood `201` ja päis `Location: /api/orders/9001`.
Kui kohustuslikud väljad puuduvad, tagastatakse `422`.
Kui JSON ei ole korrektne, tagastatakse `400`.
Lisaks kontrollitakse sündmuse olemasolu ja vabade kohtade arvu.
Tellimuse loomisel kasutatakse kontrolltöös fikseeritud ID-d `9001`.

---

### 7. Lisa 404 KÕIGE VIIMASENA ja kontrolli teda tundmatu teega.
Kõik teadaolevad marsruudid kontrollitakse enne üldist 404 vastust.
404-käsitleja asub funktsioonis `createHandler()` kõige viimasena.

Kui päringu tee ei vasta ühelegi olemasolevale marsruudile, tagastatakse:
- HTTP staatus `404`.
- JSON-vastus veateatega `Marsruuti ei leitud`.

Kontrollimiseks kasutatakse näiteks tundmatut teed: `GET /unknown`.
Sellisel juhul ei jää päring vastust ootama.

---

### 8. Mähi käsitleja .catch-i sisse: asünkroonne viga EI TOHI protsessi tappa.
Funktsioonis `makeServer()` luuakse server funktsiooniga `http.createServer()`.
Päringute käsitlemiseks kasutatakse eraldi funktsiooni `createHandler(data)`.
Asünkroonsete vigade püüdmiseks kasutatakse `.catch()`.
Kui päringu töötlemisel tekib ootamatu viga, tagastatakse võimaluse korral HTTP `500` vastus.
Kui ühendus on juba katkenud, uut vastust ei saadeta. Kui päised on juba saadetud, katkestatakse ühendus.
Selline lahendus aitab vältida serveriprotsessi ootamatut sulgumist päringu vea tõttu.

---

### 9. Saada 1,2 MB keha ja kontrolli, et server on pärast seda ELUS.
POST-päringu keha lugemiseks kasutatakse etteantud funktsiooni `readBody()` failist `materials/body-reader.js`.
Keha suuruse piiriks määrati 1 MB ehk `1 000 000` baiti.
Kui päringu keha ületab selle piiri, katkestatakse ühendus.
Kontrollimiseks saadetakse 1,2 MB suurune päring.
1,2 MB suuruse päringu saatmisel ühendus katkes või server tagastas vastuse koodiga 413.
Seejärel saadeti uus päring aadressile /api/events, millele server vastas koodiga 200.
Pärast liiga suure päringu saatmist tehakse uus päring aadressile `/api/events`.
Uus päring peab saama vastuse koodiga `200`.
See näitab, et liiga suur päring ei lõpetanud serveri tööd.

---

### Oodatav tulemus
Selles ülesandes kasutati puhast Node.js HTTP-serverit, et näha, milliseid toiminguid tuleb ilma raamistikuta ise teha.
| Käsitsi                                           | Expressis                         |
| ------------------------------------------------- | --------------------------------- |
| Keha lugemine tükkide kaupa ja suuruse piirang    | `express.json({ limit: '1mb' })`  |
| Tee sobitamine ja `:id` parameetri leidmine       | `app.get('/api/events/:id', ...)` |
| Content-Type, charset ja Content-Length määramine | `res.json(...)`                   |
| 404 vastus, kui ükski tee ei sobi                 | Expressi vaikimisi 404 vastus     |

Puhas HTTP-server nõuab rohkem käsitsi kirjutatud koodi. Express pakub nende toimingute jaoks valmis funktsioone ja lihtsustab päringute käsitlemist.
Kontrollimiseks kasutati etteantud faili `materials/check-plain.js`. Kõik 29 kontrolli läbisid edukalt: `29 kontrolli OK`.
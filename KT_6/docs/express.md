# C06 — Ülesanne 3: Express — marsruudid ja vahevara

### 1. Päringu ID määramine

Failis `server/middleware.js` loodi funktsioon `requestId()`.
Middleware kontrollib, kas klient saatis päise `X-Request-Id`.
Kui klient saatis oma ID, kasutatakse seda väärtust.
Kui päis puudub või on tühi, genereeritakse uus ID funktsiooniga `randomUUID()`.
ID salvestatakse `req.id` sisse ja lisatakse vastuse päisesse `X-Request-Id`.
Nii saab iga päringu siduda vastava logikirjega.

---

### 2. JSON-päringu keha suuruse piirang

Failis `server/app.js` kasutatakse middleware'i:
```js
app.use(express.json({ limit: '10kb' }));
```

See loeb JSON-päringu keha ja salvestab andmed `req.body` sisse.
Keha suuruse piir on 10 kB.
Kui päringu keha on sellest suurem, tekib viga koodiga `413`.
Viga liigub edasi üldisesse veakäsitlejasse.
Pärast liiga suurt päringut saab server uusi päringuid edasi töödelda.

---

### 3. Vigade edastamine üldisesse veakäsitlejasse

Failis `server/app.js` lisati etteantud `errorHandler()` pärast kõiki marsruute ja `notFound` käsitlejat.
Kasutatakse funktsiooni `simpleResponse()`, mis määrab veale vastava HTTP-koodi ja vastuse keha.
Veakäsitleja võtab vastu neli parameetrit: `err`, `req`, `res` ja `next`.
Express tunneb veakäsitleja ära nelja parameetri järgi.
Asünkroonsete marsruutide vigade edastamiseks kasutatakse etteantud funktsiooni `wrap()`.
Ex3 algses versioonis tekitas vigane sündmuse ID vea koodiga `400`. Ex4 praeguses versioonis kasutatakse selle vea jaoks koodi `422`.
Kui vastuse päised on juba saadetud, antakse viga edasi Expressi järgmisele veakäsitlejale.

---

### 4. Middleware'ide ja marsruutide järjekord
Rakenduse middleware'id ja marsruudid on failis `server/app.js` järgmises järjekorras:
1. `requestId()` — määrab päringule ID ja lisab selle vastuse päisesse. See on esimene, sest ID peab olema olemas ka järgmiste middleware'ide ja võimalike vigade logimisel.
2. `logger(log)` — mõõdab päringu töötlemise aega ja kirjutab logi pärast vastuse lõppu. See asub enne `express.json()` middleware'i, et logida ka vigase või liiga suure JSON-päringuga seotud vead, näiteks `413`.
3. `express.json({ limit: '10kb' })` — loeb JSON-andmed ja kontrollib keha suurust.
4. `express.static()` — võimaldab väljastada staatilisi faile.
5. `/api/events` — sündmuste marsruuter.
6. `/api/orders` — tellimuste marsruuter.
7. `/api/health` — serveri tervisekontroll.
8. `notFound` — tagastab `404`, kui ükski marsruut ei sobi. See asub pärast marsruutereid, et kontrollida kõiki päringuid, millele vastust ei leitud.
9. `errorHandler()` — käsitleb rakenduse käigus tekkinud vigu. See asub ahela lõpus, sest peab vastu võtma ka varasemate middleware'ide ja marsruutide edastatud vead.
Express töötleb middleware'e ja marsruute nende lisamise järjekorras. Seetõttu mõjutab järjekord seda, millised middleware'id päringut töötlevad ja kuidas vead käsitletakse.

---

### 5. Päringu töötlemise aja mõõtmine

Failis `materials/logger.js` on etteantud logimise näidis.
Päringu alguses salvestatakse aeg funktsiooniga `process.hrtime.bigint()`.
Vastuse lõppu kuulatakse sündmusega `res.on('finish')`.
Selle sündmuse käivitumisel arvutatakse päringu töötlemiseks kulunud aeg millisekundites.
Aega ei mõõdeta `next()` ümber, sest `next()` annab juhtimise kohe järgmisele ahela lülile ega oota vastuse valmimist.
Logisse kirjutatakse päringu meetod, URL, vastuse staatus ja töötlemise aeg.

---

### 6. Sündmuste ja tellimuste marsruuterid

Failis `server/routes.js` loodi kaks eraldi Expressi marsruuterit.

`eventsRouter(store)` käsitleb sündmuste päringuid:

- `GET /api/events` — tagastab sündmuste nimekirja.
- `GET /api/events?search=...` — võimaldab otsida sündmusi otsingusõna järgi.
- `GET /api/events/popular` — tagastab populaarse sündmuse.
- `GET /api/events/:id` — tagastab ühe sündmuse ID järgi.
- `PATCH /api/events/:id` — muudab sündmuse andmeid.

`ordersRouter(store)` käsitleb tellimusi:

- `GET /api/orders` — tagastab tellimuste nimekirja.
- `POST /api/orders` — loob uue tellimuse.
- `DELETE /api/orders/:id` — kustutab tellimuse.

Andmete hoidmiseks kasutatakse etteantud `materials/store.js` faili.
See on mälupõhine andmeait ja eraldi andmebaasiühendust ei ole vaja.

---

### 7. Konkreetse ja parameetrilise marsruudi järjekord

Marsruut `GET /popular` lisati enne marsruuti `GET /:id`.
Express valib esimese sobiva marsruudi, mitte tingimata kõige täpsema.
Kui `/:id` oleks enne, käsitleks Express sõna `popular` ID väärtusena.
Seetõttu tagastatakse `/api/events/popular` päringule populaarne sündmus, mitte vigase ID viga.
Kontrollimisel tagastatakse üks sündmus nimega `Talveball`.

---

### 8. HTTP vastusekoodid
Marsruutides kasutatakse järgmisi vastusekoode:
- `201 Created` — tellimus loodi edukalt. Vastuses on tellimuse andmed ja päis `Location`, mis sisaldab loodud tellimuse aadressi.
- `204 No Content` — tellimus kustutati. Vastuse keha on tühi.
- `400 Bad Request` — Ex3 algses versioonis kasutati seda sündmuse ID vale vormingu korral.
- `404 Not Found` — sündmust, tellimust või marsruuti ei leitud.
- `409 Conflict` — sündmus on välja müüdud või vabu kohti ei jätku.
- `422 Unprocessable Content` — tellimuse sisendandmed on vigased või sündmuse ID ei vasta nõuetele. Ex4 praeguses versioonis käsitletakse vigast sündmuse ID-d veana `InvalidInput`, mille vastusekood on `422`.
  
Staatus `409` tähistab olukorda, kus sisendandmed on korrektsed, kuid olemasolev seisund ei võimalda toimingut teha.

---

### 9. Marsruutide kontrollimine curl-käskudega

Marsruutide kontrollimiseks kasutati Windows CMD käsureal `curl.exe` käske.
Käsud saadavad päringuid serverile aadressil `http://localhost:3006`.

**GET-päringud**
```cmd
curl.exe -i http://localhost:3006/api/events
curl.exe -i "http://localhost:3006/api/events?search=kontsert"
curl.exe -i http://localhost:3006/api/events/99
curl.exe -i http://localhost:3006/api/health
curl.exe -i -H "X-Request-Id: minu-id" http://localhost:3006/api/health
```
**POST-päringud**
Uue tellimuse loomine:
```cmd
curl.exe -i -X POST http://localhost:3006/api/orders -H "Content-Type: application/json" -d "{\"event\":3,\"qty\":2}"
```
Vigaste andmetega päring:
```cmd
curl.exe -i -X POST http://localhost:3006/api/orders -H "Content-Type: application/json" -d "{\"event\":\"x\"}"
```
Veel ühe tellimuse loomine:
```cmd
curl.exe -i -X POST http://localhost:3006/api/orders -H "Content-Type: application/json" -d "{\"event\":2,\"qty\":1}"
```
Liiga suure JSON-päringu kontrollimine:
```cmd
curl.exe -i -X POST http://localhost:3006/api/orders -H "Content-Type: application/json" --data-binary "@large.json"
```
**DELETE-päringud**
Tellimuse kustutamine. Kui tellimuse ID on teistsugune, tuleb käsus `9001` asendada tegeliku ID-ga:
```cmd
curl.exe -i -X DELETE http://localhost:3006/api/orders/9001
curl.exe -i -X DELETE http://localhost:3006/api/orders/9001
```
Teist päringut kasutatakse kustutatud tellimuse uuesti kustutamise kontrollimiseks.
**Kontrollimise tulemused**
Päringute abil kontrolliti:
- sündmuste nimekirja ja otsingut;
- üksiku sündmuse päringut;
- tellimuse loomist õigete ja vigaste andmetega;
- tellimuse kustutamist ja juba kustutatud tellimuse uuesti kustutamist;
- liiga suure JSON-päringu tagasilükkamist;
- tervisekontrolli marsruuti;
- päringu ID edastamist `X-Request-Id` päise kaudu.
Päringute vastustest kontrolliti HTTP olekukoode ja vastuse sisu.

---

### Süstitud defektid ja nende tagajärjed
| Defekt                          | Tagajärg                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `express.json()` eemaldati      | `req.body` on `undefined` ja kaheksa kontrolli ebaõnnestuvad.                         |
| `/popular` marsruut eemaldati   | `popular` käsitletakse parameetrina `:id`, seega populaarse sündmuse päring ei tööta. |
| `requestId()` eemaldati         | `X-Request-Id` puudub vastuse päisest ja päringu ID ei ole saadaval.                  |
| `204` asendati `200`-ga         | Vastuse keha oli 11 baiti, kuigi `204 No Content` korral oodatakse 0 baiti.           |
| Kohtade arvu kontroll eemaldati | Välja müüdud sündmusele saab tellimuse teha ja ülemüük läheb läbi.                    |

### Oodatav tulemus

Kontrollimiseks kasutatakse etteantud faili `materials/check-app.js`.
Automaatse kontrolli tulemus oli `27 kontrolli OK`.
Töö näitab, et Expressi rakenduse käitumine sõltub middleware'ide ja marsruutide järjekorrast ning õigesti valitud HTTP vastusekoodidest.
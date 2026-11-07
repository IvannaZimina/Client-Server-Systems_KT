# C06 — Ülesanne 4: Vead ja arendushügieen

### 1. Veaklasside loomine

Failis `server/errors.js` loodi kolm klassi, mis pärivad klassist `RuntimeError`.

| Klass          | HTTP-kood | Tähendus                                     |
| -------------- | --------: | -------------------------------------------- |
| `NotFound`     |       404 | Küsitud kirjet ei leitud.                    |
| `InvalidInput` |       422 | Sisendandmed on vigased.                     |
| `Conflict`     |       409 | Toiming ei ole praeguses seisundis võimalik. |

`RuntimeError` ja funktsioon `isRuntimeError()` pärinevad etteantud failist `materials/runtime-error.js`.
Markeri abil eristatakse oodatavaid käitusvigu programmivigadest.

---

### 2. Funktsioon makeErrorResponse()

Funktsioon `makeErrorResponse({ isDev })` loodi failis `server/errors.js`.
Käitusvea korral kasutatakse vea enda HTTP-koodi ja teadet.
Programmivea korral tagastatakse kood 500 ja üldine teade `Serveri sisemine viga`.
Vastus sisaldab päringu ID-d ja võimaluse korral vea detaili.
Arenduskeskkonnas kuvatakse ka vea pinu (`stack`), tootmiskeskkonnas seda ei avaldata.
Logikirjesse lisatakse vea tüüp, teade, päringu ID ja marsruut.

---

### 3. Parameetri headersSent kontrollimine

Etteantud failis `materials/error-middleware.js` kontrollitakse `res.headersSent` väärtust.
Kui vastus on juba saadetud, ei saa enam muuta selle HTTP-koodi ega saata uut vastust.
Seetõttu antakse viga edasi funktsiooniga `next(err)`, mille järel Expressi vaikimisi veakäsitleja sulgeb ühenduse.

---

**### 4. Veapinu kuvamine**

Arenduskeskkonnas kuvatakse veapinu (`stack`), mis aitab leida vea asukoha koodis.
Tootmiskeskkonnas seda kliendile ei avaldata, sest veapinu võib paljastada failide asukohti, rakenduse sisemist struktuuri ja tehnilisi üksikasju.
Selline teave võib aidata ründajal rakenduse nõrkusi tuvastada.
Programmivea korral tagastatakse kliendile üldine teade `Serveri sisemine viga`, käitusvea korral säilib konkreetne veateade.

---

### 5. Päringu ID kasutamine

Middleware `requestId()` määrab igale päringule ID ja salvestab selle `req.id` sisse. ID lisatakse ka vastuse päisesse.
Sama ID kasutatakse veavastuses ja logikirjes. Nii saab kliendi saadud veateate siduda serveri logiga.

---

### 6. Protsessikaitsed

Etteantud funktsioon `installProcessGuards()` kutsuti välja failis `server/server.js` serveri käivitamise alguses.
See jälgib sündmusi `uncaughtException` ja `unhandledRejection`.

Sellise vea korral salvestatakse logisse vea teave ning protsess lõpetatakse koodiga 1.
Pärast püüdmatut erindit võib rakenduse olek olla määramata ja järgmised päringud võivad anda valesid vastuseid.
Seetõttu ei jätkata serveri tööd. Protsessi taaskäivitamine jääb protsessihalduri ülesandeks.

---

### 7. Konfiguratsiooni kontrollimine

Funktsiooni `readConfig()` kasutatakse failis `server/server.js` enne serveri käivitamist. See kontrollib kohustuslikke keskkonnamuutujaid `DB_URL` ja `SESSION_SECRET` ning pordi `PORT` väärtust.

Vigase või puuduva konfiguratsiooni korral visatakse viga ja serveri käivitamine peatub enne päringute vastuvõtmist. Selline lähenemine järgib põhimõtet *fail fast*: konfiguratsiooniviga avastatakse kohe käivitamisel, mitte alles pärast seda, kui server on juba mõnda aega tootmiskeskkonnas töötanud.

---

### 8. Serveri käivitamine ja skriptid

Failis `server/server.js` loodi andmehoidla funktsiooniga `createStore()` ja Expressi rakendus funktsiooniga `createApp()`.
Algandmed loetakse failist `materials/events.json`.
Faili `package.json` lisati järgmised skriptid:

- `start` — serveri tavaline käivitamine;
- `dev` — serveri käivitamine automaatse taaskäivitamisega;
- `test` — Node.js testimisvahendi käivitamine;
- `audit` — sõltuvuste turvakontroll.

---

### 9. Node.js sisseehitatud tööriistad

Eraldi pakettide asemel kasutati Node.js ja npm sisseehitatud võimalusi.

| Tööriist                 | Asendus                                 |
| ------------------------ | --------------------------------------- |
| `nodemon`                | `node --watch`                          |
| `dotenv`                 | `node --env-file=.env`                  |
| `uuid`                   | `node:crypto` funktsioon `randomUUID()` |
| Eraldi testimisraamistik | `node:test`                             |

Sõltuvuste paigaldamiseks kasutati käsku `npm ci`, mis paigaldab paketid `package-lock.json` faili järgi.

---

### 10. Käitusvea ja programmivea erinevus

|             | Käitusviga                                                   | Programmiviga                                                         |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| Näide       | Puuduv kirje, vigased sisendandmed                           | `undefined.foo`, programmeerimisviga                                  |
| Oodatav?    | Jah                                                          | Ei                                                                    |
| Käsitlemine | Veakood ja teade tagastatakse kliendile. Server jätkab tööd. | Expressi kaudu käsitlemisel tagastatakse HTTP 500 ja üldine veateade. |
| Kliendile   | Konkreetne veateade                                          | `Serveri sisemine viga`                                               |

Püüdmatute vigade (`uncaughtException` ja `unhandledRejection`) korral logitakse vea teave ning protsess lõpetatakse koodiga 1.
Seda käsitleb funktsioon `installProcessGuards()`.

---

### Kontrollimise tulemused

Server käivitati edukalt käsuga `node --env-file=.env server/server.js`. Sõltuvuste puhas paigaldamine käsuga `npm ci` õnnestus.
Tehti järgmised HTTP-päringud:

| Päring                | Tulemus | Kontroll                                                           |
| --------------------- | ------: | ------------------------------------------------------------------ |
| `GET /api/health`     |     200 | Tagastati `{"status":"ok"}`.                                       |
| `GET /api/events`     |     200 | Tagastati neli sündmust.                                           |
| `GET /api/events/999` |     404 | Tagastati teade `Sündmust ei leitud`.                              |
| `GET /api/events/abc` |     422 | Tagastati teade `Vigane sündmuse ID`.                              |
| `POST /api/orders`    |     409 | Täielikult müüdud sündmusele uue tellimuse lisamine lükati tagasi. |

Kontrollitud käitusvigade vastustes sisaldusid päringu ID ja vea detailid.
Arenduskeskkonnas lisati vastustele ja logikirjetele ka `stack`.
`headersSent` kontrolli katsetamiseks lisati ajutine marsruut, mis saatis osa vastusest ja tekitas seejärel vea.
Kontrollimisel tagastati algne HTTP-kood 200 ning Express sulges ühenduse ilma teist vastust saatmata.
Pärast katset eemaldati ajutine marsruut failist `server/app.js`.
Etteantud failid `materials/runtime-error.js`, `materials/error-middleware.js` ja `materials/process-guards.js` jäid muutmata.
Käsk `npm test` käivitus edukalt, kuid projektis testifaile ei leitud. Seetõttu käivitati 0 testi.
Käsk `npm run audit` lõpetas kontrolli tulemusega `found 0 vulnerabilities`. Sõltuvustes teadaolevaid turvaauke ei leitud.
Tootmiskeskkonnas kontrolliti päringut "`GET /api/events/999`".
Vastus oli 404 ning sisaldas päringu ID-d ja vea detaili, kuid mitte `stack`-välja.
Serveri logikirjes kasutati sama päringu ID-d.
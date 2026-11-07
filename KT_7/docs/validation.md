# C07 — Ülesanne 4: Valideerimine ja ühtne veavorming

## 1. Kirjutada OrderSchema koos .strict()-iga ja kontrollida iga piirangut eraldi.

Failis `server/validate.js` loodi skeem `OrderSchema`, kasutades `.strict()` meetodit.
Igale väljale määrati eraldi piirangud:
- `event` — positiivne täisarv;
- `qty` — täisarv vahemikus 1 kuni 10;
- `buyer` — vähemalt kahe märgiga sõne, mille algusest ja lõpust eemaldatakse tühikud;
- `email` — korrektne e-posti aadress.

Tundmatud väljad lükatakse `.strict()` abil tagasi.
Lisaks loodi sündmuse muutmise skeem `EventChange`. See nõuab vähemalt ühe välja olemasolu.
Tühi objekt lükatakse tagasi, ühe korrektse välja muutmine võetakse vastu.

## 2. Mitte kasutada päringu kehas coerce'i: sõne arvuväljal on kliendi viga, mitte meie mure.

`OrderSchema`-is tüübiteisendust ei kasutata.
Arvuväljade jaoks kasutatakse `z.number()` ja `z.number().int()` koos vastavate vahemikupiirangutega.
Sõneväärtust `"2"` ei teisendata välja `qty` puhul arvuks ning see lükatakse vale andmetüübina tagasi.
Seega kontrollib skeem tegelikult saadetud väärtuse tüüpi ega püüa kliendi viga automaatselt parandada.

## 3. Kasutada päringustringis coerce'i ja säilitada Ex3 reeglid: vigane filter või sort annab 422, vigane page või per saab vaikeväärtuse.

`ListQuery`-s rakendati arvuliste parameetrite teisendamine `z.coerce.number()` abil.
Sorteerimiseks ja filtreerimiseks kasutatakse Ex3-s määratud lubatud välju. Tundmatud parameetrid eemaldatakse `.strip()` abil.
Kontrollimiseks käivitati käsk:

```cmd
node --input-type=module -e "import { ListQuery } from './server/validate.js'; console.log('Teisendamine:', ListQuery.parse({ page: '3', per: '10', min_price: '20', sort: '-free', extra: 'x' })); console.log('Vaikevaartused:', ListQuery.parse({ page: 'abc', per: '0' })); console.log('Vigane filter:', ListQuery.safeParse({ min_price: 'abc' }).success); console.log('Vigane sort:', ListQuery.safeParse({ sort: 'password' }).success);"
```

Tulemus:

```text
Teisendamine: { sort: '-free', min_price: 20, page: 3, per: 10 }
Vaikevaartused: { page: 1, per: 20 }
Vigane filter: false
Vigane sort: false
```

Tulemus kinnitab sõnena esitatud arvude teisendamist, vaikeväärtuste kasutamist vigaste `page` ja `per` väärtuste korral ning vigaste filtrite ja sortimisväljade tagasilükkamist.

## 4. Kontrollida, et neli vigast välja annavad NELI kirjet, mitte ühe.

Kontrollimiseks anti korraga neli vigast väärtust: `{ event: -1, qty: 0, buyer: 'M', email: 'x' }`.
Funktsioon `zodFields()` tagastas neli viga:

1. `event` — `Too small: expected number to be >0`
2. `qty` — `Too small: expected number to be >=1`
3. `buyer` — `Too small: expected string to have >=2 characters`
4. `email` — `Invalid email address`

Kõik neli viga saadi korraga.

## 5. Kasutaja ei tohi parandada nelja välja neljas eri päringus.

Väljade vigade kogumiseks kasutatakse etteantud funktsiooni `zodFields` failist `server/zod-fields.js`.
See kogub valideerimise käigus tekkinud vead väljade kaupa, nii et kasutaja saab kõik tuvastatud vead ühe vormi saatmisega, mitte ei pea iga välja eraldi parandama.

## 6. Luua ühtne veavorming: err inimesele, code masinale, fields vormile.

Failis `server/validate.js` loodi funktsioon `errorShape()`.
See moodustab ühtse veavormingu:
- `err` — kasutajale mõeldud teade;
- `code` — veakood;
- `fields` — vormi üksikute väljade vead;
- `detail` — täiendav teave, kui see on edastatud.

Lisaks loodi objekt `ERROR_CODES`, mis määrab veakoodide ja HTTP-olekukoodide vastavused.

## 7. Suunata Ex1 teenuse vead läbi errorShape(): serviceErrorHandler peab tagastama ka 404 ja 409 koos koodiga.

Funktsioonis `serviceErrorHandler()` realiseeriti Ex1 `ServiceError`-vigade teisendamine ühtsesse vormingusse funktsiooni `errorShape()` abil.
Määrati järgmised vastavused:
- `not_found` → `NOT_FOUND` → 404;
- `conflict` → `CONFLICT` → 409;
- `invalid` → `INVALID_INPUT` → 422;
- `unauthenticated` → `UNAUTHENTICATED` → 401;
- `forbidden` → `FORBIDDEN` → 403.

Valmis testis kontrolliti viga `not_found` olekukoodiga 404 ja koodiga `NOT_FOUND` ning viga `forbidden` olekukoodiga 403 ja koodiga `FORBIDDEN`.
Vastavus `conflict` → 409 on veakäsitlejas realiseeritud, kuid seda ei kontrollitud testis eraldi.

## 8. Tõestada testiga, et etteantud funktsioon validate() ASENDAB req.body — muidu on kogu kontroll mõttetu.

Failis `server/validate.js` eksporditakse etteantud funktsioon `validate` failist `server/validate-middleware.js`.
Kontrollimiseks käivitati käsk:
```cmd
node materials\check-validate.js
```

Tulemus:
```text
43 kontrolli OK
```

Test kontrollib, et pärast edukat valideerimist asendatakse `req.body` kontrollitud andmetega.
Näiteks eemaldatakse välja `buyer` väärtuse algusest ja lõpust tühikud ning tulemuseks on `Mari`.
Samuti kontrollitakse, et vigased andmed annavad vastuse 422 ega jõua järgmise middleware'ini.

## 9. Näidata, et sümbolid < ja reavahetused JÄÄVAD alles: XSS-kaitse on VÄLJUNDIS, mitte sisendis.

Failis `server/validate.js` loodi funktsioon `cleanText()`.
See eemaldab juhtmärgid, normaliseerib reavahetused ja eemaldab sõne algusest ning lõpust tühikud, kuid säilitab HTML-sümbolid.
Kontrollimiseks käivitati käsk:
```cmd
node --input-type=module -e "import { cleanText } from './server/validate.js'; const input = '  <b>Sügis</b>\r\nTeine\u0001rida  '; const output = cleanText(input); console.log('Sisend:', JSON.stringify(input)); console.log('Valjund:', JSON.stringify(output));"
```

Tulemus:
```text
Sisend: "  <b>Sügis</b>\r\nTeine\u0001rida  "
Valjund: "<b>Sügis</b>\nTeinerida"
```

Tulemus näitab, et HTML-sildid `<b>` ja `</b>` säilisid, reavahetus normaliseeriti kujule `\n`, juhtmärk eemaldati ning sõne algusest ja lõpust eemaldati tühikud.
See kinnitab, et HTML-sisu ei eemaldata sisendi töötlemise etapis. XSS-kaitse tuleb rakendada andmete väljastamisel.

## 10. COMMIT: teha commit slaidil „Kommitid“ antud käsuga.

Ülesande kontrollimine on tehtud:
```cmd
node materials\check-validate.js
```
Tulemus: `43 kontrolli OK`.

Commit on veel tegemata. Selle jaoks tuleb kasutada slaidil „Kommitid“ antud käsku.
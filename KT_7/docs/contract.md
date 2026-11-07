# C07 Ex5 — OpenAPI leping ja lepingutestid

## 1. Kirjuta checkSchema(): puuduva KOHUSTUSLIKU välja korral on tegemist veaga, ka siis, kui selle väärtus on null.

Failis `server/contract.js` loodi funktsioon `checkSchema()`.
Funktsioon kontrollib, kas kõik skeemis määratud kohustuslikud väljad on olemas.
Kui kohustuslik väli puudub, tagastatakse veateade.
Kohustusliku välja väärtus ei tohi olla `null`. Funktsioon kontrollib ka väljade andmetüüpe.

---

## 2. Ja teine suund: lepingus PUUDUV väli on samuti viga.

Funktsioon `checkSchema()` kontrollib vastuse objekti iga välja.
Kui välja nimi puudub `schema.fields` loetelust, tagastab funktsioon veateate:
```text
lepingus puuduv väli: passwordHash
```

---

## 3. Kontrolli, et passwordHash lisamine vastusesse KUKUB testi läbi.

Failis `materials/check-contract.js` kontrollitakse välja `passwordHash` lisamist sündmuse objektile:
```js
L.checkSchema(L.CONTRACT, 'Event', {
  ...EVENT,
  passwordHash: 'x'
})
```
Kontrolli oodatav tulemus:
```js
['lepingus puuduv väli: passwordHash']
```

Käsu käivitamisel:
```cmd
node materials\check-contract.js
```
läbis kontrollskript kõik testid. Test kinnitas, et lepingus puuduv lisaväli lükatakse tagasi.

---

## 4. Lisa nõutud päiste kontroll: 201 ilma Location-ita ei tohi läbi minna.

Funktsioonile `checkResponse()` lisati vastuse päiste kontroll.
Leping nõuab päist `Location` vastuses 201 päringule `POST /orders`.
Kui päis puudub, tagastatakse veateade:
```text
puudub nõutud päis: Location
```
Päiste nimede võrdlemisel ei arvestata suur- ja väiketähtedega.

---

## 5. VIHJE: integer sobib number-väljale, aga mitte vastupidi.

Funktsioonis `checkSchema()` rakendati arvväärtuste kontrolli vastavalt välja tüübile.
Näiteks võib pileti hind olla täisarv `24` või kümnendmurd `24.5`.
Kohtade arv peab olema täisarv, näiteks `420`.
Väärtus `420.5` ei ole selle välja jaoks lubatud.
Andmetüüpide kontrollimisel kasutatakse funktsiooni `toType()` failist `materials/api-schemas.js`.

---

## 6. Kirjuta createMock(), mis ehitab vastuse LEPINGUST, ja kontrolli ringi: mocki vastus peab ISE lepingutesti läbima.

Loodi funktsioon `createMock()`, mis saab marsruudid, HTTP-meetodid, vastuse olekukoodid, kohustuslikud päised ja skeemide nimed otse lepingust.
Vastuse keha moodustatakse automaatselt vastava skeemi väljade ja tüüpide põhjal.
Kolme skeemi `Event`, `List` ja `Order` puhul kasutatakse funktsioonile antud näidisandmeid.
Ülejäänud skeemide väärtused moodustatakse väljade tüüpide järgi: stringide väärtus on `example`, täisarvude ja arvude väärtus `1`, massiivide väärtus `[]` ning objektide väärtus `{}`.
Vastuse 201 korral lisatakse automaatselt kohustuslik päis `Location`.
Tundmatu marsruudi korral tagastatakse olekukood 404.
Lisaks kontrolliti, et mock-vastuse `GET /events/{id}` keha läbib funktsiooni `checkSchema()` kontrolli.

---

## 7. Kirjuta changeKind(); päringust eemaldamise liigi otsustab sinu Ex4 OrderSchema.

Loodi funktsioon `changeKind()`, mis määrab muudatuse mõju.
- Välja lisamine vastuses: `safe`.
- Välja eemaldamine vastusest: `BREAKING`.
- Valikulise välja lisamine päringusse: `safe`.
- Kohustusliku välja lisamine päringusse: `BREAKING`.
- Välja eemaldamine päringust: `BREAKING`.
- Andmetüübi muutmine: `BREAKING`.
Päringu kontroll on range, sest Ex4 `OrderSchema` kasutab meetodit `.strict()`.

---

## 8. Kirjuta compareContracts() ja jooksuta ta nelja muudatuse peal, üks neist tüübi muutus.

Loodi funktsioon `compareContracts()`, mis võrdleb kahe lepingu skeeme ning leiab lisatud, eemaldatud ja muudetud väljad.
Kontrolliti järgmisi muudatusi:

| Skeem    | Väli    | Muudatus                               | Tulemus  |
| -------- | ------- | -------------------------------------- | -------- |
| Event    | image   | Valikulise välja lisamine              | safe     |
| NewOrder | coupon  | Kohustusliku välja lisamine            | BREAKING |
| List     | pages   | Välja eemaldamine                      | BREAKING |
| Order    | receipt | Kohustusliku välja lisamine vastusesse | safe     |
| NewOrder | note    | Välja eemaldamine päringust            | BREAKING |
| Event    | price   | Tüübi muutmine number → string         | BREAKING |
Tulemus: kokku 4 ühildumatut muudatust.

---

## 9. Kirjuta docs/orders.http lepingu järgi: kolm POST /orders, vastustega 201, 422, 409.

Failis `docs/orders.http` koostati kolm päringut `POST /orders`.
1. Edukas tellimus: oodatav vastus 201 Created.
2. Vigane tellimus, mille `qty` väärtus on 0: oodatav vastus 422.
3. Tellimus üritusele, mille kõik kohad on välja müüdud: oodatav vastus 409 Conflict.
Kõik päringud kasutavad lepingu `NewOrder` skeemis määratud välju.
Vastuse 201 korral nõuab leping päist `Location`.

---

### Kontrollimine

Käivitati etteantud kontrollskript:
```cmd
node materials\check-contract.js
```

Tulemus:
```text
32 kontrolli OK
```
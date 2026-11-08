# Ülesanne 3 — Repositoorium ja CRUD

## 1 Vaata, mis tüüpi on price enne ja pärast rowToEvent-i
Enne `rowToEvent()` teisendust:
- `price = "15.00"`
- `typeof price = "string"`
Pärast `rowToEvent()` teisendust:
- `price = 15`
- `typeof price = "number"`

---

## 2 Proovi muuta olematut rida ja muuta olemasolevat SAMA väärtusega
| Katse                          | Tulemus                                 |
| ------------------------------ | --------------------------------------- |
| `update(999999, { price: 1 })` | `null`                                  |
| `update(1, { price: 15 })`     | Tagastab sündmuse objekti, `price = 15` |
Olematu rea muutmine annab `null`. Sama väärtusega muutmine tagastab objekti, mitte `null`.

---

## 3 Seleta KAKS asja: mis läheks katki, kui iga meetod teisendaks rea ise, mitte rowToEvent; miks price saab arvuks repositooriumis, mitte kliendis
Kui iga meetod teisendaks andmebaasi rida ise, tekiks korduv kood ja meetodid võiksid tagastada erineva kujuga objekte. `rowToEvent()` tagab ühtse teisenduse.
`price` teisendatakse repositooriumis arvuks, sest andmebaas tagastab DECIMAL-väärtuse tekstina.
Rakendus saab seega kasutada hinda arvutustes arvuna, mitte tekstina.

---

## 4 Tee tabel VIIEST väljast: kuju baasis, kuju rakenduses, miks
| Väli         | Kuju baasis                | Kuju rakenduses      | Miks                    |
| ------------ | -------------------------- | -------------------- | ----------------------- |
| `starts_at`  | `starts_at`                | `startsAt`           | JavaScripti domeeninimi |
| `seat_count` | `seat_count`               | `seatCount`          | JavaScripti domeeninimi |
| `price`      | DECIMAL, näiteks `"15.00"` | Number, näiteks `15` | Arvutuste tegemiseks    |
| `venue_name` | JOIN-i tulemus             | `venue.name`         | Pesastatud objekt       |
| `venue_city` | JOIN-i tulemus (`address`) | `venue.city`         | Pesastatud objekti väli |

---

## 5 VIHJE: kui update() võtab veerunime kasutajalt, on see sama auk mis Ex2
`update()` kasutab lubatud väljade nimekirja.
Tundmatu väli, näiteks `password_hash`, ei jõua SQL-päringusse ega tekita viga.
Testi tulemus: `update(id, { password_hash: "x" })` tagastas sündmuse objekti, hind jäi `21`.

---

## 6 Kirjuta kõik kuus meetodit ja jooksuta check-repo.js
Rakendatud meetodid:
- `findAll({...})` — otsing, sortimine ja lehekülgede kaupa lugemine andmebaasis.
- `readTotal({...})` — koguarvu lugemine eraldi päringuga.
- `findById(id)` — sündmuse otsimine ID järgi; olematu sündmus annab `null`.
- `add({...})` — sündmuse lisamine ja terve objekti tagastamine.
- `update(id, change)` — osaline muutmine lubatud väljade nimekirja alusel.
- `remove(id)` — kustutamine; teine kustutamine annab `false`.
`node materials/check-repo.js` → 32 kontrolli OK.

---

## 7 Kirjuta docs/repository.md koos mõõdetud käitumisega
| Kontroll                             | Tulemus                        |
| ------------------------------------ | ------------------------------ |
| `price` enne teisendamist            | `"15.00"`, `string`            |
| `price` pärast teisendamist          | `15`, `number`                 |
| `findById(999999)`                   | `null`                         |
| `update(999999, { price: 1 })`       | `null`                         |
| `update(1, { price: 15 })`           | Sündmuse objekt                |
| `update(id, { password_hash: "x" })` | Tundmatu väli ei jõudnud SQL-i |
| `remove(id)`                         | `true`                         |
| `remove(id)` teist korda             | `false`                        |


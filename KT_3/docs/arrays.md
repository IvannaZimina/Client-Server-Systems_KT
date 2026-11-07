# Ülesanne 2 — Massiivid ja objektid

## 1. Kirjuta `available`, `list`, `findById`, `revenue`, `anyFree` ja `allSoldOut`.

Failis `public/stats.js` on kuus funktsiooni, mis kasutavad erinevaid massiivi meetodeid.

| Funktsioon     | Meetod     | Tulemus                               |
| -------------- | ---------- | ------------------------------------- |
| `available()`  | `filter()` | Massiiv vabadest kohtadest            |
| `list()`       | `map()`    | Uus massiiv täiendatud sündmustega    |
| `findById()`   | `find()`   | Esimene sobiv sündmus või `undefined` |
| `revenue()`    | `reduce()` | Müügitulu kokku                       |
| `anyFree()`    | `some()`   | `true` või `false`                    |
| `allSoldOut()` | `every()`  | `true` või `false`                    |

Iga meetod annab erineva tulemuse. `filter()` ja `map()` tagastavad massiivi, `find()` ühe elemendi ning `reduce()` ühe arvutatud väärtuse. `some()` ja `every()` tagastavad tõeväärtuse.

## 2. `list` arvutab iga sündmuse kohta vabad kohad ja täitumuse protsendina.

Funktsioon `list()` kasutab `map()` meetodit. Iga sündmuse kohta luuakse uus objekt, millele lisatakse `freeSeats` ja `fillPercentage`.

Näide tulemusest:

| Väli             | Tulemus |
| ---------------- | ------- |
| `seats`          | `5`     |
| `sold`           | `2`     |
| `freeSeats`      | `3`     |
| `fillPercentage` | `40`    |

Algne andmestik jääb muutmata.

## 3. Kirjuta `sortBy(rows, field, dir)`, mis EI muuda kutsuja massiivi.

Funktsioon `sortBy()` kasutab algse massiivi kopeerimiseks `[...rows]` ja sortimiseks `sort()` meetodit.

Sorteerimine toimub valitud välja järgi. Vaikimisi kasutatakse kasvavat järjestust (`asc`). Kahaneva järjestuse jaoks kasutatakse `desc`.

Näiteks arvude sortimisel saadakse tulemus `[1, 9, 10]`.

## 4. Anna võrdsetele elementidele stabiilne järjestus id järgi.

Kui sorteeritava välja väärtused on võrdsed, kasutatakse järjestamiseks `id` välja kasvavas järjekorras.

Kui ka `id` väärtused on võrdsed, säilib elementide algne järjestus.

## 5. VIHJE: `[...rows].sort(...)` — muidu muutub kutsuja andmestik tema selja taga.

JavaScripti `sort()` muudab algset massiivi. Selle vältimiseks tehakse enne sortimist koopia.

Tavaline `[10, 9, 1].sort()` annab tulemuseks `[1, 10, 9]`, sest vaikimisi sorteeritakse väärtusi sõnedena.

Funktsioonis `sortBy()` kasutatakse koopiat ja väärtuste võrdlemist. Seetõttu jääb algne massiiv muutmata.

## 6. Kirjuta `summary`, mis destruktureerib, nimetab ümber ja annab vaikeväärtuse.

Funktsioon `summary()` kasutab objekti destruktureerimist.

Väli `name` nimetatakse ümber muutujaks `eventName`. Välja `price` väärtusele antakse vaikeväärtus `10` ja välja `venue` vaikeväärtus on `"Unknown"`.

Näiteks puuduva hinna korral kasutatakse väärtust `10`.

## 7. Kirjuta `organizerName` ja `seatsText`, kasutades `?.` ja `??` operaatoreid.

`organizerName()` kasutab `?.` operaatorit, et kontrollida korraldaja nime ka juhul, kui `organizer` puudub.

`seatsText()` kasutab `??` operaatorit. Puuduva väärtuse korral tagastatakse `"?"`, kuid väärtus `0` säilib.

Tulemused:

| Funktsiooni väljakutse                           | Tulemus                 |
| ------------------------------------------------ | ----------------------- |
| `organizerName({ organizer: { name: "Mari" } })` | `"Mari"`                |
| `organizerName({})`                              | `"Teadmata korraldaja"` |
| `seatsText({ seats: 0 })`                        | `"0 kohta"`             |
| `seatsText({})`                                  | `"? kohta"`             |

Operaator `||` ei sobi siin, sest see käsitleks ka nulli väärtust puuduva väärtusena.

## 8. Kirjuta `pack` ja `unpack`; vigane JSON EI TOHI lehte tappa.

Funktsioon `pack()` kasutab `JSON.stringify()` ja `unpack()` kasutab `JSON.parse()`.

Mõlemas funktsioonis kasutatakse `try...catch` konstruktsiooni, et vigase sisendi korral ei tekiks töötlemata viga.

Näited:

| Funktsioon            | Tulemus       |
| --------------------- | ------------- |
| `pack({ a: 1 })`      | `"{\"a\":1}"` |
| `unpack("{\"a\":1}")` | `{ a: 1 }`    |
| `unpack("bad")`       | `null`        |

JSON-i teisendamisel säilib `null`, kuid objekti omaduse väärtus `undefined` jäetakse täielikult välja. Massiivis asendatakse `undefined` väärtus `null`-iga.

## 9. Tee `allSoldOut` nii, et tühi valik EI OLE välja müüdud; kirjuta tulemused üles.

Funktsioon `allSoldOut()` kasutab `every()` meetodit. Enne kontrollimist vaadatakse, kas massiiv on tühi.

Tulemused:

| Funktsiooni väljakutse                | Tulemus |
| ------------------------------------- | ------- |
| `allSoldOut([])`                      | `false` |
| `allSoldOut([{ seats: 2, sold: 2 }])` | `true`  |
| `allSoldOut([{ seats: 2, sold: 1 }])` | `false` |

Tühi massiiv annab meetodi `every()` kasutamisel tulemuseks `true`. Seetõttu on vaja tühja massiivi eraldi kontrollida.

Ülemüüdud sündmuse korral kasutatakse samuti tingimust `seats - sold <= 0`.

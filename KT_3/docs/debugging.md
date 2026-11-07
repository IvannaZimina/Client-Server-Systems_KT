# Ülesanne 1 — Keel, ulatus ja silumine

## 1. Loo `public/format.js` ja kirjuta viis funktsiooni `const`-vaikevalikuga.

Failis `public/format.js` on viis funktsiooni:

- `freeText(free = 0)` — kontrollib vabade kohtade arvu.
- `price(tier = "standard", qty = 1, ...extras)` — arvutab pileti hinna ja lisakulud.
- `withVat(sum = 0, vatRate = 0.22)` — lisab summale käibemaksu.
- `createCart()` — loob ostukorvi objekti, mille sisemine massiiv ei ole väljast nähtav.
- `seatLabel(row = 1, nr = 1, separator = "-")` — vormindab koha numbri.

Funktsioonide parameetritele on määratud vaikeväärtused. Täpsem teostus asub failis `public/format.js`.

## 2. `freeText` eristab kolme juhtu: 0, positiivne arv ja vigane sisend.

Funktsiooni tulemused:

| Sisend           | Tulemus           |
| ---------------- | ----------------- |
| `freeText(0)`    | `"välja müüdud"`  |
| `freeText(5)`    | `"5 vaba"`        |
| `freeText(-1)`   | `"vigane sisend"` |
| `freeText("5")`  | `"vigane sisend"` |
| `freeText(null)` | `"vigane sisend"` |
| `freeText(NaN)`  | `"vigane sisend"` |

`freeText(undefined)` kasutab vaikeväärtust `0` ja tagastab `"välja müüdud"`.

## 3. `price` viskab tundmatu hinnaklassi peale `RangeError`-i, mitte ei anna `NaN`.

Hinnaklasside kontrollimiseks kasutatakse `Object.hasOwn(priceTiers, tier)`.

| Funktsiooni väljakutse | Tulemus      |
| ---------------------- | ------------ |
| `price("standard", 1)` | `10`         |
| `price("vip", 2, 3)`   | `53`         |
| `price("child", 1)`    | `5`          |
| `price("toString")`    | `RangeError` |

`Object.hasOwn()` kontrollib ainult objekti enda omadusi. Operaator `in` kontrollib ka prototüübi omadusi. Seetõttu on `Object.hasOwn()` siin sobivam.

## 4. `createCart` tagastab objekti, mille sisemine massiiv jääb väljast nähtamatuks.

Funktsioonis `createCart()` luuakse massiiv `rows`, mida kasutatakse ainult tagastatud objekti meetodites.

- `add()` lisab uue elemendi.
- `getRows()` tagastab massiivi koopia.
- `getCount()` tagastab elementide arvu.

See on sulundi (_closure_) näide. Massiiv jääb funktsiooni sisse ega ole väljast otse muudetav.

## 5. VIHJE: kontrolli `=== 0`, mitte `!free` — null on väär ja haru läheb valeks.

JavaScriptis on `0` ja `null` falsy-väärtused. Tingimus `!free` annab mõlemal juhul tulemuseks `true`.

Seetõttu kasutatakse kontrolli `free === 0`. Nii eristatakse täpselt nulli teistest vigastest sisenditest.

## 6. Jooksuta `scopeDemo(3)` ja kirjuta mõlemad massiivid täpselt üles.

Funktsiooni `scopeDemo(3)` tulemus:

| Massiiv | Tulemus     |
| ------- | ----------- |
| `var_`  | `[3, 3, 3]` |
| `let_`  | `[0, 1, 2]` |

`var` on funktsiooni ulatusega. `let` on ploki ulatusega. Seetõttu on massiivide tulemused erinevad.

## 7. Jooksuta `comparisons()` ja `prototypeChain()`; pane mõlema tulemused tabelisse.

### `comparisons()` tulemused

| Võrdlus              | Tulemus |
| -------------------- | ------- |
| `0 == ""`            | `true`  |
| `0 === ""`           | `false` |
| `"6" == 6`           | `true`  |
| `null == undefined`  | `true`  |
| `null === undefined` | `false` |
| `NaN === NaN`        | `false` |

Operaator `==` lubab tüübiteisendust. Operaator `===` võrdleb väärtust ja tüüpi ilma automaatse teisenduseta. `NaN` ei ole võrdne iseendaga.

### `prototypeChain()` tulemused

| Väli               | Tulemus      |
| ------------------ | ------------ |
| `chain`            | `true`       |
| `class_type`       | `"function"` |
| `this_with_object` | `"VIP"`      |
| `this_detached`    | `TypeError`  |

`Child.prototype` pärineb `Base.prototype`-ist. Objekti kaudu kutsutud meetodis on `this` väärtus `"VIP"`. Eraldi kutsutud meetodis tekib `TypeError`.

## 8. Pane tingimuslik katkestuspunkt, mis peatab ainult `tier === "vip"` korral.

Tingimuslik katkestuspunkt tuleb seada funktsiooni `price()` sisse, näiteks reale `return total;`.

Tingimus:

```javascript
tier === "vip";
```

Katkestuspunkti juures saab kontrollida väärtusi `tier`, `qty`, `extras` ja `total`.

Näiteks `price("vip", 2, 3)` korral on koguhind `53`.

## 9. Kirjuta `docs/debugging.md`: ulatus, võrdlemine, sulund ja PROTOTÜÜBIAHEL.

**Ulatus (_scope_)**

`var` on funktsiooni ulatusega. `let` ja `const` on ploki ulatusega.

**Võrdlemine (_comparison_)**

`==` lubab tüübiteisendust. `===` võrdleb väärtust ja tüüpi. `NaN` kontrollimiseks kasutatakse `Number.isNaN()`.

**Sulund (_closure_)**

Sulund võimaldab kasutada välise funktsiooni muutujaid ka pärast funktsiooni töö lõppu. Näiteks `createCart()` kasutab seda massiivi `rows` peitmiseks.

**PROTOTÜÜBIAHEL (_prototype chain_)**

Prototüübiahel näitab objektide pärimist. Selles ülesandes on ahel järgmine: `Child.prototype` → `Base.prototype` → `Object.prototype` → `null`.

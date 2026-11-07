# Ülesanne 2 — Lubadused ja async/await ★★★

### 1. Jooksuta ette antud `chain()` ja kirjuta tema jälg üles — see on ETALON.

Etalonahela jälg on `sain sündmuse`, `lisasin hinna`, `finally`.
Tulemuseks saadakse objekt id-ga 1, sündmuse nimega `Sügiskontsert`
ja hinnaga 24.

---

### 2. Kirjuta `chainWithAwait()`, mis annab TÄPSELT sama jälje ja sama tulemuse.

`chainWithAwait()` annab sama jälje ja sama sündmuse tulemuse nagu `chain()`.
`try`, `catch` ja `finally` annavad samasuguse käitumise nagu lubaduste ahel.

---

### 3. Näita jälje pealt, et `finally` EI MUUDA väärtust, kuigi ta midagi tagastab.

Jälg on `sain sündmuse`, `lisasin hinna`, `finally`; järgmine tulemus sisaldab
endiselt sündmust `Sügiskontsert` ja hinda 24. `finally`-s antud väärtus
ignoreeritakse ning eelmine väärtus säilib.

---

### 4. Tõesta, et `async` funktsioon tagastab lubaduse ka siis, kui ta tagastab arvu.

Kontroll `const r = (async () => 42)()` annab `r instanceof Promise: true` ja
`await r: 42`. `async` funktsioon pakib arvu automaatselt lubaduse sisse.

---

### 5. VIHJE: lahknev jälg tähendab, et üks kahest ei tee seda, mida sa arvad.

`chain()` ja `chainWithAwait()` jäljed peavad olema samad.
Erinev jälg näitab, et üks kahest lahendusest ei tööta
oodatud viisil. Võrdluse abil saab kontrollida `await`-i,
veahalduse ja `finally` käitumist.

---

### 6. Mõõda kolm 80 ms tööd järjest ja korraga; kirjuta mõlemad ajad üles.

Järjestikune töö kestis 280 millisekundit, sest iga 80 millisekundiline
viivitus algab pärast eelmist. Mõõdetud korraga tehtud töö aeg oli 93
millisekundit, sest kolm tööd käivitatakse korraga.

---

### 7. Arvuta, mitu korda vahe on, ja seleta, miks summa vs maksimum.

Ajad erinevad 3,01 korda (`280 / 93 = 3,01`). Järjestikune aeg on viivituste
summa. `Promise.all` ootab kõige aeglasemat tööd, sest sõltumatud tööd
käivitatakse korraga.
Tegelik mõõdetud aeg võib olla veidi suurem taimerite ja programmi täitmise lisakulu tõttu.

---

### 8. Jooksuta `settleAll()` ühe kukkujaga ja näita, mis `all`-iga kaoks.

`settleAll()` tagastab eraldi `fulfilled`- ja `rejected`-massiivid. Seetõttu
säilivad `seatmap` ja `prices`, kuigi `soodustused` ebaõnnestub.
`Promise.all` lükkaks kogu lubaduse ühe vea tõttu tagasi.

```javascript
Timeout: Ajalõpp 50 ms
Kohe pärast timeout-i: 0
Pärast algse töö lõppu: 1
```

---

### 9. Jooksuta `withTimeout()` ja näita mõõtes, mida ta EI tee.

`withTimeout()` võrdleb tegelikku tööd ajalõpu lubadusega. Liiga aeglane töö
annab vea `Ajalõpp 50 ms`. Mõõtmisel lõppes aeglane töö pärast ajalõpu viga ja
loendur muutus väärtuseks `1`; seega algset tööd ei katkestata. Kiire töö
tagastab oma väärtuse.

---

## Oodatav tulemus

## Järjest või korraga - kolm sõltumatut 80 ms tööd

| viis                       | aeg    |
|----------------------------|-------:|
| for + await sees (järjest) | 280 ms |
| Promise.all (korraga) | 93 ms |

3,01 KORDA. Järjest võtab SUMMA, korraga võtab MAKSIMUMI.

## allSettled - üks kukkuja ei kaota teisi

```text
fulfilled: ["seatmap", "prices"]
rejected:  ["soodustused kukkusid"]
```

`Promise.all`-iga lükataks kogu tulemus ühe vea tõttu tagasi.
Seetõttu ei saaks õnnestunud päringute tulemusi samast Promise'ist kätte.

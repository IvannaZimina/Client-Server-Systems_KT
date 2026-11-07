# Ülesanne 5 - vahemälu ja tingimuslikud päringud

### 1. Kirjuta `stateTag`: sama sisu annab ALATI sama sildi, ka siis kui võtmete järjekord erineb.

Funktsioon `stateTag` sorteerib objekti võtmed enne JSON-kuju loomist ja
arvutab sisust deterministliku SHA-1-põhise ETag-i. Sama sisu annab alati sama
märgise ka siis, kui võtmete järjekord erineb.

---

### 2. Kirjuta `answerRead`: õige `If-None-Match` annab 304 ILMA kehata.

Funktsioon `tagsEqual` võrdleb tugevaid märgiseid täpselt, toetab nõrka
võrdlust valikuga `{ weak: true }` ja käsitleb märgist `*` alati sobivana.

---

### 3. `If-None-Match` võib sisaldada MITUT silti komadega — kasvõi üks vaste piisab.

`answerRead` tagastab vaikimisi `200`, ETag-i ja ressursi keha. Sobiva
`If-None-Match` korral tagastatakse `304` ja `body: null`.

---

### 4. Lisa `Last-Modified` ja `If-Modified-Since`; MÕLEMA korral otsustab SILT.

Päises olevad märgised jagatakse komade järgi. Kui vähemalt üks märgis sobib
ressursi ETag-iga, tagastatakse `304`.

---

### 5. VIHJE: mõõda enne serveri pealt, kui palju baite 304 kokku hoiab.

Kui ressursi muutmisaeg on olemas, lisatakse `Last-Modified`. Hilisema või
võrdse `If-Modified-Since` väärtuse korral tagastatakse `304`. Kui mõlemad
tingimused on olemas, on ETag ülimuslik.

---

### 6. Kirjuta `answerWrite`: 428 ilma If-Matchita, 412 vana sildiga.

`answerWrite` nõuab kirjutamisel `If-Match` päist. Päise puudumisel tagastab
funktsioon `428`. Vale või aegunud märgis annab `412`. Õige märgise korral
rakendatakse muudatus ja tagastatakse `200` koos uue ETag-iga.

---

### 7. Kirjutamisel EI TOHI nõrka silti (`W/...`) aktsepteerida — lugemisel tohib.

Kirjutamise puhul ei tohi `W/"..."` märgist aktsepteerida. Nõrk märgis
tagastab `412`, sest muutmise eeltingimus peab olema tugev.

---

### 8. Kirjuta `cacheHeader` neljale laadile: immutable → public, max-age=31536000, immutable; short → public, max-age=60; revalidate → no-cache; secret → no-store, private. Tundmatu laad viskab `RangeError`-i.

| laad | Cache-Control |
|---|---|
| `immutable` | `public, max-age=31536000, immutable` |
| `short` | `public, max-age=60` |
| `revalidate` | `no-cache` |
| `secret` | `no-store, private` |

Tundmatu laad viskab `RangeError`-i. `no-cache` nõuab ülekontrollimist, kuid
`no-store` keelab salvestamise.

---

### 9. Mängi kahe korraldaja stsenaarium serveri peal läbi ja kirjuta koodid üles.

```text
A ja B loevad sündmuse 1 -> mõlemal sama ETag
A muudab hinna 26 -> 200, uus ETag
B muudab vana ETag-iga -> 412
hind lõpuks -> 26
```

Ilma `If-Match`-ita võiks B A muudatuse vaikides üle kirjutada.

---

## Oodatav tulemus

Mõõdetud vastused:

```text
200  keha 634 B + päised 222 B = 856 B
304  keha   0 B + päised 164 B = 164 B
```

304 vähendas edastatud mahtu umbes 81%. Kontrollskript annab:

```text
30 kontrolli OK
```

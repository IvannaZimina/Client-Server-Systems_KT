# Ülesanne 6 - sisu läbirääkimine ja osaline sisu

### 1. Võta `Accept`-päis lahti tüüpideks ja `q`-väärtusteks.

Funktsioon `parseAccept` jagab päise komade järgi ja loeb iga tüübi juurde
`q`-väärtuse. Puuduv `q` saab väärtuse `1`. Tüüpide võrdlemisel kasutatakse
väikeste tähtedega MIME-tüüpe.

---

### 2. Anna `q`-ta tüübile `q=1` ja käsitle `q=0` KEELUNA, mitte ükskõiksusena.

Päises `text/csv` tähendab puuduva q-ga tüüp `q=1`. `q=0` tähendab, et tüüpi
ei tohi valida, mitte et tüübi eelistus oleks lihtsalt väike.

---

### 3. Järjesta võrdse `q` juures TÄPSEMA tüübi kasuks: `tüüp/alam` > `tüüp/*` > `*/*`.

Võrdse q-väärtuse korral kasutatakse järjekorda:

```text
tüüp/alam > tüüp/* > */*
```

Näiteks `application/json` on täpsem kui `text/*`, mis on täpsem kui `*/*`.

---

### 4. Kirjuta `representationHeaders` nii, et `Vary` on ALATI kaasas.

Funktsioon tagastab valitud tüübi `Content-Type`-ina ja lisab alati:

```text
Vary: Accept
```

`Vary` näitab vahemälule, et vastus sõltub `Accept`-päisest.

---

### 5. VIHJE: ilma `Vary`-ta annab vahemälu JSON-i küsijale CSV — ja tabab TEIST kasutajat.

Ilma `Vary: Accept`-ita võiks vahemälu salvestada sama URL-i CSV-vastuse ja
tagastada selle järgmisele kasutajale, kes küsis JSON-i.

---

### 6. Jooksuta antud `range()` kujudega `bytes=0-499`, `bytes=500-` ja `bytes=-500` ja kirjuta üles, mida ta annab.

Mõõdetud tulemused serverist:

| Range | tulemus |
|---|---|
| `bytes=0-499` | esimesed 500 baiti |
| `bytes=500-` | alates baidist 500 kuni lõpuni |
| `bytes=-500` | viimased 500 baiti |

Kontrollskriptis kasutatud logi pikkus on `15499` baiti.

---

### 7. Kirjuta `rangeHeaders`: 206 koos `Content-Range` ja `Content-Length`, 200 koos `Accept-Ranges`.

Osalise vastuse korral annab funktsioon `206`, `Content-Range` ja
`Content-Length`. Täieliku vastuse korral annab funktsioon `200` ja
`Accept-Ranges: bytes`.

---

### 8. Pane 416 vastusesse `Content-Range: bytes */<pikkus>` — ka vigase `Range` korral.

Vigase või liiga suure algusega vahemiku korral tagastatakse `416` ja:

```text
Content-Range: bytes */15499
```

Päis näitab alati ressursi tegelikku pikkust.

---

### 9. Kirjuta `rangeBody`: lõika BAITIDEST, mitte sõnest — mõttekriips on kolm baiti.

`rangeBody` teisendab teksti UTF-8 `Buffer`-iks ja lõikab `start`-ist
`end`-ini baitide kaupa. Sõne indeksite kasutamine oleks täpitähtede ja
mõttekriipsu puhul vale.

---

## Oodatav tulemus

```text
bytes=0-49   -> 206, bytes 0-49/15499
bytes=100-   -> 206, bytes 100-15498/15499
bytes=-60    -> 206, bytes 15439-15498/15499
bytes=99999- -> 416, bytes */15499
```

Mõttekriips `—` on UTF-8-s kolm baiti. Kontrollskript annab:

```text
25 kontrolli OK
```

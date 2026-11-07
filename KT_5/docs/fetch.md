# Ülesanne 3 — fetch: neli olekut ja vead ★★★

### 1. Kirjuta `readResponse()` antud `readBody()` peale: tema vea laad on 5xx ja 429 `server`, muu 4xx `client`.

`readResponse()` viskab HTTP-vea korral erindi koos väljaga `kind`. Staatuste
`500`, `503` ja `429` korral on `kind: 'server'`. Staatuste `400`, `404` ja
`422` korral on `kind: 'client'`; vastuse staatus säilib väljal `status`.

---

### 2. Vigane keha on `format`, mitte `server`: `?broken` annab 200 JA katkise JSON-i.

`?broken` annab laadiks `format`, sest HTTP-vastus on 200, kuid keha ei vasta
JSON-vormingule. Serverivastuse staatus ja vastuse keha vorming on kaks eri
kontrolli.

---

### 3. Jooksuta serveri `?err` ja `?broken` ning kirjuta mõlema laad üles.

`?err` annab staatuse 500 ja laadiks `server`. `?broken` annab staatuse 200,
kuid JSON-i lugemine ebaõnnestub ja laadiks määratakse `format`.

```javascript
?err:
status: 500
kind: server

?broken:
status: 200
kind: format
```
---

### 4. Kontrolli, et võrguviga (`TypeError`) ei jõua kasutajani toorel kujul.

Võrguviga muudetakse teateks `Ühendus puudub. Kontrolli võrku.`.
Toores `TypeError` ei jõua kasutajaliidesesse.
```javascript
{ state: 'err', message: 'Ühendus puudub. Kontrolli võrku.' }
```

---

### 5. VIHJE: `fetch` küsimus on „kas vastus tuli“, mitte „kas vastus oli hea“.

`fetch` näitab eelkõige vastuse saabumist. 404 ja 500 ei tekita automaatselt
JavaScripti erindit, sest HTTP-vastus saabus korrektselt. Edukuse kontroll
tehakse `response.ok` abil.

---

### 6. Kirjuta `stateFromData()`: tühi massiiv annab oleku `empty`, MITTE `err`.

Tühi massiiv annab oleku `empty`, sest päring õnnestus, kuid tulemusi ei ole.
Andmetega massiiv annab oleku `data`. Mitte-massiivne väärtus annab veaoleku.

---

### 7. Jooksuta `?empty` ja kirjuta üles kood ning keha suurus baitides.

Vastus on 200. Keha sisaldab `[]` ja on kahebaidine UTF-8-s. Tühi tulemus ei
ole serveri viga.

---

### 8. Kirjuta `createClient()` nii, et kaks korraga kutset teevad ÜHE päringu.

Pooleliolev lubadus salvestatakse muutujasse `inFlight`. Kaks samal ajal tehtud
kutset kasutavad sama lubadust ja serverisse saadetakse ainult üks päring.

---

### 9. Kontrolli, et järjest tehtud kaks kutset teevad KAKS päringut.

Pärast esimese päringu lõppu eemaldatakse `inFlight`-väärtus `finally`-osas.
Hiljem tehtud uus kutse alustab uue päringu.

---

## Mõõdetud tulemus

## fetch ei viska HTTP-vea peale

```text
404          -> fetch ÕNNESTUS.  response.ok === false
võrk katki   -> fetch VISKAS TypeError("Failed to fetch")
```

## Kaks eri viga ühe päringu sees - ?broken

```text
response.ok      -> true
response.json()  -> VISKAB      laad: format
```

## Neli olekut

| olek | serveri vastus | mida kasutaja näeb |
|---|---|---|
| loading | ?slow=900 | kohatäide 1,096 s |
| data | 200, 634 B | nimekiri |
| empty | 200, 2 B ehk [] | "Ükski sündmus ei vasta" |
| err | 500 | teade + kordamisnupp |

`?broken` vastuse staatus on 200 ja keha suurus 20 baiti. Keha
`{"events": [ KATKINE` ei ole kehtiv JSON.

Mõõdetud aeg oli 1,096 s, mis on umbes 196 ms rohkem kui serveri määratud 900 ms viivitus.
Lisandub päringu ja vastuse töötlemise aeg.

# Ülesanne 4 — Katkestamine, ajalõpp ja kordamine ★★★

### 1. Kirjuta `timeoutSignal()`, mis ühendab oma kella ja välise signaali.

`timeoutSignal()` loob eraldi `AbortController`-i ja ühendab selle välise
katkestussignaaliga. Päring katkeb nii ajalõpu saabumisel kui ka kutsuja
poolt antud signaali korral.

---

### 2. Kustuta kell ALATI, ka õnnestunud päringu järel — kasuta `finally`.

Taimer kustutatakse alati pärast päringu lõppu, ka õnnestunud vastuse korral.
Selleks kasutatakse `finally`-plokki, sest sama puhastus peab toimuma nii
õnnestumise kui ka vea korral.

---

### 3. Seleta, mis juhtub ilma katkestamiseta: ühendus, andmed, päringute lagi.

Vananenud päring hoiab võrguühendust ja brauseri ressursse kinni. Vana vastus
võib jõuda pärast uuemat vastust ning kuvada kasutajale aegunud otsingutulemuse.
Paljude rippuvate päringute korral täitub hosti ühenduste piir ja uued päringud
jäävad järjekorda.

---

### 4. Näita, et `abort()` ilma põhjuseta annab `AbortError`-i ja sinu ajalõpp `TimeoutError`-i.

Põhjuseta `abort()` andis kontrollis `err.name = AbortError`. Kohaliku taimeri
põhjustatud katkestus andis `err.name = TimeoutError`, et ajalõppu saaks
vajadusel korrata.

---

### 5. VIHJE: brauseris on korraga ~6 päringut hosti kohta — rippuvad blokeerivad.

Ühe hosti kohta on brauseris korraga ligikaudu 6 ühendust. Rippuvad
ühendused vähendavad vabade ühenduste arvu ning uued päringud võivad seetõttu
oodata isegi enne serverini jõudmist.

---

### 6. Kirjuta `shouldRetry()`: 5xx ja 429 jah, 4xx ja `AbortError` ei; POST ja PATCH mitte kunagi.

`shouldRetry()` tagastab `true` staatuste `500`, `503` ja `429` korral ning
võrguvea või `TimeoutError`-i korral, kui meetod on `GET`. Staatuste `400` ja
`404`, `AbortError`-i, `POST`-i ja `PATCH`-i korral tagastab funktsioon `false`.

---

### 7. Ühenda kõik `requestWithRetry()` sisse ja loe kutsed kokku.

`requestWithRetry()` teeb esimese päringu ja kordab ainult `shouldRetry()` poolt
lubatud olukordi. Õnnestumise korral tagastatakse vastus koos katsete arvuga.
Mõõdetud katsed olid vastavalt stsenaariumidele `3, 1, 3, 1, 1, 1, 2, 1`.
Kui kõik katsed ebaõnnestuvad, antakse viimane viga kutsujale edasi.

---

### 8. Jooksuta serveri `?retry` vastu ja kirjuta koodide jada üles.

Server annab iga kolmanda päringu korral staatuse 200. Ülejäänud päringud saavad staatuse 503. Tegin kaks eraldi `requestWithRetry()` kutset, mõlemas oli maksimaalselt kolm katset.

### 9. Lisa pausile juhuslikkus (jitter) ja kirjuta kahe kliendi kolm pausi üles.

Jitter lisab põhipausile juhusliku osa. Testisin kahte klienti nelja päringuga. Mõlemad said pärast kolme kordamist vastuse 200.

## Mõõdetud tulemus

### Serveri `?retry`

```text
503 503 200 503 503 200
```

Mõlemad `requestWithRetry()` kutsed õnnestusid kolmandal katsel.

### Jitteriga pausid

| Klient   | 1. paus (ms) | 2. paus (ms) | 3. paus (ms) |
| -------- | -----------: | -----------: | -----------: |
| Client A |          206 |          464 |          862 |
| Client B |          236 |          437 |          862 |

### Kordamine võltsitud fetch-iga

| Stsenaarium                         | Päringuid | Tulemus           |
| ----------------------------------- | --------: | ----------------- |
| 503, 503, 200                       |         3 | 200               |
| 404                                 |         1 | 404 (ei korratud) |
| POST: 503                           |         1 | 503 (ei korratud) |
| Võrguviga x3                        |         3 | TypeError         |
| POST: võrguviga                     |         1 | TypeError         |
| Kasutaja katkestas                  |         1 | AbortError        |
| Ajalõpp x2                          |         2 | TimeoutError      |
| Väline signaal oli juba katkestatud |         1 | Viga, ei korratud |

---

## Mõõdetud tulemus

## Serveri ?retry - iga kolmas läbi

```text
503  503  200  503  503  200
```

## Kordamine võltsitud fetch-iga

| stsenaarium        | päringuid | tulemus           |
| ------------------ | --------: | ----------------- |
| 503, 503, 200      |         3 | 200               |
| 404                |         1 | 404 (ei korratud) |
| POST: 503, 201     |         1 | 503 (ei korratud) |
| võrguviga x3       |         3 | viskas            |
| kasutaja katkestas |         1 | AbortError        |
| ajalõpp x2         |         2 | TimeoutError      |

## Kasvav ooteaeg ja juhuslikkus

```text
ilma:      A 200 400 800   B 200 400 800   lagi 5000
jitteriga: A 201 495 838   B 263 491 824
```

Jitteri väärtused muutuvad iga käivitusega, sest lisand on juhuslik.

# Ülesanne 1 - päringu ja vastuse anatoomia

### 1. Käivita ette antud server ja ava katsetusala pordil 3004.

Käivitati antud server kaustast `materials` käsuga `node server.js`.
Katsetusala avati aadressil `http://localhost:3004`. Sama server töötab ka
pordil `3005` päritolu ja CORS-i katsetamiseks.

---

### 2. Saada `/api/mirror`-ile päring ja loetle KÕIK päised, mis kohale jõudsid.

`POST /api/mirror` päring saadeti JSON-kehaga. Server peegeldas järgmised
päised:

| päis | väärtuse päritolu |
|---|---|
| `host` | klient, kohustuslik |
| `connection` | klient ise |
| `content-type` | päringu saatja |
| `content-length` | klient arvutas keha põhjal |
| `user-agent` | klient ise |
| `accept` | klient ise |
| `accept-language` | klient ise |
| `accept-encoding` | klient ise |

Täpne nimekiri võib sõltuda kasutatud kliendist, kuid `/api/mirror` näitab
serverisse tegelikult jõudnud päiseid.

--- 

### 3. Märgi iga päise juurde, kas selle pani sina või klient ise.

`Content-Type` määrati päringu saatmisel. `Host`, `User-Agent`, `Accept`,
`Accept-Language`, `Accept-Encoding` ja `Connection` lisas HTTP-klient või
brauser. `Content-Length` arvutas klient saadetud keha baitide põhjal.

---

### 4. Saada sama päring kaks korda ja näita, et server ei mäleta esimest.

Sama päring saadeti kaks korda. Mõlemal korral tagastas `/api/mirror` sama
päringu kirjelduse. Teise vastuse juures ei olnud esimese päringu andmeid.
See näitas, et HTTP-suhtlus on olekuta.

---

### 5. VIHJE: `Content-Length` on BAITIDES — täpitäht on kaks baiti, mõttekriips kolm.

`Content-Length` näitab UTF-8-s saadetud keha baitide arvu, mitte märkide
arvu. Täpitäht, näiteks `ä`, võtab kaks baiti. Mõttekriips `—` võtab kolm
baiti.

---

### 6. Võrdle GET-i ja HEAD-i: kirjuta mõlema kood ja keha suurus üles.

Mõõdetud tulemused:

```text
GET  /api/events -> 200, keha 634 B
HEAD /api/events -> 200, keha 0 B
```

HEAD tagastas GET-iga samad päised, sealhulgas `Content-Length`, kuid keha
server ei saatnud.

---

### 7. Ava Network-paneel ja seleta ajajoone kaks osa: Waiting ja Content Download.

`Waiting` näitab aega päringu saatmise ja esimese vastusebaidi saabumise vahel
ehk serveri töötlemise ja TTFB-d. `Content Download` näitab vastuse keha
allalaadimise aega. Suur TTFB ja aeglane allalaadimine vajavad erinevaid
optimeerimisi.

---

### 8. Kasuta „Copy as cURL“ ja korda üht päringut käsurealt.

Network-paneelist kopeeriti päring käsuga `Copy as cURL` ja käivitati see
käsureal. JSON-peegli päringu näide:

```text
curl -i -X POST http://localhost:3004/api/mirror ^
  -H "Content-Type: application/json" ^
  --data "{\"event\":3,\"qty\":2}"
```
---

### 9. Kirjuta `docs/anatomy.md`: neli osa, päised, olekuta suhtlus, HEAD.

Käesolevas failis on kirjeldatud päringu ja vastuse osi, peegeldatud päised,
olekuta suhtlus ning GET-i ja HEAD-i erinevus koos mõõdetud tulemustega.

---

## Oodatav tulemus

```text
GET  /api/events -> 200, keha 634 B
HEAD /api/events -> 200, keha   0 B
```

Päised on identsed, ka `Content-Length`. `/api/mirror` näitab klienti ja
brauserit puudutavate päiste erinevust.

# C07 Ülesanne 6 — Ümberühendamine ja API-stiilid

## 1. Kirjuta baseUrl(env): API_URL võidab — ka SUHTELINE tee nagu /api/v1 —, muidu localhost ja PORT (vaikimisi 3000).

Failis `server/connection.js` loodi funktsioon `baseUrl(env)`.
- Kui `API_URL` on määratud, kasutatakse seda, sealhulgas suhtelist teed `/api/v1`.
- Kui `API_URL` puudub, kasutatakse `http://localhost:<PORT>/api/v1`.
- Kui `PORT` puudub, kasutatakse porti `3000`.
- Lõpus eemaldatakse üleliigsed kaldkriipsud.
Kontrolliti vaikimisi aadressi, `PORT` väärtust, absoluutset ja suhtelist `API_URL` väärtust ning `API_URL` prioriteeti.

---

## 2. Tee CORS-i vaikeseisuks KEELATUD ja loe lubatud päritolud CORS_ORIGINS-ist.

Failis `server/connection.js` loeb funktsioon `corsOptions(env)` väärtuse `CORS_ORIGINS`, jagab loendi komade järgi osadeks ja eemaldab üleliigsed tühikud.
Näiteks väärtuse `CORS_ORIGINS=https://piletikassa.ee,http://localhost:5173` korral on lubatud kaks päritolu:
- `https://piletikassa.ee`
- `http://localhost:5173`
Tühjad väärtused ja `*` jäetakse loendist välja. Kui `CORS_ORIGINS` ei ole määratud, jääb `origins` loend tühjaks ning ühegi määratud päritoluga päring ei läbi CORS-i kontrolli.

---

## 3. Luba credentials AINULT siis, kui konkreetsed päritolud on loetletud.

Funktsioonis `corsOptions(env)` sõltub `credentials` väärtus lubatud päritolude arvust:
- Kui `CORS_ORIGINS` sisaldab vähemalt ühte konkreetset päritolu, on `credentials: true`.
- Kui loend on tühi või puudub, on `credentials: false`.
Seega ei lülitata `credentials` automaatselt sisse ega kasutata koos kõigi päritolude lubamisega (`*`).

---

## 4. Kontrolli neli juhtu: lubatud, tundmatu, päritoluta, seadistuseta.

Kontroll tehti funktsiooniga `isAllowed(options, origin)`. Saadi järgmised tulemused:
| Kontrollitav juht               | Päritolu                    | Tegelik tulemus    |
| ------------------------------- | --------------------------- | ------------------ |
| Päritolu on lubatud loendis     | `https://piletikassa.ee`    | `true` — lubatud   |
| Tundmatu päritolu               | `https://kuri.ee`           | `false` — keelatud |
| Päritolu puudub (curl)          | `undefined`                 | `true` — lubatud   |
| `CORS_ORIGINS` seadistus puudub | Mis tahes määratud päritolu | `false` — keelatud |

Lisaks kontrolliti, et seadistuse puudumisel on `credentials` väärtus `false` ja konkreetsete lubatud päritolude olemasolul `true`.

---

## 5. VIHJE: tagasilükkamine EI OLE viga — server vastab, brauser blokeerib.

Funktsioonis `corsOptions(env)` kasutatakse päritolu kontrollimiseks callback-funktsiooni:
`callback(null, isAllowed(options, origin))`.
Tundmatu päritolu korral tagastab funktsioon `false` ega edasta callback-funktsiooni kaudu viga.
See tähendab, et CORS middleware ei lisa vastusele lubavaid CORS-päiseid.
CORS-i keeldumine iseenesest ei peata päringu töötlemist serveris.
Brauser saab vastuse, kuid blokeerib JavaScriptil selle sisu lugemise.
Päring ilma `Origin` päiseta, näiteks `curl`-iga tehtud päring, läbib kontrolli, sest tegemist ei ole brauseriülese päringuga.

---

## 6. Täida STYLES toimingutele nimekiri, saaliplaan ja ost: mitu päringut vajab kliendileht ja kas HTTP-vahemälu tohib vastust hoida — miks.

Failis `server/connection.js` täideti objekt `STYLES` REST-i, GraphQL-i ja gRPC jaoks.
Iga toimingu puhul määrati päringute arv, HTTP-vahemälu kasutamise võimalus ja põhjendus.

| Tegevus              | REST                     | GraphQL               | gRPC                    |
| -------------------- | ------------------------ | --------------------- | ----------------------- |
| events (nimekiri)    | 1 päring, vahemälu jah   | 1 päring, vahemälu ei | 1 päring, vahemälu ei   |
| seatmap (saaliplaan) | 2 päringut, vahemälu jah | 1 päring, vahemälu ei | 2 päringut, vahemälu ei |
| buyTickets (ost)     | 1 päring, vahemälu ei    | 1 päring, vahemälu ei | 1 päring, vahemälu ei   |

REST kasutab eraldi ressursiaadresse ja GET-päringuid, mille vastuseid saab HTTP-vahemällu salvestada.
Piletite ostmine toimub POST-päringuga, mis muudab serveri andmeid.
GraphQL kasutab kõigi kolme tegevuse jaoks ühte aadressi `POST /graphql`.
Saaliplaani saab küsida ühe päringuga, kuid tavaline HTTP-vahemälu POST-vastuseid ei salvesta.
gRPC kasutab HTTP/2 POST-päringuid ja eraldi RPC-meetodeid. Tavaline HTTP-vahemälu neid vastuseid ei salvesta.

---

## 7. Kirjuta suggestStyle() kolme sisendi järgi ja põhjenda iga haru.

Funktsioon `suggestStyle()` valib API-stiili kolme sisendi põhjal:
kliendi tüüp (`client`), latentsustundlikkus (`latencySensitive`) ja andmete sügavus (`entityDepth`).

| Tingimus                           | Valitud stiil | Põhjendus                                                  |
| ---------------------------------- | ------------- | ---------------------------------------------------------- |
| Browser                            | REST          | Ressursipõhised aadressid ja GET-päringute vahemälu        |
| Service ja latencySensitive = true | gRPC          | Sobib latentsustundlikuks teenustevaheliseks suhtluseks    |
| Mobile ja entityDepth > 1          | GraphQL       | Võimaldab küsida sügavalt pesastatud andmeid ühe päringuga |
| Mobile ja entityDepth <= 1         | REST          | Lihtsate andmete jaoks piisab ressursipõhisest API-st      |
| Muud juhud                         | REST          | Vaikimisi valik                                            |

---

## 8. Vali piletikassale stiil sammu 6 tabeli järgi: nimeta lahtrid, mis valiku otsustavad, ja kas suggestStyle() annab sama vastuse.

Piletikassa projekti jaoks valiti REST.
Valiku tegemisel lähtuti 6. sammu tabeli järgmistest lahtritest:
- `events`: REST kasutab ühte GET-päringut ja vastust saab HTTP-vahemällu salvestada.
- `seatmap`: REST kasutab kahte GET-päringut ja vastuseid saab HTTP-vahemällu salvestada.
- `buyTickets`: REST kasutab ühte POST-päringut, sest piletite ostmine muudab serveri andmeid.
- 
GraphQL võimaldaks saaliplaani küsida ühe päringuga, kuid kasutab POST-meetodit ega paku tavalise HTTP-vahemälu eelist.
gRPC kasutab samuti POST-päringuid ega paku selles võrdluses HTTP-vahemälu eelist.
Brauserikliendi korral tagastab `suggestStyle()` REST-i. Seega on funktsiooni soovitus ja piletikassa jaoks tehtud valik samad.

---

## 9. Vii oma api.js teed Ex2 kujule baseUrl() järel (/events, /events/:id/seatmap) ja kirjuta docs/connection.md: mis muutus.

Failis `server/api.js` kasutatakse nüüd `baseUrl()` funktsiooni.
API aadressid:
- `API.events` — `${baseUrl()}/events`
- `API.seatmap(id)` — `${baseUrl()}/events/${id}/seatmap`
Kontrolliti käsklusega:
```cmd
node --input-type=module -e "import { API } from './server/api.js'; console.log(API.events); console.log(API.seatmap(123));"
```
Tulemus:
```text
http://localhost:3000/api/v1/events
http://localhost:3000/api/v1/events/123/seatmap
```
Suhtelise `API_URL=/api/v1` väärtusega kontrolliti samuti aadresse:
```text
/api/v1/events
/api/v1/events/123/seatmap
```
Seega sõltuvad API aadressid nüüd `baseUrl()` tagastatud väärtusest ning lõplikud ressursiteed vastavad Ex2 struktuurile.

---

## Oodatav tulemus

### CORS — kontrolli tulemused
| Päritolu                                                      | Tulemus            |
| ------------------------------------------------------------- | ------------------ |
| `https://piletikassa.ee` — on lubatud loendis                 | `true` — lubatud   |
| `https://kuri.ee` — puudub loendist                           | `false` — keelatud |
| Ilma `Origin` päiseta (curl)                                  | `true` — lubatud   |
| Ilma `CORS_ORIGINS` seadistuseta, mis tahes määratud päritolu | `false` — keelatud |

### Kolm stiili piletikassas: päringuid · HTTP-vahemälu
| Toiming    | REST    | GraphQL | gRPC   |
| ---------- | ------- | ------- | ------ |
| Nimekiri   | 1 · jah | 1 · ei  | 1 · ei |
| Saaliplaan | 2 · jah | 1 · ei  | 2 · ei |
| Ost        | 1 · ei  | 1 · ei  | 1 · ei |

Faili `server/connection.js` kontrolliti käsuga:
```cmd
node materials\check-connection.js
```
Tulemus:
```text
34 kontrolli OK
```
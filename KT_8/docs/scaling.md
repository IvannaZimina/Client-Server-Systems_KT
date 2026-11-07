# C08 — Ülesanne 6: Olekuta server

## 1. Loetle kuus mälus olekut ja nende ilming kahe eksemplariga.

Failis `server/scaling.js` määrati kuus olekut objektis `IN_MEMORY_STATE`.

| Olek              | Ilming kahe eksemplariga                   | Sobiv hoidla             |
| ----------------- | ------------------------------------------ | ------------------------ |
| Istung            | Juhuslik väljalogimine                     | Redis                    |
| Vahemälu          | Vastus sõltub sellest, kuhu päring sattus  | Redis                    |
| WebSocket         | A ei näe B teateid                         | Redis Pub/Sub            |
| Loendur           | Statistika on eksemplaride arvu võrra vale | Andmebaas                |
| Cron              | Kaks kirja ühe ostu kohta                  | Andmebaas ja lukustamine |
| Üleslaaditud fail | 404 iga teise päringu peale                | Objektihoidla            |

Kõik need probleemid võivad jääda ühe serveri kasutamisel märkamatuks, sest kogu olek asub samas protsessis. Kahe eksemplari korral ei näe üks server teise serveri mälus olevaid andmeid.

---

## 2. Kirjuta findProblems(), mis leiab mälus oleku koos lahendusega.

Failis `server/scaling.js` loodi funktsioon `findProblems()`. Funktsioon kontrollib rakenduse olekuid ja leiab need, mille väärtus on `in-memory`.

Iga leitud probleemi kohta tagastatakse nimi, ilmnemise kirjeldus ja lahendus.

Kontrollimisel leiti kolm probleemi: `session`, `websocket` ja `scheduled_job`. Rakenduse korral, kus kõik olekud asuvad ühistes hoidlates, tagastati tühi massiiv.

---

## 3. Võrdle kolme oleku hoidlat ja põhjenda, miks istung ei kuulu objektihoidlasse.

Failis `server/scaling.js` võrreldi kolme hoidlat objektis `STORES`.

| Hoidla        | Eelis                                                       | Puudus                                              |
| ------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| Redis         | Kõik eksemplarid näevad samu andmeid, TTL on sisse ehitatud | Üks lisateenus, mis võib maas olla                  |
| Andmebaas     | Püsiv andmete säilitamine ja tehingute tugi                 | Aeglasem; iga päringuga suureneb andmebaasi koormus |
| Objektihoidla | Kõik eksemplarid näevad sama faili                          | Iga kirjutus saadab terve objekti                   |

Istung ei sobi objektihoidlasse, sest istungiandmeid muudetakse sageli ja neile on vaja kiiret ligipääsu. Objektihoidla saadab iga kirjutusega terve objekti, mistõttu sobib see paremini failide kui väikese ja pidevalt muutuva oleku hoidmiseks.

---

**4. Kontrolli tulemust.**

Käivitati käsk: `node materials\check-scaling.js`
Tulemus: `11 kontrolli OK`
Kõik kontrollid läbisid edukalt.
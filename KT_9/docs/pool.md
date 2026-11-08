# Ülesanne 2 - Ühendus, kogum ja parameetrid

## 1 Tee kogum suurusega 4 ja jooksuta 8 päringut SLEEP(0.15)-ga

Loodud kogum suurusega 4.
Käivitatud 8 samaaegset päringut `SELECT SLEEP(0.15)`.
Tulemus: 325 ms. Päringud läksid kahes voorus, sest korraga sai kasutada 4 ühendust.
`waitForConnections: true` — päringud ootavad vaba ühendust.
`queueLimit: 0` — järjekorra suurus ei ole piiratud.
`dateStrings: true` — kuupäevad tagastatakse tekstina.

---

## 2 Mõõda kulunud aeg ja arvuta sellest, mitmes voorus päringud läksid

Mõõdetud aeg: 325 ms.
Ühe päringu kestus: 150 ms.
`325 / 150 ≈ 2,17`
Tulemus: 2 vooru.

---

## 3 Saada parameetrina SQL-i süstimise katse ja vaata, mitu rida tuleb

Päring: `SELECT id FROM event WHERE name = ?`
Parameeter: `"' OR '1'='1"`
Tulemus: 0 rida. Parameetrit käsitleti tavalise tekstiväärtusena.

---

## 4 Vaata execute() tulemust: mitu elementi massiivis ja mis nad on

Päring: `SELECT id FROM event LIMIT 3`
Tulemus: massiivis oli 2 elementi.
- `result[0]` — päringu read: `[{ id: 1 }]`.
- `result[1]` — metaandmed: veeru nimi `id`.

---

## 5 VIHJE: kui kaheksa päringut võtavad 150 ms, ei ole kogum piiratud

Mõõdetud aeg oli 325 ms, mitte 150 ms.
Tulemus kinnitab, et 4 ühendusega kogum piirab samaaegsete päringute arvu. Ülejäänud päringud ootavad vaba ühendust.

---

## 6 Tee tabel KUUEST SQL-i osast: kas tohib parameetriks ja kust ta tuleb

| SQL-i osa               | Kas tohib parameetriks?          | Tulemus ja allikas                                                            |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| Väärtus (`SELECT ?`)    | Jah                              | Parameeter. Testis tagastas `hello`.                                          |
| Tabeli nimi (`FROM ?`)  | Ei                               | SQL-ist. Test andis `ER_PARSE_ERROR`.                                         |
| Veeru nimi (`SELECT ?`) | Ei                               | Parameetrit käsitleti tekstiväärtusena `name`.                                |
| `ORDER BY` väli         | Ei                               | SQL-i valgest nimekirjast. `ORDER BY ?` ei sorteerinud välja järgi.           |
| `ORDER BY` suund        | Ei                               | Lubatud väärtuste hulgast `ASC` või `DESC`. Test andis `ER_PARSE_ERROR`.      |
| `IN` väärtuste loend    | Mitte ühe massiivse parameetrina | Iga väärtuse jaoks eraldi `?`. `inClause()` koostab tingimuse ja parameetrid. |

---

## 7 Seleta KAKS asja: kogumi suurus nelja eksemplari jaoks baasist loetud max_connections-i järgi; miks tundmatu VÄLI viskab, aga tundmatu SUUND võtab vaikeväärtuse

`SELECT @@max_connections` tulemus: 151.
Nelja rakenduse eksemplari korral: `151 / 4 = 37,75`
Igale eksemplarile saab määrata kuni 37 ühendust.
Kokku kasutatakse 148 ühendust ja 3 jääb teiste ühenduste jaoks.
Tundmatu väli viskab `RangeError`, sest välja nimi lisatakse SQL-päringusse ja see peab tulema valgest nimekirjast.
Tundmatu suund asendatakse vaikeväärtusega `ASC`, sest see on ohutu väärtus ega lisa päringusse kasutaja sisestatud SQL-teksti.

---

## 8 Kirjuta docs/pool.md koos mõõdetud aegadega

Mõõdetud ja kontrollitud tulemused:

| Kontroll                                   |    Tulemus |
| ------------------------------------------ | ---------: |
| `@@max_connections`                        |        151 |
| Kogumi suurus                              |          4 |
| 8 päringut `SLEEP(0.15)`                   |     325 ms |
| Päringute voorud                           |          2 |
| SQL-i süstimise katse                      |     0 rida |
| `execute()` massiivi pikkus                | 2 elementi |
| `affectedRows / changedRows`, sama väärtus |      1 / 0 |
| `affectedRows / changedRows`, puuduv rida  |      0 / 0 |

`node materials/check-conn.js` → 25 kontrolli OK.

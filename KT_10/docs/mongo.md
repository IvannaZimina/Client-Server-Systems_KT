# C10 # Ülesanne 2 - MongoDB: skeem ja päringud

## 1. Käivita konteiner replikatsioonikomplektina ja kontrolli ühendust.
MongoDB käivitati Dockeris pordil 27019.
Seadistati Replica Set `rs0`.
Ühendust kontrolliti käsuga `ping` ja olekuks saadi `PRIMARY`.

---

## 2. Kirjuta $jsonSchema ja proovi igat reeglit rikkuda; pane koodid kirja.
Kogumile `trial` määrati `$jsonSchema` koos seadistustega `validationLevel: strict` ja `validationAction: error`.
Puuduv kohustuslik väli, vale kuupäeva tüüp, negatiivne hind, null kohtade arv ja puuduv linna väli põhjustasid valideerimisvea koodiga `121` (`VALIDATION_ERROR`).

---

## 3. Vaata, mis juhtub TUNDMATU lisaväljaga — ja otsusta, kas see on õige.
Lisavälja `newField` lisamine õnnestus.
See on õige, sest skeem lubab täiendavaid välju ega piira andmemudeli edasist laiendamist.

---

## 4. Jooksuta EXPLAIN ankurdatud ja ankurdamata regexi peale.
Mõlema päringu plaanis kasutati `FETCH <- IXSCAN`.
Ankurdatud regex oli `/^Proovisündmus 001/` ja ankurdamata regex `/ndmus 001/`.

---

## 5. VIHJE: kui mõlemad annavad IXSCAN-i, ei ole sa veel vastust näinud.
Mõlemad päringud kasutasid indeksit, kuid läbisid erineva arvu kirjeid.
Seetõttu ei piisa päringu tõhususe hindamiseks ainult `IXSCAN` olemasolust.

---

## 6. Võrdle (totalKeysExamined + totalDocsExamined) / nReturned suhet mõlemal regexil.
Ankurdatud regexi suhe oli 2.0 ja ankurdamata regexi suhe 21.0.
Mõõdetud täitmisajad olid vastavalt 9 ms ja 11 ms. Mõlemad päringud tagastasid 100 dokumenti.

---

## 7. Tee tabel KUUEST reast: kaks regexit ja neli valideerimiskatset.

| Katse                   | Tulemus                |
| ----------------------- | ---------------------- |
| `/^Proovisündmus 001/`  | PASSED — suhe 2.0      |
| `/ndmus 001/`           | PASSED — suhe 21.0     |
| Puuduv kohustuslik väli | VALIDATION_ERROR (121) |
| Kuupäev sõnena          | VALIDATION_ERROR (121) |
| Negatiivne hind         | VALIDATION_ERROR (121) |
| Kohtade arv 0           | VALIDATION_ERROR (121) |

---

## 8. Seleta KOLM asja: miks $jsonSchema on rangem kui Mongoose; miks filter-objekt on oma süstimisrisk; miks hindaja peab ütlema välja, kui ta ei saa hinnata.
1. `$jsonSchema` on Mongoose'i kontrollist rangem, sest andmeid kontrollitakse otse andmebaasis. Rakenduse kontrollist saab mööda minna, kuid andmebaasi reeglid kehtivad kõigile päringutele.
2. Filtriobjekti kaudu võib kasutaja sisestada MongoDB operaatoreid, näiteks `$ne`. `safeEquals()` lükkab objektid tagasi ja lubab ainult lihtväärtusi.
3. Ilma `executionStats` andmeteta ei saa päringu jõudlust hinnata. Seetõttu peab hindaja sellisel juhul hindamatust selgelt märkima.
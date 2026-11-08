# C09 — Ülesanne 1: andmeskeem, piirangud ja migratsioonid

## 1. Käivita konteiner ja kontrolli ühendust: küsi konteineri mysql-kliendiga baasi versiooni.
MySQL-i konteiner `piletikassa-mysql` käivitati edukalt.
Ühendus andmebaasiga töötas. MySQL-i versioon: `8.4.13`.

---

## 2. Kirjuta migratsioon 1 (kuus tabelit, piirangud, uq_ticket_seat, ix_event_starts_at) ja 2 (hold: koht, ostja, tähtaeg).
Migratsioon 1 loob kuus tabelit: `user`, `venue`, `event`, `seat`, `orders` ja `ticket`.
Lisatud on primaarvõtmed, UNIQUE-, FOREIGN KEY- ja CHECK-piirangud.
Tabelile `event` lisati indeks `ix_event_starts_at` ja tabelile `ticket` unikaalsuspiirang `uq_ticket_seat`.
Migratsioon 2 loob tabeli `hold`, kus hoitakse koha ID-d (`seat_id`), ostja ID-d (`user_id`) ja hoidmise tähtaega (`expires_at`).

---

## 3. Proovi IGAT piirangut RIKKUDA ja pane veakood kirja.
| Katse                               | Mõõdetud veakood               |
| ----------------------------------- | ------------------------------ |
| Sama e-posti aadress kaks korda     | `1062 ER_DUP_ENTRY`            |
| Sündmus olematus toimumiskohas      | `1452 ER_NO_REFERENCED_ROW_2`  |
| Sündmus 0 kohaga                    | `ER_CHECK_CONSTRAINT_VIOLATED` |
| Sama koht kaks korda müüdud         | `1062 ER_DUP_ENTRY`            |
| Kasutaja kustutamine, kellel on ost | `1451 ER_ROW_IS_REFERENCED_2`  |

Lisaks kontrolliti kõiki skeemi piiranguid: 8 PRIMARY KEY, 6 UNIQUE, 8 FOREIGN KEY ja 2 CHECK.
Kõigi primaarvõtmete ja UNIQUE-piirangute rikkumisel saadi `1062 ER_DUP_ENTRY`.
Olematu välisvõtme viite korral saadi `1452 ER_NO_REFERENCED_ROW_2`.
CHECK-piirangute rikkumisel saadi `ER_CHECK_CONSTRAINT_VIOLATED`.

---

## 4. Jooksuta migrate() kaks korda ja võrdle, mida teine jooks tegi.
Esimesel käivitamisel rakendati migratsioonid `[1, 2]`.
Teisel käivitamisel oli tulemus `[]`, uusi migratsioone ei rakendatud.
Kontrollskriptis läbisid kõik 23 kontrolli.

---

## 5. VIHJE: piirang, mida keegi ei ole proovinud rikkuda, on kommentaar.
Kontrolliti kõiki 8 PRIMARY KEY-, 6 UNIQUE-, 8 FOREIGN KEY- ja 2 CHECK-piirangut. Kõigi kontrollitud piirangute rikkumisel saadi oodatud veakood.

---

## 6. Jooksuta seed() kaks korda, kustuta siis kohtade kolmas rida ja jooksuta uuesti; loe iga kord read üle.
`seed()` käivitati kaks korda. Teisel käivitamisel duplikaate ei tekkinud.
Seejärel kustutati kolmas koht (`row_no = 3`) ja käivitati `seed()` uuesti.
Puuduv koht lisati tagasi.

| Tabel   | Kirjete arv pärast korduvat seed'i |
| ------- | ---------------------------------: |
| `user`  |                                  1 |
| `venue` |                                  1 |
| `event` |                                  1 |
| `seat`  |                                 12 |

---

## 7. Tee tabel oma skeemi KÕIGIST võõrvõtmetest: veerg, ON DELETE ja mõõdetud tulemus, kui vanem kustutada.
| Tabel    | Veerg          | ON DELETE | Mõõdetud tulemus                           |
| -------- | -------------- | --------- | ------------------------------------------ |
| `event`  | `venue_id`     | RESTRICT  | Kustutamine ebaõnnestus, `1451`            |
| `event`  | `organizer_id` | RESTRICT  | Kustutamine ebaõnnestus, `1451`            |
| `seat`   | `event_id`     | CASCADE   | Sündmuse kustutamisel kustutati kohad      |
| `orders` | `user_id`      | RESTRICT  | Skeemist tuvastatud, eraldi ei testitud    |
| `ticket` | `order_id`     | CASCADE   | Tellimuse kustutamisel kustutati pilet     |
| `ticket` | `seat_id`      | RESTRICT  | Kustutamine ebaõnnestus, `1451`            |
| `hold`   | `seat_id`      | CASCADE   | Koha kustutamisel kustutati hoidmise kirje |
| `hold`   | `user_id`      | RESTRICT  | Skeemist tuvastatud, eraldi ei testitud    |
Õnnestunud kustutamiskatsed tehti tehingu sees ja seejärel käivitati `ROLLBACK`.

---

## 8. Seleta KAKS asja: mida kaitseb Piletikassas kohtade CASCADE ja korraldaja RESTRICT; mis juhtub, kui muudad juba jooksnud migratsiooni 1 ja jooksutad migrate() vanal ja uuel baasil.
- `CASCADE` kustutab sündmuse kustutamisel automaatselt ka selle kohad.
- `RESTRICT` takistab korraldaja kustutamist, kui tema kasutajakontoga on seotud sündmusi.

Kui migratsioon 1 on vanas andmebaasis juba rakendatud, jätab `migrate()` selle uuesti vahele ka siis, kui migratsioonifaili on muudetud.
Uues tühjas andmebaasis rakendatakse muudetud migratsioon. Seetõttu võivad vana ja uus andmebaas erineda. Olemasoleva skeemi muutmiseks tuleb luua uus migratsioon.

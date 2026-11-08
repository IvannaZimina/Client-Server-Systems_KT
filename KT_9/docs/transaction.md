# C09 # Ülesanne 5 - tehing: sada ostjat, üks koht

## 1. Jooksuta 100 samaaegset buyWRONG-i ja loe piletid ja vead.

Käivitasin 100 samaaegset ostu sama koha peale.
Tulemused:
- Müüdi 1 pilet.
- 99 ostu tekitasid vea.
- Andmebaasi UNIQUE-indeks takistas sama koha korduvat müümist.

---

## 2. Võta uq_ticket_seat ära, jooksuta sama asi uuesti ja pane piirang tagasi.

Indeksi eemaldamisel tekkis viga `ER_DROP_INDEX_FK`, sest väline võti `fk_ticket_seat` vajab seda indeksit.
Testimiseks lisati ajutine mitteunikaalne indeks. Seejärel eemaldati `uq_ticket_seat` ja käivitati 100 samaaegset `buyWRONG` ostu.

Tulemus:
- Müüdi 100 piletit samale kohale.
- Ilma unikaalse piiranguta ei takistanud andmebaas topeltmüüki.

Pärast testi taastati unikaalne indeks `uq_ticket_seat`.

---

## 3. Jooksuta 100 samaaegset buy-d ja võrdle kõiki nelja arvu.

Võrdlesin kolme varianti.

| Funktsioon | Indeks | Piletid | Õnnestus | Keeldus | Visked |
| ---------- | ------ | ------: | -------: | ------: | -----: |
| buyWRONG   | on     |       1 |        1 |       0 |     99 |
| buyWRONG   | off    |     100 |      100 |       0 |      0 |
| buy        | on     |       1 |        1 |      99 |      0 |

`buy()` kasutab tehingut ja `SELECT ... FOR UPDATE` lukku.
Ainult üks ost õnnestus. Teised ostjad said korrektse keeldumise, mitte andmebaasi vea.

---

## 4. Hoia üks tehing 300 ms lahti ja mõõda, kui kaua teine ostja ootab.

Esimene tehing hoidis koha lukku 300 ms.
Teine ostja ootas lukku 324 ms.
See näitab, et teine ostja peab ootama, kuni esimene tehing vabastab lukustatud koha.

---

## 5. VIHJE: indeksi äravõtmine kukub — võõrvõti vajab teda. Loe veakood.

Indeksi eemaldamisel sain vea `ER_DROP_INDEX_FK`.
Põhjus: väline võti `fk_ticket_seat` kasutab indeksit `uq_ticket_seat`.
Seetõttu ei saa seda indeksit otse eemaldada.
Testis kasutasin ajutist mitteunikaalset indeksit, et kontrollida, mis juhtub ilma unikaalse piiranguta.

---

## 6. Osta viis kohapaari korraga mõlemast suunast ja loe lock_deadlocks enne ja pärast.

Käivitati kolm testiringi. Igas ringis osteti viis kohapaari mõlemast suunast.
Tulemus:
- Pileteid müüdi kokku 30.
- Deadlocke: 0.
- Vigu: 0.

`orderLocks()` sorteerib kohad enne lukustamist kasvavas järjekorras.
Nii lukustavad tehingud kohad samas järjekorras ja ummikseisu ei teki.

## 7. Tee tabel KUUEST veakoodist, mille sa ise esile kutsusid: lause, mis vea tekitas, ja translateError-i vastus.

| Veakood                      | Vea tekitanud SQL-lause                                                                                                                          | translateError-i vastus                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| ER_DUP_ENTRY                 | `INSERT INTO user (email,name,password_hash) VALUES ('organizer@piletikassa.ee','Test','hash')`                                                  | HTTP 409, `duplicate`, field `email`, retryable `false` |
| ER_NO_REFERENCED_ROW_2       | `INSERT INTO event (venue_id,organizer_id,name,starts_at,seat_count,price) VALUES (4294967295,1,'Test missing venue','2099-01-01 10:00:00',1,0)` | HTTP 422, `invalid_reference`, retryable `false`        |
| ER_ROW_IS_REFERENCED_2       | `DELETE FROM venue WHERE name='Piletikassa proovisaal'`                                                                                          | HTTP 409, `reference_in_use`, retryable `false`         |
| ER_CHECK_CONSTRAINT_VIOLATED | `INSERT INTO event (venue_id,organizer_id,name,starts_at,seat_count,price) VALUES (1,1,'Test invalid seats','2099-01-01 11:00:00',0,0)`          | HTTP 422, `validation`, retryable `false`               |
| ER_DATA_TOO_LONG             | `INSERT INTO user (email,name,password_hash) VALUES (REPEAT('x',300),'Test','hash')`                                                             | HTTP 422, `validation`, retryable `false`               |
| ER_LOCK_WAIT_TIMEOUT         | `SELECT id FROM seat WHERE id = 1 FOR UPDATE`                                                                                                    | HTTP 409, `deadlock`, retryable `true`                  |

Lisaks tekkis indeksi eemaldamisel `ER_DROP_INDEX_FK`. Selle koodi jaoks tagastab `translateError()` HTTP 500 ja `internal`.

---

## 8. Seleta KAKS asja oma mõõtmiste põhjal: mida nägid buyWRONG-i 99 ostjat, kui indeks oli alles; mis juhtub teise ostjaga, kui esimene hoiab lukku kauem kui innodb_lock_wait_timeout (loe baasist).

Kui unikaalne indeks oli alles, siis 99 ostjat said andmebaasist vea, sest üks ost oli juba sama koha müünud. Ainult üks ost õnnestus.

Andmebaasist kontrollisin: `innodb_lock_wait_timeout = 50`

See tähendab, et teine ostja võib lukku oodata kuni 50 sekundit.
Kui aeg saab täis, tekib `ER_LOCK_WAIT_TIMEOUT`.

Tehing tuleb tagasi pöörata ja ühendus vabastada.
`buy()` kasutab selleks `ROLLBACK` ja `finally` plokis `release()`.

Testis kasutasin teises ühenduses lühemat, 2-sekundilist seansipõhist väärtust ja sain vea `ERROR 1205 (HY000): Lock wait timeout exceeded`.

## 9. Kirjuta docs/transaction.md koos kolme mõõdetud reaga.

Dokument sisaldab kolme mõõdetud ostuvarianti ja nende tulemusi:
- `buyWRONG`, indeks olemas;
- `buyWRONG`, indeks eemaldatud;
- `buy`, indeks olemas.

# C06 — Ülesanne 6: Protsessimudel mõõdetuna

### 1. Kerge päringu p95 mõõtmine

Etteantud failis `materials/load-tool.js` käivitati kaks serverit, mis teevad sama rasket arvutust (5 miljonit `Math.sqrt` operatsiooni).
Esimene server (`blokeeriv`) teeb arvutuse peamises lõimes. Teine server (`worker_threads`) kasutab arvutamiseks eraldi töötajalõime.

Mõõdeti kerge päringu p95 latentsust kahes olukorras:
- vaikne olukord — serveril puudub raske koormus;
- koormuse all — samal ajal toimub raske arvutus.

Mõõtmine tehti arvutis, millel on 8 protsessorituuma.

| Server           | Vaikselt | Koormuse all |
| ---------------- | -------: | -----------: |
| `blokeeriv`      |   2,4 ms |      88,0 ms |
| `worker_threads` |   3,5 ms |       3,4 ms |

---

### 2. Kerge päringu halvenemise arvutamine

Koormuse all toimunud muutuse leidmiseks jagati koormuse all mõõdetud p95 vaikse olukorra p95 väärtusega.

| Server           | Arvutus    | Halvenemine |
| ---------------- | ---------- | ----------: |
| `blokeeriv`      | 88,0 / 2,4 |       36,7x |
| `worker_threads` | 3,4 / 3,5  |       0,97x |

Blokeeriva serveri kerge päringu latentsus suurenes koormuse all umbes 36,7 korda.

`worker_threads` serveri puhul olulist halvenemist ei toimunud. Kerge päringu latentsus jäi peaaegu samaks.
See näitab, et raske arvutus peamises lõimes takistab teiste päringute töötlemist.

---

### 3. Raskete tööde arv ja erinevus

Mõõtmise ajal loendati ka lõpetatud raskete tööde arv.

| Server           | Raskete tööde arv |
| ---------------- | ----------------: |
| `blokeeriv`      |                46 |
| `worker_threads` |                 4 |

Blokeeriv server jõudis teha 46 rasket tööd, kuid `worker_threads` server ainult 4.
Failis `materials/load-tool.js` luuakse iga raske päringu jaoks uus töötajalõim funktsiooniga `new Worker()`.
Uue töötajalõime loomine, käivitamine ja lõpetamine võtab aega. Seetõttu kulub osa ajast töötaja haldamisele, mitte arvutamisele.
`worker_threads` hoiab peamise lõime vabana, kuid iga päringu jaoks uue töötaja loomine vähendab raskete tööde läbilaskevõimet.

---

### 4. Mõõteriista soojendus

Failis `materials/load-tool.js` kasutatakse funktsioonis `measureLight()` enne mõõtmist viit kerget päringut.
Soojendus on vajalik, sest esimene päring võib võtta rohkem aega ühenduse loomise ja päringu ettevalmistamise tõttu.
Järgmiste päringute tulemused on stabiilsemad ja sobivad paremini serveri tegeliku latentsuse mõõtmiseks.

Ilma soojenduseta võib esimese päringu ettevalmistamise aeg mõjutada mõõtmistulemust.
Seetõttu tehakse enne mõõtmist viis päringut, mille tulemusi mõõtmises ei arvestata.

---

### 5. Latentsuse ja läbilaskevõime kompromiss

Latentsus näitab, kui kaua üks päring vastust ootab. Läbilaskevõime näitab, kui palju töid jõutakse teatud aja jooksul lõpetada.

Mõõtmistulemustest selgus, et `worker_threads` hoidis kerge päringu latentsuse koormuse all peaaegu muutumatuna.
Koormuse all oli blokeeriva serveri kerge päringu p95 latentsus 88,0 ms ja `worker_threads` serveril 3,4 ms.
Seega oli `worker_threads` serveri latentsus umbes 25,9 korda väiksem.

Samal ajal jõudis blokeeriv server lõpetada 46 rasket tööd, kuid `worker_threads` server ainult 4.
Blokeeriv server lõpetas seega umbes 11,5 korda rohkem raskeid töid.

See näitab, et väiksem latentsus ei tähenda automaatselt suuremat läbilaskevõimet. Mõõtmisel tuleb arvestada mõlema näitajaga.

---

### 6. Ühe protsessi, cluster'i ja worker_threads'i võrdlus

Node.js rakenduse töö korraldamiseks saab kasutada erinevaid protsessimudeleid.

| Mudel            | Töökorraldus                                                             | Eelis                                                    | Puudus                                                          |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------- |
| Üks protsess     | Kõik päringud töötavad ühes protsessis ja peamises lõimes.               | Lihtne ülesehitus ja väike lisakulu.                     | Raske sünkroonne arvutus blokeerib peamise lõime.               |
| `cluster`        | Käivitatakse mitu eraldi Node.js protsessi, mis saavad päringuid jagada. | Päringuid saab töödelda mitme protsessori tuuma abil.    | Raske arvutus blokeerib endiselt selle protsessi peamise lõime. |
| `worker_threads` | Raske arvutus viiakse eraldi töötajalõime.                               | Peamine lõim saab samal ajal kergeid päringuid töödelda. | Töötajalõimede loomine ja suhtlus tekitavad lisakulu.           |

`cluster` võimaldab jagada päringuid mitme protsessi vahel, kuid ei kõrvalda ühe protsessi sisemist blokeerimist.
`worker_threads` võimaldab teha protsessorimahukat tööd eraldi lõimes, nii et peamine lõim jääb vabaks.

---

### 7. Töötajate kogumi kasutamine

Iga päringu jaoks uue töötajalõime loomise asemel on parem kasutada töötajate kogumit (worker pool).
Töötajate kogum koosneb eelnevalt loodud töötajalõimedest, mis jäävad töövalmis olekusse.
Uus ülesanne antakse vabale töötajalõimele. Pärast töö lõpetamist saab sama töötaja järgmise ülesande.
Nii väheneb uute lõimede loomise ja lõpetamisega seotud lisakulu.
Samuti saab piirata korraga töötavate ülesannete arvu ja hallata tööjärjekorda.

---

### 8. Sobiva protsessimudeli valimine piletikassa tööde jaoks

Piletikassa rakenduse erinevate tööde jaoks sobivad erinevad mudelid.

| Töö                                       | Sobiv mudel                              | Põhjendus                                                                              |
| ----------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Sündmuste nimekirja kuvamine ja otsimine  | Üks protsess koos asünkroonse I/O-ga     | Andmete lugemine ja päringute töötlemine ei vaja eraldi protsessorimahukat lõime.      |
| Tellimuste loomine ja kustutamine         | Üks protsess koos asünkroonse I/O-ga     | Andmebaasi või muu välise teenuse vastust saab oodata peamist lõime blokeerimata.      |
| Suur hulk samaaegseid HTTP-päringuid      | `cluster`                                | Päringuid saab jagada mitme protsessi ja protsessorituuma vahel.                       |
| Mahukad arvutused ja aruannete koostamine | `worker_threads` koos töötajate kogumiga | Arvutused toimuvad peamisest lõimest eraldi ega blokeeri kergete päringute töötlemist. |

Sobiva mudeli valimisel arvestatakse töö iseloomu. I/O-põhiste tööde puhul piisab asünkroonsest töötlemisest, kuid protsessorimahukad arvutused vajavad eraldi töötajalõimi või protsesse.

---

### 9. Mõõtmistulemuste kokkuvõte

Etteantud mõõteriistaga `materials/load-tool.js` võrreldi blokeerivat serverit ja `worker_threads` serverit.
Arvutis oli 8 protsessorituuma.

| Näitaja                   | `blokeeriv` | `worker_threads` |
| ------------------------- | ----------: | ---------------: |
| Kerge päring vaikselt     |      2,4 ms |           3,5 ms |
| Kerge päring koormuse all |     88,0 ms |           3,4 ms |
| Kerge päringu halvenemine |       36,7x |            0,97x |
| Raskete tööde arv         |          46 |                4 |

Mõõtmine näitas, et eraldi töötajalõim kaitseb peamist lõime raske arvutuse ajal ja hoiab kergete päringute latentsuse madalana.
Samas vähendas iga päringu jaoks uue töötajalõime loomine raskete tööde arvu. Püsiva koormuse korral on sobivam kasutada töötajate kogumit.
Etteantud failid `materials/load-tool.js` ja `materials/worker.js` jäid muutmata.
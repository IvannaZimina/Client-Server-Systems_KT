# C10 Ülesanne 4 — Firestore: mudel ja kuulajad

## 1. Käivita emulaator ja kontrolli ühendust.
Firestore Emulator käivitati käsuga `npx firebase-tools emulators:start --only firestore --project piletikassa-demo --config materials/firebase.json`.
Ühendus töötas aadressil `127.0.0.1:8085`. Google'i kontot ei olnud vaja.

---

## 2. Loo sündmus ja 12 kohta alamkollektsiooni. Loe sündmus tagasi.
Loodi sündmus `s1` ja selle alamkollektsiooni lisati 12 kohta (3 rida ja 4 kohta).
Sündmuse lugemisel saadi tagasi ainult vanemdokumendi andmed. Kohad loeti eraldi päringuga.

---

## 3. Käivita kuulaja ilma muutusteta ja jälgi esimest teadet.
`onSnapshot()` saatis kohe esimese teate, mis sisaldas 12 vaba kohta ja 12 `added` muudatust.

---

## 4. Märgi üks koht müüduks ja vaata `docChanges()` tulemust.
Koht `r1n1` märgiti müüduks funktsiooniga `update()`.
Kuulaja teatas 11 vabast kohast ja `docChanges()` näitas muudatust `removed`.
Puuduva dokumendi muutmine põhjustas vea.

---

## 5. Miks peab kuulaja esimesel käivitamisel kuvama kogu seisu?
Esimene `onSnapshot()` teade sisaldab kogu päringu hetkeseisu.
Seetõttu kuvati alguses kõik 12 vaba kohta, mitte ainult edasised muudatused.

---

## 6. Proovi võrratust ühel väljal ja `orderBy` teisel väljal.
Päring `price > 10` koos `orderBy('startsAt')` töötas.
Kahe võrratuse kasutamine eri väljadel töötas samuti ja tagastas 1 dokumendi.

---

## 7. Tee tabel VIIEST reast: kes hoiab ühendust, kes teab ühendatuid, mis juhtub taasühendumisel, mida sa maksad, kus on piir.

| Küsimus                     | Firestore                                   | WebSocket-server                 |
| --------------------------- | ------------------------------------------- | -------------------------------- |
| Kes hoiab ühendust?         | Firestore'i klientteek                      | Rakenduse server ja klient       |
| Kes teab ühendatuid?        | Firestore'i teenus                          | Server                           |
| Mis juhtub taasühendumisel? | Kuulaja taastatakse ja saadetakse hetkeseis | Taastamine tuleb ise lahendada   |
| Mida sa maksad?             | Lugemised, kirjutamised ja salvestus        | Server ja andmeedastus           |
| Kus on piir?                | Dokumendi suurus 1 MiB ja päringupiirangud  | Serveri jõudlus ja ühenduste arv |

---

## 8. Seleta KOLM asja: miks alamkollektsioon ei tule vanemaga kaasa; miks tuletatud id säästab päringu; miks emulaator on ohtlik.
Alamkollektsioon on vanemdokumendist eraldi ja tuleb lugeda eraldi päringuga.
Tuletatud ID võimaldab dokumendi aadressi otse moodustada ilma otsingupäringuta.
Emulaator võib lubada toiminguid ja indekseid, mis tootmiskeskkonnas vajavad eraldi seadistamist.

---

## 9. Kirjuta `docs/firestore.md` mõõdetud tulemustega.
Käivitati `node materials/check-firestore.js` ja saadi **31 kontrolli OK**.
Kuulaja sai 2 teadet. Liitindeksit nõudev päring töötas 20 ms jooksul ja tagastas 1 dokumendi. Kahe võrratusega päring tagastas 1 dokumendi.

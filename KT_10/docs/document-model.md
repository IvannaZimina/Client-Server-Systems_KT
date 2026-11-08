# Ülesanne 1 - Dokumendimudel ja andmete kuju

## 1. Kirjuta sama sündmus mõlemas kujus ja loe kollektsioonid kokku.
Näiteks sündmus **Rock Concert** toimub 15.12.2026 Tallinn Concert Hallis (Tallinn) ja sellel on kohad A1, A2 ja A3.
- **Normaliseeritud mudel (Normalized):** sündmus salvestatakse kollektsiooni `events` ja kohad eraldi kollektsiooni `seats`. Sündmus on saaliga seotud `venueId` kaudu. Kokku on **2 kollektsiooni**.
- **Denormaliseeritud mudel (Denormalized):** sündmus, saali info ja kohad salvestatakse koos ühte `events` dokumendisse. Kokku on **1 kollektsioon**.

---

## 2. Arvuta saali nime ja vabade kohtade arvu dubleerimise hind.
| Andmed             | Koopiaid | Muutusi päevas | Kirjutamisi | Säästetud lugemisi | Otsus                  |
| ------------------ | -------: | -------------: | ----------: | -----------------: | ---------------------- |
| Saali nimi         |     2000 |              1 |        2000 |              50000 | Dubleerimine tasub ära |
| Vabade kohtade arv |        1 |           5000 |        5000 |               3000 | Hoida viitena          |
Saali nimi muutub harva, kuid seda loetakse sageli.
2000 kirjutamist päevas säästab 50000 lugemist, seega on dubleerimine põhjendatud.
Vabade kohtade arv muutub sagedamini kui seda loetakse.
5000 kirjutamist ei ole põhjendatud 3000 lugemise säästmisega, seega on parem hoida andmeid ühes kohas.

---

## 3. Mõõda, mitu kommentaari mahub ühte 16 MB dokumenti.
MongoDB dokumendi maksimaalne suurus on 16 MB ehk 16777216 baiti.
Ühe kommentaari mõõdetud suurus on 114 baiti.
Arvutus: 16777216 / 114 = 147168 kommentaari.
Seega mahub ühe dokumendi sisse ligikaudu 147000 kommentaari.
Tegelik maht on väiksem, sest ruumi vajavad ka dokumendi struktuur, massiiv ja väljade nimed.
Piiramatu kasvu korral võib dokument ületada 16 MB piiri ning seda ei saa enam salvestada.

---

## 4. Tee tabel KUUEST reast: neli perekonda ja kaks andmekuju.
| Perekond / andmekuju | Näide                           | Sobib                                             | Ei sobi                                              |
| -------------------- | ------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| Document             | MongoDB                         | Paindliku struktuuriga andmed                     | Keerulised mitmele-mitmele seosed                    |
| Key-value            | Redis                           | Kiire otsing võtme järgi                          | Keerulised päringud väärtuste sisu järgi             |
| Column               | Apache Cassandra                | Suured andmemahud ja hajutatud kirjutamine        | Keerulised JOIN-operatsioonid                        |
| Graph                | Neo4j                           | Võrgustikud ja keerulised seosed                  | Lihtsate võtme-väärtusandmete massiline salvestamine |
| Normaliseeritud      | Events ja Seats eraldi          | Andmete eraldi muutmine ja dubleerimise vältimine | Andmete kuvamine ühe päringuga                       |
| Denormaliseeritud    | Sündmus koos saali ja kohtadega | Seotud andmete kiire lugemine                     | Sageli muutuvate andmete dubleerimine                |

---

## 6. Kirjuta pickShape nii, et neli sisendit annavad vastuse ise.
- `childrenGrow = true` → `reference`, sest alamkirjete arv kasvab pidevalt.
- `childrenQueriedAlone = true` → `reference`, sest alamkirjeid päritakse eraldi.
- `childrenAvg > 100` → `reference`, sest suur alamkirjete arv kasvatab dokumendi mahtu.
- `readTogether = true` → `nested`, kui ükski eelmistest tingimustest ei kehti, sest andmeid loetakse koos.
- 
Näited:
- Kontserdi kohad: `readTogether = true`, `childrenAvg = 50`, `childrenGrow = false`, `childrenQueriedAlone = false` → `nested`.
- Kontserdi kommentaarid: `readTogether = false`, `childrenAvg = 150`, `childrenGrow = true`, `childrenQueriedAlone = true` → `reference`.

---

## 7. Seleta KOLM asja: miks „skeemita“ ei ole „struktuurita“; miks denormaliseerimine on ka ATOMAARSUS; miks kohti tohib pesastada, aga kommentaare mitte.
- **Miks „skeemita“ ei tähenda „struktuurita“.**
Meie andmebaasis on sündmusel `Rock Concert` väljad `id`, `name`, `date` ja `venueId`. MongoDB lubab teistel sündmustel kasutada lisavälju, kuid rakenduse korrektseks tööks peavad põhiliste väljade nimed ja andmetüübid olema kooskõlas. Seega on andmete struktuur ikkagi vajalik.

- **Miks denormaliseerimine on ka aatomilisuse küsimus.**
Denormaliseeritud mudelis salvestatakse `Rock Concert`, Tallinn Concert Halli info ja kohad A1–A3 ühte dokumenti. Seetõttu saab selle sündmuse andmeid muuta ühe atomaarse operatsiooniga. Normaliseeritud mudelis asuvad andmed kahes kollektsioonis ja nende kooskõlastatud muutmiseks võib vaja minna tehingut.

- **Miks kohti võib pesastada, aga kommentaare mitte.**
Kohad A1–A3 on piiratud arvuga ja neid loetakse koos sündmuse infoga, seega sobivad need sündmuse dokumendi sisse. Kontserdi kommentaaride arv võib pidevalt kasvada ja neid võidakse pärida eraldi. Seetõttu on parem hoida kommentaare eraldi kollektsioonis, et sündmuse dokument ei ületaks 16 MB suuruse piirangut.
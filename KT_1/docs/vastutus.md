# Ülesanne 2 - Vastutuse jaotus

## Klassifikatsioon

| #   | Rakenduse osa                             | Klient | Server | Põhjendus                                                                        |
| --- | ----------------------------------------- | ------ | ------ | -------------------------------------------------------------------------------- |
| 1   | Mängukordade nimekirja kuvamine           | Jah    | Jah    | Klient kuvab kasutajale, aga andmed peab andmebaasist turvaliselt andma server.  |
| 2   | Kuupäevavälja vorming                     | Jah    | Ei     | Kliendi poolt mugavuse ja visuaalse vorminduse tagamiseks.                       |
| 3   | "Vabu kohti vähemalt" filtri rakendamine  | Jah    | Jah    | Kliendis kiireks filtreerimiseks, serveris täpseks andmete pärimiseks.           |
| 4   | Kontroll, kas väli on täitmata            | Jah    | Ei     | Kiire tagasiside kasutajale vormi täitmisel (mugavus).                           |
| 5   | Kontroll, kas mängukord on juba täis      | Ei     | Jah    | Kriitiline reegel, mida klient saab petta – server peab rangelt kaitsma.         |
| 6   | Kontroll, kas kasutaja on sisse logitud   | Ei     | Jah    | Turvalisuse tagamiseks peab server alati kontrollima sessiooni/tokenit.          |
| 7   | Kontroll, kas kasutaja on admin           | Ei     | Jah    | Admin-õiguste kontroll peab toimuma serveris, et vältida volitamata juurdepääsu. |
| 8   | Paarikutse saatmine                       | Ei     | Jah    | Ärifunktsioon, mida server peab valideerima ja andmebaasi salvestama.            |
| 9   | Mängutabeli genereerimine ringmeetodiga   | Ei     | Jah    | Keeruline äriloogika, mis tehakse turvaliselt serveri poolel.                    |
| 10  | Edetabeli arvutamine                      | Ei     | Jah    | Andmete töötlemine ja arvutamine peab toimuma serveris.                          |
| 11  | Tulemuste sortimine juba laaditud tabelis | Jah    | Ei     | Kasutajaliideses kiiruse ja mugavuse huvides.                                    |
| 12  | Andmebaasi parool                         | Ei     | Jah    | Paroolid ja salajased võtmed asuvad rangelt ainult serveri keskkonnas.           |

## Kolm asja, mis ei tohi kunagi kliendile jõuda

1. **API salajased võtmed ja välised teenuste tokenid (nt makselüüsid või e-posti teenused)** – kui need lekivad kliendile, saavad teised neid kuritarvitada (näiteks saata sinu nimel miljoneid spämmi-e-kirju või teha kulukaid päringuid).
2. **Kasutajate paroolide räsid või soolased (hashed passwords)** – kui paroolide andmebaas koos räsidega laetakse kliendi poolele, saab ründaja neid võrguühenduseta (offline) jõuga ehk *Brute Force / Rainbow Table* meetodiga lahti murda.
3. **Sisemised ärireeglid ja hinnakujunduse/allahindluste algoritmid** – kui kogu loogika, kuidas arvutatakse klubi liikmetasusid või soodustusi, on kliendi koodis lahti kirjutatud, saab iga kasutaja muuta koodi nii, et saab treeningud tasuta.

## Kolm rünnakut (kui kontroll on tehtud ainult kliendis)

### 1. MassAssignment / Andmeväljade volitamata lisamine (Over-posting)
* **Kuidas juhtub:** Kasutaja saadab vormi kaudu lisavälja (näiteks `is_admin: true` või `balance: 1000`), mida vormis polnudki näha, aga kuna server võtab vastu kogu objekti, kirjutab see andmed baasi.
* **Miks see on katastroof:** Kasutaja saab salaja muuta andmeid, millele tal ei tohiks ligipääsu olla.
* **Kuidas serveripoolne kontroll aitab:** Server filtreerib sissetulevad andmed rangelt (*whitelisting*) ja lubab muuta ainult lubatud välju.

### 2. Broken Object Level Authorization (BOLA - Broken Object Level Authorization / IDOR - Insecure Direct Object Reference)
* **Kuidas juhtub:** Kasutaja muudab URL-is või päringus oma ID (näiteks `/api/user/5`) kellegi teise ID vastu (`/api/user/6`), et näha teise klubiliikme privaatseid broneeringuid või isikuandmeid.
* **Miks see on katastroof:** Server usub, et kui kasutaja on sisse loginud, siis võib ta vaadata suvalisi ID-sid, ja lekivad teiste isikuandmed (GDPR rikkumine).
* **Kuidas serveripoolne kontroll aitab:** Server kontrollib alati sessiooni põhjal: kas *praegusel* sisselogitud kasutajal on õigus *just sellele* konkreetsele ressursile ligi pääseda.

### 3. Rate Limiting puudumine / Brute-Force rünnak (Päringute uputamine)
* **Kuidas juhtub:** Ründaja kirjutab skripti, mis saadab kliendi liidese kaudu (või otse) sekundis tuhat sisselogimispäringut või broneeringikatset.
* **Miks see on katastroof:** Server või andmebaas jookseb koormuse all kokku (*Denial of Service*) või toimub paroolide automaatne äraarvamine.
* **Kuidas serveripoolne kontroll aitab:** Server seab IP-aadressi või kasutaja põhjal limiidid (*Rate Limiting*) ja blokeerib liiga kiire ja kahtlase päringute voo.
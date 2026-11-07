# C08 — Ülesanne 5: Tagasisurve ja serveri vahemälu

## 1. Rakenda neli voogude tagasisurve strateegiat.

Failis `server/cache.js` loodi funktsioon `createStream()`, mis toetab nelja strateegiat: `buffer`, `drop_new`, `drop_old` ja `last_only`.

- `buffer` säilitab kõik teated. Viie teate lisamisel jäi järjekorda 5 teadet ja kaduma ei läinud ühtegi.
  Kui kliendil on aeglane ühendus, võib järjekord piiramatult kasvada.
- `drop_new` jätab järjekorra täitumisel uued teated lisamata. Mahuga 3 säilitati teated `[1, 2, 3]` ja kaduma läks 2 uut teadet.
- `drop_old` eemaldab järjekorra täitumisel kõige vanema teate. Mahuga 3 säilitati teated `[3, 4, 5]`.
- `last_only` säilitab ainult viimase teate. Viie teate lisamisel jäi alles `[5]` ja vahepealsena läks kaduma 4 teadet.

Funktsioon `clear()` saadab järjekorrast teateid etteantud arvul ning `pending()` ja `lost()` tagastavad vastavalt järjekorras olevate ja kaotatud teadete arvu.

---

## 2. Võrdle strateegiaid.

`drop_new` sobib olukorda, kus vanemad teated on olulisemad kui uued.
`drop_old` säilitab uuema info.
`last_only` sobib siis, kui oluline on ainult kõige viimane seis.
`buffer` ei kaota teateid, kuid võib suurendada mälukasutust.

Kontrollimisel lisati igale strateegiale viis teadet.
Lisaks kontrolliti, et `drop_old` saadab korraga kaks teadet ja jätab ülejäänud kolm järjekorda.

---

## 3. Vali piletikassa jaoks sobiv strateegia.

Piletikassa jaoks valiti `last_only`, sest kliendile on oluline ainult viimane vabade kohtade arv, mitte vahepealsed muutused.

---

## 4. Määra, millal aeglane klient ühenduselt eemaldada.

Funktsioonis `shouldClose()` kontrollitakse väljaminevate andmete puhvri suurust (`bufferedAmount`).
Ühendus suletakse, kui puhver ületab 1 MB. Väikese puhvri korral ühendust ei suleta.
Kontrollimisel tagastas `shouldClose(1000)` väärtuse `false` ja `shouldClose(2000000)` väärtuse `true`.

---

## 5. Saada kliendile ainult vajalik info.

Piletikassa puhul kasutatakse `last_only` strateegiat.
Kui vabade kohtade arv muutub mitu korda järjest, säilitatakse ainult viimane väärtus.
Nii ei saadeta kliendile kõiki vahepealseid muutusi.

---

## 6. Rakenda serveri vahemälu TTL-i ja LRU-ga.

Funktsioonis `createCache()` loodi vahemälu, millel on aegumisaeg (`TTL`) ja maksimaalne kirjete arv (`cap`).
- Vaikimisi TTL on 300 000 ms ehk 5 minutit.
- Aegumise kontrollimisel eemaldatakse aegunud kirje.
- Edukas lugemine suurendab tabamuste arvu ja tõstab kirje LRU-järjekorra lõppu.
- Mahu täitumisel eemaldatakse kõige kauem kasutamata kirje.
- `stats()` tagastab tabamuste ja möödalaskmiste arvu.

Kontrollimisel loeti kirje `1` enne uue kirje lisamist.
Pärast mahu täitumist jäi kirje `1` alles ja eemaldati lugemata kirje `2`.

---

## 7. Kontrolli vahemälu kirjete säilimist.

Kontrolliti, et aegunud kirje tagastab `undefined` ja eemaldatakse vahemälust.
Samuti kontrolliti, et hiljuti loetud kirjet ei eemaldata enne vanemat kasutamata kirjet.

---

## 8. Rakenda siltide põhine kehtetuks muutmine.

Kirjetele lisatakse sildid (`tags`). Funktsioon `evictTag()` eemaldab kõik kirjed, millel on etteantud silt.
Kontrollimisel eemaldati sildiga `event:3` seotud kirjed `list` ja `search:x`.
Kirje `report`, millel seda silti ei olnud, jäi alles.
TTL-i korral võib aegunud info olla kasutusel kuni aegumiseni.
Võtme järgi eemaldamisel tuleb teada kõiki seotud võtmeid.
Siltide abil saab eemaldada korraga kõik sama sündmusega seotud kirjed.

---

## 9. Määra, milliseid andmeid ei tohi jagatud vahemällu salvestada.

Funktsioonis `mayCache()` keelatakse salajaste ja kasutajapõhiste andmete salvestamine jagatud vahemällu.
Kasutajapõhised andmed võivad eri kasutajate vahel seguneda ning põhjustada andmete lekkimist.
Sageli muutuvate andmete TTL on 5000 ms. Stabiilsete andmete vaikimisi TTL on 300 000 ms.

---

**Käivitati käsk:** `node materials\check-cache.js`
Tulemus: `30 kontrolli OK`
Kõik kontrollid läbisid edukalt.
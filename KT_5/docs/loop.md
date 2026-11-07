# Ülesanne 1 — Sündmuste tsükkel mõõdetuna ★★

### 1. Kirjuta iga funktsiooni oodatav väljund üles ENNE, kui teda jooksutad.

Enne käivitamist koostatud prognoos on esitatud plokis `Prognoos enne
käivitamist`.

#### Prognoos enne käivitamist

`threeQueues()` prognoos: `1 sünkroonne algus`, `2 sünkroonne lõpp`,
`3 mikroülesanne`, `4 queueMicrotask`, `5 setTimeout 0`.

`microBeforeMacro()` prognoos: `mikro 1, mikro 2, mikro 3, makro 1, makro 2`.

`delay(100, 250)` prognoos: lubatud aeg `100 ms`, tegelik aeg ligikaudu
`250 ms`.

`pyramid(callback)` prognoos: kolm järjestikust `5 ms` taimerit ja tulemus
`callback(null, "valmis")`.

`block(250)` prognoos: funktsioon blokeerib JavaScripti lõime
ligikaudu 250 ms jooksul ja tagastab tegelikult mõõdetud aja.

## Lisafunktsioonide kontroll

`block(250)` tulemus: 250 ms.

`pyramid(callback)` tulemus: `null, valmis`.
Kolm järjestikust taimerit käivitati ja pärast neid kutsuti välja callback.

---

### 2. Jooksuta `threeQueues()` ja pane viis rida õigesse järjekorda.

Mõõdetud järjekord on `1 sünkroonne algus`, `2 sünkroonne lõpp`,
`3 mikroülesanne`, `4 queueMicrotask`, `5 setTimeout 0`. Kaks esimest rida
tekivad kohe sünkroonse koodi ajal. Promise'i jätk ja `queueMicrotask` kuuluvad
mikroülesannete hulka.

---

### 3. Jooksuta `microBeforeMacro()` ja seleta, miks mikro 2 ja 3 jõudsid ette.

Tulemus on `mikro 1, mikro 2, mikro 3, makro 1, makro 2`. `mikro 2` ja
`mikro 3` lisatakse `Promise`-ahela jätkudena mikrotööde järjekorda. Sündmuste
tsükkel täidab mikrotööd enne `setTimeout()` taimerite ehk makrotööde
käivitamist.

---

### 4. Märgi iga koht, kus sinu ennustus EI klappinud, ja kirjuta põhjus.

Mõõdetud väljundid klappisid prognoosidega. Kõige rohkem küsimusi tekitas
`setTimeout(..., 0)`, kuid `threeQueues()` kinnitas, et taimer käivitub pärast
sünkroonset koodi ja mikrotöid.

---

### 5. VIHJE: `setTimeout(f, 0)` ei ole kõige kiirem — ta on makroülesanne.

Funktsioonis `threeQueues()` lisab `setTimeout(f, 0)` funktsiooni
makrotööde järjekorda. Seetõttu käivitub taimer pärast sünkroonset koodi ja
mikrotööde lõpetamist.

---

### 6. Jooksuta `delay(100, 250)` ja kirjuta lubatud ning tegelik aeg üles.

Lubatud aeg on 100 millisekundit. Käivitamisel mõõdeti tegelikuks ajaks
250 millisekundit, sest taimer käivitub pärast blokeeriva tsükli lõppu.
```javascript
delay(100, 250): { allowed: 100, actual: 250 }
```

---

### 7. Seleta, miks kell tulistas hiljem, kui talle öeldi.

Blokeeriv tsükkel hõivab JavaScripti ainsa lõime. Taimeri aeg saab täis, kuid
taimeri funktsioon saab käivituda alles pärast lõime vabanemist.

---

### 8. Võrdle tagasikutset ja lubadust: pesastamine, viga, tagastusväärtus.

Pesastatud tagasikutsed moodustavad kergesti sügava püramiidi
ehk callback-hell. Promise'i puhul saab järjestikused tegevused
ühendada `.then()`-ahelaks.

Tagasikutse puhul tuleb viga kontrollida igas sammus eraldi.
Promise'i ahelas liigub viga edasi kuni `.catch()`-meetodini,
kus seda saab käsitleda.

Tagasikutse tagastusväärtus ei jõua automaatselt algse funktsioonini.
Promise'i puhul saab `.then()` tagastada uue väärtuse või Promise'i,
mida järgmine ahela samm kasutab.

## 9. Event Loop'i kasutamine piletikassas

1. Piletite laadimine: `fetch()` abil saab serverist piletite info
laadida ilma kasutajaliidest blokeerimata.

2. Ostu kinnitamine: serveri vastust saab oodata Promise'i abil.
Selle aja jooksul jääb kasutajaliides kasutatavaks.

3. Otsing ja filtrid: kasutaja sisestatud otsingut saab viivitusega
käivitada, näiteks `setTimeout()` abil, et päringut ei saadetaks
iga klahvivajutuse peale.
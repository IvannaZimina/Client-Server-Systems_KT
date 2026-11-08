# C10 # Ülesanne 3 - koondamiskonveier

## 1. Kirjuta sama koond kahes järjekorras.
**Esimene järjekord:** `$group` → `$match`. Kõigepealt rühmitatakse kõik 2000 sündmust linna järgi ja seejärel valitakse grupp `Tartu`.

**Teine järjekord:** `$match` → `$group`. Kõigepealt valitakse Tartu linna sündmused ja seejärel rühmitatakse need.
Mõlema variandi tulemusena saadi 500 sündmust.
---

## 2. Jooksuta mõlema peal explain ja võrdle dokumentide ning indeksivõtmete arvu.
| Konveier               | Dokumente | Indeksivõtmeid |
| ---------------------- | --------: | -------------: |
| `$group` enne `$match` |      2000 |              0 |
| `$match` enne `$group` |         0 |            500 |

`$match` esimesena võimaldas kasutada indeksit ja vältida dokumentide lugemist.

---

## 3. Mõõda $lookup indeksiga ja ilma.
| Näitaja                |  Indeksita |         Indeksiga |
| ---------------------- | ---------: | ----------------: |
| Strateegia             | `HashJoin` | `IndexedLoopJoin` |
| Dokumente vaadati      |       2200 |              2200 |
| Indeksivõtmeid vaadati |          0 |               200 |
| Aeg                    |     209 ms |            171 ms |

Indeksiga päring oli 38 ms kiirem. `$lookup` ei ole N+1 probleem, sest ühendamine toimub andmebaasis ühe agregatsioonipäringu osana.

---

## 4. VIHJE: agregatsiooni explain on pesastatud teisiti kui find explain.
Väljad `totalDocsExamined` ja `totalKeysExamined` leiti kogu `explain` tulemuse pesastatud struktuurist.

---

## 5. Tee tabel VIIEST olukorrast: millal konveier, millal loendur dokumendis.
| Olukord                                                    | Lahendus           |
| ---------------------------------------------------------- | ------------------ |
| Piletite arvu kohene kuvamine suure päringusageduse korral | Loendur dokumendis |
| Linnade päevaaruande koostamine                            | Konveier           |
| Sündmuste keskmise hinna arvutamine                        | Konveier           |
| Müüdud piletite arvu pidev kuvamine suure koormuse korral  | Loendur dokumendis |
| Ühekordne müügiandmete analüüs                             | Konveier           |

Loendur sobib sagedasteks ja kiiret vastust nõudvateks päringuteks.
Konveier sobib koondamiseks ja aruannete koostamiseks.

---

## 6. Seleta KAKS asja: miks $match peab olema esimene ja miks toArray() juures mälu otsa saab.
`$match` peab olema võimalikult esimene etapp, et MongoDB saaks kasutada indeksit ja vähendada tööd järgmistes etappides. `toArray()` laadib kõik tulemused korraga mällu, mistõttu võib suur andmehulk mälu ammendada. Kursor võimaldab tulemusi järk-järgult töödelda.

---

## 7. Kirjuta docs/pipeline.md koos mõõdetud arvudega.
Mõõtmistulemused ja võrdlustabelid on esitatud punktides 2 ja 3.

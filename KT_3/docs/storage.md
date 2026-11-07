# Ülesanne 5 — Brauseripoolne hoidla ja mustand

## 1. localStorage säilitab ainult sõne

`localStorage` salvestab ainult string-tüüpi väärtusi.

```javascript
localStorage.setItem("x", { a: 1 });
localStorage.getItem("x");
```

Tulemuseks on:

```text
"[object Object]"
```

Objekti salvestamiseks tuleb kasutada `JSON.stringify()` ja lugemisel `JSON.parse()`.

## 2. Versioonitud kirje

Mustandi salvestamisel kasutatakse võtit `piletikassa:draft`.

Salvestatud kirje struktuur:

```javascript
{
    version: 1,
    data: { ... }
}
```

Versiooni hoitakse konstandis `VERSION`. Kui salvestatud kirje versioon puudub või erineb rakenduse versioonist, eemaldab `read()` vana kirje ja tagastab `null`.

## 3. Funktsioonid failis public/draft.js

Failis on kolm funktsiooni:

- `save(data)` teisendab andmed JSON-stringiks ja salvestab need. Edu korral tagastab `true`, vea korral `false`.
- `read()` loeb kirje, kontrollib selle versiooni ja tagastab andmed. Puuduva kirje, vale versiooni või vea korral tagastab `null`.
- `remove()` kustutab mustandi. Edu korral tagastab `true`, vea korral `false`.

Kõik kolm funktsiooni kasutavad `try/catch`, et hoidla vead ei katkestaks rakenduse tööd.

## 4. Vigade testimine

Ülesandes kontrollitakse kolme olukorda.

| Olukord                            | Oodatav tulemus                                     |
| ---------------------------------- | --------------------------------------------------- |
| Vale või puuduv versioon           | `read()` tagastab `null` ja vana kirje kustutatakse |
| Katkine JSON                       | `read()` tagastab `null`                            |
| `QuotaExceededError` salvestamisel | `save()` tagastab `false`                           |
| Keelatud hoidla lugemisel          | `read()` tagastab `null`                            |

Need testid kontrollivad, et rakendus töötaks edasi ka siis, kui mustandit ei saa lugeda või salvestada.

## 5. localStorage, sessionStorage ja IndexedDB

| Hoidla           | Eluiga                     | Ulatus                  | Sünkroonsus | Kasutus                         |
| ---------------- | -------------------------- | ----------------------- | ----------- | ------------------------------- |
| `localStorage`   | Kuni kustutamiseni         | Sama päritolu vahelehed | Sünkroonne  | Väikesed tekstilised andmed     |
| `sessionStorage` | Kuni vahelehe sulgemiseni  | Üks vaheleht            | Sünkroonne  | Ajutised andmed                 |
| `IndexedDB`      | Kuni andmete kustutamiseni | Sama päritolu           | Asünkroonne | Suuremad struktureeritud andmed |

`localStorage` ja `sessionStorage` on lihtsad, kuid nende kasutamine on sünkroonne ja andmemaht piiratud. `IndexedDB` sobib suuremate struktureeritud andmete hoidmiseks.

Tundlikke tokeneid ei ole soovitatav hoida `localStorage`-is, sest XSS-rünnaku korral võib pahatahtlik skript neid lugeda.

## 6. Mõõdetud päritolu

Kontrollimiseks kasutati kahte aadressi:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Need aadressid on erinevad päritolud, sest host on erinev. Seetõttu ei ole nende `localStorage` sama.

Oodatav kontrolltulemus:

```text
localhost:3000 -> read() returned data
127.0.0.1:3000 -> read() returned null
```

Tulemus sõltub sellest, kas vastava päritolu hoidlas on mustand olemas.

## 7. Kokkuvõte

Ülesande käigus loodi fail `public/draft.js`, mis võimaldab mustandit salvestada, lugeda ja kustutada.

Andmed salvestatakse JSON-stringina koos versiooninumbriga. Vigase või sobimatu kirje korral tagastab `read()` `null` ning salvestamise vea korral tagastab `save()` `false`.

Mustand jääb brauserisse ega lähe serverisse enne ostu sooritamist.

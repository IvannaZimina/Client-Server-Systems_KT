# Ülesanne 3 - Andmete edastamise viisid

### 1. Saada ost päringustringina, JSON-ina, urlencoded-ina ja multipartina; kirjuta koodid üles.

Kõigis päringutes kasutati samu andmeid: `event=3`, `qty=2`, `buyer=Mari`.

| viis          | Content-Type                        | kood |
| ------------- | ----------------------------------- | ---: |
| päringustring | puudub                              |  415 |
| vormiandmed   | `application/x-www-form-urlencoded` |  201 |
| JSON          | `application/json`                  |  201 |
| multipart     | `multipart/form-data`               |  201 |

Päringustringi korral olid parameetrid URL-is, kuid keha puudus. Server tagastas `415 Unsupported Media Type`. Ülejäänud kolm vormingut võeti vastu ja tagastati `201 Created`.

`Content-Type` näitab päringu keha vormingut. `Accept` näitab, millist vastuse vormingut klient soovib.

### 2. Mõõda iga keha baitides ja pane neli arvu ühte tabelisse.

Suurused mõõdeti `/api/mirror` vastuse `body_bytes` väärtuse järgi.

| viis          | keha suurus |
| ------------- | ----------: |
| päringustring |         0 B |
| vormiandmed   |        24 B |
| JSON          |        34 B |
| multipart     |       356 B |

Multipart-keha oli sama kolme välja puhul umbes 14,8 korda suurem kui urlencoded-keha. Suuruse erinevus tuleneb osade piiritlejatest ja päistest.

### 3. Saada üks päring tüübiga `text/plain` ja kirjuta kood ning põhjus üles.

Päring saadeti päisega `Content-Type: text/plain` ja ühebaidise sisuga `x`.

Server tagastas `415 Unsupported Media Type`, sest `text/plain` ei ole tellimuse keha toetatud vorming.

### 4. Vaata vastusest `Location`-päist ja seleta, miks 201 ilma temata on poolik.

Õnnestunud tellimuse loomisel tagastas server `201 Created` ja päise:

```text
Location: /api/orders/1003
```

Päis näitab loodud ressursi aadressi. Ilma selleta peaks klient uue tellimuse aadressi ise tuletama.

### 5. VIHJE: multipart eraldab iga välja oma piiritlejaga — vaata peeglist toorest keha.

`/api/mirror` vastuses oli näha kolme eraldi osa: `event`, `qty` ja `buyer`. Iga osa algas piiritlejaga ning sisaldas `Content-Disposition`-päist, tühja rida ja välja väärtust.

Päringu keha suurus oli 356 baiti.

### 6. Näita, et urlencoded annab arvu SÕNENA, JSON aga arvuna.

Urlencoded-vormingu korral näitas `/api/mirror` vastus:

```json
{
  "event": "3",
  "qty": "2",
  "buyer": "Mari"
}
```

JSON-vormingu korral oli vastus:

```json
{
  "event": 3,
  "qty": 2,
  "buyer": "Mari"
}
```

Urlencoded annab väärtused sõnedena, JSON säilitab arvulise tüübi. Seetõttu annab `"2" + 1` tulemuseks `"21"`, aga `2 + 1` tulemuseks `3`.

### 7. Kirjuta, millal on õige valik päringustring ja miks ta ostuks ei kõlba.

Päringustring sobib otsimiseks, filtreerimiseks ja sortimiseks, kui andmeid loetakse. Ostu loomisel muudetakse serveri olekut, seetõttu kasutatakse POST-päringut ja andmeid edastatakse päringu kehas. URL võib jääda logidesse, järjehoidjatesse või vahemäludesse.

### 8. Seleta, miks `charset` ei ole valikuline — too näide täpitähega.

`charset` määrab, kuidas keha baite märkideks dekodeeritakse. UTF-8 võimaldab edastada ka täpitähti, näiteks `Õ` sõnas `Mari Õun`.

Kontrollpäring saadeti päisega `Content-Type: application/json; charset=UTF-8`. Peegelduses oli tekst õigesti loetav ja keha suurus oli 21 baiti.

### 9. Kirjuta `docs/transfer.md` koos mõõdetud baitidega.

Failis on esitatud nelja edastusviisi mõõdetud keha suurused, vastuste olekukoodid, `Location`-päis, multipart-keha struktuur, andmetüüpide erinevus ja `charset`-i kontroll.

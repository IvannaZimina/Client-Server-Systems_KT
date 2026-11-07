# Ülesanne 4 - Küpsised, päritolu ja CORS

### 1. Sea viis küpsist ja vaata neid Application-paneelilt üle.

Server seadis viis küpsist erinevate atribuutidega:

| Küpsis       | Väärtus | Atribuut                        |
| ------------ | ------: | ------------------------------- |
| `simple`     |       1 | `Path=/`                        |
| `httponly`   |       2 | `Path=/; HttpOnly`              |
| `short`      |       3 | `Path=/; Max-Age=10`            |
| `same_site`  |       4 | `Path=/; SameSite=Strict`       |
| `cross_site` |       5 | `Path=/; SameSite=None; Secure` |

Kõik viis küpsist olid brauseri Application-paneelil nähtavad.

### 2. Võrdle `document.cookie` sisu sellega, mida server oma nimekirjas näitab.

Brauseri `document.cookie` näitas:

```text
simple=1; same_site=4; cross_site=5
```

Serveri küpsiste nimekirjas olid kõik viis küpsist:

```text
simple=1; httponly=2; short=3; same_site=4; cross_site=5
```

`document.cookie` ei näita `HttpOnly` atribuudiga küpsist. Server saab seda küpsist siiski lugeda.

### 3. Nimeta küpsis, mis on ÜHES nimekirjas ja puudub teisest.

`httponly=2` oli serveri nimekirjas, kuid puudus `document.cookie` loendist. `HttpOnly` peidab küpsise JavaScripti eest, mitte serveri eest.

### 4. Seleta, miks istungimärgis ei kuulu `localStorage`-isse (C03 Ex5).

`localStorage` on JavaScriptile loetav. XSS-rünnaku korral võib pahatahtlik skript sealt istungimärgise varastada. `HttpOnly` küpsist JavaScript lugeda ei saa, seetõttu sobib see serveripoolse istungi jaoks paremini.

### 5. VIHJE: `Max-Age=10` küpsis kaob kümne sekundiga — laadi leht uuesti ja vaata.

`short=3` küpsisele määrati `Max-Age=10`, seega on selle eluiga kümme sekundit. Pärast aegumist brauser seda küpsist enam ei saada.

### 6. Küsi pordilt 3005 ilma CORS-ita: kirjuta Console-paneeli teade üles ja näita Network-paneelilt, et server VASTAS, kuigi leht vastust ei saanud.

Päring saadeti aadressile `http://localhost:3005/api/cors` lehelt, mis asus pordil `3004`.

Pordid `3004` ja `3005` tähendavad erinevat päritolu. Server vastas päringule, kuid CORS-i päiste puudumise tõttu ei lubanud brauser JavaScriptil vastust lugeda. Console-paneelil kuvatakse CORS-i veateade ja `fetch` ebaõnnestub.

Network-paneelil on päring siiski nähtav, sest server sai päringu ja vastas sellele.

### 7. Saada PUT lubatud CORS-iga ja loe välja, mitu päringut brauser tegi.

PUT-päringule eelnes CORS-i eelkontroll ehk preflight-päring:

```text
1. OPTIONS
2. PUT
```

Brauser tegi kokku kaks päringut. OPTIONS kontrollis, kas server lubab PUT-meetodit ja kasutatavaid päiseid. Pärast lubavat vastust saadeti PUT-päring.

### 8. Küsi 3005-lt `credentials`-iga ja kirjuta üles, KAS `SameSite=Strict` küpsis läks.

Päring saadeti valikuga `credentials: "include"`. Server lubas päringu konkreetsele päritolule ja vastuses oli `Access-Control-Allow-Credentials: true`.

Sama saidi tõttu saadeti ka `SameSite=Strict` küpsis. Pordid `3004` ja `3005` on erineva päritoluga, kuid sama saidiga, sest port ei kuulu saidi määratlusse.

### 9. Seleta, mida HTTPS-i sertifikaat tõendab ja mida mitte, ja nimeta kolm asja, mis ilma HTTPS-ita ei tööta.

HTTPS-i sertifikaat seob sertifikaadis nimetatud hosti avaliku võtmega ja võimaldab kontrollida serveri identiteeti. See ei tõenda veebilehe omaniku ausust ega veebilehe sisu õigsust.

Ilma HTTPS-ita ei tööta:

1. TLS-i kaudu krüpteeritud ühendus;
2. `Secure`-küpsiste tavapärane kasutamine;
3. sertifikaadipõhine serveri autentimine.

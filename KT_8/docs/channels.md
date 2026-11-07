# C08 Ülesanne 2 — WebSocket: kanalid ja taasühendus

## 1. Kirjuta keskus, kus teade läheb AINULT oma kanali liikmetele.
Failis `server/channels.js` loodi `createHub()`.
Ühendused lisatakse kanalitesse ning sõnum saadetakse ainult vastava kanali liikmetele.
Kontrollis liideti kaks ühendust kanalisse `event:1` ja üks kanalisse `event:2`.
Sõnumi sai ainult kaks esimesse kanalisse kuuluvat ühendust.

---

## 2. Kustuta TÜHI kanal — muidu on Map mäluleke, mis paistab nädalate pärast.
Funktsioonis `leave()` kustutatakse kanal `Map`-ist kohe, kui selle liikmete arv jõuab nullini.
`leaveAll()` eemaldab ühenduse kõigist kanalitest.
Ilma puhastamiseta jääksid tühjad kanalid mällu ka pärast ühenduste sulgemist.

---

## 3. Ära saada suletud ühendusele; kontrolli enne.
Enne sõnumi saatmist kontrollitakse ühenduse `open` väärtust.
Suletud ühendused jäetakse saatmisel vahele. Nii ei proovita saata sõnumeid ühendustele, mis enam ei tööta.

---

## 4. Autendi ühenduse loomisel ja põhjenda, miks märgis EI KÄI URL-i.
Funktsioonis `authConnection()` kontrollitakse küpsist või esimest autentimissõnumit.
Vigase autentimise korral tagastatakse kood `4401`.
Tokenit ei lisata URL-i, sest URL võib salvestuda brauseri ajalukku ning serveri ja puhverserveri logidesse.
See võib tokeni teistele nähtavaks teha.

---

## 5. VIHJE: WebSocketil ei ole päiseid pärast käepigistust.
Autentimiseks kasutatakse küpsist ühenduse loomisel või eraldi esimest sõnumit.
Pärast WebSocketi käepigistust ei saa enam HTTP-päiseid lisada. Seetõttu ei saa hiljem lisada ka `Authorization`-päist.

---

## 6. Määra sulgemiskoodid ja otsusta iga kohta, kas tasub uuesti proovida.
Funktsioonis `shouldReconnect()` määratakse sulgemiskoodi põhjal, kas ühendus tuleb uuesti luua.
- `1000` — normaalne sulgemine, ei.
- `1006` — ühendus katkes, jah.
- `4401` — autentimata, ei.
- `4403` — ligipääs keelatud, ei.
- `4429` — ülekoormus, jah.
- `4503` — server seiskub, jah.
Autentimisvea või keelatud ligipääsu korral ei ole korduv proovimine mõistlik, sest sama päring annab tõenäoliselt sama tulemuse.
Ülekoormuse ja ühenduse katkemise korral võib uus katse õnnestuda.

---

## 7. Kirjuta kasvava ooteajaga taasühendaja koos juhuslikkusega.
Funktsioonis `createReconnector()` toimub taasühendamine järgmiselt:
1. Esimene katse — 500 ms pärast.
2. Teine katse — 1000 ms pärast.
3. Kolmas katse — 2000 ms pärast.
4. Seejärel ooteaeg kahekordistub, kuni jõuab 30 000 ms-ni.
5. Ooteajale lisatakse juhuslik kõikumine, et kliendid ei prooviks ühenduda samal ajal.

---

## 8. Taga, et ÕNNESTUMINE NULLIB loenduri — muidu kasvab ta igavesti.
Funktsioon `succeeded()` lähtestab katsete loenduri.
Pärast edukat ühendust algab järgmine taasühendamine uuesti 500 millisekundist.
Ilma lähtestamiseta jääks pärast pikka ühendust järgmise katkestuse korral kasutusele liiga pikk ooteaeg.

---

## 9. Kirjuta ping-pong kontroll: vastamata jätnud ühendus tuleb sulgeda.
Funktsioonis `createHeartbeat()` toimub ühenduste kontrollimine järgmiselt:
1. Igale ühendusele saadetakse `ping`.
2. `pong`-vastuse saanud ühendus märgitakse aktiivseks.
3. Kui järgmise kontrolli ajaks vastust ei saabu, ühendus suletakse.
4. Suletud ühendus eemaldatakse kontrollitavate ühenduste hulgast.

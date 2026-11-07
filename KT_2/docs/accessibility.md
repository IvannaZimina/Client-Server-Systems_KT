
# C02 — Ülesanne 1: Semantika ja ligipääsetavus

## 1. Täienda KT1 public/index.html-i: skelett on juba olemas, uut faili ei tehta.

Täiendati olemasolevat `public/index.html` faili. Uut HTML-faili ei loodud.

## 2. Pane paika viis maamärki ja anna igale sektsioonile aria-labelledby.

Lehel kasutati järgmisi maamärke:

| Element   | Maamärk     | Nimetamine                |
| --------- | ----------- | ------------------------- |
| `header`  | banner      | Lehe päis                 |
| `nav`     | navigation  | `aria-label="Peamenüü"`   |
| `main`    | main        | Peamine sisu, üks element |
| `section` | region      | `aria-labelledby`         |
| `footer`  | contentinfo | Lehe jalus                |

Mõlemal sektsioonil on oma `aria-labelledby` atribuut ja vastav pealkiri.

## 3. Sündmuste võrdlus on TABEL: caption ja iga päis oma scope-iga.

Sündmuste võrdlus esitati tabelina.

- Tabelile lisati `caption`.
- Veergude päised kasutavad `th scope="col"`.
- Ridade päised kasutavad `th scope="row"`.
- Andmed esitati `td` elementides.

## 4. Esiletõstetud kaardid on NIMEKIRI: ul > li > article.

Esiletõstetud sündmused esitati struktuuriga `ul > li > article`.

Iga kaart sisaldab sündmuse pealkirja, linki, kirjeldust, kuupäeva, kellaaega ja toimumiskohta.

Dekoratiivsetel piltidel kasutatakse tühja `alt=""` atribuuti.

## 5. VIHJE: reapäis on th scope="row", mitte td — muidu ei tea lugeja, mis rida.

Tabeli ridade nimetamiseks kasutati `th scope="row"` elemente. Sündmuste nimed on seega ekraanilugejale rea päistena tuvastatavad.

## 6. Lisa hüppelink, mis on nähtav ainult fookuses, ja tee ta esimeseks.

Lehe esimeseks fookustatavaks elemendiks lisati link „Liigu põhisisuni“, mis viib `main` elemendini. Link muutub nähtavaks fookuse saamisel.

## 7. Käi leht Tabiga läbi: fookus on nähtav ja järjekord vastab visuaalsele.

Klaviatuuriga navigeerimisel kontrolliti fookuse nähtavust ja elementide järjekorda. Fookuse tähistamiseks kasutatakse CSS-is `:focus-visible` selektorit.

## 8. Mõõda SINU lehe iga tekstipaari värvid ja arvuta kontrastisuhe — näidise arvud on style-1.css-i omad.

Kontrastsussuhted arvutati lehel kasutatud värvide põhjal.

| Värvipaar                                                 |    Suhe | AA (4,5:1) |
| --------------------------------------------------------- | ------: | ---------- |
| Põhitekst valgel (`#1a1a1a` / `#ffffff`)                  | 17,40:1 | jah        |
| Abitekst valgel (`#46555e` / `#ffffff`)                   |  7,72:1 | jah        |
| Põhitekst päise ja jaluse taustal (`#1a1a1a` / `#f2f5f7`) | 15,90:1 | jah        |
| Abitekst päise ja jaluse taustal (`#46555e` / `#f2f5f7`)  |  7,05:1 | jah        |

Fookuse ääre kontrastsus:

| Värvipaar                                                     |   Suhe |
| ------------------------------------------------------------- | -----: |
| Fookuse ääris valgel (`#0b6b8f` / `#ffffff`)                  | 5,98:1 |
| Fookuse ääris päise ja jaluse taustal (`#0b6b8f` / `#f2f5f7`) | 5,46:1 |

Kõik mõõdetud tekstivärvide kombinatsioonid vastavad WCAG AA tavateksti kontrastinõudele 4,5:1.


## 9. Kirjuta docs/accessibility.md ja loetle, mida automaatkontroll EI leia.

Automaatkontroll ei tuvasta järgmisi probleeme:

- Vale või sisutühi alternatiivtekst piltidel. Näiteks `alt="pilt123.jpg"` läbib kontrolli, kuid ei kirjelda pildi sisu.
- Ebaloogiline klaviatuuriga navigeerimise järjekord, mis ei vasta visuaalsele struktuurile.
- Maamärkide ebasobiv jaotus, mis muudab lehel navigeerimise keeruliseks.
- Ebaselged või kasutajale arusaamatud `aria-label` väärtused.

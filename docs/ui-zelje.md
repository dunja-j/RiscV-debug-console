# Želje za UI (za M6 i M7)

Nastalo posle probe privremenog mini UI-ja iz M3.5. Ovo je ulazni materijal za M6 (prikaz) i
M7 (kontrole izvršavanja) — ne radi se ranije, jer se privremeni UI ionako baca.

## 1. Program se prikazuje samo jednom — dva režima

**Problem:** u mini UI-ju kod stoji dvaput (polje za pisanje levo, prikaz izvršavanja desno),
a ono što je suština projekta — tekuća instrukcija i stanje procesora — bilo je sitnije i
sa strane.

**Rešenje (varijanta A):** jedno polje sa dva režima.

- **Režim pisanja** — obična `textarea`, kod se slobodno menja, greške se prijavljuju uživo.
- Dugme **„Asembliraj"** prebacuje u režim izvršavanja.
- **Režim izvršavanja** — isto polje postaje nepromenljiv prikaz sa brojevima linija,
  markerom `>` na tekućoj instrukciji i tačkama za breakpoint; aktivni su Step, Run, Reset.
- Dugme **„Izmeni"** vraća u režim pisanja i poništava tok izvršavanja.

**Odbačene varijante:**

| Varijanta | Zašto ne |
|---|---|
| B — uvek promenljivo polje + uska traka sa brojevima linija pored njega | Sinhronizacija skrolovanja i visina linija; mutna semantika ako se kod izmeni usred izvršavanja |
| C — providna `textarea` preko iscrtanog sloja koda (tako rade pravi editori) | Poravnanje piksel-u-piksel se lako raspadne; složenost nesrazmerna koristi |

**Dodatna korist varijante A:** režim izvršavanja fizički onemogućava izmenu koda dok program
radi, pa pitanje „šta ako korisnik obriše liniju na kojoj stoji PC" uopšte ne postoji. Pravi
debageri se ponašaju isto.

**Posledica po raspored:** panel sa programom postaje glavni i dobija više prostora; registri
i memorija stoje sa strane, kao na mokapu.

## 2. Prikazuju se samo korišćeni registri

**Menja odluku iz Faze 0** („prikaži svih 32 uvek"). U praksi su programi kratki i koriste
nekoliko registara, pa je spisak od 32 reda nepregledan.

**Pravilo:** prikazuje se registar u koji je bar jednom upisano, i ostaje vidljiv i ako mu se
vrednost kasnije vrati na 0. Namerno **nije** „vrednost različita od nule" — registar ne sme
da nestane iz prikaza baš kad ga posmatraš.

**Šta se menja u kodu:** `Cpu` pamti skup registara u koje je pisano; upis se beleži u
`setRegister`, koji je već jedino mesto upisa. Mala izmena, radi se u M5 da bi M6 ostao
čisto UI milestone.

## 3. Boje

Tamna tema ostaje. Plavi akcenti se zamenjuju roze tonovima.

Polazni predlog: pozadina `#1e1e1e`, akcent `#ff79c6`, prigušeni akcent `#d16d9e`,
greške `#ff5555` (greška mora ostati vizuelno odvojena od akcenta).

U M6 se pravi nekoliko varijanti palete, pa se bira.

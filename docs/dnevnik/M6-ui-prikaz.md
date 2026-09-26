# M6 — UI: prikaz

## Cilj

Pravi izgled aplikacije: jedno polje za kod sa dva režima, paneli REGISTRI i MEMORIJA,
prijava grešaka uživo, tamna tema sa roze akcentima.

## Šta je urađeno

- `index.html` — raspored: panel PROGRAM (levo, glavni), REGISTRI i MEMORIJA (desno),
  traka sa dugmadima ispod
- `src/ui/render.ts` — iscrtavanje: listing, registri, memorija, greške
- `src/ui/main.ts` — stanje ekrana (režim, učitani procesor) i reagovanje na događaje
- `src/style.css` — stilovi i dve palete boja

Dugmad Step, Run, Reset i Breakpoint su vidljiva ali neaktivna — ponašanje dobijaju u M7.

## Dva režima

| Režim pisanja | Režim izvršavanja |
|---|---|
| obična `textarea`, kod se menja | nepromenljiv prikaz reda po red |
| greške se prijavljuju na svaki otkucaj | brojevi linija, `>` marker, mesto za breakpoint |
| aktivno dugme „Asembliraj" | aktivno dugme „Izmeni" |

Prelazak u režim izvršavanja uspeva samo ako kod nema grešaka. Režim izvršavanja fizički
onemogućava izmenu koda, pa pitanje „šta ako korisnik obriše liniju na kojoj stoji PC"
ne postoji.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| `render.ts` odvojen od `main.ts` | Sve u jednom fajlu | `render.ts` samo prima stanje i ispisuje ga, ne zna za dugmad ni događaje; `main.ts` drži stanje i sluša događaje. Granica je jasna i lako se objašnjava |
| Tekst se upisuje isključivo preko `textContent` | `innerHTML` sa sastavljenim stringom | Kod koji korisnik otkuca ne sme da se tumači kao HTML — inače bi `<img onerror=...>` u komentaru postao izvršni kod (XSS) |
| `replaceChildren(...)` — ceo panel se iscrtava iznova | Ažuriranje samo promenjenih redova | Panela ima nekoliko i sadrže desetak redova; razlika u brzini je nemerljiva, a kod je znatno prostiji |
| Boje kao CSS promenljive (`--akcent`, `--pozadina`…) | Boje upisane direktno u pravila | Zamena palete je izmena jednog bloka umesto prepisivanja celog fajla |
| Dugmad iz M7 su prikazana, ali neaktivna | Dodati ih tek u M7 | Raspored se vidi u konačnom obliku već u M6, a `disabled` jasno govori šta još ne radi |
| Memorija se prikazuje i heksadecimalno i decimalno | Samo hex, kao na mokapu | Doslednost sa panelom registara; `FFFFFFFB` je nečitljivo, `-5` se vidi odmah |

## Zamke i problemi

- **`>>> 0` pri ispisu heksadecimalno**: bez toga bi `-1` bio ispisan kao `-1`, a ne kao
  `FFFFFFFF`. `>>> 0` tumači isti niz bitova kao broj bez znaka.
- **Listing prikazuje sve linije izvornog koda**, uključujući prazne i komentare, jer se
  marker vezuje za `sourceLine` iz instrukcije — brojevi linija moraju da se poklope sa onim
  što korisnik vidi u editoru.
- **Panel koji je prazan ispisuje napomenu** („nijedan registar još nije korišćen") umesto da
  ostane prazan — prazan panel izgleda kao greška u programu.

## Boje

Ponuđene su dve palete, bira se pred kraj rada:

- **paleta-1** — neutralno tamno sivo (`#1e1e1e`), živ roze akcent `#ff79c6`
- **paleta-2** — pozadina sa ljubičastim podtonom (`#1a1620`), mekši roze `#f06292`

Menjaju se klasom na `<body>` u `index.html`.

## Kako je testirano

Ručno, u browseru (logika koja se testira automatski je u `core/`):

- „Asembliraj" prebacuje u režim izvršavanja, `>` stoji na prvoj instrukciji (linija 2,
  jer je prva linija komentar), „Izmeni" vraća u pisanje;
- kucanje `MULT` prijavljuje `Linija 2: nepoznata instrukcija 'MULT'` odmah, a „Asembliraj"
  odbija prelazak uz poruku u statusnoj traci;
- prazni paneli prikazuju napomene umesto praznine.

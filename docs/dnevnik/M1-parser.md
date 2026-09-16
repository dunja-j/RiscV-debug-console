# M1 — Parser

## Cilj

Pretvoriti sirov asemblerski tekst u strukturirane podatke i prijaviti sve sintaksne greške,
bez ikakvog znanja o tome koje instrukcije postoje.

## Šta je urađeno

- `src/core/types.ts` — zajednički tipovi: `AsmError`, `Operand`, `ParsedLine`, `ParseResult`.
- `src/core/parser.ts` — jedna javna funkcija `parse(source)`, sve ostalo je privatno.

Tok obrade jedne linije:

```
sirova linija
  └─ skini komentar (#)
  └─ trim; ako je prazna -> preskoči
  └─ ima li labelu na početku? (ime:) -> izdvoji je
  └─ prvi token = mnemonik, ostatak = operandi
  └─ razdvoji operande po zarezu, svaki klasifikuj:
       ├─ sadrži zagrade -> mem    8(x2)
       ├─ oblika xN      -> reg    (N > 31 je greška)
       ├─ broj           -> imm    5, -3, 0x1F
       └─ ime            -> label
```

## Podela odgovornosti (parser vs asembler)

| Parser (M1) radi | Parser NE radi (to je M2) |
|---|---|
| skida komentare | proverava da li `MULT` postoji kao instrukcija |
| prepoznaje labele | proverava da li labela `kraj` postoji |
| izdvaja mnemonik i operande | proverava broj operanada instrukcije |
| prepoznaje tip operanda | proverava opseg immediate vrednosti |
| javlja `x99` kao nepostojeći registar | prevodi pseudo-instrukcije |

Razlog: parser koji ne zna tabelu instrukcija može se testirati potpuno nezavisno, a
dodavanje nove instrukcije kasnije ne dira parser uopšte.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| Parser klasifikuje operande u diskriminisanu uniju (`reg`/`imm`/`label`/`mem`) | Vraćanje sirovih stringova koje asembler sam tumači | Parsiranje `0x1F` i razlaganje `8(x2)` jeste sintaksni posao; asembler onda samo proverava oblik. TypeScript uz polje `kind` sam sprečava pristup pogrešnim poljima |
| Greška ne prekida parsiranje — linija se preskoči, obrada se nastavlja | Prekid na prvoj grešci | Odluka iz Faze 0: korisnik dobija sve greške odjednom |
| Offset je obavezan: `0(x1)`, ne `(x1)` | Podrazumevani offset 0 | Manje specijalnih slučajeva; `RET` se ionako prevodi u `JALR x0, 0(x1)` |
| Jedna labela po liniji | Više labela (`a: b: ADD ...`) | Nema praktične potrebe, a uvodi dodatnu petlju u parsiranju |

## Zamke i problemi

- **Redosled prepoznavanja operanda je bitan.** Memorijski operand se mora proveriti prvi
  jer sadrži zagrade; inače bi `8(x2)` pao u granu „neispravan operand".
- **`parseRegister` ima tri ishoda, ne dva:** `reg` (uspeh), `null` (jeste oblika `xN` ali je
  `N > 31` — greška je već prijavljena), `undefined` (nije registar, pozivalac neka proba kao
  broj ili labelu). Bez te razlike poruka za `x99` bila bi neinformativno „neispravan operand"
  umesto „nepostojeći registar".
- **Dvotačka se traži samo na početku linije,** regularnim izrazom usidrenim na početak.
  Naivno `indexOf(":")` bi u liniji `ADDI x1, x0, 5 :` proglasilo celu instrukciju za labelu.
- Labela i registar imaju isti oblik (`x5` je validno ime labele). Parser daje prednost
  registru. U praksi nije problem jer se labele imenuju opisno.

## Kako je testirano

21 test u `tests/parser.test.ts`, u dve grupe:

- **ispravan kod** (13): komentari, prazne linije, sve vrste operanada, hex i negativne
  konstante, labela sama u liniji i uz instrukciju, case-insensitivnost, tačnost broja linije,
  i dokaz da parser namerno *propušta* nepoznatu instrukciju sa pet operanada;
- **greške** (8): nepostojeći registar, labela koja počinje cifrom, neispravan mnemonik,
  neispravan operand, višak zareza, nedostajući offset, neispravna baza, i test koji
  potvrđuje da se sve greške skupljaju odjednom sa tačnim brojevima linija.

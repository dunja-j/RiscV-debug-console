# M2 — Asembler

## Cilj

Pretvoriti parsirane linije u niz izvršivih instrukcija: prevesti pseudo-instrukcije,
razrešiti labele i proveriti semantiku.

## Šta je urađeno

- `src/core/assembler.ts` — javna funkcija `assemble(source)`.
- `src/core/types.ts` dopunjen tipovima `OpCode`, `Instruction`, `AssembleResult`.

Asembler radi četiri stvari:

1. prevodi pseudo-instrukcije (`LI`, `MV`, `NOP`, `J`, `RET`),
2. gradi tabelu labela (ime → adresa u bajtovima),
3. proverava semantiku (postoji li instrukcija, broj i tip operanada, opseg konstanti),
4. računa PC-relativne pomeraje za grane i skokove.

## Zašto dva prolaza

U liniji `BNE x1, x0, kraj` labela `kraj` može biti definisana tek kasnije u programu
(*forward reference*). Zato prvi prolaz samo broji adrese i beleži gde je koja labela, a
drugi prolaz — kad su sve labele poznate — prevodi instrukcije. Isto rešenje koriste i pravi
asembleri.

Srećna okolnost: sve naše pseudo-instrukcije šire se 1:1, pa širenje ne pomera adrese. Da
`LI` postaje dve instrukcije (kao u pravom RISC-V-u, `LUI` + `ADDI`), širenje bi moralo da se
desi pre prvog prolaza.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| Cilj grane pamtimo kao PC-relativni pomeraj u bajtovima | Apsolutna adresa cilja | Tako radi pravi RISC-V; odatle prirodno sledi zašto grane imaju ograničen domet, što je tema koju komisija može da pita |
| Deklarativna tabela `SPECS` (format + tekst sintakse po instrukciji) | `switch` sa granom po instrukciji | Dodavanje instrukcije je jedan red tabele; tekst sintakse se koristi u poruci o grešci (`ADD ocekuje: ADD rd, rs1, rs2`) |
| Pseudo-instrukcije se prevode na nivou operanada, pre provere formata | Zasebna provera i izgradnja instrukcije za svaku pseudo | `LI` automatski nasleđuje 12-bitno ograničenje od `ADDI` — nema duplirane logike |
| Sve instrukcije imaju ista polja (`rd`, `rs1`, `rs2`, `imm`), neiskorišćena su 0 | Poseban tip po formatu instrukcije | Petlja izvršavanja u CPU-u ostaje jednostavna |
| Konstanta van 12 bita u `LI` je greška | Dodati `LUI` kao 16. instrukciju | `LUI` nije na mentorovom spisku; ograničenje je zapisano kao poznato ograničenje rada |
| Labela iza poslednje instrukcije je dozvoljena | Prijaviti grešku | Idiom `J kraj` … `kraj:` je prirodan izlaz iz programa; kraj izvršavanja je ionako definisan kao „PC je prešao poslednju instrukciju" |
| Ako parser prijavi sintaksne greške, asembler staje odmah | Nastaviti i skupljati i semantičke greške | Nad kodom koji se nije pročitao do kraja javljale bi se lažne greške tipa „nedefinisana labela" |

## Zamke i problemi

- **`SW rs2, offset(rs1)` puni `rs2`, ne `rd`** — kod store instrukcije registar je *izvor*
  podatka, a ne odredište. Lako se previdi; pokriveno posebnim testom.
- **Adresa mora da raste i za linije sa greškom**, inače bi sve labele iza pogrešne linije
  dobile netačne adrese, pa bi korisnik dobio gomilu lažnih grešaka.
- **Linija sa samo labelom ne zauzima adresu** — labela se vezuje za sledeću instrukciju.
- Opsezi konstanti nisu proizvoljni, nego dolaze iz formata pravog RISC-V-a: 12 bita za
  `ADDI/LW/SW/JALR`, 13 za grane (±4 KB), 21 za `JAL` (±1 MB).

## Kako je testirano

27 testova u `tests/assembler.test.ts`, u četiri grupe:

- **prave instrukcije** (5): popunjavanje polja po formatu, uključujući `SW`;
- **pseudo-instrukcije** (6): svih pet prevoda, plus poruka o grešci za pogrešan oblik;
- **labele i pomeraji** (5): skok unapred i unazad, `JAL`, labela na kraju programa, labela
  u istoj liniji sa instrukcijom;
- **greške** (11): nepoznata instrukcija, pogrešan broj i tip operanada, nedefinisana i
  duplirana labela, konstanta van opsega (uključujući granične vrednosti 2047 i -2048),
  predaleka grana, skupljanje više grešaka, i prekid kad postoje sintaksne greške.

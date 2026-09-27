# RISC-V simulator

Web aplikacija za pisanje i izvršavanje programa za podskup RISC-V asemblerskog jezika,
uz Step, Run, breakpointe i prikaz registara i memorije.

## Preduslovi

Za pokretanje su potrebni:

- [Node.js](https://nodejs.org/) verzija **20.19+ iz serije 20** ili **22.12+**;
- `npm`, koji se instalira zajedno sa Node.js-om;
- moderan web pregledač.

Instalaciju možete proveriti u terminalu:

```bash
node --version
npm --version
```

## Pokretanje

Otvorite terminal u folderu projekta i instalirajte zavisnosti:

```bash
npm install
```

Pokrenite aplikaciju:

```bash
npm run dev
```

Terminal će prikazati lokalnu adresu, najčešće:

```text
http://localhost:5173/
```

Otvorite tu adresu u web pregledaču. Terminal mora ostati otvoren dok se aplikacija
koristi. Server se zaustavlja kombinacijom `Ctrl+C`.

## Korišćenje

U editoru napišite program ili izaberite jedan od četiri ugrađena primera, a zatim
pritisnite **Asembliraj**. Ako je kod ispravan, aplikacija prelazi u režim izvršavanja.

| Kontrola | Funkcija |
|---|---|
| **Step** | Izvršava jednu instrukciju |
| **Run** | Izvršava do kraja programa, breakpointa ili greške |
| **Reset** | Vraća registre, memoriju i PC na početno stanje; breakpointi ostaju |
| **Breakpoint** | Postavlja ili uklanja breakpoint na tekućoj instrukciji |
| **Izmeni** | Vraća program u režim pisanja i briše stanje izvršavanja |

Breakpoint se može postaviti i klikom na izvršivu liniju. Marker `>` označava sledeću
instrukciju. Ako je program već zaustavljen na breakpointu, Run izvršava tu instrukciju i
nastavlja dalje.

Paneli sa strane prikazuju korišćene registre i upisane memorijske reči, heksadecimalno i
decimalno. Promene poslednje akcije su istaknute. Simulator ima 4 KB little-endian memorije;
adrese za `LW` i `SW` moraju biti poravnate na četiri bajta.

## Podržana sintaksa

Primer:

```asm
# Komentar traje do kraja linije

LI x1, 5
LI x2, 0

petlja:
ADD x2, x2, x1
ADDI x1, x1, -1
BNE x1, x0, petlja

SW x2, 0(x0)
```

Pravila:

- jedna instrukcija po liniji;
- komentari počinju znakom `#`;
- labele imaju oblik `ime:`;
- ime labele može sadržati slova, cifre i `_`, ali ne sme početi cifrom;
- registri su `x0`–`x31`;
- mnemonici i registri nisu osetljivi na velika i mala slova;
- operandi se razdvajaju zarezima;
- konstante mogu biti decimalne (`15`, `-3`) ili heksadecimalne (`0x1F`);
- cilj grane ili skoka piše se kao labela;
- memorijski operand ima oblik `offset(bazni_registar)`, na primer `8(x2)`.

## Podržane instrukcije

| Grupa | Instrukcije | Oblik |
|---|---|---|
| Aritmetičke i logičke | `ADD`, `SUB`, `AND`, `OR`, `XOR`, `SLL`, `SRL` | `OP rd, rs1, rs2` |
| Immediate | `ADDI` | `ADDI rd, rs1, imm` |
| Memorija | `LW` | `LW rd, offset(rs1)` |
| Memorija | `SW` | `SW rs2, offset(rs1)` |
| Grananje | `BEQ`, `BNE`, `BLT` | `OP rs1, rs2, labela` |
| Skok | `JAL` | `JAL rd, labela` |
| Skok kroz registar | `JALR` | `JALR rd, offset(rs1)` |

`BLT` poredi brojeve sa znakom. `SRL` je logičko pomeranje udesno. `SLL` i `SRL` koriste
samo donjih pet bita registra koji određuje broj mesta pomeranja.

## Pseudo-instrukcije

| Pseudo-instrukcija | Prevod |
|---|---|
| `LI rd, imm` | `ADDI rd, x0, imm` |
| `MV rd, rs` | `ADDI rd, rs, 0` |
| `NOP` | `ADDI x0, x0, 0` |
| `J labela` | `JAL x0, labela` |
| `RET` | `JALR x0, 0(x1)` |

Pseudo-instrukcije se prevode tokom asembliranja. Simulator izvršava odgovarajuće prave
instrukcije.

Greške pri asembliranju prikazuju se sa brojevima linija. Izvršavanje se zaustavlja kod
neispravnog pristupa memoriji, neispravnog skoka ili nakon 100.000 instrukcija zbog moguće
beskonačne petlje.

## Razvojne komande

```bash
npm test          # automatski testovi
npm run typecheck # provera TypeScript tipova
npm run build     # produkcioni build u folderu dist/
npm run preview   # lokalni pregled produkcionog builda
```

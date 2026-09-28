# 5. Vodič kroz najvažnije delove koda

## Kako koristiti ovaj dokument

Ako komisija želi da vidi izvorni kod, nije potrebno otvarati svaki fajl i objašnjavati
svaku liniju. Najbolji redosled je:

1. [`src/core/types.ts`](../../src/core/types.ts) — koji podaci prolaze kroz sistem;
2. [`src/core/parser.ts`](../../src/core/parser.ts) — tekst postaje strukturirana linija;
3. [`src/core/assembler.ts`](../../src/core/assembler.ts) — linija postaje instrukcija;
4. [`src/core/cpu.ts`](../../src/core/cpu.ts) — instrukcija menja stanje procesora;
5. [`src/ui/main.ts`](../../src/ui/main.ts) — korisničke akcije pozivaju core;
6. [`src/ui/render.ts`](../../src/ui/render.ts) — stanje se prikazuje u browseru.

Ovaj redosled prati stvarni tok podataka i zato je lakši za objašnjavanje od redosleda
kojim su fajlovi nastajali.

---

# 1. Zajednički tipovi

Fajl: [`src/core/types.ts`](../../src/core/types.ts)

## `AsmError`

```ts
export interface AsmError {
  line: number;
  message: string;
}
```

Svaka greška sadrži:

- broj izvorne linije, počevši od 1;
- tekst poruke za korisnika.

I parser i asembler koriste isti oblik, pa UI može da prikaže greške bez obzira na fazu u
kojoj su nastale.

### Šta naglasiti

Greška je podatak koji se vraća pozivaocu. Sintaksne i semantičke greške nisu JavaScript
izuzeci, jer su očekivani rezultat obrade korisničkog programa.

## `Operand`

```ts
export type Operand =
  | { kind: "reg"; num: number }
  | { kind: "imm"; value: number }
  | { kind: "label"; name: string }
  | { kind: "mem"; offset: number; base: number };
```

Ovo je diskriminisana unija. Polje `kind` određuje koja ostala polja postoje.

Primer:

```ts
if (operand.kind === "reg") {
  // TypeScript ovde zna da operand ima polje num.
}
```

### Zašto je važno

Bez ovog tipa svi operandi bi bili stringovi koje bi svaka naredna faza ponovo tumačila.
Ovako parser jednom utvrđuje vrstu, a asembler dobija već strukturiran operand.

## `ParsedLine`

```ts
export interface ParsedLine {
  sourceLine: number;
  label: string | null;
  mnemonic: string | null;
  operands: Operand[];
}
```

`mnemonic` je `null` kada linija sadrži samo labelu. `sourceLine` ostaje vezan za originalni
editor čak i kada se prazne linije i komentari ne pojave u rezultatu parsera.

## `OpCode`

`OpCode` je unija svih 15 pravih instrukcija. Pseudo-instrukcije nisu deo ovog tipa, jer se
prevode pre nego što program stigne do CPU-a.

### Šta naglasiti

CPU nikada ne izvršava `LI`, `MV`, `NOP`, `J` ili `RET`. On vidi samo njihov prevod.

## `Instruction`

```ts
export interface Instruction {
  op: OpCode;
  rd: number;
  rs1: number;
  rs2: number;
  imm: number;
  sourceLine: number;
}
```

Sve instrukcije imaju isti oblik. Na primer, `ADD` ne koristi `imm`, pa je ono nula; `SW`
ne koristi `rd`, pa je `rd` nula.

### Pitanje komisije

**Zašto nemate poseban tip za svaki format?**  
Skup instrukcija je mali, a uniformna struktura značajno pojednostavljuje CPU. Ispravnost
polja za svaki format garantuje asembler i proveravaju testovi.

---

# 2. Parser

Fajl: [`src/core/parser.ts`](../../src/core/parser.ts)

## Regularni izrazi na početku

Konstante `LABEL_DEF`, `LABEL_NAME`, `MNEMONIC`, `REGISTER`, `MEMORY` i `NUMBER` opisuju
dozvoljenu tekstualnu formu.

Važna razlika:

- `LABEL_DEF` prepoznaje definiciju na početku linije, na primer `petlja:`;
- `LABEL_NAME` proverava ime kada se koristi kao operand, na primer u `BNE`.

## `parse(source)`

```text
ulaz:  ceo izvorni tekst
izlaz: ParsedLine[] + AsmError[]
```

Funkcija:

1. deli tekst na linije;
2. svakoj liniji dodeljuje broj od 1;
3. poziva `parseLine`;
4. čuva uspešno parsirane linije;
5. nastavlja i posle greške.

### Ključni detalj

```ts
const rawLines = source.split(/\r?\n/);
```

Podržani su i Windows završeci linije `\r\n` i Unix završeci `\n`.

## `parseLine`

Tok jedne linije:

```text
sirova linija
-> ukloni komentar
-> trim
-> izdvoji labelu
-> izdvoji mnemonik
-> parsiraj operande
-> ParsedLine
```

Prvo se poziva `stripComment`, pa se prazna linija preskače.

Labela se traži samo na početku linije. Ako posle labele nema teksta, vraća se linija sa:

```ts
mnemonic: null
operands: []
```

Mnemonik se pretvara u velika slova:

```ts
mnemonic: mnemonic.toUpperCase()
```

Zato su instrukcije case-insensitive.

## `parseOperands`

Operandi se dele po zarezu. Prazan deo, na primer:

```asm
ADD x1, , x3
```

daje jasnu grešku o praznom operandu.

Funkcija prekida obradu te linije na prvom neispravnom operandu, ali `parse()` nastavlja sa
narednim linijama.

## `parseOperand`

Redosled provera je važan:

1. memorijski operand;
2. registar;
3. broj;
4. labela;
5. greška.

Memorijski operand se proverava prvi zato što sadrži zagrade i sastoji se od dva dela.

## `parseMemoryOperand`

Za:

```asm
8(x2)
```

funkcija vraća:

```ts
{ kind: "mem", offset: 8, base: 2 }
```

Odvojeno proverava:

- da oblik zagrada odgovara;
- da offset postoji;
- da je offset ceo broj;
- da je baza registar;
- da je broj registra u opsegu.

## `parseRegister`

Ova funkcija ima tri moguća rezultata:

| Rezultat | Značenje |
|---|---|
| objekat registra | token je validan `x0–x31` |
| `null` | token liči na registar, ali je van opsega |
| `undefined` | token uopšte nije oblika registra |

Razlika između `null` i `undefined` omogućava tačnu poruku:

```text
nepostojeći registar 'x99'
```

umesto opšte poruke:

```text
neispravan operand
```

## `parseNumber`

Podržava:

```text
5
-3
+7
0x1F
-0x10
```

Regularni izraz odvaja znak od cifara, a zatim se bira osnova 10 ili 16.

## Kako objasniti parser za 30 sekundi

> Parser ide liniju po liniju, uklanja komentare, izdvaja opcionu labelu, mnemonik i
> operande. Operande pretvara u tipizirane objekte: registar, immediate, labelu ili
> memorijski operand. Ne zna koje instrukcije postoje; njegov posao je samo sintaksa.
> Greške skuplja sa brojevima linija i nastavlja obradu ostatka programa.

---

# 3. Asembler

Fajl: [`src/core/assembler.ts`](../../src/core/assembler.ts)

## Tabele `SPECS` i `PSEUDO_SYNTAX`

`SPECS` je deklarativna tabela pravih instrukcija:

```ts
ADDI: { format: "I", syntax: "ADDI rd, rs1, konstanta" }
```

Za svaku instrukciju čuva:

- format operanada;
- tekst očekivane sintakse za poruku o grešci.

`PSEUDO_SYNTAX` ima istu ulogu za pseudo-instrukcije.

### Zašto tabela

Nema posebne velike provere za svaki op-kod. Instrukcije istog formata dele istu logiku u
`buildInstruction`.

## `assemble(source)`

Ovo je jedina javna funkcija asemblera.

Tok:

```text
parse
-> ako ima sintaksnih grešaka, odmah vrati njih
-> collectLabels
-> translate
-> vrati program, labele i greške
```

Ako parser prijavi grešku, semantička obrada se ne nastavlja. U suprotnom bi nad nepotpuno
parsiranom programu mogle da nastanu lažne greške o labelama.

## `collectLabels`

Prvi prolaz vodi promenljivu `address`.

Za svaku liniju:

1. ako ima labelu, pamti trenutnu adresu;
2. ako ima instrukciju, povećava adresu za četiri.

Linija sa samo labelom ne povećava adresu, pa se labela odnosi na sledeću instrukciju.

Ako je labela već u mapi, dodaje se greška za duplu definiciju.

### Važan edge case

Adresa raste i ako je instrukcija semantički pogrešna. U prvom prolazu svaka tekstualna
instrukcija mora da zauzme mesto, inače bi naredne labele dobile pogrešne adrese.

## `translate`

Drugi prolaz ponovo vodi adresu i za svaku instrukcijsku liniju poziva `assembleLine`.

Uspešne instrukcije ulaze u `program`. Linije sa greškom ne ulaze, ali adresa ipak raste.

Program se koristi samo kada je lista grešaka prazna.

## `assembleLine`

Funkcija radi tri stvari:

1. poziva `expandPseudo`;
2. pomoću `isOpCode` proverava da li je mnemonik prava instrukcija;
3. poziva `buildInstruction`.

`isOpCode` je TypeScript type guard. Nakon njegove provere kompajler zna da je string
bezbedan ključ tabele `SPECS`.

## `expandPseudo`

Primer za `LI`:

```text
LI x1, 42
-> ADDI x1, x0, 42
```

Funkcija prvo proverava tačan broj i tip operanada. Zatim vraća novu `ParsedLine` vrednost
sa pravim mnemonikom i preuređenim operandima.

Sve pseudo-instrukcije šire se 1:1, pa prvi prolaz ne mora da menja izračunate adrese.

## `buildInstruction`

Ovo je centralna semantička provera.

Najpre se pravi osnovni objekat:

```ts
const base = { op, rd: 0, rs1: 0, rs2: 0, imm: 0, sourceLine };
```

Zatim `switch` po formatu proverava operande i popunjava korišćena polja.

### R format

Očekuje tri registra:

```asm
ADD rd, rs1, rs2
```

### I format

Očekuje dva registra i immediate:

```asm
ADDI rd, rs1, imm
```

Immediate se proverava funkcijom `fitsIn`.

### LOAD, STORE i JALR

Koriste već parsiran memorijski operand. Razlika je u rasporedu registara:

```text
LW:   rd = prvi operand
SW:   rs2 = prvi operand
JALR: rd = prvi operand
```

### BRANCH i JAL

Ciljna labela se pretvara u PC-relativni pomeraj pomoću `resolveLabel`.

## `resolveLabel`

```ts
return target - address;
```

Ako labela ne postoji, vraća se `null` i dodaje jasna greška sa izvornom linijom.

## `fitsIn`

Za signed broj od `bits` bita računa:

```text
minimum = -2^(bits - 1)
maksimum = 2^(bits - 1) - 1
```

Ista funkcija koristi se za 12-bitne immediate vrednosti, 13-bitne grane i 21-bitni `JAL`.

## Kako objasniti asembler za 30 sekundi

> Asembler prvo poziva parser. Ako je sintaksa ispravna, u prvom prolazu gradi tabelu
> labela, a u drugom prevodi instrukcije. Pseudo-instrukcije se najpre svode na prave
> instrukcije. Zatim se prema formatu proveravaju broj i tip operanada, opsezi immediate
> vrednosti i labele. Rezultat je uniforman niz instrukcijskih objekata koje CPU može
> direktno da izvrši.

---

# 4. CPU

Fajl: [`src/core/cpu.ts`](../../src/core/cpu.ts)

## Konstante

Na vrhu su hardverski parametri modela:

```text
REGISTER_COUNT  = 32
INSTRUCTION_SIZE = 4
MEMORY_SIZE = 4096
WORD_SIZE = 4
SHIFT_MASK = 0x1f
MAX_STEPS = 100000
```

One čine pravila eksplicitnim i izbegavaju „magične brojeve" u izvršnoj logici.

## `StepResult` i `RunOptions`

`StepResult` ima četiri statusa:

| Status | Značenje |
|---|---|
| `ok` | jedna instrukcija je izvršena |
| `halted` | nema sledeće instrukcije |
| `error` | izvršavanje je prekinuto greškom |
| `breakpoint` | Run je stao pred označenom instrukcijom |

`RunOptions` prenosi skup breakpointa i opcioni limit instrukcija.

## Stanje klase `Cpu`

```ts
registers
memory
writtenWords
usedRegisters
pc
nextPc
view
program
```

### Javno stanje

UI čita registre, memoriju, PC i skupove korišćenih resursa.

### Privatno stanje

- `program` se dobija u konstruktoru i ne menja;
- `nextPc` se koristi tokom jedne instrukcije;
- `view` omogućava 32-bitni pristup memorijskim bajtovima.

## `reset`

Funkcija:

- postavlja sve registre na nulu;
- postavlja sve bajtove memorije na nulu;
- briše evidenciju korišćenih registara i upisanih reči;
- vraća PC na nulu;
- ne menja učitani program.

Breakpointi nisu u CPU-u, već u UI-ju, pa ih Reset ne briše.

## `currentInstruction`

Indeks se računa:

```ts
const index = this.pc / INSTRUCTION_SIZE;
```

Ako je indeks izvan niza programa, vraća se `null`. Adresa tačno iza poslednje instrukcije
zato prirodno predstavlja kraj programa.

## `step`

Glavni tok:

```ts
const instruction = this.currentInstruction;
this.nextPc = this.pc + INSTRUCTION_SIZE;
const error = this.execute(instruction);
this.pc = this.nextPc;
```

Pre izvršavanja se postavlja podrazumevani sledeći PC. Ako `execute` vrati grešku, `pc` se
ne menja.

Ako nema instrukcije, odmah se vraća `"halted"`.

## `run`

`run()` je ograničena petlja oko `step()`:

1. izvrši korak;
2. vrati grešku ili završetak ako ih je `step()` prijavio;
3. proveri da li je program upravo završen;
4. proveri breakpoint sledeće instrukcije;
5. nastavi do limita.

Provera završetka posle uspešnog koraka rešava edge case kada program ima tačno
`maxSteps` instrukcija.

### Breakpoint pravilo

Run ne proverava breakpoint pre prvog koraka. Program već stoji pred tekućom instrukcijom,
pa Run znači da treba nastaviti njenim izvršavanjem. Breakpoint se proverava na sledećoj
instrukciji.

## `execute`

Funkcija prvo čita:

```ts
const a = this.registers[rs1];
const b = this.registers[rs2];
```

Zatim iscrpan `switch` bira semantiku instrukcije.

### Aritmetika i logika

Rezultat se prosleđuje u `setRegister`.

Za `SLL` i `SRL` broj mesta je:

```ts
b & 0x1f
```

`SRL` koristi `>>>`, jer `>>` čuva znak.

### Memorija

Efektivna adresa:

```text
vrednost rs1 + immediate
```

`LW` poziva `load`, a `SW` poziva `store`.

### Grane

`BEQ`, `BNE` i `BLT` izračunavaju samo uslov i prosleđuju ga u `branch`.

`BLT` je signed poređenje jer vrednosti dolaze iz `Int32Array`.

### Skokovi

`JAL` koristi:

```text
pc + PC-relativni pomeraj
```

`JALR` koristi:

```text
(vrednost rs1 + immediate) & ~1
```

Maska briše najniži bit kako propisuje RISC-V specifikacija.

## `branch`

Ako uslov nije ispunjen, ostaje podrazumevani `nextPc = pc + 4`.

Ako jeste:

```ts
return this.setNextPc(this.pc + offset);
```

## `jump`

Redosled je važan:

1. proveri i postavi cilj;
2. tek zatim upiši povratnu adresu.

Zato `JALR` radi i kada su `rd` i `rs1` isti registar. Neispravan skok ne menja odredišni
registar.

## `setNextPc`

Proverava:

- deljivost adrese sa četiri;
- da adresa nije negativna;
- da nije iza dozvoljenog kraja programa.

Adresa tačno iza poslednje instrukcije je dozvoljena i predstavlja uredan završetak.

## `load` i `store`

Obe funkcije prvo pozivaju `checkAddress`.

`load` čita:

```ts
this.view.getInt32(address, true)
```

`store` upisuje:

```ts
this.view.setInt32(address, value, true)
```

Argument `true` bira little-endian poredak.

`store` dodatno beleži adresu u `writtenWords`.

## `setRegister`

```ts
if (num === 0) {
  return;
}
```

Ova jedna provera sprovodi pravilo `x0 = 0` za sve instrukcije. Uspešan upis beleži registar
u `usedRegisters`.

## `checkAddress`

Redom proverava:

1. poravnanje na četiri bajta;
2. negativnu adresu;
3. da poslednji bajt reči ne izlazi iz memorije.

Provera opsega koristi:

```text
address + WORD_SIZE > MEMORY_SIZE
```

Nije dovoljno proveriti samo početnu adresu, jer bi reč mogla delimično da izađe iz
memorije.

## Kako objasniti CPU za 45 sekundi

> Cpu čuva 32 registra, 4 KB bajtovske memorije, program i PC. Step uzima instrukciju na
> indeksu `pc / 4`, postavlja podrazumevani `nextPc` na `pc + 4`, izvršava instrukciju i tek
> zatim ažurira PC. Aritmetika upisuje kroz `setRegister`, koji štiti `x0`. Memorija koristi
> DataView u little-endian režimu i proverava poravnanje i opseg. Grane i skokovi menjaju
> `nextPc`. Run ponavlja Step do kraja, greške, breakpointa ili limita instrukcija.

---

# 5. UI kontroler

Fajl: [`src/ui/main.ts`](../../src/ui/main.ts)

## Pronalaženje elemenata

Pomoćna funkcija `element<T>` poziva `querySelector`. Ako element ne postoji, baca jasnu
grešku sa selektorom.

To je bolje od TypeScript castovanja rezultata, jer pogrešan ID u HTML-u odmah daje
razumljivu grešku.

## Stanje UI-ja

Glavne promenljive su:

```text
mode
cpu
breakpoints
executableLines
changedRegisters
finished
```

| Promenljiva | Uloga |
|---|---|
| `mode` | bira pisanje ili izvršavanje |
| `cpu` | trenutno učitan procesor ili `null` |
| `breakpoints` | brojevi označenih linija |
| `executableLines` | linije na kojima stvarno postoji instrukcija |
| `changedRegisters` | registri istaknuti posle poslednje akcije |
| `finished` | gasi izvršne kontrole posle kraja ili greške |

## Inicijalizacija

Opcije padajućeg menija nastaju iz `PROGRAM_EXAMPLES`. Prvi primer se upisuje u editor, a
svako dugme dobija jedan event listener.

Na kraju se poziva `enterEditMode`, pa početno stanje prolazi kroz istu logiku kao svaki
kasniji povratak u editor.

## `enterRunMode`

Tok dugmeta Asembliraj:

1. poziva `assemble(editor.value)`;
2. prikazuje sve greške;
3. ako greške postoje, ostaje u editoru;
4. pravi `Cpu` sa asembliranim programom;
5. iz programa izvodi skup izvršivih linija;
6. prelazi u režim izvršavanja;
7. poziva `render`.

UI ne poziva parser posebno. `assemble()` predstavlja jednu javnu ulaznu tačku za obradu
teksta.

## `enterEditMode`

Poništava:

- CPU;
- status završetka;
- izvršive linije;
- istaknute registre;
- breakpointe;
- stare greške.

Breakpointi se brišu jer posle izmene teksta stari broj linije možda više ne pripada istoj
instrukciji.

## `onExampleSelected`

Funkcija pronalazi primer po ID-u, menja vrednost editora i poziva `onEdit`.

Zatim:

- vraća padajući meni na početnu opciju;
- fokusira editor;
- postavlja kursor na početak;
- vraća skrol na vrh.

## `onStep` i `onRun`

Obe funkcije:

1. kopiraju registre pre akcije;
2. pozivaju odgovarajuću CPU metodu;
3. rezultat šalju u `applyResult`.

Kopija mora biti:

```ts
Int32Array.from(cpu.registers)
```

Da je sačuvana samo referenca, stanje pre i posle pokazivalo bi na isti niz.

## `applyResult`

Prvo računa promenjene registre, pa `switch` po statusu:

| Status | UI reakcija |
|---|---|
| `ok` | prikazuje izvršenu liniju |
| `breakpoint` | prikazuje liniju zaustavljanja |
| `halted` | označava kraj i gasi izvršne kontrole |
| `error` | prikazuje liniju i poruku i gasi izvršne kontrole |

Na kraju uvek poziva `render`.

## `changedSince`

Poredi 32 elementa pre i posle akcije i vraća skup indeksa čija se vrednost promenila.

Posle Step-a to su promene jedne instrukcije. Posle Run-a to su registri čija se konačna
vrednost razlikuje od vrednosti pre pokretanja.

## Breakpoint funkcije

### `onListingClick`

Koristi delegiranje događaja. Listener je na celom listingu, a `closest(".linija")` pronalazi
kliknuti red.

To je važno zato što se redovi listinga posle svake akcije ponovo prave.

### `toggleBreakpoint`

Najpre proverava `executableLines`. Breakpoint na komentaru ili labeli se odbija uz poruku.

Zatim dodaje ili uklanja broj linije iz skupa i ponovo iscrtava listing.

## `render`

Ova funkcija povezuje stanje sa čistim render funkcijama:

- bira koji prikaz programa je vidljiv;
- uključuje i isključuje dugmad;
- isključuje izbor primera tokom izvršavanja;
- određuje liniju trenutne instrukcije;
- poziva iscrtavanje listinga, registara i memorije.

### Kako objasniti UI kontroler

> `main.ts` je kontroler između DOM-a i core logike. Čuva samo stanje prikaza, reaguje na
> događaje, poziva asembler ili CPU i zatim traži ponovno iscrtavanje. Pravila instrukcija
> i memorije nisu u UI kodu.

---

# 6. Renderovanje

Fajl: [`src/ui/render.ts`](../../src/ui/render.ts)

Ovaj modul nema event listenere i ne menja CPU. Dobija stanje i pravi DOM elemente.

## `renderListing`

Izvorni tekst se deli na sve linije, uključujući prazne i komentare. Za svaki red pravi se:

```text
breakpoint | marker | broj linije | tekst
```

CSS klase označavaju:

- trenutnu liniju;
- izvršivu liniju;
- postavljen breakpoint.

Broj linije se upisuje u `data-line`, koji `main.ts` kasnije čita pri kliku.

## `renderRegisters`

Čita `cpu.usedRegisters`, sortira brojeve registara i pravi red za svaki korišćeni registar.

Ako procesor ne postoji ili nema korišćenih registara, prikazuje napomenu umesto praznog
panela.

## `renderMemory`

Čita `cpu.writtenWords`, sortira adrese i za svaku poziva `cpu.readWord`.

Prikazuju se samo početne adrese 32-bitnih reči u koje je pisano.

## `renderErrors`

Svaku grešku prikazuje kao:

```text
Linija N: poruka
```

## `valueRow`

Isti pomoćnik koristi se i za registre i za memoriju. Vrednost prikazuje:

- heksadecimalno;
- decimalno sa znakom;
- opciono sa klasom za isticanje.

## `textContent` umesto `innerHTML`

Pomoćnik `cell` upisuje:

```ts
element.textContent = text;
```

Ako korisnik u komentaru napiše HTML, browser ga prikazuje kao običan tekst. Ne tumači ga
kao element niti izvršava.

## `toHex`

```ts
value >>> 0
```

isti 32-bitni obrazac tumači kao broj bez znaka. Zato se `-1` prikazuje kao:

```text
FFFFFFFF
```

umesto `-1`.

### Kako objasniti render modul

> Render funkcije su čiste u smislu odgovornosti: dobijaju trenutno stanje i iz njega
> ponovo prave sadržaj panela. Ne znaju šta je korisnik kliknuo i ne izvršavaju instrukcije.
> Korisnički tekst svuda postavljaju pomoću `textContent`.

---

# 7. Primer kompletnog toka jedne linije

Za liniju:

```asm
petlja: ADDI x1, x1, 1
```

## Parser

Vraća približno:

```ts
{
  sourceLine: 7,
  label: "petlja",
  mnemonic: "ADDI",
  operands: [
    { kind: "reg", num: 1 },
    { kind: "reg", num: 1 },
    { kind: "imm", value: 1 }
  ]
}
```

## Prvi prolaz asemblera

Upisuje:

```text
petlja -> trenutna adresa
```

Pošto linija ima instrukciju, sledeća adresa povećava se za četiri.

## Drugi prolaz asemblera

Proverava I format i pravi:

```ts
{
  op: "ADDI",
  rd: 1,
  rs1: 1,
  rs2: 0,
  imm: 1,
  sourceLine: 7
}
```

## CPU

Ako PC pokazuje na ovu instrukciju:

1. čita staru vrednost `x1`;
2. sabira immediate `1`;
3. poziva `setRegister(1, rezultat)`;
4. postavlja PC na podrazumevani `pc + 4`.

## UI

Posle Step-a:

- `changedSince` otkriva promenu registra `x1`;
- status prikazuje da je izvršena linija 7;
- `renderRegisters` ističe `x1`;
- `renderListing` pomera marker na narednu instrukciju.

Ovaj primer povezuje svih šest slojeva u jednom kratkom toku.

---

# 8. Ako komisija otvori nasumičan deo koda

## Ako otvore regularne izraze parsera

Objasniti da oni proveravaju samo tekstualni oblik, dok opsege i značenje proveravaju
funkcije parsera i asemblera.

## Ako otvore `switch` u asembleru

Objasniti da je `switch` po formatu, ne po svakoj instrukciji. Instrukcije istog formata
dele proveru operanada.

## Ako otvore `switch` u CPU-u

Objasniti da je to semantika 15 podržanih instrukcija i da TypeScript `OpCode` ograničava
moguće vrednosti.

## Ako otvore `DataView`

Objasniti da memorija ostaje niz bajtova, a `DataView` samo daje pogled za 32-bitno
little-endian čitanje i upis.

## Ako otvore `nextPc`

Objasniti razliku između trenutne i sledeće adrese i vezu sa povratnom adresom `pc + 4`.

## Ako otvore `changedSince`

Objasniti da je isticanje vizuelno pitanje, pa se računa u UI-ju, a ne u CPU modelu.

## Ako otvore `replaceChildren`

Objasniti da su paneli mali i da potpuno ponovno iscrtavanje daje jednostavniji i
pouzdaniji kod od parcijalnog ažuriranja.

## Ako otvore testove

Prvo reći šta konkretan test dokazuje, a zatim zašto je baš taj ulaz izabran. Ne treba samo
čitati `expect`.

---

# 9. Najvažnije stvari koje treba znati napamet

1. Parser proverava sintaksu; asembler proverava semantiku.
2. Asembler ima dva prolaza zbog forward reference labela.
3. Sve pseudo-instrukcije šire se u tačno jednu pravu instrukciju.
4. Instrukcija ima uniformna polja `op`, `rd`, `rs1`, `rs2`, `imm`, `sourceLine`.
5. Indeks instrukcije je `pc / 4`.
6. `nextPc` čuva sledeću adresu dok trenutni `pc` ostaje stabilan.
7. `Int32Array` daje 32-bitno signed ponašanje registara.
8. `setRegister` štiti `x0`.
9. `Uint8Array` daje byte-adresibilnu memoriju.
10. `DataView(..., true)` daje little-endian pristup reči.
11. `checkAddress` proverava poravnanje i celu širinu reči.
12. `JALR` briše najniži bit ciljne adrese.
13. Run je ograničena petlja oko Step-a.
14. Breakpointi su brojevi izvornih linija i proveravaju se na sledećoj instrukciji.
15. UI čuva samo stanje prikaza; RISC-V pravila su u `core/`.
16. `textContent` sprečava tumačenje korisničkog koda kao HTML-a.

## Završno usmeno objašnjenje koda

> Kada bih pratila jedan program kroz kod, počela bih od tipova koji definišu operand,
> parsiranu liniju i instrukciju. Parser zatim deli izvor na linije i pravi tipizirane
> operande. Asembler u prvom prolazu gradi tabelu labela, a u drugom prevodi
> pseudo-instrukcije, proverava formate i pravi niz instrukcija. Cpu taj niz izvršava preko
> metoda Step i Run, pri čemu `nextPc` razdvaja trenutnu i sledeću adresu, `setRegister`
> štiti `x0`, a DataView obezbeđuje little-endian memoriju. `main.ts` povezuje dugmad sa
> tim metodama i čuva stanje prikaza, dok `render.ts` iz trenutnog stanja ponovo iscrtava
> listing, registre, memoriju i greške.

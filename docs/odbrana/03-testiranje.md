# 3. Testiranje

## Cilj testiranja

Testovi proveravaju da parser, asembler i simulator daju tačan rezultat i na uobičajenim i
na graničnim ulazima. Posebno su važni slučajevi koje je lako prevideti ručnim korišćenjem:

- granice immediate vrednosti;
- 32-bitno prelivanje;
- little-endian raspored bajtova;
- neporavnate i nedozvoljene adrese;
- PC-relativni skokovi;
- ponašanje `x0`;
- beskonačne petlje i breakpointi.

UI se proverava ručno u browseru, dok se sva RISC-V logika automatski proverava bez browsera.

## Alat i pokretanje

Testovi su napisani pomoću biblioteke **Vitest**. Ona koristi sintaksu:

```ts
describe("grupa testova", () => {
  it("opis ponasanja", () => {
    expect(dobijeno).toBe(ocekivano);
  });
});
```

Svi testovi pokreću se komandom:

```bash
npm test
```

Provera tipova i produkcioni build pokreću se odvojeno:

```bash
npm run typecheck
npm run build
```

Konačan rezultat:

| Test fajl | Broj testova | Predmet testiranja |
|---|---:|---|
| [`tests/parser.test.ts`](../../tests/parser.test.ts) | 24 | sintaksna analiza |
| [`tests/assembler.test.ts`](../../tests/assembler.test.ts) | 31 | semantika, pseudo-instrukcije i labele |
| [`tests/cpu.test.ts`](../../tests/cpu.test.ts) | 58 | izvršavanje, registri, memorija i tok kontrole |
| **Ukupno** | **113** | |

## Zašto su automatski testovi u `core/`

Najvažniji deo projekta je deterministička logika:

```text
ulaz + početno stanje -> očekivani rezultat
```

Na primer:

- isti tekst uvek daje isti rezultat parsera;
- ista labela i adresa uvek daju isti pomeraj;
- ista instrukcija i stanje registara uvek daju isto novo stanje;
- isti neporavnat pristup uvek daje istu grešku.

Takva logika je pogodna za brze automatske testove. Pošto `core/` ne koristi DOM, testovima
nisu potrebni browser, klikovi ni HTML elementi.

Testovi su organizovani po komponentama. CPU testovi koriste pravi `assemble()` pomoćnik
da se instrukcije ne bi ručno sastavljale u svakom testu, ali svaka provera je usmerena na
jedno konkretno ponašanje CPU-a. Nije uveden poseban end-to-end test paket za ceo UI.

## Obrazac jednog testa

Većina testova prati obrazac **Arrange – Act – Assert**:

1. **Arrange** — pripremi ulaz ili stanje;
2. **Act** — pozovi funkciju;
3. **Assert** — proveri rezultat.

Primer provere da je `SRL` logičko, a ne aritmetičko pomeranje:

```ts
const cpu = run("LI x1, -8\nLI x2, 1\nSRL x3, x1, x2");

expect(cpu.registers[3]).toBe(-8 >>> 1);
expect(cpu.registers[3]).not.toBe(-4);
```

Prva provera potvrđuje očekivani rezultat. Druga jasno dokumentuje pogrešan rezultat koji
bi dao operator `>>`.

---

## Testovi parsera

Parser testovi podeljeni su na ispravan kod i sintaksne greške.

### Ispravan kod

Proveravaju se:

- prazan ulaz, prazne linije i komentari;
- komentar iza instrukcije;
- registri `x0–x31`;
- neosetljivost mnemonika i registara na velika i mala slova;
- decimalne, negativne i heksadecimalne konstante;
- memorijski operand `offset(baza)`;
- labela sama u liniji i uz instrukciju;
- dozvoljeni znakovi u imenu labele;
- instrukcija bez operanada;
- očuvanje tačnog broja izvorne linije.

Važan test potvrđuje da parser namerno prihvata:

```asm
MULT x1, x2, x3, x4, x5
```

Parser može sintaksno da pročita ovu liniju. Provera da instrukcija `MULT` ne postoji i da
ima pogrešan broj operanada pripada asembleru.

### Greške

Proveravaju se:

- registar van opsega, uključujući bazni registar u memorijskom operandu;
- labela koja počinje cifrom;
- neispravan mnemonik;
- neispravan operand;
- prazan operand zbog viška zareza;
- memorijski operand bez offseta;
- memorijski operand sa neispravnom bazom;
- skupljanje više grešaka sa tačnim brojevima linija.

### Najvažniji zaključak

Jedna pogrešna linija ne prekida parser. Ona se preskače, a obrada se nastavlja kako bi
korisnik dobio sve sintaksne greške odjednom.

---

## Testovi asemblera

Asembler testovi proveravaju prave instrukcije, pseudo-instrukcije, labele i semantičke
greške.

### Interna reprezentacija instrukcija

Za svaki format proverava se raspored polja. Posebno je važan `SW`:

```asm
SW x3, 8(x2)
```

Interna instrukcija mora da sadrži:

```text
rs2 = 3   registar čija se vrednost upisuje
rs1 = 2   bazni registar adrese
imm = 8   offset
rd  = 0   SW nema odredišni registar
```

Ovaj test sprečava čestu grešku da se prvi operand `SW` smesti u `rd`.

### Pseudo-instrukcije

Provereno je svih pet prevoda:

| Pseudo-instrukcija | Očekivani rezultat |
|---|---|
| `LI x1, 42` | `ADDI x1, x0, 42` |
| `MV x1, x2` | `ADDI x1, x2, 0` |
| `NOP` | `ADDI x0, x0, 0` |
| `J cilj` | `JAL x0, cilj` |
| `RET` | `JALR x0, 0(x1)` |

Testira se i jasna greška kada pseudo-instrukcija dobije pogrešne operande.

### Labele i pomeraji

Proveravaju se:

- skok unapred;
- skok unazad;
- pomeraj za `JAL`;
- labela iza poslednje instrukcije;
- labela na istoj liniji kao instrukcija;
- krajnji dostižni pomeraji grane `-4096` i `4092`.

Pozitivna granica koja je stvarno dostižna iznosi `4092`, a ne `4095`, jer je svaka
instrukcija poravnata na četiri bajta.

### Opsezi immediate vrednosti

Testovi proveravaju:

- dozvoljene granice `-2048` i `2047`;
- vrednosti neposredno izvan granica;
- offsete za `LW`, `SW` i `JALR`;
- da `LI` nasleđuje 12-bitno ograničenje instrukcije `ADDI`;
- predaleku granu.

### Semantičke greške

Proveravaju se:

- nepoznata instrukcija;
- pogrešan broj operanada;
- pogrešan tip operanda;
- nedefinisana labela;
- duplirana labela;
- više semantičkih grešaka u istom programu;
- prekid asembliranja kada parser prijavi sintaksnu grešku.

Važan edge case potvrđuje da i semantički pogrešna instrukcija zauzima adresu u prvom
prolazu. U suprotnom bi sve naredne labele dobile pogrešne adrese i proizvele dodatne,
lažne greške.

---

## Testovi CPU-a

CPU ima najviše testova zato što objedinjuje registre, memoriju, PC i svih 15 instrukcija.

### Aritmetika i logika

Proveravaju se:

- `ADD`, `SUB` i `ADDI`;
- `AND`, `OR` i `XOR`;
- `SLL` i `SRL`;
- korišćenje samo donjih pet bita registra pomeraja;
- negativni rezultati.

### 32-bitno ponašanje

Poseban test direktno postavlja:

```text
x1 = 2147483647
x2 = 1
```

Posle `ADD x3, x1, x2` očekuje se:

```text
x3 = -2147483648
```

Time se potvrđuje wrap-around 32-bitnog registra.

### Registar `x0`

Odvojeno se proveravaju:

- čitanje iz `x0` uvek daje nulu;
- pokušaj upisa ne menja `x0`;
- `x0` se ne pojavljuje u skupu korišćenih registara.

### Memorija

Testovi proveravaju:

- `SW` pa `LW` vraća istu pozitivnu i negativnu vrednost;
- četiri bajta stvarno imaju little-endian raspored;
- efektivna adresa je baza plus offset;
- čitanje neupisane memorije daje nulu;
- poslednja validna reč na adresi `4092`;
- neporavnata, negativna i adresa van memorije;
- pamćenje upisanih adresa;
- Reset briše memoriju i evidenciju upisa.

Test little-endian rasporeda ne proverava samo da `LW` pročita ono što je `SW` upisao.
Takav test bi mogao da prođe čak i kada bi obe funkcije koristile isti pogrešan raspored.
Zato se direktno proveravaju bajtovi:

```text
0x12345678 -> 78 56 34 12
```

### Grane

Za `BEQ`, `BNE` i `BLT` provereni su i tačan i netačan uslov. Poseban test za `BLT`
koristi `-1` i `1` da potvrdi poređenje sa znakom.

Petlja koja broji do 10 potvrđuje ponovljeno grananje unazad i pravilno ažuriranje PC-a.

### Skokovi

Proveravaju se:

- `JAL` upisuje povratnu adresu `pc + 4`;
- `J` ne čuva povratnu adresu jer piše u `x0`;
- poziv i povratak preko `JAL` i `RET`;
- cilj `JALR` je zbir registra i offseta;
- `JALR` briše najniži bit ciljne adrese;
- `JALR` radi kada su `rd` i `rs1` isti registar;
- neispravan cilj ne upisuje povratnu adresu;
- skok tačno iza poslednje instrukcije završava program;
- skok van programa i neporavnat skok daju grešku.

Slučaj `rd == rs1` potvrđuje važan redosled: cilj skoka mora da se izračuna pre nego što se
u isti registar upiše povratna adresa.

### Step, Run i breakpointi

Proveravaju se:

- PC raste za četiri;
- `step()` vraća izvornu liniju;
- završetak posle poslednje instrukcije;
- prazan program;
- Reset;
- Run do kraja;
- prekid beskonačne petlje;
- prenošenje greške iz `step()` u `run()`;
- zaustavljanje pred breakpointom;
- nastavak sa breakpointa;
- breakpoint na liniji bez instrukcije nema efekta;
- Run izvršava instrukciju pred kojom program već stoji;
- Step pa Run na liniji sa breakpointom ne pravi prazno zaustavljanje.

---

## Greška koju je otkrio M8 pregled

### Završetak tačno na `maxSteps`

Program sa tri instrukcije pokrenut ovako:

```ts
cpu.run({ maxSteps: 3 });
```

izvršio je sve tri instrukcije, ali bi petlja zatim izašla zbog dostignutog limita i vratila
grešku:

```text
prekoracen limit ... (moguca beskonacna petlja)
```

Problem nije bio u izvršavanju instrukcija, nego u trenutku provere završetka. `run()` je
ranije saznao da je program završen tek kroz naredni poziv `step()`, za koji više nije bilo
dozvoljenih koraka.

Ispravka posle svakog uspešnog koraka proverava:

```ts
const next = this.currentInstruction;
if (next === null) {
  return { status: "halted" };
}
```

Novi test potvrđuje da tačno `maxSteps` instrukcija daje `"halted"`, dok prava beskonačna
petlja i dalje daje grešku.

## Edge case koji je precizirao breakpoint semantiku

Tokom M8 razmatran je breakpoint na prvoj instrukciji. Ključno pitanje bilo je da li prvi
Run treba odmah da se zaustavi ili da izvrši instrukciju pred kojom program već stoji.

Konačno pravilo je:

> Run izvršava tekuću instrukciju, a zatim proverava breakpoint sledeće instrukcije.

Isto pravilo pokriva:

- prvi Run posle asembliranja;
- Run posle jednog ili više Step koraka;
- nastavak sa breakpointa;
- ponovni dolazak na isti breakpoint kroz petlju.

Testovi su sprečili uvođenje dodatnog stanja samo za pamćenje breakpointa i potvrdili
jednostavnije, dosledno ponašanje.

---

## Ručno testiranje UI-ja

UI nema poseban automatizovani test paket. Ručno su provereni:

1. prelazak iz režima pisanja u režim izvršavanja;
2. ostanak u editoru i prikaz svih grešaka kada asembliranje ne uspe;
3. Step i pomeranje markera `>`;
4. Run do kraja;
5. Run do breakpointa i nastavak;
6. postavljanje i uklanjanje breakpointa klikom i dugmetom;
7. Reset registara, memorije i PC-a uz očuvanje breakpointa;
8. Izmeni i brisanje starog izvršnog stanja;
9. isticanje promenjenih registara;
10. prikaz upisanih memorijskih reči;
11. početni prazan projekat i učitavanje sva četiri primer-programa;
12. zaključavanje menija primera u režimu izvršavanja;
13. otvaranje dokumentacije u oba režima i zatvaranje dugmetom ili tasterom `Escape`;
14. prikaz svih 15 pravih i 5 pseudo-instrukcija.

Za svaki ugrađeni primer provereno je i konačno stanje:

| Primer | Provereni rezultat |
|---|---|
| Zbir brojeva 1–5 | memorija `0000 = 15` |
| Aritmetika i logika | očekivani rezultati u registrima `x3–x11` |
| Rad sa memorijom | adrese `0008 = 10`, `000C = 20`, `0010 = 30` |
| Funkcija i grananje | memorija `0000 = 8`, `0004 = 1` |

## Zašto UI nije automatski testiran

Glavni razlog nije da UI testovi nisu korisni, već procena odnosa koristi i složenosti:

- kritična RISC-V logika već je izdvojena i automatski pokrivena;
- UI je mali i nema složene asinhrone tokove;
- browser testovi bi zahtevali dodatni alat i održavanje selektora;
- projekat ima kratak rok i prioritet je ispravan MVP.

Za veći projekat sledeći korak bili bi end-to-end testovi osnovnog korisničkog toka:
unos koda → Asembliraj → Step/Run → provera prikaza.

## Šta broj testova ne dokazuje

Broj 113 sam po sebi nije dokaz da program nema grešaka. Važnije je šta je testirano:

- normalni slučajevi;
- obe strane uslova;
- vrednosti na granici;
- vrednosti neposredno izvan granice;
- greške i stanje posle neuspešne operacije;
- međusobno zavisna pravila, kao `JALR` sa istim izvornim i odredišnim registrom.

Nije meren procenat code coverage-a. Umesto težnje ka procentu, testovi su birani prema
specifikaciji i rizičnim mestima implementacije.

## Kratko usmeno objašnjenje

> Automatski testovi su koncentrisani u core sloju, jer se tu nalazi deterministička logika
> parsera, asemblera i CPU-a. Parser ima 24, asembler 31, a CPU 58 testova, ukupno 113.
> Nisam proveravala samo svaku instrukciju, već i granice immediate vrednosti, 32-bitno
> prelivanje, little-endian raspored bajtova, poravnanje memorije, skokove, `x0`, limit
> instrukcija i breakpointe. M8 pregled je konkretno otkrio da je program koji se završava
> tačno na `maxSteps` pogrešno prijavljivan kao beskonačna petlja. UI je zbog malog obima
> proveren ručno kroz kompletan korisnički tok i sva četiri ugrađena primera. Početni
> prazan projekat i ugrađena dokumentacija naknadno su dodati prema povratnoj informaciji
> mentora i provereni u browseru.

## Moguća pitanja komisije

**Zašto nije dovoljno testirati samo konačan rezultat programa?**  
Isti konačan rezultat ponekad može da nastane uprkos pogrešnoj unutrašnjoj implementaciji.
Na primer, pogrešni `SW` i `LW` sa istim poretkom bajtova mogli bi zajedno da vrate ispravnu
vrednost. Zato se zasebno proveravaju bajtovi u memoriji.

**Zašto CPU testovi koriste pravi asembler?**  
Time se izbegava ručno pravljenje velikog broja instrukcijskih objekata. Test i dalje ima
jednu ciljanu CPU tvrdnju, a pomoćnik prvo potvrđuje da je asembliranje prošlo bez greške.

**Kako znate da je `SRL` logičko pomeranje?**  
Test koristi negativan broj. Logičko `>>>` uvlači nule i daje veliki pozitivan rezultat,
dok bi aritmetičko `>>` sačuvalo znak.

**Kako testirate 32-bitno prelivanje kada JavaScript koristi `number`?**  
Vrednosti registara čuvaju se u `Int32Array`. Test sabira najveći pozitivan 32-bitni broj i
jedan i očekuje najmanji negativan 32-bitni broj.

**Zašto testirate i dozvoljenu granicu i vrednost izvan nje?**  
Tako se otkrivaju greške tipa `<` umesto `<=`, odnosno off-by-one greške.

**Da li 113 testova garantuje da nema grešaka?**  
Ne. Testovi povećavaju pouzdanost za definisanu specifikaciju, ali ne mogu da dokažu
odsustvo svih mogućih grešaka. Zato su dopunjeni proverom tipova, buildom i ručnim
testiranjem UI-ja.

**Šta biste sledeće automatizovali?**  
Jedan mali browser test za osnovni tok: učitavanje primera, asembliranje, Step, breakpoint,
Run i provera konačnog prikaza.

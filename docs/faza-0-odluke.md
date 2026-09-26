# Faza 0 — Donete odluke

Ovaj dokument je referenca za ceo projekat. Sve odluke ispod su eksplicitno potvrđene pre
pisanja koda. Ako se neka odluka menja tokom rada, menja se i ovde, uz kratko obrazloženje.

---

## 1. Tehnologija

| Odluka | Izbor | Obrazloženje |
|---|---|---|
| Tip aplikacije | Web (radi u browseru) | Nula instalacije kod mentora, lak debug kroz DevTools |
| Jezik | TypeScript | Tipovi hvataju greške pre pokretanja — bitno kod simulatora sa 32 registra i memorijom |
| Build alat | Vite | Lokalni server sa auto-osvežavanjem, jedna komanda za pokretanje, nula konfiguracije |
| UI framework | **nema** (obični DOM) | UI je 4 dugmeta i 3 liste teksta; React bi bio dodatni sloj za učenje i odbranu |
| Editor koda | obična `<textarea>` + sopstveni prikaz brojeva linija | Bez spoljnih zavisnosti, potpuna kontrola nad prikazom `>` markera i breakpointa |
| Testovi | da (unit testovi za asembler i simulator) | Sprečavaju da popravka jedne stvari pokvari drugu; dobro izgledaju u radu |
| Git | commit na kraju svakog milestone-a | Istorija rada vidljiva i branjiva |

---

## 2. Sintaksa asemblera

```asm
# ovo je komentar — sve od # do kraja linije se ignoriše

petlja:                  # labela sama u liniji
    ADDI x1, x0, 5       # decimalni immediate
    addi x2, x0, 0x1F    # hex immediate; instrukcije su case-insensitive
    LW   x3, 8(x2)       # format za LW/SW: rd, offset(baza)
    BNE  x1, x0, petlja  # skok na labelu
```

Pravila:

- **Jedna instrukcija po liniji.** Prazne linije i linije sa samo komentarom su dozvoljene.
- **Komentari:** `#` do kraja linije.
- **Labele:** `ime:` — slova, cifre i `_`, ne smeju počinjati cifrom. Mogu biti same u liniji
  ili ispred instrukcije u istoj liniji.
- **Registri:** `x0`–`x31`, case-insensitive (`X5` = `x5`). ABI imena (`zero`, `ra`, `sp`, …)
  **ne** podržavamo u MVP-u.
- **Mnemonici:** case-insensitive (`addi` = `ADDI`).
- **Immediate:** decimalno sa opcionim minusom (`5`, `-3`) ili heksadecimalno (`0x1F`).
- **Razdvajanje operanada:** zarez; razmaci oko zareza su slobodni.
- **Cilj skokova i grana:** isključivo labela (ne numerički offset).

### Podržane instrukcije (15)

| Tip | Instrukcije | Format |
|---|---|---|
| R (registar-registar) | `ADD, SUB, AND, OR, XOR, SLL, SRL` | `OP rd, rs1, rs2` |
| I (immediate) | `ADDI` | `ADDI rd, rs1, imm` |
| I (load) | `LW` | `LW rd, offset(rs1)` |
| S (store) | `SW` | `SW rs2, offset(rs1)` |
| B (grananje) | `BEQ, BNE, BLT` | `OP rs1, rs2, labela` |
| J (skok) | `JAL` | `JAL rd, labela` |
| I (skok kroz registar) | `JALR` | `JALR rd, offset(rs1)` |

- `SLL`/`SRL` su R-tipa: pomeraj je donjih 5 bita registra `rs2`.
- `BLT` poredi kao **brojeve sa znakom**.
- `SRL` je **logičko** pomeranje udesno (uvlače se nule).

### Pseudo-instrukcije (5)

| Pseudo | Prevodi se u |
|---|---|
| `LI rd, imm` | `ADDI rd, x0, imm` |
| `MV rd, rs` | `ADDI rd, rs, 0` |
| `NOP` | `ADDI x0, x0, 0` |
| `J labela` | `JAL x0, labela` |
| `RET` | `JALR x0, 0(x1)` |

Prevođenje se radi u asembleru, pre izvršavanja — simulator nikada ne vidi pseudo-instrukciju.

---

## 3. Interna reprezentacija

```ts
registers: Int32Array(32)   // 32-bitni brojevi sa znakom; wrap-around je automatski
memory:    Uint8Array(4096) // 4 KB podataka, byte-adresibilna
pc:        number           // kreće od 0, raste za 4; indeks instrukcije = pc / 4

// jedna asemblirana instrukcija:
{ op: 'ADD', rd: 3, rs1: 1, rs2: 2, imm: 0, sourceLine: 7 }
```

- `Int32Array` je izabran jer sam vrši presecanje na 32 bita, kao pravi procesor.
- `x0` je uvek 0 — svaki upis u njega se tiho ignoriše.
- `sourceLine` povezuje instrukciju sa linijom u editoru (za `>` marker i breakpointe).
- **Simulacija je na nivou instrukcija, ne bitova** — instrukcije se ne enkodiraju u
  32-bitni mašinski kôd. (Otvoreno pitanje za mentora.)

---

## 4. Memorija i adresiranje

- **Veličina:** 4 KB podataka, adrese `0x000`–`0xFFF`.
- **Byte-adresibilna**, **little-endian**.
- **Instrukcije i podaci su odvojeni** (Harvard model): program je niz objekata, podaci su
  `Uint8Array`. Jednostavnije za implementaciju i objašnjenje nego jedinstvena memorija.
- `LW`/`SW` **moraju** biti poravnati na 4 bajta (`adresa % 4 == 0`), inače greška
  pri izvršavanju.
- Pristup van opsega `0x000`–`0xFFF` je greška pri izvršavanju.

---

## 5. Prikaz stanja

**Registri**

- Prikazuju se samo registri u koje je bar jednom upisano; ostaju vidljivi i kada im se
  vrednost vrati na 0.
  *(Izmenjeno posle M3.5: prvobitna odluka je bila „svih 32 uvek", ali je spisak od 32 reda
  u praksi nepregledan — programi koriste nekoliko registara. Vidi `ui-zelje.md`.)*
- Format: hex (8 cifara, kao na mokapu) **i** decimalno sa znakom pored — npr. `x1  00000005  (5)`.
- Registri promenjeni poslednjom akcijom se vizuelno obeležavaju: kod `Step`-a to su
  promene jedne instrukcije, kod `Run`-a sve promene nastale tokom tog izvršavanja.
  *(Precizirano u M7: prvobitna formulacija je pominjala samo „poslednju izvršenu
  instrukciju", što nema jasno značenje posle `Run`-a.)*

**Memorija**

- Prikazuju se samo reči u koje je nešto upisivano (mokap: `0000: 00000008`).
- Format: `AAAA: VVVVVVVV` plus decimalna vrednost sa znakom, sortirano po adresi.
  *(Izmenjeno u M6: dodato decimalno, radi doslednosti sa panelom registara — `FFFFFFFB`
  je nečitljivo, `-5` nije.)*

**Editor**

- `>` marker na liniji koja će se sledeća izvršiti.
- Crvena tačka u levoj margini za breakpoint.

---

## 6. Greške

**Pri asembliranju** — skupljaju se **sve odjednom** i ispisuju kao lista ispod editora:

```
Linija 7: nepoznata instrukcija 'MULT'
Linija 12: nedefinisana labela 'kraj'
```

Dok postoji bar jedna greška, program se ne pokreće.

Tipovi: nepoznata instrukcija, pogrešan broj/tip operanada, nepostojeći registar,
nedefinisana labela, duplirana labela, immediate van dozvoljenog opsega.

**Pri izvršavanju** — izvršavanje se zaustavlja i ispisuje se poruka sa adresom i linijom:
neporavnat pristup memoriji, adresa van opsega, skok van programa, prekoračen limit instrukcija.

---

## 7. Kontrole izvršavanja

| Dugme | Ponašanje |
|---|---|
| **Step** | Izvrši tačno jednu instrukciju i osveži prikaz |
| **Run** | Izvršava do kraja programa, do breakpointa ili do greške — **odjednom**, bez animacije. Limit: 100000 instrukcija, pa greška „moguća beskonačna petlja" |
| **Reset** | Registri na 0, memorija na 0, PC na 0, program se ponovo asemblira. Breakpointi ostaju |
| **Breakpoint** | Klik na broj linije postavlja/skida breakpoint. Dugme radi isto za liniju na kojoj je kursor |

- Program se završava kada PC pređe poslednju instrukciju.
- Run se zaustavlja **pre** izvršavanja instrukcije na kojoj je breakpoint.

---

## 8. Otvorena pitanja za mentora

1. Da li je 15 ili 16 instrukcija? (u mejlu piše 16, nabrojano je 15)
2. Da li treba prikaz binarnog enkodiranja instrukcije, ili je dovoljan nivo asemblera?
3. Da li je 4 KB simulirane memorije dovoljno?

Nijedno od ovih ne blokira rad — ako odgovor stigne, prilagođavamo se.

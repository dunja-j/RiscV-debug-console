# M5 — Kontrola toka

## Cilj

Dodati grane i skokove (`BEQ, BNE, BLT, JAL, JALR`), zaštitu od beskonačne petlje i
beleženje korišćenih registara. Ovim je `core/` kompletan.

## Šta je urađeno

Prošireno `src/core/cpu.ts`:

- privatno polje `nextPc` i preuređen `step()`
- `branch()`, `jump()` i `setNextPc()` — grananje, skok i provera odredišta
- `run(maxSteps)` — izvršavanje celog programa sa limitom (podrazumevano 100000)
- `usedRegisters: Set<number>` — registri u koje je pisano (za panel REGISTRI u M6)

## Ključna izmena: `nextPc`

Do M4 je `step()` uvek radio `pc += 4` posle izvršavanja. Sa skokovima to više ne važi:

```ts
this.nextPc = this.pc + INSTRUCTION_SIZE;  // podrazumevano: sledeca instrukcija
const error = this.execute(instruction);   // grana ili skok menja nextPc
this.pc = this.nextPc;
```

Time `pc` ostaje nepromenjen tokom cele instrukcije, pa `JAL` i `JALR` mogu da računaju
povratnu adresu kao `pc + 4`. Isto radi pravi procesor: sledeći PC se bira tek na kraju
ciklusa izvršavanja.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| Uvedeno polje `nextPc`, `pc` se menja tek na kraju koraka | Instrukcija direktno menja `pc` | `JAL`/`JALR` računaju povratnu adresu iz `pc`; da se `pc` menjao usred izvršavanja, ta računica bi se lako pokvarila |
| `run(limit)` je u `core`, ne u UI | Petlja u UI kodu | Može se testirati bez browsera; UI u M7 samo poziva metodu |
| Skok tačno iza poslednje instrukcije je uredan završetak | Greška | Nastavak odluke iz M2 da je labela na kraju programa dozvoljena — `J kraj` je prirodan izlaz |
| Provera odredišta ide pre upisa povratne adrese | Prvo upis, pa provera | Kod `JALR x1, 0(x1)` odredišni i izvorni registar mogu biti isti |

## Zamke i problemi

- **`JALR` briše najniži bit odredišne adrese** (`& ~1`) — tako propisuje specifikacija
  RISC-V. Poravnanje na 4 bajta se posle toga i dalje proverava.
- **`BLT` poredi sa znakom**: `-1 < 1` je tačno. `Int32Array` to daje besplatno, ali je to
  suštinska razlika u odnosu na poređenje bez znaka i pokriveno je posebnim testom.
- **Granica dozvoljenog skoka je `program.length * 4`, uključivo** — adresa tačno iza
  poslednje instrukcije znači kraj programa, a ne grešku.
- **Limit instrukcija je nužan**, ne kozmetika: `petlja: J petlja` bi bez njega zamrznuo
  celu stranicu, jer JavaScript u browseru izvršava sav kod u jednoj niti.

## Kako je testirano

19 novih testova (ukupno 94 u projektu):

- **grane** (6): `BEQ` skače/ne skače, `BNE`, `BLT` sa znakom, petlja koja broji do 10,
  provera da grana unazad vraća PC na tačnu adresu;
- **skokovi** (7): `JAL` upisuje povratnu adresu, `J` je ne čuva (piše u `x0`), pun ciklus
  poziva funkcije preko `JAL`/`RET` (rezultat `x5 = 111` dokazuje i redosled i povratak),
  `JALR` iz registra i offseta, skok na kraj programa, skok van programa, neporavnat skok;
- **run i limit** (3): izvršavanje celog programa, prekid beskonačne petlje, prenošenje
  greške iz izvršavanja;
- **korišćeni registri** (4): beleženje upisa, zadržavanje registra vraćenog na nulu,
  `x0` se nikad ne beleži, `reset` briše spisak.

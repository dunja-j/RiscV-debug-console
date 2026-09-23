# M3 — CPU: aritmetika i logika

## Cilj

Model procesora koji izvršava jednu instrukciju: registri, PC i osam aritmetičko-logičkih
instrukcija (`ADD, SUB, ADDI, AND, OR, XOR, SLL, SRL`).

## Šta je urađeno

`src/core/cpu.ts` — klasa `Cpu`:

- `registers: Int32Array(32)` i `pc`
- `step()` — izvršava instrukciju na koju pokazuje PC i vraća `StepResult`
- `reset()` — registri i PC na nulu, program ostaje učitan
- `currentInstruction` — instrukcija na adresi PC, ili `null` ako je program gotov

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| `Int32Array` za registre | Običan niz brojeva | `Int32Array` sam odseca rezultat na 32 bita, pa se prelivanje ponaša kao na pravom procesoru bez ručnog maskiranja (`2147483647 + 1` daje `-2147483648`) |
| Klasa `Cpu` | Čist objekat stanja + zasebne funkcije | Bliže terminologiji arhitekture računara („procesor ima stanje i izvršava instrukcije"), lakše za usmeno objašnjenje |
| `step()` vraća `StepResult` sa statusom | Bacanje izuzetka (`throw`) | Pozivalac uvek proverava rezultat; nema skrivenih putanja izvršavanja kroz UI |
| Upis u registar ide isključivo kroz `setRegister` | Direktan upis u svakoj grani `switch`-a | Pravilo „`x0` je uvek nula" sprovedeno je na jednom mestu umesto na osam |
| Instrukcije iz M4/M5 vraćaju grešku „još nije podržana" | Tiho ih ignorisati | Ponašanje je vidljivo i testirano; TypeScript zahteva da `switch` pokrije svih 15 `OpCode` vrednosti, pa nas kompajler sam tera da granu smanjimo kad dodamo `LW` |

## Zamke i problemi

- **`SRL` mora da koristi `>>>`, ne `>>`.** JavaScript ima dva operatora pomeranja udesno:
  `>>` je aritmetičko i čuva znak, `>>>` je logičko i uvlači nule. `SRL` je po specifikaciji
  logičko: `-8` pomereno za 1 daje `2147483644`, a ne `-4`. Ovo je pokriveno posebnim testom.
- **Pomeranje koristi samo donjih 5 bita** registra `rs2` — 32-bitni broj nema smisla pomerati
  za više od 31. JavaScript to slučajno već radi, ali je maska `& 0x1f` napisana eksplicitno
  da se u kodu vidi da je pravilo namerno, a ne posledica jezika.
- **Registar `x0` nije specijalan slučaj radi lakoće**, nego temelj arhitekture: zato
  `LI`, `MV` i `NOP` uopšte mogu da postoje kao pseudo-instrukcije.

## Kako je testirano

17 testova u `tests/cpu.test.ts`, u četiri grupe:

- **aritmetika i logika** (7): svih osam instrukcija, uključujući dokaz da je `SRL` logičko
  pomeranje i da se koristi samo donjih 5 bita pomeraja;
- **32-bitno ponašanje** (2): prelivanje zbira, čuvanje znaka;
- **registar x0** (2): čitanje uvek daje 0, upis se odbacuje;
- **tok izvršavanja** (6): PC raste za 4, `step` vraća izvornu liniju, `halted` posle
  poslednje instrukcije, prazan program, `reset`, i greška za još nepodržane instrukcije.

Testovi koriste pravi asembler (`assemble`) umesto ručno sklopljenih instrukcija, pa
usput proveravaju i da se M2 i M3 ispravno uklapaju.

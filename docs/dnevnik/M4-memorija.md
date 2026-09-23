# M4 — Memorija

## Cilj

Dodati simuliranu memoriju podataka i instrukcije `LW` i `SW`, sa proverama poravnanja i
opsega adrese.

## Šta je urađeno

Prošireno `src/core/cpu.ts`:

- `memory: Uint8Array(4096)` — 4 KB podataka, adrese `0x000`–`0xFFF`
- `writtenWords: Set<number>` — adrese reči u koje je pisano (za panel MEMORIJA u M6)
- `readWord(address)` — javno čitanje reči, koristi ga UI
- privatne `load` i `store`, i slobodna funkcija `checkAddress`

Adresa se računa kao `registers[rs1] + imm` — baza iz registra plus konstanta iz instrukcije.

## Little-endian

32-bitna reč se upisuje „najniži bajt prvi". Vrednost `0x12345678` na adresi 0:

| adresa | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| bajt | `78` | `56` | `34` | `12` |

Praktičan razlog: čitanje prvih bajtova daje najmanje značajne cifre, pa se broj lako
proširuje na veću širinu bez pomeranja. RISC-V je little-endian, kao i x86.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| `DataView` za čitanje/upis reči | Ručno sklapanje četiri bajta pomoću pomeranja i `\|` | Kraće i manje prostora za grešku; razumevanje little-endian poretka se dokazuje testom koji proverava same bajtove, a ne komentarom u kodu |
| `checkAddress` je slobodna funkcija, van klase | Privatna metoda | Ne dira stanje procesora — prima adresu, vraća poruku ili `null`; lakše se čita i testira |
| Pamćenje upisanih adresa uvedeno odmah, uz `SW` | Odložiti za M5 | Prirodno pripada kodu za memoriju; panel MEMORIJA u M6 prikazuje samo te adrese |
| Greška vraća poruku kroz `StepResult` | Bacanje izuzetka | Isti mehanizam kao u M3 — pozivalac uvek proverava rezultat |

## Zamke i problemi

- **Provera opsega mora da računa i širinu reči**: uslov je `address + 4 > MEMORY_SIZE`, ne
  `address >= MEMORY_SIZE`. Inače bi upis na adresu 4094 delimično izašao iz memorije.
- **Negativna adresa** (npr. `LW x1, -4(x0)`) mora da se hvata posebno; formatiranje takve
  adrese u heksadecimalni oblik dalo bi besmislen ogroman broj, pa se ispisuje decimalno.
- Dve greške u pisanju testova pokazale su da raniji milestone-ovi rade kako treba:
  - test sa `LI x2, 2100` nije prošao jer konstanta ne staje u 12 bita — provera iz M2;
  - test „instrukcije iz kasnijih milestone-ova nisu podržane" pao je jer `LW` sada jeste
    podržana, pa je prebačen na `BEQ`. To je direktna korist od iscrpnog `switch`-a nad
    `OpCode` tipom.

## Kako je testirano

10 novih testova u `tests/cpu.test.ts` (ukupno 75 u projektu):

- `SW` pa `LW` vraća istu vrednost, uključujući negativnu;
- bajtovi u memoriji stvarno leže u little-endian poretku (`78 56 34 12`);
- adresa je zbir registra i offseta;
- čitanje iz nedirane memorije daje 0;
- spisak upisanih adresa se ispravno puni;
- neporavnata adresa, adresa van memorije i negativna adresa daju grešku sa jasnom porukom;
- `reset` briše memoriju i spisak upisanih adresa.

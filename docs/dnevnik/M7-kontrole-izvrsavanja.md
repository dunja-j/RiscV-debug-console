# M7 — Kontrole izvršavanja

## Cilj

Oživeti dugmad: Step, Run (sa breakpointima), Reset i Breakpoint, uz isticanje registara
promenjenih poslednjom akcijom.

## Šta je urađeno

- `src/core/cpu.ts` — `run()` prima `RunOptions` (`breakpoints`, `maxSteps`); dodat status
  `"breakpoint"` u `StepResult`
- `src/ui/main.ts` — rukovanje dugmadima, skup breakpointa, poređenje registara pre i posle
- `src/ui/render.ts` — tačka breakpointa u listingu, klasa `promenjen` na registrima
- `src/style.css` — crvena tačka, bledi nagoveštaj tačke na prelaz mišem, roze isticanje

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| `Run` proverava breakpointe **tek posle** izvršenog koraka | Provera pre svakog koraka | Inače bi `Run`, pokrenut sa zaustavljene instrukcije, odmah ponovo stao na istom mestu i izvršavanje se nikad ne bi pomerilo. Svaki debager rešava to isto |
| Breakpointi se pamte po **broju linije u editoru** | Po adresi instrukcije | Korisnik klikće na linije; adresa mu nije vidljiva |
| Breakpoint se može postaviti samo na liniju koja nosi instrukciju | Dozvoliti bilo gde | Breakpoint na komentaru ili praznoj liniji nikad ne bi bio pogođen — tiho neispravno ponašanje |
| Klik na liniju postavlja/skida breakpoint; dugme „Breakpoint" radi isto za tekuću liniju | Klik *bira* liniju, dugme postavlja | Manje stanja u UI-ju (nema „izabrane linije"), a dugme sa mokapa i dalje ima smisao |
| Breakpointi se brišu pri povratku u režim pisanja | Čuvati ih po broju linije | Posle izmene koda brojevi linija se pomeraju, pa bi breakpoint završio na pogrešnoj instrukciji |
| Koji su se registri promenili računa **UI**, poređenjem kopije pre i posle | Da `Cpu` sam vodi evidenciju | To je pitanje prikaza, ne stanja procesora; `Cpu` ostaje čist |
| Posle `Run`-a se ističu svi registri promenjeni tokom izvršavanja | Ne isticati ništa posle `Run`-a | Koristan pregled šta je izvršavanje dodirnulo. Precizirana je i formulacija odluke u Fazi 0 |
| Po završetku ili grešci se gase Run, Step i Breakpoint | Ostaviti ih aktivnim uz poruku | Stanje programa se vidi iz same dugmadi; Reset ili Izmeni ih vraćaju |

## Zamke i problemi

- **Klik se hvata na kontejneru listinga, ne na svakoj liniji** (delegiranje događaja). Linije
  se iscrtavaju iznova posle svake akcije, pa bi pojedinačni slušaoci morali stalno da se
  postavljaju. Broj linije se čita iz `data-line` atributa.
- **`render.ts` i dalje ne zna za događaje** — samo upisuje `data-line`; sav klik-kod je u
  `main.ts`. Granica iz M6 je očuvana.
- **Kopija registara pre koraka** mora biti prava kopija (`Int32Array.from`), a ne referenca —
  inače bi se „pre" i „posle" odnosili na isti niz i razlika bi uvek bila prazna.
- Duga poruka u statusnoj traci je razvlačila stranicu i pravila horizontalni skrol; rešeno
  skraćivanjem teksta sa `text-overflow: ellipsis`.

## Kako je testirano

**Automatski** — 3 nova testa u `tests/cpu.test.ts` (ukupno 97):

- `run` staje pred instrukcijom sa breakpointom, i ta instrukcija **nije** izvršena;
- ponovni `run` sa zaustavljene instrukcije nastavlja dalje umesto da stane na istom mestu;
- breakpoint na liniji koja ne nosi instrukciju nema efekta.

**Ručno, u browseru** — pun ciklus na programu koji sabira brojeve 1..3 u petlji:
Step pomera `>` i puni panel registara → klik na liniju 7 postavlja tačku → Run staje na njoj
→ ponovni Run prođe kroz petlju i opet stane → dugme Breakpoint skida tačku → Run doteruje
program do kraja (`memorija 0000: 00000006`) i gasi Run/Step/Breakpoint → Reset vraća `>` na
prvu liniju i prazni panele.

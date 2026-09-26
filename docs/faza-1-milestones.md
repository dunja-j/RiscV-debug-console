# Faza 1 — Plan rada po milestone-ovima

Plan je dogovoren posle Faze 0, pre pisanja koda. Radimo strogo jedan milestone u jednom
trenutku: kad je gotov — testovi prolaze, kod je pročišćen i prokomentarisan, beleška u
`docs/dnevnik/` napisana — grana se merge-uje u `main` i otvara se sledeća.

## Struktura projekta

```
src/
  core/                 # logika, ne zna nista o browseru - ovde idu svi testovi
    parser.ts           # tekst -> strukturirane linije
    assembler.ts        # linije -> izvrsive instrukcije (+ labele, pseudo)
    cpu.ts              # registri, memorija, izvrsavanje jedne instrukcije
    types.ts            # zajednicki tipovi
  ui/
    main.ts             # povezuje dugmad i core
    render.ts           # iscrtavanje editora, registara, memorije
  style.css
index.html
tests/                  # unit testovi
docs/                   # odluke, plan, dnevnik rada
```

Ključna ideja: `core/` je čist TypeScript bez ijedne veze sa browserom. Zato se može testirati
bez UI-ja, i po potrebi preneti u drugu vrstu aplikacije bez izmena.

## Milestone-ovi

| # | Milestone | Obim (šta ulazi) | Definition of done | Status |
|---|---|---|---|---|
| **M0** | Setup projekta | Vite + TS + test runner, struktura foldera, prazan `index.html`, `.gitignore` | `npm run dev` otvara stranicu, `npm test` prolazi | ✅ gotovo |
| **M1** | Parser | Skidanje komentara, prepoznavanje labela, mnemonika i operanada; sintaksne greške sa brojem linije. Ne proverava postojanje labele ni instrukcije | Za dati tekst vraća tačnu listu parsiranih linija; za pokvaren tekst očekivane greške | ✅ gotovo (21 test) |
| **M2** | Asembler | Tabela labela (2 prolaza), prevođenje 5 pseudo-instrukcija, provera registara i opsega konstanti, računanje pomeraja za grane i skokove | Program sa labelama i pseudo-instrukcijama daje tačan niz instrukcija; nedefinisana/duplirana labela daje grešku | ✅ gotovo (27 testova) |
| **M3** | CPU — aritmetika i logika | `ADD, SUB, ADDI, AND, OR, XOR, SLL, SRL`, `x0` uvek 0, wrap na 32 bita, PC += 4 | Test za svaku instrukciju posebno + prelivanje + upis u `x0` ne menja ništa | ✅ gotovo (17 testova) |
| **M3.5** | Privremeni mini UI | Textarea + dugme Step + ispis registara, bez stilizovanja | Program se vidi kako se izvršava u browseru | ✅ gotovo |
| **M4** | Memorija | `LW, SW`, little-endian, provera poravnanja i opsega | Upis pa čitanje vraća istu vrednost; neporavnat pristup baca grešku | ✅ gotovo (10 testova) |
| **M5** | Kontrola toka | `BEQ, BNE, BLT, JAL, JALR`, kraj programa, limit instrukcija; + beleženje korišćenih registara (za prikaz u M6) | Petlja koja broji do 10; poziv „funkcije" preko `JAL`/`RET` | ✅ gotovo (19 testova) |
| **M6** | UI — prikaz | Dva režima (pisanje / izvršavanje) po `ui-zelje.md`, paneli REGISTRI i MEMORIJA, lista grešaka, roze paleta | Vizuelno odgovara mokapu; greške se prijavljuju pri asembliranju, sa brojem linije | ✅ gotovo |
| **M7** | Kontrole izvršavanja | Step, Run, Reset, Breakpoint; `>` marker; obeležavanje promenjenih registara | Ceo ciklus radi iz browsera; breakpoint zaustavlja Run | ✅ gotovo (3 nova testa + ručna provera) |
| **M8** | Testiranje i poliranje | 3-4 primer-programa, ivični slučajevi, čišćenje i komentarisanje koda | Svi testovi prolaze, nema mrtvog koda | ⬜ sledeće |
| **M9** | Priprema za odbranu | Objašnjenje arhitekture, dijagram toka, pregled odluka i obrazloženja | Projekat se može ispričati od početka do kraja bez gledanja u kod | ⬜ |

M3.5 je dodat naknadno na zahtev — privremeni UI posle M3, da se rad simulatora vidi ranije
nego što stigne pravi UI u M6. Deo tog koda se svesno baca u M6.

## Radni obrazac za svaki milestone

1. dogovor o spornim tačkama pre koda (ako ih ima)
2. kod + testovi
3. `npm run typecheck` i `npm test` moraju proći
4. beleška u `docs/dnevnik/MN-ime.md`
5. commit na grani `dev/milestoneN`, pa `git merge --no-ff` u `main`

## Prioritet

Rok je nekoliko nedelja. Prioritet je kompletan i ispravan MVP koji ispunjava sve zahteve
iz teme. Dodatne funkcionalnosti (animirani Run, lepši editor, dodatne instrukcije) dolaze
na red samo ako ostane vremena.

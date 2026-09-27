# M8 — Testiranje i poliranje

## Cilj

Proveriti ivične slučajeve u parseru, asembleru i simulatoru, dodati gotove programe za
demonstraciju, očistiti konačan kod i pripremiti aplikaciju da je mentor može odmah
pokrenuti i isprobati.

## Šta je urađeno

- pregledani su svi postojeći testovi i upoređeni sa implementacijom i odlukama iz Faze 0;
- dodato je 16 unit testova za nedostajuće granične slučajeve;
- ispravljeno je ponašanje `run()` kada se program završi tačno na granici `maxSteps`;
- precizirano je ponašanje Run-a i breakpointa na instrukciji pred kojom program već stoji;
- dodata su četiri ugrađena primer-programa i padajući meni za njihovo učitavanje;
- napisan je korisnički `README.md` sa uputstvom za pokretanje i kratkom referencom jezika;
- izabrana je konačna ljubičasto-roze paleta i uklonjena probna paleta;
- pregledan je ceo `src/` i uklonjeni su nepotreban javni izvoz i type-castovi u asembleru;
- pripremljen je minimalni paket projekta koji mentor može pokrenuti pomoću `npm install`
  i `npm run dev`.

## Novi ivični slučajevi

### Parser

- poslednji dozvoljeni registar `x31`;
- labela sa donjom crtom i ciframa posle prvog znaka;
- nepostojeći bazni registar `x32` u memorijskom operandu.

### Asembler

- granični 12-bitni offseti za `LW`, `SW` i `JALR`;
- offseti izvan 12-bitnog opsega za sva tri memorijska formata;
- krajnji dostižni pomeraji grane: `-4096` i `4092`;
- pogrešna instrukcija i dalje zauzima adresu pri računanju narednih labela.

### CPU

- pristup poslednjoj poravnatoj reči memorije, na adresi `4092`;
- netačni uslovi za `BNE` i `BLT`;
- brisanje najnižeg bita odredišta kod `JALR`;
- `JALR` kada su `rd` i `rs1` isti registar;
- neispravan `JALR` ne upisuje povratnu adresu;
- završetak programa tačno posle `maxSteps` instrukcija;
- Run na tekućoj instrukciji sa breakpointom;
- prelazak Step-om na instrukciju sa breakpointom, pa nastavak Run-om.

## Ispravljena greška u `run()`

Ako je program imao tačno onoliko instrukcija koliko iznosi `maxSteps`, sve instrukcije su
se izvršile, ali je `run()` ipak vraćao grešku o mogućoj beskonačnoj petlji. Posle svakog
uspešnog koraka sada se odmah proverava da li postoji sledeća instrukcija. Ako ne postoji,
vraća se status `"halted"`.

## Konačno ponašanje breakpointa

Program je već zaustavljen pred tekućom instrukcijom: posle asembliranja, Step-a ili
prethodnog breakpointa. Zato Run prvo izvršava tu instrukciju, a zatim proverava da li
sledeća instrukcija ima breakpoint.

Ovo pravilo izbegava „prazan Run" i dodatno stanje u CPU-u:

- prvi Run izvršava prvu instrukciju čak i ako je na njoj postavljena tačka;
- Run nastavlja kada je Step doveo PC na liniju sa breakpointom;
- Run nastavlja sa breakpointa na kojem se prethodno zaustavio;
- ako se program kasnije kroz petlju vrati na označenu liniju, breakpoint se ponovo aktivira.

## Primer-programi

Primeri su izdvojeni u `src/ui/examples.ts`:

| Primer | Šta demonstrira | Očekivani rezultat |
|---|---|---|
| Zbir brojeva 1–5 | petlja, `ADD`, `ADDI`, `BLT`, `SW` | vrednost 15 na adresi 0 |
| Aritmetika i logika | aritmetičke, logičke i shift instrukcije; `MV`, `NOP` | rezultati 17, 7, 4, 13, 9, 20 i 3 u registrima |
| Rad sa memorijom | bazna adresa, offset, `SW`, `LW` | vrednosti 10, 20 i 30 na adresama 8, 12 i 16 |
| Funkcija i grananje | `JAL`, `RET`, `BEQ`, `BNE`, `J` | rezultat funkcije 8 i rezultat provere 1 |

Meni se nalazi desno u zaglavlju panela PROGRAM. Izbor primera zamenjuje tekst u editoru i
vraća kursor i skrol na početak. Meni je onemogućen u režimu izvršavanja da se kod ne bi
promenio dok je procesor aktivan.

## Završno čišćenje

- konačne boje su postavljene direktno kao CSS promenljive u `:root`;
- uklonjene su klase i vrednosti neizabrane palete;
- `ProgramExample` više nije javno eksportovan jer se koristi samo u svom modulu;
- provera pravog mnemonika u asembleru koristi TypeScript type guard `isOpCode` umesto
  ručnih castova;
- pri povratku u režim pisanja briše se i skup izvršivih linija;
- potvrđeno je da nema `TODO`, `FIXME`, `console.log`, `debugger` niti mrtvih modula i
  funkcija.

## Kako je testirano

**Automatski:**

- sva 3 test fajla prolaze;
- svih 113 testova prolazi;
- `npm run typecheck` prolazi;
- `npm run build` pravi produkcioni paket bez greške;
- `git diff --check` ne prijavljuje probleme.

**Ručno, u browseru:**

- sva četiri primera učitana su kroz padajući meni;
- svaki primer se asemblira bez greške i završava očekivanim stanjem registara i memorije;
- provereno je da je meni onemogućen tokom izvršavanja;
- provereni su Asembliraj, Step, Run, Reset, Izmeni i postavljanje breakpointa;
- provereno je vraćanje editora na početak pri izboru novog primera.

## Rezultat

Definition of done za M8 je ispunjen: testovi prolaze, primeri pokrivaju glavne mogućnosti
aplikacije, kod je pregledan i očišćen, a aplikacija ima uputstvo i spremna je za testiranje.

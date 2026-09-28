# 4. Demonstracija, ograničenja i pitanja

## Cilj demonstracije

Demonstracija ne treba da pokaže svaku instrukciju pojedinačno. Cilj je da se u nekoliko
minuta vidi ceo tok aplikacije:

```text
izbor ili unos programa
-> asembliranje
-> Step
-> registri i PC
-> breakpoint
-> Run
-> memorija
-> Reset
-> prijava greške
```

Najpogodniji glavni primer je **Zbir brojeva 1–5**, jer u kratkom programu koristi
pseudo-instrukcije, aritmetiku, petlju, grananje i memoriju.

## Priprema pre odbrane

Pre početka prezentacije:

1. proveriti da projekat ima instalirane zavisnosti;
2. pokrenuti `npm run dev`;
3. otvoriti adresu koju Vite prikaže;
4. maksimalno uvećati prozor browsera;
5. zatvoriti nepotrebne tabove i programe;
6. isključiti obaveštenja operativnog sistema;
7. proveriti da je u meniju dostupan primer **Zbir brojeva 1-5**;
8. ostaviti terminal otvoren u pozadini.

Korisno je pre odbrane jednom pokrenuti:

```bash
npm test
npm run typecheck
npm run build
```

To nije deo demonstracije, već poslednja provera da je projekat u očekivanom stanju.

---

## Glavni scenario demonstracije

Ovaj scenario traje približno pet minuta.

### 1. Ukratko predstaviti ekran

Pokazati:

- panel PROGRAM;
- panele REGISTRI i MEMORIJA;
- dugmad Asembliraj, Run, Step, Reset i Breakpoint;
- padajući meni sa primerima.

Predlog šta reći:

> Levo se nalazi program, a desno stanje registara i memorije. Aplikacija ima odvojen
> režim pisanja i režim izvršavanja, tako da kod ne može da se promeni dok se izvršava.

### 2. Učitati primer

Iz menija izabrati **Zbir brojeva 1-5**.

Program:

```asm
# Zbir brojeva od 1 do 5
LI x1, 0        # zbir
LI x2, 1        # brojac
LI x3, 6        # granica

petlja:
ADD x1, x1, x2
ADDI x2, x2, 1
BLT x2, x3, petlja

SW x1, 0(x0)    # rezultat 15 na adresi 0
```

Objasniti registre:

```text
x1 = tekući zbir
x2 = brojač
x3 = granica petlje
```

Predlog šta reći:

> `LI` je pseudo-instrukcija koja se u asembleru prevodi u `ADDI` sa registrom `x0`.
> Petlja sabira brojeve od 1 do 5, a konačan rezultat upisuje u memoriju.

### 3. Asemblirati

Pritisnuti **Asembliraj**.

Pokazati:

- editor je zamenjen nepromenljivim listingom;
- pojavili su se brojevi linija;
- marker `>` stoji na prvoj izvršivoj instrukciji;
- registri i memorija su još prazni.

Predlog šta reći:

> Parser i asembler su uspešno obradili program. Marker pokazuje instrukciju koju će CPU
> sledeću izvršiti. Komentari, prazne linije i samostalna labela ostaju vidljivi, ali ne
> zauzimaju instrukcijsku adresu.

### 4. Izvršiti inicijalizaciju pomoću Step

Tri puta pritisnuti **Step**.

Posle koraka očekuju se:

```text
x1 = 0
x2 = 1
x3 = 6
```

Marker treba da dođe na:

```asm
ADD x1, x1, x2
```

Predlog šta reći:

> Step izvršava tačno jednu instrukciju. PC se podrazumevano povećava za četiri bajta, a
> marker se pomera pomoću `sourceLine` podatka sa asemblirane instrukcije. Prikazuju se samo
> registri u koje je pisano.

Napomena: `x1` treba da bude prikazan iako mu je vrednost nula, jer UI pamti da je u njega
pisano. To je dobar detalj za pokazivanje.

### 5. Postaviti breakpoint u petlji

Dok marker stoji na `ADD`, kliknuti na tu liniju ili pritisnuti **Breakpoint**. Pojaviće se
crvena tačka.

Zatim pritisnuti **Run**.

Pošto je program već zaustavljen pred tom instrukcijom, Run je prvo izvršava. Zatim izvršava
ostatak iteracije, grana se nazad i zaustavlja pred sledećim izvršavanjem iste `ADD`
instrukcije.

Očekivano stanje posle prvog zaustavljanja:

```text
x1 = 1
x2 = 2
x3 = 6
```

Predlog šta reći:

> Breakpoint se proverava na sledećoj instrukciji posle izvršenog koraka. Zato Run može da
> nastavi sa linije na kojoj program već stoji, a breakpoint se ponovo aktivira kada se
> petlja vrati na nju.

### 6. Nastaviti do istog breakpointa

Još jednom pritisnuti **Run**.

Očekivano:

```text
x1 = 3
x2 = 3
x3 = 6
```

Time se jasno vidi da isti breakpoint radi u svakoj iteraciji petlje.

### 7. Ukloniti breakpoint i završiti program

Dok je marker ponovo na `ADD`, pritisnuti **Breakpoint** da se tačka ukloni. Zatim pritisnuti
**Run**.

Na kraju očekivati:

```text
x1 = 15
x2 = 6
x3 = 6
memorija 0000 = 0000000F (15)
```

Predlog šta reći:

> Run sada prolazi do kraja programa. `SW` upisuje zbir na adresu nula, pa se memorijska
> reč prikazuje heksadecimalno i decimalno. Program se završava kada PC dođe iza poslednje
> instrukcije.

### 8. Pokazati Reset

Pritisnuti **Reset**.

Očekivano:

- marker se vraća na prvu instrukciju;
- registri se brišu;
- memorija se briše;
- program ostaje učitan;
- breakpointi bi ostali sačuvani da ih nismo uklonili.

Predlog šta reći:

> Reset menja samo stanje procesora. Učitani program ostaje isti, pa može ponovo da se
> izvrši bez vraćanja u editor.

### 9. Pokazati grešku pri asembliranju

Pritisnuti **Izmeni** i privremeno zameniti jednu instrukciju, na primer:

```asm
MULT x1, x2, x3
```

Pritisnuti **Asembliraj**.

Očekivano:

```text
Linija N: nepoznata instrukcija 'MULT'
```

Predlog šta reći:

> Parser može da pročita oblik ove linije, ali asembler prijavljuje da instrukcija nije u
> podržanom skupu. Dok postoji greška, aplikacija ne prelazi u režim izvršavanja.

Nakon demonstracije nije potrebno popravljati kod; može se ponovo izabrati ugrađeni primer.

---

## Kraća demonstracija od dva minuta

Ako je vreme ograničeno:

1. izabrati **Zbir brojeva 1-5**;
2. pritisnuti Asembliraj;
3. uraditi tri Step koraka;
4. postaviti breakpoint na `ADD`;
5. pritisnuti Run i pokazati zaustavljanje;
6. ukloniti breakpoint;
7. pritisnuti Run i pokazati rezultat 15 u memoriji.

U toj verziji preskočiti Reset i namernu grešku.

## Rezervni primeri

Ako komisija traži dodatnu funkcionalnost:

| Pitanje ili zahtev | Primer koji treba otvoriti |
|---|---|
| Pokažite bitovske operacije | Aritmetika i logika |
| Pokažite `LW`, `SW` i offset | Rad sa memorijom |
| Pokažite poziv funkcije | Funkcija i grananje |
| Pokažite pseudo-instrukcije | Aritmetika i logika ili Funkcija i grananje |
| Pokažite povratak iz funkcije | Funkcija i grananje |

### Očekivani rezultati rezervnih primera

**Aritmetika i logika**

```text
x3  = 17   ADD
x4  = 7    SUB
x5  = 4    AND
x6  = 13   OR
x7  = 9    XOR
x9  = 20   SLL
x10 = 3    SRL
x11 = 17   MV
```

**Rad sa memorijom**

```text
adresa 8  = 10
adresa 12 = 20
adresa 16 = 30
```

**Funkcija i grananje**

```text
x5 = 8     rezultat funkcije
x7 = 1     rezultat provere
memorija[0] = 8
memorija[4] = 1
```

---

## Ako demonstracija ne radi

Pre svega ostati miran i opisati očekivani tok. Najčešći tehnički problemi nisu problem
simulatora:

### Vite server nije pokrenut

U terminalu:

```bash
npm run dev
```

Zatim otvoriti adresu koju terminal prikaže.

### Port 5173 je zauzet

Vite će obično automatski ponuditi sledeći slobodan port. Treba otvoriti tačno adresu iz
terminala, a ne unapred upisanu adresu.

### Zavisnosti nisu instalirane

```bash
npm install
```

### Browser prikazuje staru verziju

Osvežiti stranicu pomoću `Ctrl+F5`.

### Nema vremena za rešavanje problema

Imati spreman video demonstracije i nekoliko slika:

- početni ekran;
- breakpoint u petlji;
- konačno stanje registara i memorije;
- primer poruke o grešci.

---

## Granice projekta

Ograničenja su svesno izabrani obim, a ne skriveni nedostaci.

### Podskup instrukcija

Podržano je 15 instrukcija:

```text
ADD, SUB, ADDI, AND, OR, XOR, SLL, SRL,
LW, SW, BEQ, BNE, BLT, JAL, JALR
```

Nisu podržane ostale RV32I instrukcije, množenje i deljenje, floating-point, sistemske
instrukcije, CSR registri ni privilegovani režimi.

### Nema binarnog enkodiranja

Asembler proizvodi tipizirane instrukcijske objekte, ne pravi RISC-V mašinski kod. CPU
izvršava semantiku instrukcija bez hardverskih faza fetch i decode.

### Ograničena pseudo-instrukcija `LI`

`LI` se prevodi samo u:

```asm
ADDI rd, x0, imm
```

Zato konstanta mora stati u 12-bitni signed immediate, od `-2048` do `2047`. Pravi RISC-V
asembler bi za veće vrednosti mogao da koristi više instrukcija, na primer `LUI` i `ADDI`.

### Samo registri `x0–x31`

ABI imena kao `zero`, `ra`, `sp`, `a0` i `t0` nisu podržana.

### Jednostavna sintaksa

Nisu podržane:

- direktive kao `.text`, `.data` i `.word`;
- simboličke konstante;
- izrazi u immediate operandima;
- više instrukcija u jednoj liniji;
- numerički cilj grane ili skoka.

### Memorija

- ima 4 KB;
- namenjena je podacima;
- odvojena je od niza instrukcija;
- `LW` i `SW` moraju biti poravnati na četiri bajta;
- nema keša, virtuelne memorije ni memorijski mapiranih uređaja.

### Izvršni model

- simulacija je na nivou instrukcija;
- nema pipeline-a, hazard-a ni taktova;
- nema prekida i izuzetaka RISC-V procesora;
- Run nije animiran;
- beskonačna petlja se procenjuje pomoću limita, ne formalnom analizom programa.

### UI i čuvanje rada

- editor je obična `textarea`, ne pun IDE editor;
- nema syntax highlighting-a ni automatskog dovršavanja;
- program se ne čuva trajno u browseru;
- nema uvoza i izvoza `.s` fajlova;
- stanje se gubi osvežavanjem stranice.

## Zašto su ograničenja prihvatljiva

Tema zahteva jednostavan editor, parser/asembler, Step, Run, breakpointe i prikaz registara
i memorije za dogovoreni skup instrukcija. Sve ove funkcije su implementirane.

Dodatne instrukcije, binarno enkodiranje, pipeline ili napredni editor mogu biti pravci
daljeg razvoja, ali nisu potrebni da bi se demonstrirali osnovni principi RISC-V
izvršavanja.

## Mogući pravci daljeg razvoja

1. podrška za kompletan RV32I skup;
2. `LUI` i puna pseudo-instrukcija `LI`;
3. ABI imena registara;
4. `.text`, `.data` i `.word` direktive;
5. prikaz binarnog i heksadecimalnog enkodiranja instrukcije;
6. uvoz i izvoz asemblerskih fajlova;
7. syntax highlighting i označavanje greške direktno u editoru;
8. podešavanje veličine i početne adrese memorije;
9. animirani Run sa kontrolom brzine;
10. prikaz pipeline faza kao posebna edukativna nadogradnja;
11. automatizovani browser testovi;
12. hostovana verzija kojoj se pristupa bez lokalne instalacije.

---

## Pitanja komisije i kratki odgovori

### 1. Šta je osnovni cilj aplikacije?

Da korisnik napiše program za dogovoreni podskup RISC-V instrukcija, asemblira ga i prati
izvršavanje kroz PC, registre i memoriju pomoću Step, Run i breakpoint kontrola.

### 2. Da li je ovo pravi RISC-V asembler?

Implementira sintaksnu i semantičku obradu, labele, pseudo-instrukcije i PC-relativne
pomeraje, ali ne emituje binarni mašinski kod. Rezultat je interna reprezentacija pogodna
za simulator.

### 3. Koja je razlika između parsera i asemblera?

Parser prepoznaje strukturu teksta. Asembler poznaje značenje instrukcija, proverava
operande i opsege, prevodi pseudo-instrukcije i razrešava labele.

### 4. Zašto asembler ima dva prolaza?

Zbog skokova na labele definisane kasnije. Prvi prolaz određuje adrese svih labela, a drugi
računa pomeraje i pravi instrukcije.

### 5. Kako se predstavlja jedna instrukcija?

Kao objekat sa poljima `op`, `rd`, `rs1`, `rs2`, `imm` i `sourceLine`. Neiskorišćena polja
imaju vrednost nula.

### 6. Zašto PC raste za četiri?

U modelu svaka instrukcija zauzima četiri bajta. PC je bajtovska adresa, pa su uzastopne
instrukcije na adresama 0, 4, 8 i tako dalje.

### 7. Kako rade grane?

Asembler čuva PC-relativni pomeraj. CPU proverava uslov i, ako je tačan, postavlja sledeći
PC na `pc + pomeraj`; inače ostaje podrazumevani `pc + 4`.

### 8. Zašto postoji `nextPc`?

Da `pc` ostane adresa trenutne instrukcije tokom njenog izvršavanja. Grane i skokovi menjaju
`nextPc`, koji tek na kraju postaje novi `pc`. To je važno za povratnu adresu `pc + 4`.

### 9. Kako rade `JAL` i `JALR`?

Obe instrukcije upisuju adresu naredne instrukcije u `rd`. `JAL` računa cilj relativno u
odnosu na PC, a `JALR` iz registra i immediate vrednosti i briše najniži bit cilja.

### 10. Kako radi `RET`?

`RET` je pseudo-instrukcija:

```asm
JALR x0, 0(x1)
```

Registar `x1` sadrži povratnu adresu, a `x0` znači da se ne čuva nova povratna adresa.

### 11. Kako je garantovano da je `x0` uvek nula?

Svaki upis prolazi kroz `setRegister`. Ako je odredište registar 0, metoda odmah završava
bez promene vrednosti.

### 12. Kako se simulira 32-bitno prelivanje?

Registri su `Int32Array`. Pri upisu se rezultat automatski svodi na signed 32-bitnu
vrednost.

### 13. Šta znači little-endian?

Najmanje značajan bajt višebajtne vrednosti nalazi se na najnižoj adresi. Na primer,
`0x12345678` se u memoriji čuva kao `78 56 34 12`.

### 14. Zašto `LW` i `SW` zahtevaju poravnanje?

Simulator modeluje 32-bitne reči od četiri bajta. Dozvoljene početne adrese reči zato su
deljive sa četiri.

### 15. Zašto su instrukcije i podaci odvojeni?

Program je niz instrukcijskih objekata, a podaci su niz bajtova. Ova Harvard organizacija
pojednostavljuje simulator i jasno odvaja izvršni program od podataka.

### 16. Kako radi breakpoint?

Breakpoint se čuva kao broj izvorne linije. Run posle svake instrukcije proverava da li
sledeća instrukcija pripada označenoj liniji i, ako pripada, staje pre njenog izvršavanja.

### 17. Zašto Run ne stane odmah ako već stoji na breakpointu?

Program je već pauziran pred tom instrukcijom. Novi Run znači nastavak, pa izvršava
trenutnu instrukciju. Ako se program kasnije vrati na istu liniju, breakpoint se ponovo
aktivira.

### 18. Kako sprečavate da beskonačna petlja zamrzne browser?

Run ima limit od 100.000 instrukcija. Ako do tada ne stigne do kraja, breakpointa ili
greške, izvršavanje se prekida uz poruku o mogućoj beskonačnoj petlji.

### 19. Kako se prijavljuju greške?

Parser i asembler vraćaju listu grešaka sa brojevima linija. CPU vraća status i poruku o
grešci. Očekivane greške korisničkog programa ne koriste JavaScript izuzetke.

### 20. Zašto se prikazuju samo neki registri?

Prikazuju se registri u koje je bar jednom pisano. Kratki programi koriste mali deo od 32
registra, pa je tako prikaz pregledniji. Registar ostaje vidljiv i ako mu se vrednost vrati
na nulu.

### 21. Kako biste dodali novu R-tip instrukciju?

Dodala bi se u `OpCode`, tabelu specifikacija asemblera i `switch` u CPU-u, a zatim bi se
dodao test njenog rezultata i graničnih slučajeva. TypeScript pomaže da se ne zaboravi
izvršna grana.

### 22. Kako biste dodali binarno enkodiranje?

Svakoj instrukciji trebalo bi pridružiti opcode, `funct3` i po potrebi `funct7`, zatim
rasporediti `rd`, `rs1`, `rs2` i immediate bitove prema RISC-V formatu. Simulator bi mogao
da prikazuje tu reč ili da uvede i fazu dekodiranja.

### 23. Zašto niste koristili React?

Interfejs ima mali broj elemenata i stanja. Običan DOM je dovoljan, lakši za objašnjenje i
ne uvodi dodatnu zavisnost koja nije važna za temu rada.

### 24. Šta su testovi konkretno otkrili?

M8 pregled je otkrio da je program koji se završi tačno na `maxSteps` ranije pogrešno
prijavljivao moguću beskonačnu petlju. Razmatranje breakpoint edge case-a dovelo je i do
jednostavnijeg i doslednijeg pravila za Run.

### 25. Koje je najvažnije ograničenje?

Simulator ne generiše binarni mašinski kod i podržava samo dogovoreni podskup instrukcija.
Ipak, u okviru tog podskupa modeluje registre, memoriju, PC, grane, skokove i 32-bitno
ponašanje.

### 26. Šta biste prvo dodali da imate više vremena?

Najpre kompletan RV32I skup i prikaz binarnog enkodiranja, jer su najbliži postojećoj
arhitekturi. Zatim ABI imena registara i direktive za podatke radi praktičnijeg pisanja
programa.

---

## Završna kontrolna lista za odbranu

- [ ] Projekat se pokreće i stranica se otvara.
- [ ] Glavni primer je vraćen u početno stanje.
- [ ] Znam očekivane vrednosti registara i memorije.
- [ ] Znam razliku između parsera, asemblera i CPU-a.
- [ ] Znam zašto asembler ima dva prolaza.
- [ ] Znam da objasnim `Int32Array`, `DataView`, little-endian i poravnanje.
- [ ] Znam da objasnim `pc`, `nextPc`, `JAL`, `JALR` i `RET`.
- [ ] Znam konačno pravilo breakpointa.
- [ ] Znam najvažnija ograničenja projekta.
- [ ] Imam lokalnu kopiju videa i rezervne slike demonstracije.
- [ ] Obaveštenja su isključena, a nepotrebni prozori zatvoreni.

## Završna poruka

Na kraju demonstracije dovoljno je reći:

> Aplikacija ispunjava sve osnovne zahteve teme: prihvata i asemblira dogovoreni podskup
> RISC-V jezika, izvršava program korak po korak ili do kraja i breakpointa, i tokom
> izvršavanja prikazuje registre i memoriju. Logika je odvojena od interfejsa i proverena
> sa 113 automatskih testova. Ograničenja, kao što su podskup instrukcija i izostanak
> binarnog enkodiranja, svesno su definisana kako bi projekat ostao jasan i pouzdan MVP.

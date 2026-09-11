# Kontekst projekta: RISC-V asembler i simulator (diplomski rad)

Ovaj fajl je kontekst za GitHub Copilot (ili bilo kog AI asistenta) koji mi pomaže da napravim diplomski rad. Pre pisanja ijedne linije koda, pročitaj ovo u celosti i drži ga se tokom celog rada na projektu.

## O meni i projektu

- Ovo je diplomski rad na osnovnim studijama. Mentor je prof. Uroš Radenković, koji predaje Arhitekturu i organizaciju računara.
- Rok je par nedelja od dobijanja teme — treba da prioritetizujemo ono što mora da radi, a ne da gubimo vreme na uglađivanje pre nego što osnovna funkcionalnost postoji.
- Nemam mnogo iskustva sa web razvojem. Ako predlažeš framework, biblioteku ili alat, ukratko objasni šta radi i zašto ga biramo — ne pretpostavljaj da već znam.
- Ovo je moj diplomski rad, ne samo projekat — moraću da ga objasnim i odbranim pred komisijom. To znači da kod treba da bude čitljiv, razumljiv i prokomentarisan, i da ja moram da razumem svaku odluku, ne samo da imam kod koji radi.

## Zadatak (tačan tekst dobijen od mentora mejlom)

Napraviti jednostavan editor za pisanje i izvršavanje asemblerskog koda za RISC-V arhitekturu. Aplikacija treba da ima:

- jednostavan parser i asembler "u pozadini" koji asemblerski kod prevodi u izvršive instrukcije
- mogućnost izvršavanja koda instrukciju po instrukciju (Step)
- mogućnost izvršavanja do breakpointa
- mogućnost izvršavanja celog programa odjednom (Run)
- prikaz sadržaja registara i memorije sa strane, koji se ažurira kako izvršavanje teče

## Skup instrukcija koje simulator mora da podrži

`ADD, SUB, ADDI, AND, OR, XOR, SLL, SRL, LW, SW, BEQ, BNE, BLT, JAL, JALR`

Napomena: mentor je u mejlu napisao "16 instrukcija" ali je nabrojao njih 15. Ovo treba proveriti sa mentorom pre nego što se smatra konačnim — moguće je da nedostaje jedna instrukcija sa spiska, ili je samo omaška u broju.

## Pseudo-instrukcije (moraju se prevoditi u instrukcije sa spiska iznad)

| Pseudo-instrukcija | Značenje | Prevodi se u |
|---|---|---|
| `LI rd, imm` | Učitaj konstantu u registar | `ADDI rd, x0, imm` |
| `MV rd, rs` | Kopiraj vrednost registra | `ADDI rd, rs, 0` |
| `NOP` | Ne radi ništa | `ADDI x0, x0, 0` |
| `J label` | Bezuslovni skok | `JAL x0, label` |
| `RET` | Povratak iz funkcije | `JALR x0, 0(x1)` |

## Referentni izgled interfejsa

U prilogu ovog fajla je slika `ui-mockup-reference.png` koju je poslao mentor kao smernicu za izgled (nije obavezujuća, samo ideja). Ukratko: prozor je podeljen na levi panel sa asemblerskim kodom (trenutna instrukcija koja se izvršava označena je sa `>`), i desni panel podeljen na "REGISTRI" (npr. `x1 00000005`, vrednosti u hex zapisu) i "MEMORIJA" (parovi adresa: vrednost, npr. `0000: 00000008`). Na dnu su dugmad: Run, Step, Reset, Breakpoint.

## Tehnologija — NIJE ODLUČENO, ne pretpostavljaj

Mentor je eksplicitno rekao da može biti web ili desktop aplikacija — izbor je na nama. Nemoj birati tehnologiju ili arhitekturu sam od sebe. Ovo je jedna od prvih stvari o kojima treba da odlučimo zajedno (vidi Fazu 0 ispod), imajući u vidu da nemam veliko iskustvo sa web razvojem i da imamo samo par nedelja.

## Kako želim da radimo (ovo je najvažniji deo)

**Faza 0 — Ključne odluke, pre bilo kakvog koda.** Pre nego što napišeš ijednu liniju koda, prolazimo zajedno kroz sve krucijalne odluke o projektu i eksplicitno se slažemo oko svake. Ovo uključuje minimum:

- web ili desktop aplikacija, i koji tačno stack/jezik/framework
- struktura projekta i organizacija fajlova
- tačna sintaksa asemblera koju parser mora da prihvati (labele, komentari, format immediate vrednosti, da li su registri case-sensitive, razmaci/zarezi)
- interna reprezentacija instrukcija i stanja procesora (registri, memorija, program counter)
- veličina memorije koju simuliramo i pravila adresiranja (byte-addressable, poravnanje za LW/SW)
- format prikaza registara (hex kao na mokapu, ili i dec/signed)
- kako se prijavljuju greške u asembliranju (npr. nepoznata instrukcija, loš operand, nedefinisana labela)

Ne predlaži kod dok ove odluke nisu eksplicitno zapisane i potvrđene.

**Faza 1 — Definisanje milestone-ova, pre početka rada.** Kada su odluke iz Faze 0 donete, zajedno definišemo redosled milestone-ova pre nego što počnemo da pišemo kod. Za svaki milestone treba jasno da stoji: cilj, tačan obim (šta ulazi, šta ne), i kriterijum da je gotov (definition of done). Dole je moj grubi predlog podele — nije konačan, prodiskutujmo ga i prilagodimo:

1. Setup projekta i osnovna struktura (na osnovu odluka iz Faze 0)
2. Parser/leksička analiza asemblerskog koda
3. Asembler — prevođenje parsiranog koda (uključujući pseudo-instrukcije) u internu reprezentaciju
4. Model izvršavanja: registri i aritmetičko-logičke instrukcije (ADD, SUB, ADDI, AND, OR, XOR, SLL, SRL)
5. Memorija i LW/SW
6. Kontrola toka: BEQ, BNE, BLT, JAL, JALR
7. UI — editor koda i prikaz registara/memorije uživo
8. Kontrole izvršavanja: Step, Run, Breakpoint, Reset, povezano sa UI
9. Testiranje na više test-programa, ivični slučajevi, poliranje
10. Priprema objašnjenja/dokumentacije za odbranu rada

**Faza 2 — Rad kroz milestone-ove, jedan po jedan.** Radimo striktno jedan milestone u datom trenutku. Kad je milestone gotov: testiramo da radi ispravno, čistimo i komentarišemo kod, i tek onda prelazimo na sledeći. Ne radi unapred na sledećim milestone-ovima i ne uvodi funkcionalnost van trenutnog dogovorenog obima bez da me pitaš.

**Kroz sve faze:**

- Kad god postoji više validnih pristupa ili nešto nije jasno iz specifikacije, pitaj me umesto da pretpostaviš.
- Objasni mi odluke i netrivijalan kod dovoljno da mogu da ga razumem i odbranim — cilj nije samo "radeći kod", nego kod koji ja stvarno razumem.
- Kod treba da bude čitljiv i prokomentarisan, jer je ovo akademski rad koji branim usmeno.

## Otvorena pitanja (proveriti sa mentorom ili odlučiti zajedno)

- Da li je zaista 15 ili 16 instrukcija (videti napomenu iznad)
- Tačna sintaksa asemblera koju treba podržati
- Da li treba prikaz binarnog enkodiranja instrukcije, ili je dovoljan assembly nivo
- Koliko memorije simulator treba da podržava

## Ograničenje

Rok je par nedelja. Prioritet je da radi kompletan, ispravan MVP koji ispunjava SVE zahteve mentora — dodatne funkcionalnosti (lepši UI, dodatne instrukcije, itd.) dolaze na red tek ako ostane vremena.

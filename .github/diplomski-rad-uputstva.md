# Pravila za pripremu i pisanje diplomskog rada

## Status i izvori pravila

- Korisnica je 28.09.2026. potvrdila: Word šablon ima prednost; PDF služi
  samo za dopunske savete koji nisu u sukobu sa šablonom.
- Naknadno je prenela izričit zahtev mentora da rad ima BAREM 25 strana.
  Taj zahtev ima prednost nad preporukom šablona o najviše 20 numerisanih
  strana. Ostala pravila šablona ostaju na snazi.
- Glavni izvor: [Šablon za pisanje završnog rada](<../../../Šablon za pisanje završnog rada.docx>).
- Dopunski izvor: [Uputstvo za pisanje studentskih radova](<../../../uputstvo za pisanje diplomskog.pdf>),
  Milan Bjelica i Predrag Pejović, 2011. PDF sadrži i LaTeX uputstva;
  ona se ne primenjuju na izradu ovog Word dokumenta.
- Relativne putanje odgovaraju trenutnom rasporedu direktorijuma. Dokumenti
  nisu deo repozitorijuma. Ako nisu dostupni, zatražiti originale od korisnice.
- Korisnica je 28.09.2026. odobrila sadržaj sa osam poglavlja i predloženim
  potpoglavljima navedenim ispod. Dogovor o sadržaju više ne blokira pisanje.
- Potvrđeno pismo je srpska latinica sa dijakriticima: č, ć, š, ž, đ.
  Nazive tehnologija, instrukcije i identifikatore iz koda pisati u izvornom
  obliku. Objašnjenja pisati na srpskom; nazive konkretnih kontrola aplikacije
  navoditi onako kako se prikazuju u interfejsu.
- Konačan naslov, podaci za naslovnu stranu i uključivanje zahvalnice
  još nisu dogovoreni. Ne preuzimati imena, zvanja i godinu iz primera šablona.
  Ovi podaci ne blokiraju pripremu glavnog teksta, ali moraju biti razrešeni
  pre završne verzije dokumenta.

## Trenutno stanje pisanja

- Rad se piše poglavlje po poglavlje, uz pregled korisnice pre nastavka.
- Korisnica je 28.09.2026. odobrila uvod. Ne menjati njegov tekst bez dogovora.
- Korisnica je odobrila drugo poglavlje posle jezičkih izmena i dodavanja
  razmaka posle tabele. Prva dva poglavlja ne menjati bez novog dogovora.
- Na naknadni zahtev korisnice naslov 2.4 promenjen je u
  „Poređenje sa razvijenim simulatorom”; sadržaj odeljka nije menjan.
- Korisnica je odobrila treće poglavlje nakon preciziranja izraza za osnovni
  skup instrukcija i zamene pominjanja elektronskog kola opisom hardverske
  realizacije procesora. Prva tri poglavlja ne menjati bez novog dogovora.
- Korisnica je 29.09.2026. prihvatila sadržaj četvrtog poglavlja uz zahteve
  da se objasni opcija strict, prirodnije poveže rečenica o CSS klasama i
  pojasni razlika između pripreme aplikacije i obrade unetog RISC-V programa.
  Izmene su primenjene, proverene i odobrene; poglavlje zauzima strane 9–10.
- Pripremljeno je peto poglavlje sa svih osam dogovorenih potpoglavlja,
  2 originalna dijagrama i 4 isečka stvarnog koda. Korisnica je prihvatila
  sadržaj uz zahtev da se pojasni izraz listing i ispravi red reči u
  „imena labela se ne menjaju”. Ranija pominjanja prikaza koda uskladiti
  sa tim pojašnjenjem; ostali tekst ne menjati. Izmene su primenjene
  i proverene u Word dokumentu i PDF-u.
- Glavni dokument: [Diplomski-rad.docx](../docs/diplomski-rad/Diplomski-rad.docx).
- Pregled za čitanje: [Diplomski-rad.pdf](../docs/diplomski-rad/Diplomski-rad.pdf).
- Dokument trenutno sadrži prvih pet poglavlja i 11 referenci.
  Naslovna strana, sadržaj i poglavlja 6–8 još nisu uneti; primeri i instrukcioni tekst
  originalnog šablona nisu deo radne verzije.
- Posle dodavanja petog poglavlja prelom je proveren u Microsoft Word-u:
  uvod zauzima strane 1–2, drugo poglavlje strane 3–5, treće poglavlje
  strane 6–8, četvrto poglavlje strane 9–10, peto poglavlje strane 11–18,
  a reference su na zasebnoj nenumerisanoj devetnaestoj strani.
  Prva četiri poglavlja sačuvana su, osim naknadno zatraženog usklađivanja
  izraza za prikaz koda u drugom i četvrtom poglavlju.
  To nije provera obima celog budućeg rada.
- Tabela 1 je u celini na strani 5, u formatu tabele preuzetom iz šablona,
  sa natpisom iznad i automatskom unakrsnom referencom u prethodnom pasusu.
- Tabela 2 (5 pseudo-instrukcija i njihovi prevodi) cela je na strani 7,
  sa automatskim natpisom i unakrsnom referencom. Obe tabele imaju 6 pt
  razmaka pre narednog pasusa.
- Slika 1 je na strani 12, Slika 2 na strani 13. Originalni dijagrami:
  [arhitektura.png](../docs/diplomski-rad/slike/arhitektura.png) i
  [tok-asembliranja.png](../docs/diplomski-rad/slike/tok-asembliranja.png).
  Centrirani su, široki najviše 80% prostora za tekst i imaju proverenu
  efektivnu rezoluciju oko 887 dpi.
- Segmenti izvornog koda 1–4 nalaze se redom na stranama 14–17:
  tip Instruction, funkcija assemble, deo metode step i petlja metode run.
  Kod je tekst u okviru preuzetom iz Word šablona, stilom Kod;
  svaki kompletan isečak provereno je na jednoj strani.
  Slike i kod imaju natpise ispod i automatske unakrsne reference u tekstu.
- Definicije stilova, numeracije, teme i fontova preuzete su bez izmene
  iz originalnog šablona. Sačuvani su format stranice, margine i odvojene
  sekcije za glavni tekst i reference. Originalni šablon nije menjan.
- Uvod koristi jednu proverenu referencu: RISC-V International,
  The RISC-V Instruction Set Manual, Volume I: Unprivileged Architecture,
  izdanje 20260120, odeljak Introduction: RISC-V ISA Overview,
  https://docs.riscv.org/reference/isa/v20260120/unpriv/intro.html
  (pristupljeno 28.09.2026.).
- Izvori drugog poglavlja, pristupljeno 28.09.2026.:
  [2] https://github.com/TheThirdOne/rars;
  [3] https://github.com/TheThirdOne/rars/blob/master/src/help/Debugging.html;
  [4] https://github.com/kvakil/venus;
  [5] https://venus.kvakil.me/.
  Pregled obuhvata izvorni kvakil/venus i njegovu veb aplikaciju, ne druge
  izvedene verzije. Poređenje je dokumentaciono, bez tvrdnji o izmerenoj
  brzini, usaglašenosti sa standardom ili tome koliko alat pomaže u učenju.
- Treće poglavlje koristi i izvor [6]: RISC-V International,
  The RISC-V Instruction Set Manual, Volume I: Unprivileged Architecture,
  izdanje 20260120, RV32I Base Integer Instruction Set, Version 2.1,
  https://docs.riscv.org/reference/isa/v20260120/unpriv/rv32.html
  (pristupljeno 28.09.2026.). Provereni su registri, instrukcije, redosled
  bajtova i pravila poravnanja; numerički primeri dodatno su proračunati.
- Treće poglavlje jasno odvaja RISC-V specifikaciju od izbora simulatora:
  4096 bajtova, little-endian, obavezno poravnanje LW/SW, odvojen program,
  interna reprezentacija i ograničenje LI na opseg od -2048 do 2047.
- Izvori četvrtog poglavlja, pristupljeno 28.09.2026.:
  [7] https://www.typescriptlang.org/docs/handbook/2/basic-types.html;
  [8] https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model;
  [9] https://vite.dev/guide/features.html;
  [10] https://vitest.dev/guide/.
  Uloge alata i razlozi izbora provereni su prema konfiguraciji, kodu,
  razvojnim odlukama i dokumentaciji. Nisu navedene neproverene verzije alata
  ni novi rezultati testiranja.
- Četvrto poglavlje razlikuje prevođenje TypeScript-a u JavaScript, statičku
  proveru tipova, testove ponašanja i asembliranje korisničkog RISC-V programa.
  Vite sam ne proverava tipove; projektna build komanda prvo pokreće tsc --noEmit.
- Izvor [11], dodat u petom poglavlju: MDN Web Docs, JavaScript typed arrays,
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays
  (pristupljeno 29.09.2026.).
- Peto poglavlje opisuje stvarno ponašanje, čak i kada stariji dnevnici
  daju pojednostavljen opis: Run poredi registre pre i posle cele akcije,
  ne ističe svaku međupromenu; Step posle uspešne poslednje instrukcije
  vraća ok, a naredni poziv halted; Reset ne asemblira ponovo program.
- Pri nastavku prvo pročitati postojeći Word dokument i uključiti eventualne
  korisničke izmene; ne prepisivati ga slepo iz ranijih radnih izvora.

## Dodatne smernice mentora

Korisnica je prenela sledeću poruku mentora:

> У ворд документу је све подешено па само ту убаците текст, такође
> испоштујте како се наводе слике, табеле и референце. Рад треба да има
> бар 25 страна, прикажите лепо у раду симулатор сликама и неки део
> имплементације са исечцима програмског кода, писање није тешко,
> биће то како треба.

- Obavezno prikazati simulator sopstvenim snimcima ekrana i objasniti
  šta svaki od njih pokazuje.
- Obavezno uključiti odabrane isečke stvarnog izvornog koda, uz objašnjenje
  njihove uloge i netrivijalnih odluka; ne prepisivati cele datoteke.
- Obim povećati sadržajem relevantnim za temu, ne većim fontovima,
  proredom, praznim prostorom, ponavljanjem ili dekorativnim slikama.
- Mentorova poruka ne precizira da li se 25 strana odnosi na ceo dokument
  ili numerisani deo. Korisnica je prihvatila plan od oko 27 strana od uvoda
  do zaključka, kako minimum ne bi zavisio od brojanja naslovne strane,
  sadržaja i referenci. To je dogovoreni ciljni obim, ne dodatni zahtev mentora.

## Odobreni sadržaj i raspodela prostora

Brojevi strana su okvirni i uključuju slike, tabele, dijagrame i isečke koda.
Stvarni obim zavisi od preloma u originalnim Word stilovima.

### 1. Uvod — oko 2 strane

- Motivacija, predmet i problem rada.
- Ciljevi i obim simulatora.
- Pristup izradi, pregled ostvarenog rešenja i organizacija rada.

### 2. Pregled postojećih rešenja — oko 3 strane

- 2.1. Kriterijumi izbora i poređenja
- 2.2. RARS
- 2.3. Venus
- 2.4. Poređenje sa razvijenim simulatorom

Porediti proverene mogućnosti i namenu, bez neosnovanih tvrdnji da je
razvijeni simulator bolji od postojećih alata.

### 3. Teorijske osnove RISC-V arhitekture i simulacije — oko 3 strane

- 3.1. RISC-V i pojam arhitekture skupa instrukcija
- 3.2. Registri, programski brojač i memorija
- 3.3. Grupe podržanih instrukcija i pseudo-instrukcije
- 3.4. Uloga parsera, asemblera i simulatora

Uključiti samo teoriju potrebnu za razumevanje implementacije.
Ne uvoditi posebno poglavlje o istoriji računara.

### 4. Korišćene tehnologije i razvojni alati — oko 2 strane

- 4.1. TypeScript
- 4.2. HTML, CSS i neposredan rad sa DOM-om
- 4.3. Vite i razvojno okruženje
- 4.4. Vitest i provera tipova

Objasniti ulogu i razlog izbora, bez opšteg kursa veb programiranja.

### 5. Projektovanje i implementacija sistema — oko 8 strana

- 5.1. Zahtevi i granice sistema
- 5.2. Arhitektura i tok podataka
- 5.3. Interna reprezentacija programa i stanja procesora
- 5.4. Sintaksna analiza asemblerskog koda
- 5.5. Dvoprolazni asembler i prevođenje pseudo-instrukcija
- 5.6. Izvršavanje instrukcija, memorija i kontrola toka
- 5.7. Kontrole izvršavanja i breakpointi
- 5.8. Povezivanje modela sa korisničkim interfejsom

Ovo je centralno poglavlje. Uključiti arhitektonski dijagram, tok obrade
programa i odabrane kratke isečke implementacije sa objašnjenjima.

### 6. Funkcionalnosti i primer korišćenja — oko 4 strane

- 6.1. Izgled aplikacije i režimi rada
- 6.2. Unos i asembliranje programa
- 6.3. Izvršavanje korak po korak
- 6.4. Run, breakpointi i Reset
- 6.5. Prikaz registara, memorije i grešaka

Koristiti povezan primer izvršavanja, poput zbira brojeva od 1 do 5,
sa snimcima unosa, koraka, breakpointa i rezultata. Prikazati i grešku.
Ovde objasniti korisničko ponašanje, a ne ponavljati implementacioni opis.

### 7. Testiranje i analiza rezultata — oko 3 strane

- 7.1. Strategija i organizacija testiranja
- 7.2. Testiranje parsera i asemblera
- 7.3. Testiranje modela procesora i graničnih slučajeva
- 7.4. Ručna provera korisničkog interfejsa
- 7.5. Rezultati i ograničenja provere

### 8. Zaključak — oko 2 strane

- Ostvareni ciljevi i najvažnije odluke i izazovi.
- Ograničenja i moguća unapređenja, jasno odvojena od postojećih mogućnosti.

Ispred glavnog teksta nalaze se naslovna strana, eventualna zahvalnica i
sadržaj; iza glavnog teksta reference, u skladu sa šablonom.
Bitne promene odobrenog sadržaja ponovo dogovoriti sa korisnicom.

## Vrsta rada i obim

- Tema je razvojno-implementaciona: editor, asembler i simulator za podskup
  RISC-V instrukcija. Nije eksperimentalno istraživanje nove arhitekture procesora.
- Šablon za ovakve teme predlaže: Uvod, Pregled postojećih rešenja,
  Pregled korišćenih tehnologija, Implementacioni detalji, Funkcionalnosti
  i Zaključak. Nazivi i podela poglavlja dogovaraju se sa mentorom.
- Uvod i zaključak imaju strogo po 1–2 strane.
- Mentor zahteva barem 25 strana. Ne primenjivati staru preporuku šablona
  o najviše 20 numerisanih strana. Obim obuhvata tekst, slike i tabele;
  konačan broj proveriti u stvarnom prelomu u Word-u/PDF-u.
- Numerisanje počinje od uvoda i traje zaključno sa poslednjim poglavljem.
- Reference su na poslednjoj, zasebnoj, nenumerisanoj strani.
- Dodatna objašnjenja, opširni listinzi, uputstva i slike koji nisu suština
  rada ostaju u zasebnom dokumentu, a ne služe za povećavanje obima rada.
- Zahvalnica je opciona i ne sme biti duža od jedne strane.
- Ne dodavati automatski sažetak, ključne reči, spiskove slika i tabela ili
  priloge samo zato što ih PDF pominje. Njih nema u Word šablonu;
  uključivanje treba posebno dogovoriti.

## Word: isključivo postojeći stilovi i format

Rad izrađivati u kopiji dostavljenog DOCX šablona, ne prepisivanjem teksta
u novi prazan dokument. Original sačuvati neizmenjen.

| Namena | Postojeći naziv stila |
|---|---|
| Naslovna strana | `Naslovna`, `Naslovna (naslov)` |
| Naslovi tri nivoa | `Poglavlje 1`, `Poglavlje 2`, `Poglavlje 3` |
| Nenumerisani naslov | `Poglavlje (nenumerisano)` |
| Osnovni tekst | `Osnovni tekst` |
| Neuvučen tekst | `Osnovni tekst (neuvučen)` |
| Natpisi | `Natpis` |
| Tekst u tabelama | `Tekst (tabela)` |
| Izvorni kod | `Kod` |
| Jednačine | `Jednačina` |
| Literatura | `Reference` |
| Automatski sadržaj | `toc 1`, `toc 2`, `toc 3` |

- Ne uvoditi nove stilove, fontove, margine, prored ili dekoraciju.
  Sačuvati definicije stilova, numeraciju i format stranice iz šablona.
- Ne prelaziti treći nivo naslova. Šablon dopušta razmatranje dodatnog
  stila, ali korisnica izričito traži samo postojeće stilove.
- Svako glavno poglavlje počinje na novoj stranici. Između naslova
  poglavlja i prvog potpoglavlja mora postojati uvodni tekst.
- Tekst deliti u smislene kraće pasuse, okvirno po tri rečenice;
  izbegavati dugačke, nepregledne pasuse.
- Za liste koristiti postojeće formate lista iz šablona, ne ručno kucane
  brojeve i crtice kao zamenu za Word numeraciju.
- Automatski sadržaj, numeraciju i unakrsne reference ažurirati pre izvoza.
  Sačuvati razdvajanje numerisanih i nenumerisanih sekcija.

## Slike, tabele, kod i jednačine

- Svaki objekat pomenuti i referisati u tekstu neposredno pre njegovog prikaza.
- Tabele postavljati bez uvlačenja, u punoj raspoloživoj širini teksta.
  Natpis je IZNAD tabele.
- Korisnica je zatražila vizuelni razmak između tabele i narednog teksta.
  Koristiti 6 pt razmaka pre prvog pasusa posle tabele, bez praznih pasusa
  i bez menjanja definicija postojećih stilova.
- Slike i grafikone postavljati u neuvučen red, horizontalno centrirano;
  šablon navodi širinu do 80% širine stranice. Ne prelaziti prostor između
  margina. Natpis je ISPOD slike ili grafikona.
- Koristiti sopstvene čitljive dijagrame i snimke aplikacije.
  Ne preuzimati tuđe ilustracije bez odgovarajućeg prava korišćenja i izvora.
- Kod/pseudokod je tekst unutar okvira, ne fotografija koda. Koristiti
  stil `Kod`, punu raspoloživu širinu, neuvučen i horizontalno centriran
  okvir. Jedan segment se ne prostire preko više strana.
  Natpis je ISPOD segmenta.
- Jednačine praviti Microsoft Equation editorom, stilom `Jednačina`,
  u neuvučenom i horizontalno centriranom redu. Natpis je ISPOD jednačine.
- Ne ubacivati objekte samo radi dekoracije ili povećavanja broja strana.

## Literatura i akademski stil

### Jezičke smernice potvrđene posle pregleda teksta

- Korisnica želi prirodan, jasan i stručan srpski, a ne rečenice koje zvuče
  kao doslovan prevod sa engleskog. Primenjivati ovu smernicu pri pisanju
  i pri završnom čitanju svakog narednog poglavlja.
- Prednost dati konkretnom opisu radnje i ulozi korisnika: npr.
  „Na kartici Editor korisnik piše program”, umesto apstraktnog
  „Interfejs razdvaja unos programa u prikazu Editor”.
- Koristiti „bitski”, „bitska”, „bitske”, „bitskih” i odgovarajuće oblike,
  ne „bitovski” i njegove oblike. Ovo važi i za tekst, natpise i tabele.
- Izbegavati izraze „obrazovni učinak” i „obrazovno uspešniji”.
  Prema smislu rečenice pisati „koliko alat pomaže u učenju”,
  „da li korisnicima olakšava razumevanje gradiva” ili drugi prirodan izraz.
  Ne menjati tehničko značenje niti tvrditi korist koja nije ispitana.
- Povezane brojčane podatke pisati dosledno, prvenstveno ciframa:
  „15 instrukcija i 5 pseudo-instrukcija”, ne mešati „15” i „pet”
  u istom nabrajanju. To nije zahtev da se svi brojevi u prozi pišu ciframa.
- Preferirati „način pokretanja alata” kada se opisuje kako se alat pokreće.
  Stručni izraz „razvojno okruženje” zadržati tamo gde je zaista potreban.
- Pri objašnjavanju osnovnog skupa koristiti jasan izraz „osnovni skup
  instrukcija za rad sa celim brojevima”, ne neodređeno „osnovni celobrojni
  skup”. Kada se ISA razlikuje od implementacije, govoriti o načinu na koji
  je procesor hardverski realizovan, a ne o „konkretnom elektronskom kolu”.
- Podešavanja poput strict pri prvom pominjanju objasniti kroz njihovu
  svrhu: to je opcija za strožu proveru TypeScript tipova tokom razvoja,
  a ne režim rada simulatora.
- Kada se govori o prevođenju, jasno navesti koji se kod obrađuje:
  Vite prevodi TypeScript kod aplikacije u JavaScript; asembler u već
  pokrenutoj aplikaciji obrađuje RISC-V tekst unet u editor. Korisnički
  program se asemblira i simulira u pregledaču, ne na Vite serveru.
- Umesto neobjašnjenog termina listing koristiti „prikaz izvornog koda”
  ili „prikaz programa”, prema kontekstu. To je prikaz celog koda po redovima,
  ne jedna linija niti samo lista izvršivih instrukcija; naš prikaz sadrži
  i komentare i labele, brojeve linija, marker i tačke prekida.
  U režimu izvršavanja taj prikaz ne može da se uređuje.
- U odgovarajućoj rečenici koristiti prirodniji red reči „imena labela
  se ne menjaju”, umesto „imena labela ne menjaju se”.
- Ostatak prihvaćenog teksta ne prepravljati nepotrebno; iste jezičke
  primedbe primeniti dosledno na sva njihova pojavljivanja u radu.

### Citiranje i organizacija izlaganja

- Izvore navoditi brojevima u uglastim zagradama: [1], [2-4], [5] [7].
  Reference numerisati arapskim brojevima od 1.
- U bibliografskim opisima dosledno koristiti jedan format dopušten
  šablonom. Za knjige navesti autore, naslov, izdavača i godinu.
  Za veb izvore navesti URL, naziv stranice i stvarni datum pristupa.
- Citirati proverene i pročitane izvore. Prednost imaju RISC-V specifikacija,
  originalna dokumentacija alata i relevantna stručna literatura.
- Ne izmišljati bibliografske podatke, rezultate merenja, citate,
  istraživačku novinu ili prednosti nad drugim simulatorima.
- Ne prevoditi i prepisivati tuđe radove. Relevantne ideje sažeti
  sopstvenim rečima uz referencu.
- Pisati precizno, jednostavno i formalno; objasniti skraćenice pri prvom
  pojavljivanju. Izbegavati suvišnu istoriju računara i opšta mesta.
- Uvod objašnjava predmet, motivaciju, problem, ciljeve, način rada,
  glavne rezultate i organizaciju teksta.
- Zaključak povezuje rezultate sa ciljevima, navodi ograničenja,
  moguću primenu i realne pravce unapređenja.

## Veza sa projektom

- Projektni Markdown dokumenti su izvor materijala, ne gotova poglavlja.
  Organizovati rad tematski, a ne po milestone-ovima.
- Opisivati stvarnu implementaciju. Pre tehničkih tvrdnji proveriti
  odgovarajući kod i testove, ne oslanjati se isključivo na stare dnevnike.
- Jasno razlikovati podskup RV32I od potpune implementacije standarda,
  internu reprezentaciju od binarnog mašinskog koda i model izvršavanja
  instrukcija od simulacije mikroarhitekture.
- Broj od 113 testova potiče iz postojeće dokumentacije; ponovo proveriti
  aktuelne rezultate pre navođenja kao rezultata završnog rada.
- Funkcionalna ispravnost, pokrivenost koda, brzina i obrazovna korisnost
  nisu ista stvar. Ne tvrditi izmerenu pokrivenost, performanse ili
  poboljšanje učenja ako takva evaluacija nije sprovedena.
- Ne menjati aplikaciju radi pisanja rada bez dogovora sa korisnicom.

## Provera pre predaje

1. Korisnica je odobrila sadržaj i pročitala tekst; sadržaj je usaglašen
   sa mentorom kada je to potrebno.
2. Tehničke tvrdnje odgovaraju kodu i proverenim rezultatima.
3. Sve pozajmljene tvrdnje imaju odgovarajuće reference.
4. Koriste se isključivo postojeći stilovi i format originalnog šablona.
5. Uvod i zaključak imaju po 1–2 strane; rad ispunjava mentorov minimum
   od 25 strana i dogovoreni način brojanja, bez veštačkog povećavanja obima.
6. Poglavlja, natpisi, numeracija, sadržaj i prelomi su provereni u
   stvarno renderovanom dokumentu, ne samo pregledom DOCX XML-a.
7. Reference su na zasebnoj nenumerisanoj završnoj strani.
8. Uklonjeni su primeri i instrukcioni tekst šablona; provereni su jezik,
   pravopis, čitljivost slika i podaci na naslovnoj strani.

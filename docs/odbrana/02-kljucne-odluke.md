# 2. Ključne tehničke odluke

Ovaj dokument objašnjava najvažnije odluke donete tokom razvoja, razloge za njih i
alternative koje nisu izabrane. Na odbrani nije dovoljno reći samo *šta* je korišćeno;
važno je pokazati da je odluka bila svesna i prilagođena obimu projekta.

## Kratak pregled

| Oblast | Odluka |
|---|---|
| Vrsta aplikacije | web aplikacija koja radi u browseru |
| Jezik i alat | TypeScript i Vite |
| UI | običan DOM, bez frameworka |
| Arhitektura | `core/` je potpuno odvojen od UI-ja |
| Obrada koda | zasebni parser i asembler |
| Labele | asembler sa dva prolaza |
| Simulacija | nivo instrukcija, bez binarnog enkodiranja |
| Registri | `Int32Array(32)`, centralizovan upis, `x0` je uvek nula |
| Memorija | `Uint8Array(4096)`, little-endian, poravnanje na četiri bajta |
| Programski brojač | bajtovska adresa, instrukcije su udaljene četiri bajta |
| Greške | eksplicitni rezultati, bez izuzetaka za očekivane greške |
| UI režimi | odvojeni režim pisanja i režim izvršavanja |

---

## 1. Web aplikacija umesto desktop aplikacije

### Odluka

Aplikacija radi u browseru. Korisniku su za lokalno pokretanje potrebni Node.js, instalacija
zavisnosti i jedna komanda za razvojni server.

### Zašto

- mentor ne mora da instalira poseban desktop program;
- aplikacija radi na različitim operativnim sistemima;
- browser već obezbeđuje editor, dugmad, događaje i alate za pregled;
- razvojni ciklus je brz: izmena koda se odmah vidi u browseru.

### Odbačena alternativa

Desktop aplikacija mogla bi da se napravi, na primer, pomoću Electron-a ili nekog native
frameworka. To bi uvelo pakovanje aplikacije, veći broj zavisnosti i dodatni sloj koji nije
važan za samu temu — parser, asembler i simulator.

### Kratak odgovor za odbranu

> Izabrala sam web aplikaciju zato što je jednostavna za pokretanje i demonstraciju, a
> tema rada nije desktop infrastruktura nego asembler i simulator. Browser mi je omogućio
> da najviše vremena posvetim core logici.

---

## 2. TypeScript i Vite

### Odluka

Cela aplikacija napisana je u TypeScript-u, sa uključenim strogim proverama tipova. Vite se
koristi kao razvojni server i build alat.

### Zašto TypeScript

Simulator ima više strogo definisanih struktura:

- četiri vrste operanada;
- 15 mogućih op-kodova;
- parsirane i asemblirane instrukcije;
- rezultate izvršavanja sa konačnim skupom statusa.

TypeScript proverava te oblike pre pokretanja programa. Na primer, diskriminisana unija
operanada sprečava da se polje immediate vrednosti pročita sa operanda registra.

U [`tsconfig.json`](../../tsconfig.json) uključeni su `strict`, `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch` i `noImplicitReturns`.

### Zašto Vite

Vite obezbeđuje:

- razvojni server;
- automatsko osvežavanje;
- prevođenje TypeScript-a;
- produkcioni build;
- minimalnu konfiguraciju.

### Odbačene alternative

- običan JavaScript ne bi pružio proveru strukture instrukcija i stanja;
- ručno podešavanje bundlera povećalo bi obim infrastrukturnog rada;
- složeniji full-stack framework nije potreban za aplikaciju bez servera i baze podataka.

### Kratak odgovor za odbranu

> TypeScript sam izabrala zato što tipovi rano otkrivaju greške u reprezentaciji operanada,
> instrukcija i rezultata izvršavanja. Vite samo obezbeđuje jednostavno pokretanje i build,
> bez uticaja na samu logiku simulatora.

---

## 3. Običan DOM umesto UI frameworka

### Odluka

UI je napravljen direktno pomoću HTML-a, CSS-a i DOM API-ja, bez React-a, Vue-a ili drugog
frameworka.

### Zašto

Interfejs ima mali broj elemenata:

- editor/listing programa;
- registre;
- memoriju;
- nekoliko dugmadi;
- status i listu grešaka.

Framework bi dodao sopstveni model komponenti, stanje i build pravila, dok bi korist za
ovako mali interfejs bila mala.

### Odbačena alternativa

React bi olakšao rad sa veoma velikim i složenim UI-jem, ali bi ovde predstavljao dodatnu
zavisnost i dodatnu temu za odbranu bez jasne koristi.

### Kratak odgovor za odbranu

> UI je dovoljno mali da se jasno izrazi običnim DOM kodom. Time sam izbegla nepotrebnu
> zavisnost i zadržala fokus na arhitekturi računara.

---

## 4. Odvajanje `core/` logike od UI-ja

### Odluka

Parser, asembler i CPU nalaze se u [`src/core/`](../../src/core/) i ne koriste browser API.
Kod za događaje i prikaz nalazi se u [`src/ui/`](../../src/ui/).

### Zašto

- core se testira bez browsera;
- UI ne može da menja pravila izvršavanja;
- lakše se utvrđuje kom sloju pripada greška;
- ista logika može kasnije da se koristi iz komandne linije ili desktop interfejsa.

### Odbačena alternativa

Sva logika mogla je da bude u jednom `main.ts` fajlu. To bi na početku bilo kraće, ali bi
mešalo parsiranje, izvršavanje, DOM događaje i iscrtavanje. Testovi bi tada morali da
pokreću browser okruženje.

### Kratak odgovor za odbranu

> Core modeluje RISC-V sistem, a UI je samo jedan način da se taj model koristi. Zato core
> nema nijednu zavisnost od DOM-a.

---

## 5. Parser i asembler su odvojene komponente

### Odluka

Parser proverava sintaksu i pravi strukturirane operande. Asembler poznaje skup instrukcija,
proverava semantiku, prevodi pseudo-instrukcije i razrešava labele.

### Podela odgovornosti

| Parser | Asembler |
|---|---|
| skida komentare | proverava da li instrukcija postoji |
| prepoznaje labelu i mnemonik | proverava broj i tip operanada |
| parsira registar, broj i memorijski operand | proverava opseg immediate vrednosti |
| prijavljuje neispravnu tekstualnu formu | proverava i razrešava labele |
| ne zna značenje instrukcije | prevodi pseudo-instrukcije |

### Zašto

Sintaksa i semantika su različiti nivoi obrade. Na primer, parser može ispravno da pročita:

```asm
MULT x1, x2, x3
```

ali tek asembler zna da `MULT` nije u podržanom skupu.

### Odbačena alternativa

Jedna velika funkcija mogla bi istovremeno da deli tekst i gradi instrukcije. Takav kod bi
bio teže testirati, a dodavanje instrukcije bi zahtevalo promene u sintaksnoj analizi.

### Kratak odgovor za odbranu

> Parser odgovara na pitanje „kako je linija napisana", a asembler na pitanje „šta ta
> linija znači i da li je dozvoljena".

---

## 6. Asembler sa dva prolaza

### Odluka

Asembler najpre prolazi kroz sve linije i gradi tabelu:

```text
ime labele -> adresa u bajtovima
```

U drugom prolazu prevodi instrukcije i računa PC-relativne pomeraje.

### Zašto

Kod skoka unapred ciljna labela još nije viđena:

```asm
BEQ x1, x0, kraj
ADDI x2, x2, 1
kraj:
```

U prvom prolazu saznaje se adresa `kraj`, a u drugom se računa:

```text
pomeraj = adresa labele - adresa instrukcije
```

### Važan detalj

Svaka podržana pseudo-instrukcija prevodi se u tačno jednu pravu instrukciju, pa ne menja
adrese narednih instrukcija. Kada bi `LI` mogla da se proširi na dve instrukcije, proširenje
bi moralo da se uzme u obzir pre računanja labela.

### Odbačena alternativa

Jedan prolaz je dovoljan samo ako nema skokova unapred ili ako se čuvaju nerešene reference
koje se naknadno popravljaju. Dva prolaza su za ovaj obim jasnija i odgovaraju načinu rada
pravih asemblera.

### Kratak odgovor za odbranu

> Dva prolaza su potrebna zbog forward reference labela. Prvi određuje adrese svih labela,
> a drugi, kada su sve poznate, pravi instrukcije i računa pomeraje.

---

## 7. Jedinstven oblik instrukcije

### Odluka

Svaka asemblirana instrukcija ima ista polja:

```ts
{ op, rd, rs1, rs2, imm, sourceLine }
```

Polja koja određena instrukcija ne koristi postavljaju se na nulu.

### Zašto

- CPU ima jedan jednostavan ulazni tip;
- izvršavanje se svodi na iscrpan `switch` po `op`;
- nema proveravanja različitih objekata za R, I, S, B i J format;
- `sourceLine` povezuje izvršavanje sa UI-jem.

### Odbačena alternativa

Mogla je da se koristi posebna TypeScript struktura za svaki format instrukcije. To bi bilo
strože modelovanje, ali bi povećalo broj tipova i grananja u malom simulatoru.

### Kratak odgovor za odbranu

> Izabrala sam uniformnu internu instrukciju jer simulator podržava mali skup op-kodova.
> Neiskorišćena polja su nula, a izvršna petlja ostaje pregledna.

---

## 8. Simulacija na nivou instrukcija

### Odluka

Asembler ne proizvodi pravi 32-bitni binarni mašinski kod. On proizvodi objekte koje CPU
direktno izvršava.

### Zašto

Zahtev projekta je editor sa asemblerom i simulatorom ponašanja instrukcija. Interni objekti
omogućavaju da se proveravaju:

- registri i 32-bitna aritmetika;
- memorija i little-endian raspored;
- grane, skokovi i PC;
- pseudo-instrukcije i labele.

Binarno enkodiranje bi bilo dodatna funkcionalnost koja ne menja rezultat izvršavanja ovog
simulatora.

### Odbačena alternativa

Pravi asembler bi generisao 32-bitne instrukcijske reči, a simulator bi morao ponovo da ih
dekodira. To bi bilo vernije hardveru, ali značajno šire od dogovorenog MVP-a.

### Kratak odgovor za odbranu

> Simulator modeluje semantiku instrukcija, ne fetch/decode hardverski put. Asembler zato
> daje tipizirane instrukcijske objekte umesto binarnog koda.

---

## 9. `Int32Array` za registre i centralizovan upis

### Odluka

Registri su predstavljeni kao:

```ts
new Int32Array(32)
```

Sve instrukcije upisuju vrednost kroz jednu metodu `setRegister`.

### Zašto `Int32Array`

Upis automatski zadržava donjih 32 bita. Zato se prelivanje ponaša kao u 32-bitnom
registru:

```text
2147483647 + 1 = -2147483648
```

### Zašto `setRegister`

Pravilo da je `x0` uvek nula nalazi se na jednom mestu. Metoda istovremeno beleži registre
u koje je pisano, kako bi ih UI prikazao.

### Odbačene alternative

- običan `number[]` zahtevao bi ručno 32-bitno odsecanje pri svakom upisu;
- posebna provera `rd !== 0` u svakoj instrukciji duplirala bi isto hardversko pravilo.

### Kratak odgovor za odbranu

> `Int32Array` prirodno daje 32-bitno ponašanje, a centralni `setRegister` garantuje da
> nijedna instrukcija ne može slučajno da promeni `x0`.

---

## 10. Byte-adresibilna little-endian memorija

### Odluka

Memorija je:

```ts
new Uint8Array(4096)
```

`LW` i `SW` pristupaju 32-bitnim rečima pomoću `DataView`, u little-endian poretku.

### Zašto

- `Uint8Array` direktno modeluje byte-adresibilnu memoriju;
- `DataView` čita i upisuje 32-bitne vrednosti nad istim bajtovima;
- eksplicitni argument `true` bira little-endian raspored;
- test može da proveri stvarni redosled četiri bajta.

Za vrednost `0x12345678` na adresi 0:

| Adresa | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Bajt | `78` | `56` | `34` | `12` |

Pristup mora biti poravnat na četiri bajta, a cela reč mora stati u opseg `0x000–0xFFF`.

### Odbačene alternative

- niz 32-bitnih reči bio bi jednostavniji, ali ne bi modelovao byte-adresiranje;
- ručno sklapanje četiri bajta pomoću bitovskih operatora bilo bi duže i podložnije grešci;
- jedinstvena memorija za instrukcije i podatke nepotrebno bi komplikovala interni model.

### Kratak odgovor za odbranu

> Memorija je niz bajtova jer su RISC-V adrese bajtovske. `DataView` nad tim nizom
> omogućava tačno little-endian čitanje i upis 32-bitnih reči.

---

## 11. PC je bajtovska adresa i koristi se `nextPc`

### Odluka

PC počinje od nule i podrazumevano raste za četiri. Tokom izvršavanja instrukcije trenutni
`pc` se ne menja; buduća vrednost se čuva u `nextPc`.

### Zašto

RISC-V instrukcije u ovom modelu zauzimaju četiri bajta. Grane i skokovi koriste
PC-relativne pomeraje u bajtovima.

`nextPc` omogućava sledeći redosled:

```text
nextPc = pc + 4
izvrši instrukciju
grana ili skok po potrebi promeni nextPc
pc = nextPc
```

Dok se izvršava `JAL` ili `JALR`, stari `pc` je i dalje dostupan za računanje povratne
adrese `pc + 4`.

### Odbačena alternativa

Direktno menjanje `pc` u različitim granama `switch` naredbe otežalo bi razlikovanje
trenutne i sledeće adrese i povećalo mogućnost greške kod povratne adrese.

### Kratak odgovor za odbranu

> `nextPc` predstavlja izlaz sledeće-PC logike. Podrazumevano je `pc + 4`, a grana ili skok
> ga menjaju pre nego što na kraju instrukcije postane novi PC.

---

## 12. Eksplicitni rezultati umesto izuzetaka

### Odluka

`step()` i `run()` vraćaju rezultat sa statusom:

```text
ok | halted | error | breakpoint
```

Greška pri izvršavanju vraća i poruku i broj izvorne linije.

### Zašto

Greška korisničkog programa nije neočekivana greška same aplikacije. Na primer, neporavnata
adresa je normalan ishod izvršavanja neispravnog asemblerskog programa i UI treba jasno da
je prikaže.

### Odbačena alternativa

Bacanje izuzetka (`throw`) prekinulo bi običan tok JavaScript-a i zahtevalo `try/catch` u
UI-ju. Izuzeci su prikladniji za neočekivane kvarove aplikacije nego za očekivane rezultate
simulacije.

### Kratak odgovor za odbranu

> Status izvršavanja je deo modela procesora. Zato ga vraćam eksplicitno, umesto da
> očekivanu grešku korisničkog programa predstavljam kao JavaScript izuzetak.

---

## 13. Sinhroni Run i limit instrukcija

### Odluka

Run izvršava program odjednom, bez animacije, sa podrazumevanim limitom od 100.000
instrukcija.

### Zašto

JavaScript u browseru izvršava ovaj kod u jednoj glavnoj niti. Program:

```asm
petlja:
J petlja
```

bez limita bi zamrznuo stranicu. Limit prekida izvršavanje i prijavljuje moguću beskonačnu
petlju.

### Odbačena alternativa

Animirano izvršavanje zahtevalo bi tajmere, asinhrono stanje, kontrole za pauzu i
usklađivanje iscrtavanja. To nije deo zahteva i povećalo bi složenost UI-ja.

### Kratak odgovor za odbranu

> Run je namerno sinhron i trenutan. Limit instrukcija je zaštita browsera od korisničkog
> programa sa beskonačnom petljom.

---

## 14. Breakpointi po izvornim linijama

### Odluka

Breakpointi se čuvaju kao skup brojeva linija u editoru. Run posle svake izvršene
instrukcije proverava da li sledeća instrukcija ima breakpoint.

### Zašto

Korisnik vidi i bira linije izvornog koda, ne interne adrese. Breakpoint na praznoj liniji,
komentaru ili samostalnoj labeli nije dozvoljen jer takva linija nema instrukciju na kojoj
izvršavanje može da stane.

Program je već zaustavljen pred tekućom instrukcijom. Zato novi Run najpre izvršava tu
instrukciju, a zatim proverava breakpoint sledeće. Time Step → Run i nastavak posle
breakpointa ne zahtevaju dodatno stanje.

### Odbačena alternativa

Provera breakpointa pre prvog koraka učinila bi da Run ponovo stane na istoj instrukciji
bez ikakvog napretka. To bi zahtevalo dodatno stanje samo da bi se isti breakpoint jednom
preskočio.

### Kratak odgovor za odbranu

> Breakpoint označava liniju na kojoj Run treba sledeći put da se zaustavi. Ako program već
> stoji pred tom linijom, Run znači „nastavi", pa izvršava trenutnu instrukciju.

---

## 15. Dva UI režima

### Odluka

Panel PROGRAM ima:

- režim pisanja — promenljiva `textarea`;
- režim izvršavanja — nepromenljiv listing sa brojevima linija, markerom i breakpointima.

### Zašto

Kod se ne može promeniti dok se izvršava. Time program, tabela labela, instrukcije,
`sourceLine` i breakpointi ostaju međusobno usklađeni.

### Odbačene alternative

- dva istovremena prikaza koda zauzimala bi prostor i prikazivala isti sadržaj dvaput;
- promenljiv editor tokom izvršavanja otvorio bi pitanje šta se dešava ako se obriše
  trenutna instrukcija;
- slojeviti editor sa providnom `textarea` zahtevao bi preciznu sinhronizaciju teksta,
  brojeva linija i skrolovanja.

### Kratak odgovor za odbranu

> Režim izvršavanja zaključava kod, pa CPU uvek izvršava upravo program koji korisnik vidi.
> Dugme Izmeni eksplicitno prekida staro stanje i vraća korisnika u editor.

---

## 16. Potpuno ponovno iscrtavanje UI-ja

### Odluka

Posle svake akcije registri, memorija i listing ponovo se generišu iz trenutnog stanja.

### Zašto

Prikazi imaju mali broj redova. Razlika u brzini u odnosu na parcijalno ažuriranje je
neprimetna, dok je kod znatno jednostavniji:

```text
stanje -> render -> prikaz
```

Tekst korisničkog programa postavlja se pomoću `textContent`, nikada preko `innerHTML`.

### Odbačena alternativa

Parcijalno ažuriranje zahtevalo bi praćenje svakog promenjenog DOM elementa. `innerHTML` bi
bilo kraće za sastavljanje listinga, ali bi korisnički tekst moglo da protumači kao HTML.

### Kratak odgovor za odbranu

> Pošto su paneli mali, potpuno ponovno iscrtavanje je dovoljno brzo i smanjuje broj
> mogućih UI grešaka. `textContent` dodatno garantuje da se korisnički kod prikazuje samo
> kao tekst.

---

## 17. Prikazuju se samo korišćeni resursi

### Odluka

UI prikazuje:

- registre u koje je bar jednom pisano;
- memorijske reči u koje je bar jednom pisano.

Registar ili memorijska reč ostaju vidljivi i kada im se vrednost vrati na nulu.

### Zašto

Kratki primer-programi obično koriste samo nekoliko od 32 registra i mali deo memorije.
Prikaz svih resursa otežao bi praćenje relevantnih promena.

Pravilo „jednom upisano" bolje je od pravila „trenutno nije nula", jer vrednost ne nestaje
iz prikaza baš kada se vrati na nulu.

### Kratak odgovor za odbranu

> Prikazujem resurse koje je program zaista koristio. Evidencija upisa je stabilna tokom
> izvršavanja, pa korisnik može da prati i vrednost koja se kasnije vrati na nulu.

---

## Završno usmeno objašnjenje

> Pri svakoj odluci birala sam najjednostavnije rešenje koje potpuno ispunjava zahtev.
> TypeScript i odvojen core daju sigurnost i testabilnost. Parser i dvoprolazni asembler
> odvajaju sintaksu od semantike. CPU koristi 32-bitne registre, byte-adresibilnu
> little-endian memoriju i bajtovski PC, ali izvršava tipizirane instrukcijske objekte jer
> binarno enkodiranje nije deo dogovorenog obima. UI nema framework i ima dva jasna režima,
> čime se sprečava promena programa tokom izvršavanja. Složenija rešenja razmatrana su, ali
> nisu uvedena kada nisu donosila korist za osnovni cilj rada.

## Pitanja za proveru znanja

1. Zašto parser ne prijavljuje da je `MULT` nepoznata instrukcija?
2. Zašto je za labele potreban dvoprolazni asembler?
3. Šta bi se promenilo kada bi se `LI` prevodila u dve instrukcije?
4. Zašto je `Int32Array` pogodniji od običnog niza brojeva?
5. Kako je garantovano da `x0` ostaje nula?
6. Zašto je memorija predstavljena kao niz bajtova?
7. Kako `DataView` učestvuje u little-endian čitanju i upisu?
8. Zašto postoji `nextPc`, umesto da svaka instrukcija odmah menja `pc`?
9. Zašto greške pri izvršavanju nisu JavaScript izuzeci?
10. Zašto Run ima limit instrukcija?
11. Zašto se breakpointi čuvaju po broju izvorne linije?
12. Zašto se kod ne može menjati u režimu izvršavanja?
13. Zašto UI ponovo iscrtava ceo panel posle svake akcije?
14. Šta bi bilo potrebno dodati za pravo binarno enkodiranje instrukcija?

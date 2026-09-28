# M9 — Priprema za odbranu

## Cilj

Pripremiti materijal pomoću kojeg se arhitektura, ključne odluke, testiranje i izvorni kod
projekta mogu jasno objasniti na odbrani, uz unapred definisan scenario demonstracije i
odgovore na moguća pitanja komisije.

## Šta je urađeno

U folderu `docs/odbrana/` napravljeno je pet numerisanih dokumenata:

1. `01-arhitektura.md` — pregled slojeva, komponenti, internog stanja i glavnog toka
   podataka, uz Mermaid dijagrame;
2. `02-kljucne-odluke.md` — najvažnije tehnološke i implementacione odluke, odbačene
   alternative i kratka objašnjenja za odbranu;
3. `03-testiranje.md` — strategija testiranja, raspodela 113 testova, važni edge case-ovi,
   pronađene greške i ručna provera UI-ja;
4. `04-demonstracija-i-pitanja.md` — glavni i skraćeni scenario demonstracije, očekivani
   rezultati, ograničenja, pravci razvoja i pitanja komisije;
5. `05-vodic-kroz-kod.md` — prolazak kroz tipove, parser, asembler, CPU, UI kontroler i
   renderovanje redosledom kojim podaci prolaze kroz aplikaciju.

## Ključni rezultat

Materijal povezuje tri nivoa objašnjenja:

- **pregled sistema** — šta aplikacija radi i kako su slojevi povezani;
- **tehničko obrazloženje** — zašto su izabrane konkretne reprezentacije i algoritmi;
- **konkretan kod** — koje funkcije sprovode svako pravilo.

Za važne teme pripremljene su i kratke formulacije koje mogu direktno da se koriste u
usmenom izlaganju.

## Demonstracija

Kao glavni primer izabran je program za zbir brojeva od 1 do 5. Scenario obuhvata:

- izbor programa i asembliranje;
- Step i praćenje registara;
- postavljanje breakpointa u petlji;
- Run do breakpointa i nastavak;
- završetak programa i rezultat u memoriji;
- Reset;
- primer greške pri asembliranju.

Pripremljena je i skraćena verzija demonstracije, rezervni primeri i postupak u slučaju
tehničkog problema. Video rada aplikacije snimljen je i poslat mentoru.

## Ograničenja i dalji razvoj

Materijal jasno odvaja implementirani obim od mogućih nadogradnji. Kao ograničenja su
navedeni podskup od 15 instrukcija, izostanak binarnog enkodiranja, 4 KB memorije,
jednostavna sintaksa i simulacija na nivou instrukcija. Kao pravci razvoja izdvojeni su
kompletan RV32I skup, prikaz enkodiranja, ABI imena registara, direktive, rad sa fajlovima,
napredniji editor i pipeline prikaz.

## Kako je provereno

- svi dokumenti prate konačno ponašanje aplikacije iz M8;
- brojevi testova provereni su prema aktuelnim test fajlovima: 24 parser, 31 asembler i
  58 CPU testova, ukupno 113;
- očekivani rezultati četiri primer-programa usklađeni su sa ručnom proverom iz M8;
- relativni linkovi ka izvornim i test fajlovima su provereni;
- `git diff --check` ne prijavljuje probleme.

## Rezultat

Definition of done za M9 je ispunjen: projekat je dokumentovan od arhitekture do konkretnih
funkcija, demonstracija je unapred pripremljena, a ključne odluke, testiranje, ograničenja i
moguća pitanja komisije mogu se objasniti bez oslanjanja na čitanje izvornog koda tokom
odbrane.

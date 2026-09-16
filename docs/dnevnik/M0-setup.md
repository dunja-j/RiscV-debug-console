# M0 — Postavka projekta

Odluke o tehnologiji donete su pre ovog milestone-a i zapisane u [faza-0-odluke.md](../faza-0-odluke.md).
Ovde je samo ono što je nastalo tokom same postavke.

## Cilj

Napraviti prazan ali kompletan projektni kostur: dev server, provera tipova i pokretanje testova.

## Šta je urađeno

| Fajl | Uloga |
|---|---|
| `package.json` | Zavisnosti i komande `dev`, `test`, `build`, `typecheck` |
| `tsconfig.json` | Podešavanja TypeScript-a, `strict` režim uključen |
| `index.html` | Jedina stranica aplikacije, učitava `src/ui/main.ts` |
| `src/ui/main.ts` | Ulazna tačka; u ovoj fazi samo ispisuje tekst |
| `src/style.css` | Osnovni stil, popunjava se u M6 |
| `.gitignore` | Isključuje `node_modules/` i `dist/` iz verzionisanja |

Struktura `src/core/` (logika) i `src/ui/` (prikaz) postavljena je od početka.

## Ključne odluke

| Odluka | Alternativa koju smo odbacili | Zašto |
|---|---|---|
| Ručno pisanje konfiguracionih fajlova | `npm create vite` generator | Generator ubacuje demo fajlove (brojač, logoi) koje bismo odmah brisali; ručno je 6 malih fajlova od kojih svaki razumem |
| Vitest kao test runner | Jest | Vitest je od istih autora kao Vite, radi bez konfiguracije i razume TypeScript direktno |
| `strict: true` u TypeScript-u | blaži režim | Najveći deo koristi od TypeScript-a dolazi iz strict režima; kod simulatora sa 32 registra i memorijom to vredi |
| `core/` ne zna ništa o browseru | mešanje logike i prikaza | Logika se testira bez UI-ja i može se preneti u drugu vrstu aplikacije bez izmena |

## Zamke i problemi

- `verbatimModuleSyntax: true` zahteva da se tipovi uvoze sa `import type { ... }`, a ne
  običnim `import`. Bez toga prijavljuje grešku. Ovo je zapravo korisno: jasno se vidi
  šta je tip (nestaje pri prevođenju), a šta pravi kod.
- `package-lock.json` ide u git, `node_modules/` ne — lock fajl beleži tačne verzije
  biblioteka, pa `npm install` na drugom računaru daje identično stanje.

## Kako je testirano

Jedan probni test (`1 + 1 === 2`) čiji je jedini cilj bio da potvrdi da test okruženje radi;
obrisan je na početku M1. Ručno provereno: `npm run dev` diže server na `localhost:5173`
i stranica se učitava.

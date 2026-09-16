// Zajednicki tipovi koje koriste parser, asembler i simulator.
// Napomena: komentari u kodu su bez dijakritika radi sigurnosti sa kodiranjem fajlova.

/** Greska u izvornom kodu, uvek vezana za konkretnu liniju (numeracija od 1). */
export interface AsmError {
  line: number;
  message: string;
}

/**
 * Jedan operand instrukcije, kao diskriminisana unija.
 * Polje `kind` odredjuje koja su ostala polja dostupna, pa TypeScript
 * sam sprecava npr. citanje `value` sa registra.
 */
export type Operand =
  /** Registar: x0 - x31 */
  | { kind: "reg"; num: number }
  /** Konstanta: 5, -3, 0x1F */
  | { kind: "imm"; value: number }
  /** Ime labele, npr. cilj skoka */
  | { kind: "label"; name: string }
  /** Pristup memoriji u obliku offset(baza), npr. 8(x2) */
  | { kind: "mem"; offset: number; base: number };

/**
 * Jedna linija izvornog koda koja nosi sadrzaj (prazne linije i cisti
 * komentari se ne pojavljuju u rezultatu parsiranja).
 */
export interface ParsedLine {
  /** Broj linije u editoru, od 1 - koristi se za prikaz gresaka i `>` markera. */
  sourceLine: number;
  /** Labela definisana na ovoj liniji, ili null. */
  label: string | null;
  /** Mnemonik u velikim slovima (ADDI, LW...), ili null ako je linija samo labela. */
  mnemonic: string | null;
  operands: Operand[];
}

export interface ParseResult {
  lines: ParsedLine[];
  errors: AsmError[];
}

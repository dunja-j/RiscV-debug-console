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

/** Svih 15 instrukcija koje simulator zna da izvrsi (pseudo-instrukcije se prevode u njih). */
export type OpCode =
  | "ADD"
  | "SUB"
  | "ADDI"
  | "AND"
  | "OR"
  | "XOR"
  | "SLL"
  | "SRL"
  | "LW"
  | "SW"
  | "BEQ"
  | "BNE"
  | "BLT"
  | "JAL"
  | "JALR";

/**
 * Asemblirana instrukcija, spremna za izvrsavanje.
 * Polja koja data instrukcija ne koristi ostaju 0 - time sve instrukcije imaju
 * isti oblik, pa je CPU petlja jednostavna.
 */
export interface Instruction {
  op: OpCode;
  rd: number;
  rs1: number;
  rs2: number;
  /** Konstanta; kod grana i skokova je PC-relativni pomeraj u bajtovima. */
  imm: number;
  /** Linija u editoru iz koje je instrukcija nastala (za `>` marker i breakpointe). */
  sourceLine: number;
}

export interface AssembleResult {
  /** Instrukcije po redosledu izvrsavanja; adresa instrukcije i je i * 4. */
  program: Instruction[];
  /** Ime labele -> adresa u bajtovima. */
  labels: Map<string, number>;
  errors: AsmError[];
}

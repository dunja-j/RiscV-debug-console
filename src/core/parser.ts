import type { AsmError, Operand, ParsedLine, ParseResult } from "./types";

// Parser radi iskljucivo sintaksnu analizu: tekst -> strukturirane linije.
// Ne zna koje instrukcije postoje niti koje labele su definisane - to je posao asemblera (M2).

/** Labela na pocetku linije: niz slova/cifara/donjih crta, pa dvotacka. */
const LABEL_DEF = /^([A-Za-z0-9_]+)\s*:/;
/** Ime labele kad se koristi kao operand. */
const LABEL_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Mnemonik: samo slova. */
const MNEMONIC = /^[A-Za-z]+$/;
/** Registar: slovo x pa broj (opseg se proverava posebno). */
const REGISTER = /^[xX](\d+)$/;
/** Pristup memoriji: offset(baza) */
const MEMORY = /^(.*?)\(\s*([^()\s]*)\s*\)$/;
/** Ceo broj, decimalni ili heksadecimalni, sa opcionim znakom. */
const NUMBER = /^([+-]?)(0[xX][0-9a-fA-F]+|[0-9]+)$/;

const REGISTER_COUNT = 32;

/**
 * Parsira ceo izvorni tekst.
 * Greske se skupljaju sve odjednom - nikad se ne prekida na prvoj.
 * Linija u kojoj je nadjena greska se preskace i ne ulazi u rezultat.
 */
export function parse(source: string): ParseResult {
  const lines: ParsedLine[] = [];
  const errors: AsmError[] = [];

  const rawLines = source.split(/\r?\n/);

  for (let i = 0; i < rawLines.length; i++) {
    const sourceLine = i + 1;
    const parsed = parseLine(rawLines[i], sourceLine, errors);
    if (parsed !== null) {
      lines.push(parsed);
    }
  }

  return { lines, errors };
}

/** Vraca parsiranu liniju, ili null ako je linija prazna ili sadrzi gresku. */
function parseLine(raw: string, sourceLine: number, errors: AsmError[]): ParsedLine | null {
  let text = stripComment(raw).trim();
  if (text === "") {
    return null;
  }

  let label: string | null = null;
  const labelMatch = LABEL_DEF.exec(text);
  if (labelMatch !== null) {
    label = labelMatch[1];
    if (!LABEL_NAME.test(label)) {
      errors.push({ line: sourceLine, message: `neispravno ime labele '${label}'` });
      return null;
    }
    text = text.slice(labelMatch[0].length).trim();
  }

  // Linija sa samo labelom je validna - labela ce se vezati za sledecu instrukciju.
  if (text === "") {
    return { sourceLine, label, mnemonic: null, operands: [] };
  }

  const separator = text.search(/\s/);
  const mnemonic = separator === -1 ? text : text.slice(0, separator);
  const rest = separator === -1 ? "" : text.slice(separator + 1).trim();

  if (!MNEMONIC.test(mnemonic)) {
    errors.push({ line: sourceLine, message: `neispravan naziv instrukcije '${mnemonic}'` });
    return null;
  }

  const operands = parseOperands(rest, sourceLine, errors);
  if (operands === null) {
    return null;
  }

  return { sourceLine, label, mnemonic: mnemonic.toUpperCase(), operands };
}

/** Vraca listu operanada, ili null ako je bilo koji operand neispravan. */
function parseOperands(rest: string, sourceLine: number, errors: AsmError[]): Operand[] | null {
  if (rest === "") {
    return [];
  }

  const operands: Operand[] = [];

  for (const part of rest.split(",")) {
    const token = part.trim();
    if (token === "") {
      errors.push({ line: sourceLine, message: "prazan operand (visak zareza?)" });
      return null;
    }

    const operand = parseOperand(token, sourceLine, errors);
    if (operand === null) {
      return null;
    }
    operands.push(operand);
  }

  return operands;
}

function parseOperand(token: string, sourceLine: number, errors: AsmError[]): Operand | null {
  // Redosled provera je bitan: memorijski operand sadrzi zagrade pa se prepoznaje prvi.
  if (token.includes("(") || token.includes(")")) {
    return parseMemoryOperand(token, sourceLine, errors);
  }

  const register = parseRegister(token, sourceLine, errors);
  if (register !== undefined) {
    return register;
  }

  const value = parseNumber(token);
  if (value !== null) {
    return { kind: "imm", value };
  }

  if (LABEL_NAME.test(token)) {
    return { kind: "label", name: token };
  }

  errors.push({ line: sourceLine, message: `neispravan operand '${token}'` });
  return null;
}

function parseMemoryOperand(token: string, sourceLine: number, errors: AsmError[]): Operand | null {
  const match = MEMORY.exec(token);
  if (match === null) {
    errors.push({
      line: sourceLine,
      message: `neispravan pristup memoriji '${token}', ocekivano npr. 8(x2)`,
    });
    return null;
  }

  const offsetText = match[1].trim();
  const baseText = match[2].trim();

  if (offsetText === "") {
    errors.push({
      line: sourceLine,
      message: `nedostaje offset u '${token}', napisi npr. 0(${baseText})`,
    });
    return null;
  }

  const offset = parseNumber(offsetText);
  if (offset === null) {
    errors.push({ line: sourceLine, message: `offset '${offsetText}' nije ceo broj` });
    return null;
  }

  const base = parseRegister(baseText, sourceLine, errors);
  if (base === null) {
    return null;
  }
  if (base === undefined) {
    errors.push({ line: sourceLine, message: `'${baseText}' nije registar` });
    return null;
  }

  return { kind: "mem", offset, base: base.num };
}

/**
 * Tri moguca ishoda:
 * - operand registra, ako je oblika x0-x31
 * - null, ako je oblika xN ali je N van opsega (greska je vec prijavljena)
 * - undefined, ako token uopste nije oblika xN (pozivalac neka proba dalje)
 */
function parseRegister(
  token: string,
  sourceLine: number,
  errors: AsmError[],
): { kind: "reg"; num: number } | null | undefined {
  const match = REGISTER.exec(token);
  if (match === null) {
    return undefined;
  }

  const num = Number(match[1]);
  if (num >= REGISTER_COUNT) {
    errors.push({
      line: sourceLine,
      message: `nepostojeci registar '${token}', dozvoljeni su x0-x31`,
    });
    return null;
  }

  return { kind: "reg", num };
}

/** Parsira decimalni ili heksadecimalni ceo broj; vraca null ako token nije broj. */
function parseNumber(token: string): number | null {
  const match = NUMBER.exec(token);
  if (match === null) {
    return null;
  }

  const digits = match[2];
  const magnitude = digits.toLowerCase().startsWith("0x")
    ? parseInt(digits.slice(2), 16)
    : parseInt(digits, 10);

  return match[1] === "-" ? -magnitude : magnitude;
}

/** Uklanja komentar: sve od prvog znaka # do kraja linije. */
function stripComment(raw: string): string {
  const hash = raw.indexOf("#");
  return hash === -1 ? raw : raw.slice(0, hash);
}

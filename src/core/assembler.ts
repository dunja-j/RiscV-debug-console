import { parse } from "./parser";
import type { AsmError, AssembleResult, Instruction, OpCode, Operand, ParsedLine } from "./types";

// Asembler pretvara parsirane linije u izvrsive instrukcije. Radi cetiri stvari:
// prevodi pseudo-instrukcije, gradi tabelu labela, proverava semantiku i racuna
// PC-relativne pomeraje za grane i skokove.

const INSTRUCTION_SIZE = 4;

/** Oblik operanada koji instrukcija ocekuje. */
type Format = "R" | "I" | "LOAD" | "STORE" | "BRANCH" | "JAL" | "JALR";

interface Spec {
  format: Format;
  /** Prikazuje se u poruci o gresci. */
  syntax: string;
}

const SPECS: Record<OpCode, Spec> = {
  ADD: { format: "R", syntax: "ADD rd, rs1, rs2" },
  SUB: { format: "R", syntax: "SUB rd, rs1, rs2" },
  AND: { format: "R", syntax: "AND rd, rs1, rs2" },
  OR: { format: "R", syntax: "OR rd, rs1, rs2" },
  XOR: { format: "R", syntax: "XOR rd, rs1, rs2" },
  SLL: { format: "R", syntax: "SLL rd, rs1, rs2" },
  SRL: { format: "R", syntax: "SRL rd, rs1, rs2" },
  ADDI: { format: "I", syntax: "ADDI rd, rs1, konstanta" },
  LW: { format: "LOAD", syntax: "LW rd, offset(rs1)" },
  SW: { format: "STORE", syntax: "SW rs2, offset(rs1)" },
  BEQ: { format: "BRANCH", syntax: "BEQ rs1, rs2, labela" },
  BNE: { format: "BRANCH", syntax: "BNE rs1, rs2, labela" },
  BLT: { format: "BRANCH", syntax: "BLT rs1, rs2, labela" },
  JAL: { format: "JAL", syntax: "JAL rd, labela" },
  JALR: { format: "JALR", syntax: "JALR rd, offset(rs1)" },
};

const PSEUDO_SYNTAX: Record<string, string> = {
  LI: "LI rd, konstanta",
  MV: "MV rd, rs",
  NOP: "NOP",
  J: "J labela",
  RET: "RET",
};

// Koliko bita ima konstanta u pojedinim formatima - odatle sledi dozvoljeni opseg.
const IMM_BITS = 12; // ADDI, LW, SW, JALR:  -2048 .. 2047
const BRANCH_BITS = 13; // BEQ, BNE, BLT:      -4096 .. 4094
const JAL_BITS = 21; // JAL:             -1048576 .. 1048574

const ZERO: Operand = { kind: "reg", num: 0 };

/**
 * Asemblira izvorni kod.
 * Ako parser prijavi sintaksne greske, staje odmah - nema smisla traziti labele
 * u kodu koji se nije ni procitao do kraja.
 * `program` je upotrebljiv samo ako je `errors` prazan.
 */
export function assemble(source: string): AssembleResult {
  const parsed = parse(source);
  if (parsed.errors.length > 0) {
    return { program: [], labels: new Map(), errors: parsed.errors };
  }

  const errors: AsmError[] = [];
  const labels = collectLabels(parsed.lines, errors);
  const program = translate(parsed.lines, labels, errors);

  return { program, labels, errors };
}

/**
 * Prvi prolaz: adrese labela.
 * Potreban je zato sto labela moze biti definisana tek posle instrukcije koja
 * na nju skace (tzv. forward reference).
 */
function collectLabels(lines: ParsedLine[], errors: AsmError[]): Map<string, number> {
  const labels = new Map<string, number>();
  let address = 0;

  for (const line of lines) {
    if (line.label !== null) {
      if (labels.has(line.label)) {
        errors.push({ line: line.sourceLine, message: `labela '${line.label}' je vec definisana` });
      } else {
        labels.set(line.label, address);
      }
    }
    if (line.mnemonic !== null) {
      address += INSTRUCTION_SIZE;
    }
  }

  return labels;
}

/** Drugi prolaz: prevodjenje instrukcija, sada kad su sve labele poznate. */
function translate(
  lines: ParsedLine[],
  labels: Map<string, number>,
  errors: AsmError[],
): Instruction[] {
  const program: Instruction[] = [];
  let address = 0;

  for (const line of lines) {
    if (line.mnemonic === null) {
      continue; // linija sa samo labelom ne zauzima adresu
    }

    const instruction = assembleLine(line, address, labels, errors);
    if (instruction !== null) {
      program.push(instruction);
    }
    // Adresa raste i kad je linija pogresna, da ostale labele ostanu tacne.
    address += INSTRUCTION_SIZE;
  }

  return program;
}

function assembleLine(
  line: ParsedLine,
  address: number,
  labels: Map<string, number>,
  errors: AsmError[],
): Instruction | null {
  const expanded = expandPseudo(line, errors);
  if (expanded === null) {
    return null;
  }

  const mnemonic = expanded.mnemonic as string;
  const spec = (SPECS as Record<string, Spec | undefined>)[mnemonic];
  if (spec === undefined) {
    errors.push({ line: line.sourceLine, message: `nepoznata instrukcija '${line.mnemonic}'` });
    return null;
  }

  return buildInstruction(mnemonic as OpCode, spec, expanded, address, labels, errors);
}

/**
 * Prevodi pseudo-instrukciju u pravu instrukciju.
 * Sve nase pseudo-instrukcije se sire 1:1, pa se adrese ostalih instrukcija ne pomeraju.
 * Ako linija nije pseudo-instrukcija, vraca je nepromenjenu.
 */
function expandPseudo(line: ParsedLine, errors: AsmError[]): ParsedLine | null {
  const ops = line.operands;

  const wrongShape = (): null => {
    errors.push({
      line: line.sourceLine,
      message: `${line.mnemonic} ocekuje: ${PSEUDO_SYNTAX[line.mnemonic as string]}`,
    });
    return null;
  };

  const rewrite = (mnemonic: OpCode, operands: Operand[]): ParsedLine => ({
    ...line,
    mnemonic,
    operands,
  });

  switch (line.mnemonic) {
    case "LI":
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "imm") return wrongShape();
      return rewrite("ADDI", [ops[0], ZERO, ops[1]]);

    case "MV":
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "reg") return wrongShape();
      return rewrite("ADDI", [ops[0], ops[1], { kind: "imm", value: 0 }]);

    case "NOP":
      if (ops.length !== 0) return wrongShape();
      return rewrite("ADDI", [ZERO, ZERO, { kind: "imm", value: 0 }]);

    case "J":
      if (ops.length !== 1 || ops[0].kind !== "label") return wrongShape();
      return rewrite("JAL", [ZERO, ops[0]]);

    case "RET":
      if (ops.length !== 0) return wrongShape();
      return rewrite("JALR", [ZERO, { kind: "mem", offset: 0, base: 1 }]);

    default:
      return line;
  }
}

/** Proverava oblik operanada i sastavlja instrukciju. */
function buildInstruction(
  op: OpCode,
  spec: Spec,
  line: ParsedLine,
  address: number,
  labels: Map<string, number>,
  errors: AsmError[],
): Instruction | null {
  const ops = line.operands;
  const sourceLine = line.sourceLine;

  const wrongShape = (): null => {
    errors.push({ line: sourceLine, message: `${op} ocekuje: ${spec.syntax}` });
    return null;
  };

  const base = { op, rd: 0, rs1: 0, rs2: 0, imm: 0, sourceLine };

  switch (spec.format) {
    case "R": {
      if (ops.length !== 3 || ops[0].kind !== "reg" || ops[1].kind !== "reg" || ops[2].kind !== "reg") {
        return wrongShape();
      }
      return { ...base, rd: ops[0].num, rs1: ops[1].num, rs2: ops[2].num };
    }

    case "I": {
      if (ops.length !== 3 || ops[0].kind !== "reg" || ops[1].kind !== "reg" || ops[2].kind !== "imm") {
        return wrongShape();
      }
      if (!fitsIn(ops[2].value, IMM_BITS, sourceLine, "konstanta", errors)) {
        return null;
      }
      return { ...base, rd: ops[0].num, rs1: ops[1].num, imm: ops[2].value };
    }

    case "LOAD": {
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "mem") return wrongShape();
      if (!fitsIn(ops[1].offset, IMM_BITS, sourceLine, "offset", errors)) return null;
      return { ...base, rd: ops[0].num, rs1: ops[1].base, imm: ops[1].offset };
    }

    case "STORE": {
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "mem") return wrongShape();
      if (!fitsIn(ops[1].offset, IMM_BITS, sourceLine, "offset", errors)) return null;
      return { ...base, rs2: ops[0].num, rs1: ops[1].base, imm: ops[1].offset };
    }

    case "JALR": {
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "mem") return wrongShape();
      if (!fitsIn(ops[1].offset, IMM_BITS, sourceLine, "offset", errors)) return null;
      return { ...base, rd: ops[0].num, rs1: ops[1].base, imm: ops[1].offset };
    }

    case "BRANCH": {
      if (ops.length !== 3 || ops[0].kind !== "reg" || ops[1].kind !== "reg" || ops[2].kind !== "label") {
        return wrongShape();
      }
      const offset = resolveLabel(ops[2].name, address, labels, sourceLine, errors);
      if (offset === null) return null;
      if (!fitsIn(offset, BRANCH_BITS, sourceLine, "skok", errors)) return null;
      return { ...base, rs1: ops[0].num, rs2: ops[1].num, imm: offset };
    }

    case "JAL": {
      if (ops.length !== 2 || ops[0].kind !== "reg" || ops[1].kind !== "label") return wrongShape();
      const offset = resolveLabel(ops[1].name, address, labels, sourceLine, errors);
      if (offset === null) return null;
      if (!fitsIn(offset, JAL_BITS, sourceLine, "skok", errors)) return null;
      return { ...base, rd: ops[0].num, imm: offset };
    }
  }
}

/** Vraca PC-relativni pomeraj do labele, u bajtovima. */
function resolveLabel(
  name: string,
  address: number,
  labels: Map<string, number>,
  sourceLine: number,
  errors: AsmError[],
): number | null {
  const target = labels.get(name);
  if (target === undefined) {
    errors.push({ line: sourceLine, message: `nedefinisana labela '${name}'` });
    return null;
  }
  return target - address;
}

/** Proverava da li vrednost staje u ceo broj sa znakom date sirine. */
function fitsIn(
  value: number,
  bits: number,
  sourceLine: number,
  what: string,
  errors: AsmError[],
): boolean {
  const min = -(2 ** (bits - 1));
  const max = 2 ** (bits - 1) - 1;

  if (value < min || value > max) {
    errors.push({
      line: sourceLine,
      message: `${what} ${value} je van opsega (dozvoljeno ${min} do ${max})`,
    });
    return false;
  }
  return true;
}

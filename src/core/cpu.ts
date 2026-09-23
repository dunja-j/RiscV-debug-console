import type { Instruction } from "./types";

// Model procesora: stanje (registri, memorija, PC) i izvrsavanje jedne instrukcije.
// Grane i skokovi dolaze u M5.

const REGISTER_COUNT = 32;
const INSTRUCTION_SIZE = 4;
/** Velicina simulirane memorije podataka: 4 KB, adrese 0x000 - 0xFFF. */
const MEMORY_SIZE = 4096;
const WORD_SIZE = 4;
/** Pomeraj koristi samo donjih 5 bita - 32-bitni broj nema smisla pomerati za vise od 31. */
const SHIFT_MASK = 0x1f;

export interface StepResult {
  /** "ok" = izvrseno, "halted" = program je gotov, "error" = izvrsavanje prekinuto. */
  status: "ok" | "halted" | "error";
  /** Popunjeno samo kod greske. */
  message?: string;
  /** Linija izvorne instrukcije, za oznacavanje u editoru. */
  line?: number;
}

export class Cpu {
  /**
   * Int32Array sam odseca rezultat na 32 bita, pa se prelivanje ponasa
   * isto kao na pravom procesoru, bez rucnog maskiranja.
   */
  readonly registers = new Int32Array(REGISTER_COUNT);

  /** Memorija podataka; instrukcije se cuvaju odvojeno, u nizu `program`. */
  readonly memory = new Uint8Array(MEMORY_SIZE);

  /** Adrese reci u koje je program upisivao - panel MEMORIJA prikazuje samo njih. */
  readonly writtenWords = new Set<number>();

  pc = 0;

  /** DataView cita i pise 32-bitne reci nad istim bajtovima, u little-endian poretku. */
  private readonly view = new DataView(this.memory.buffer);

  constructor(private readonly program: Instruction[]) {}

  /** Vraca procesor u pocetno stanje; program ostaje ucitan. */
  reset(): void {
    this.registers.fill(0);
    this.memory.fill(0);
    this.writtenWords.clear();
    this.pc = 0;
  }

  /** Cita 32-bitnu rec sa poravnate adrese (koristi UI za prikaz memorije). */
  readWord(address: number): number {
    return this.view.getInt32(address, true);
  }

  /** Instrukcija na koju pokazuje PC, ili null ako je program zavrsen. */
  get currentInstruction(): Instruction | null {
    const index = this.pc / INSTRUCTION_SIZE;
    if (index < 0 || index >= this.program.length) {
      return null;
    }
    return this.program[index];
  }

  /** Izvrsava jednu instrukciju. */
  step(): StepResult {
    const instruction = this.currentInstruction;
    if (instruction === null) {
      return { status: "halted" };
    }

    const error = this.execute(instruction);
    if (error !== null) {
      return { status: "error", message: error, line: instruction.sourceLine };
    }

    this.pc += INSTRUCTION_SIZE;
    return { status: "ok", line: instruction.sourceLine };
  }

  /** Vraca poruku o gresci, ili null ako je instrukcija uspesno izvrsena. */
  private execute(instruction: Instruction): string | null {
    const { op, rd, rs1, rs2, imm } = instruction;
    const a = this.registers[rs1];
    const b = this.registers[rs2];

    switch (op) {
      case "ADD":
        this.setRegister(rd, a + b);
        return null;
      case "SUB":
        this.setRegister(rd, a - b);
        return null;
      case "ADDI":
        this.setRegister(rd, a + imm);
        return null;
      case "AND":
        this.setRegister(rd, a & b);
        return null;
      case "OR":
        this.setRegister(rd, a | b);
        return null;
      case "XOR":
        this.setRegister(rd, a ^ b);
        return null;
      case "SLL":
        this.setRegister(rd, a << (b & SHIFT_MASK));
        return null;
      case "SRL":
        // >>> je logicko pomeranje (uvlaci nule); >> bi cuvalo znak i dalo pogresan rezultat.
        this.setRegister(rd, a >>> (b & SHIFT_MASK));
        return null;

      case "LW":
        return this.load(rd, a + imm);
      case "SW":
        return this.store(a + imm, b);

      case "BEQ":
      case "BNE":
      case "BLT":
      case "JAL":
      case "JALR":
        return `instrukcija ${op} jos nije podrzana`;
    }
  }

  private load(rd: number, address: number): string | null {
    const problem = checkAddress(address);
    if (problem !== null) {
      return problem;
    }
    this.setRegister(rd, this.view.getInt32(address, true));
    return null;
  }

  private store(address: number, value: number): string | null {
    const problem = checkAddress(address);
    if (problem !== null) {
      return problem;
    }
    this.view.setInt32(address, value, true);
    this.writtenWords.add(address);
    return null;
  }

  /** Upis u registar; x0 je zicano vezan na nulu pa se upis u njega odbacuje. */
  private setRegister(num: number, value: number): void {
    if (num === 0) {
      return;
    }
    this.registers[num] = value;
  }
}

/** Vraca poruku o gresci ako se sa adrese ne sme citati/pisati, inace null. */
function checkAddress(address: number): string | null {
  if (address % WORD_SIZE !== 0) {
    return `adresa ${formatAddress(address)} nije poravnata na 4 bajta`;
  }
  if (address < 0 || address + WORD_SIZE > MEMORY_SIZE) {
    return `adresa ${formatAddress(address)} je van memorije (0x000 - 0xFFF)`;
  }
  return null;
}

function formatAddress(address: number): string {
  if (address < 0) {
    return String(address);
  }
  return `0x${address.toString(16).toUpperCase().padStart(3, "0")}`;
}

import type { Instruction } from "./types";

// Model procesora: stanje (registri, PC) i izvrsavanje jedne instrukcije.
// U ovom milestone-u podrzane su samo aritmeticke i logicke instrukcije;
// memorija (LW/SW) dolazi u M4, a grane i skokovi u M5.

const REGISTER_COUNT = 32;
const INSTRUCTION_SIZE = 4;
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
  pc = 0;

  constructor(private readonly program: Instruction[]) {}

  /** Vraca procesor u pocetno stanje; program ostaje ucitan. */
  reset(): void {
    this.registers.fill(0);
    this.pc = 0;
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
      case "SW":
      case "BEQ":
      case "BNE":
      case "BLT":
      case "JAL":
      case "JALR":
        return `instrukcija ${op} jos nije podrzana`;
    }
  }

  /** Upis u registar; x0 je zicano vezan na nulu pa se upis u njega odbacuje. */
  private setRegister(num: number, value: number): void {
    if (num === 0) {
      return;
    }
    this.registers[num] = value;
  }
}

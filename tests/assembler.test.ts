import { describe, it, expect } from "vitest";
import { assemble } from "../src/core/assembler";

describe("asembler - prave instrukcije", () => {
  it("prevodi instrukciju sa tri registra", () => {
    const { program, errors } = assemble("ADD x1, x2, x3");
    expect(errors).toEqual([]);
    expect(program[0]).toEqual({ op: "ADD", rd: 1, rs1: 2, rs2: 3, imm: 0, sourceLine: 1 });
  });

  it("prevodi ADDI sa konstantom", () => {
    const { program } = assemble("ADDI x5, x6, -7");
    expect(program[0]).toEqual({ op: "ADDI", rd: 5, rs1: 6, rs2: 0, imm: -7, sourceLine: 1 });
  });

  it("LW puni rd i rs1 iz offset(baza)", () => {
    const { program } = assemble("LW x3, 8(x2)");
    expect(program[0]).toEqual({ op: "LW", rd: 3, rs1: 2, rs2: 0, imm: 8, sourceLine: 1 });
  });

  it("SW puni rs2 i rs1 - registar sa podatkom je izvor, ne odrediste", () => {
    const { program } = assemble("SW x3, 8(x2)");
    expect(program[0]).toEqual({ op: "SW", rd: 0, rs1: 2, rs2: 3, imm: 8, sourceLine: 1 });
  });

  it("preskace linije sa samo labelom i cuva broj izvorne linije", () => {
    const { program } = assemble("start:\n\nADD x1, x2, x3");
    expect(program).toHaveLength(1);
    expect(program[0].sourceLine).toBe(3);
  });
});

describe("asembler - pseudo-instrukcije", () => {
  it("LI rd, imm -> ADDI rd, x0, imm", () => {
    const { program, errors } = assemble("LI x1, 42");
    expect(errors).toEqual([]);
    expect(program[0]).toEqual({ op: "ADDI", rd: 1, rs1: 0, rs2: 0, imm: 42, sourceLine: 1 });
  });

  it("MV rd, rs -> ADDI rd, rs, 0", () => {
    const { program } = assemble("MV x1, x2");
    expect(program[0]).toEqual({ op: "ADDI", rd: 1, rs1: 2, rs2: 0, imm: 0, sourceLine: 1 });
  });

  it("NOP -> ADDI x0, x0, 0", () => {
    const { program } = assemble("NOP");
    expect(program[0]).toEqual({ op: "ADDI", rd: 0, rs1: 0, rs2: 0, imm: 0, sourceLine: 1 });
  });

  it("J labela -> JAL x0, labela", () => {
    const { program } = assemble("kraj:\nJ kraj");
    expect(program[0]).toEqual({ op: "JAL", rd: 0, rs1: 0, rs2: 0, imm: 0, sourceLine: 2 });
  });

  it("RET -> JALR x0, 0(x1)", () => {
    const { program } = assemble("RET");
    expect(program[0]).toEqual({ op: "JALR", rd: 0, rs1: 1, rs2: 0, imm: 0, sourceLine: 1 });
  });

  it("pseudo-instrukcija sa pogresnim operandima daje jasnu poruku", () => {
    const { errors } = assemble("MV x1, 5");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("MV ocekuje");
  });
});

describe("asembler - labele i pomeraji", () => {
  it("skok unapred daje pozitivan pomeraj", () => {
    // adrese: 0 ADDI, 4 BEQ, 8 ADDI, kraj = 12
    const source = ["ADDI x1, x0, 1", "BEQ x1, x0, kraj", "ADDI x2, x0, 2", "kraj:"].join("\n");
    const { program, errors } = assemble(source);
    expect(errors).toEqual([]);
    expect(program[1].imm).toBe(8); // 12 - 4
  });

  it("skok unazad daje negativan pomeraj", () => {
    const source = ["petlja:", "ADDI x1, x1, 1", "BNE x1, x0, petlja"].join("\n");
    const { program } = assemble(source);
    expect(program[1].imm).toBe(-4); // 0 - 4
  });

  it("JAL racuna pomeraj do labele", () => {
    const source = ["JAL x1, funkcija", "NOP", "funkcija:", "RET"].join("\n");
    const { program } = assemble(source);
    expect(program[0].imm).toBe(8);
  });

  it("labela iza poslednje instrukcije je dozvoljena", () => {
    const { program, errors, labels } = assemble("NOP\nJ kraj\nkraj:");
    expect(errors).toEqual([]);
    expect(labels.get("kraj")).toBe(8);
    expect(program[1].imm).toBe(4); // 8 - 4
  });

  it("labela na istoj liniji kao instrukcija pokazuje na tu instrukciju", () => {
    const { labels } = assemble("NOP\npetlja: ADDI x1, x1, 1");
    expect(labels.get("petlja")).toBe(4);
  });
});

describe("asembler - greske", () => {
  it("prijavljuje nepoznatu instrukciju", () => {
    const { errors } = assemble("MULT x1, x2, x3");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("nepoznata instrukcija 'MULT'");
  });

  it("prijavljuje pogresan broj operanada", () => {
    const { errors } = assemble("ADD x1, x2");
    expect(errors[0].message).toContain("ADD ocekuje");
  });

  it("prijavljuje pogresan tip operanda", () => {
    const { errors } = assemble("ADD x1, x2, 5");
    expect(errors[0].message).toContain("ADD ocekuje");
  });

  it("prijavljuje nedefinisanu labelu", () => {
    const { errors } = assemble("BEQ x1, x0, nepostoji");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("nedefinisana labela 'nepostoji'");
  });

  it("prijavljuje duplu labelu", () => {
    const { errors } = assemble("petlja: NOP\npetlja: NOP");
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(2);
    expect(errors[0].message).toContain("vec definisana");
  });

  it("prijavljuje konstantu van 12-bitnog opsega", () => {
    const { errors } = assemble("ADDI x1, x0, 3000");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("van opsega");
  });

  it("granicne vrednosti konstante prolaze", () => {
    const { errors } = assemble("ADDI x1, x0, 2047\nADDI x2, x0, -2048");
    expect(errors).toEqual([]);
  });

  it("LI nasledjuje 12-bitno ogranicenje od ADDI", () => {
    const { errors } = assemble("LI x1, 5000");
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("van opsega");
  });

  it("prijavljuje predaleku granu", () => {
    // Grana nosi najvise 13 bita sa znakom = +-4096 bajtova = +-1024 instrukcije.
    const source = ["pocetak:", ...Array(1100).fill("NOP"), "BEQ x1, x0, pocetak"].join("\n");
    const { errors } = assemble(source);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("van opsega");
  });

  it("skuplja vise semantickih gresaka odjednom", () => {
    const source = ["MULT x1, x2, x3", "ADD x1, x2, x3", "BEQ x1, x0, nepostoji"].join("\n");
    const { errors } = assemble(source);
    expect(errors.map((e) => e.line)).toEqual([1, 3]);
  });

  it("sintaksne greske zaustavljaju asembliranje", () => {
    const { program, errors } = assemble("ADD x1, x99, x3\nMULT x1, x2, x3");
    expect(program).toEqual([]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("x99");
  });
});

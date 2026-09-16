import { describe, it, expect } from "vitest";
import { parse } from "../src/core/parser";

describe("parser - ispravan kod", () => {
  it("prazan ulaz daje prazan rezultat", () => {
    const result = parse("");
    expect(result.lines).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("preskace prazne linije i cist komentar", () => {
    const result = parse("# komentar\n\n   \n# jos jedan");
    expect(result.lines).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("skida komentar sa kraja linije instrukcije", () => {
    const result = parse("ADD x1, x2, x3   # saberi");
    expect(result.errors).toEqual([]);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].mnemonic).toBe("ADD");
    expect(result.lines[0].operands).toHaveLength(3);
  });

  it("parsira instrukciju sa tri registra", () => {
    const result = parse("ADD x1, x2, x3");
    expect(result.lines[0]).toEqual({
      sourceLine: 1,
      label: null,
      mnemonic: "ADD",
      operands: [
        { kind: "reg", num: 1 },
        { kind: "reg", num: 2 },
        { kind: "reg", num: 3 },
      ],
    });
  });

  it("mnemonik i registri su case-insensitive", () => {
    const result = parse("addi X5, x0, 7");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].mnemonic).toBe("ADDI");
    expect(result.lines[0].operands[0]).toEqual({ kind: "reg", num: 5 });
  });

  it("prihvata decimalne, negativne i heksadecimalne konstante", () => {
    const result = parse("ADDI x1, x0, 5\nADDI x2, x0, -3\nADDI x3, x0, 0x1F");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].operands[2]).toEqual({ kind: "imm", value: 5 });
    expect(result.lines[1].operands[2]).toEqual({ kind: "imm", value: -3 });
    expect(result.lines[2].operands[2]).toEqual({ kind: "imm", value: 31 });
  });

  it("parsira pristup memoriji oblika offset(baza)", () => {
    const result = parse("LW x3, 8(x2)\nSW x4, -4( x2 )");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].operands[1]).toEqual({ kind: "mem", offset: 8, base: 2 });
    expect(result.lines[1].operands[1]).toEqual({ kind: "mem", offset: -4, base: 2 });
  });

  it("labela sama u liniji nema mnemonik", () => {
    const result = parse("petlja:");
    expect(result.errors).toEqual([]);
    expect(result.lines[0]).toEqual({
      sourceLine: 1,
      label: "petlja",
      mnemonic: null,
      operands: [],
    });
  });

  it("labela moze biti ispred instrukcije u istoj liniji", () => {
    const result = parse("petlja: ADDI x1, x1, 1");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].label).toBe("petlja");
    expect(result.lines[0].mnemonic).toBe("ADDI");
  });

  it("ime labele kao operand se prepoznaje kao labela", () => {
    const result = parse("BNE x1, x0, petlja");
    expect(result.lines[0].operands[2]).toEqual({ kind: "label", name: "petlja" });
  });

  it("instrukcija bez operanada je dozvoljena", () => {
    const result = parse("NOP");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].mnemonic).toBe("NOP");
    expect(result.lines[0].operands).toEqual([]);
  });

  it("cuva tacan broj izvorne linije", () => {
    const result = parse("# komentar\n\nADD x1, x2, x3");
    expect(result.lines[0].sourceLine).toBe(3);
  });

  it("parser ne proverava postojanje instrukcije ni broj operanada", () => {
    // To je posao asemblera (M2) - parser samo mora da prodje bez greske.
    const result = parse("MULT x1, x2, x3, x4, x5");
    expect(result.errors).toEqual([]);
    expect(result.lines[0].mnemonic).toBe("MULT");
    expect(result.lines[0].operands).toHaveLength(5);
  });
});

describe("parser - greske", () => {
  it("prijavljuje nepostojeci registar", () => {
    const result = parse("ADD x1, x99, x3");
    expect(result.lines).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(1);
    expect(result.errors[0].message).toContain("x99");
  });

  it("prijavljuje labelu koja pocinje cifrom", () => {
    const result = parse("1petlja: NOP");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("1petlja");
  });

  it("prijavljuje neispravan naziv instrukcije", () => {
    const result = parse("@@@ x1, x2");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("instrukcije");
  });

  it("prijavljuje neispravan operand", () => {
    const result = parse("ADDI x1, x0, 5abc");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("5abc");
  });

  it("prijavljuje visak zareza", () => {
    const result = parse("ADD x1, , x3");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("zarez");
  });

  it("prijavljuje nedostajuci offset kod pristupa memoriji", () => {
    const result = parse("LW x1, (x2)");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("offset");
  });

  it("prijavljuje neispravnu bazu kod pristupa memoriji", () => {
    const result = parse("LW x1, 4(y2)");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("y2");
  });

  it("skuplja sve greske odjednom, sa tacnim brojevima linija", () => {
    const source = ["ADD x1, x2, x3", "ADDI x1, x0, 5abc", "LW x1, (x2)", "ADD x1, x99, x3"].join(
      "\n",
    );
    const result = parse(source);

    expect(result.errors.map((e) => e.line)).toEqual([2, 3, 4]);
    // Ispravna linija ostaje u rezultatu, pokvarene se preskacu.
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].sourceLine).toBe(1);
  });
});

import { describe, it, expect } from "vitest";
import { assemble } from "../src/core/assembler";
import { Cpu } from "../src/core/cpu";

/** Asemblira kod i vraca procesor sa ucitanim programom. */
function cpuFor(source: string): Cpu {
  const { program, errors } = assemble(source);
  expect(errors).toEqual([]);
  return new Cpu(program);
}

/** Izvrsava ceo program i vraca procesor radi provere stanja. */
function run(source: string): Cpu {
  const cpu = cpuFor(source);
  let result = cpu.step();
  while (result.status === "ok") {
    result = cpu.step();
  }
  expect(result.status).toBe("halted");
  return cpu;
}

describe("cpu - aritmetika i logika", () => {
  it("ADD sabira dva registra", () => {
    const cpu = run("LI x1, 5\nLI x2, 7\nADD x3, x1, x2");
    expect(cpu.registers[3]).toBe(12);
  });

  it("SUB oduzima i daje negativan rezultat", () => {
    const cpu = run("LI x1, 5\nLI x2, 7\nSUB x3, x1, x2");
    expect(cpu.registers[3]).toBe(-2);
  });

  it("ADDI sabira sa konstantom", () => {
    const cpu = run("LI x1, 10\nADDI x2, x1, -3");
    expect(cpu.registers[2]).toBe(7);
  });

  it("AND, OR i XOR rade nad bitovima", () => {
    const cpu = run(
      ["LI x1, 12", "LI x2, 6", "AND x3, x1, x2", "OR x4, x1, x2", "XOR x5, x1, x2"].join("\n"),
    );
    expect(cpu.registers[3]).toBe(4); // 1100 & 0110
    expect(cpu.registers[4]).toBe(14); // 1100 | 0110
    expect(cpu.registers[5]).toBe(10); // 1100 ^ 0110
  });

  it("SLL pomera ulevo", () => {
    const cpu = run("LI x1, 1\nLI x2, 4\nSLL x3, x1, x2");
    expect(cpu.registers[3]).toBe(16);
  });

  it("SRL je logicko pomeranje - ne cuva znak", () => {
    // -8 >>> 1 daje 2147483644, dok bi aritmeticko >> dalo -4.
    const cpu = run("LI x1, -8\nLI x2, 1\nSRL x3, x1, x2");
    expect(cpu.registers[3]).toBe(-8 >>> 1);
    expect(cpu.registers[3]).not.toBe(-4);
  });

  it("pomeranje koristi samo donjih 5 bita", () => {
    // 33 & 0x1f = 1, pa je rezultat isti kao pomeranje za 1.
    const cpu = run("LI x1, 1\nLI x2, 33\nSLL x3, x1, x2");
    expect(cpu.registers[3]).toBe(2);
  });
});

describe("cpu - 32-bitno ponasanje", () => {
  it("zbir se preliva kao na pravom procesoru", () => {
    // Registri se pune direktno jer je 2147483647 van 12-bitnog opsega konstante.
    const cpu = cpuFor("ADD x3, x1, x2");
    cpu.registers[1] = 2147483647;
    cpu.registers[2] = 1;
    cpu.step();
    expect(cpu.registers[3]).toBe(-2147483648);
  });

  it("registri su celi brojevi sa znakom", () => {
    const cpu = cpuFor("ADDI x2, x1, 0");
    cpu.registers[1] = -1;
    cpu.step();
    expect(cpu.registers[2]).toBe(-1);
  });
});

describe("cpu - memorija", () => {
  it("SW pa LW vraca istu vrednost", () => {
    const cpu = run(["LI x1, 42", "SW x1, 0(x0)", "LW x2, 0(x0)"].join("\n"));
    expect(cpu.registers[2]).toBe(42);
  });

  it("rec se upisuje u little-endian poretku", () => {
    const cpu = cpuFor("SW x1, 0(x0)");
    cpu.registers[1] = 0x12345678;
    cpu.step();
    // Najnizi bajt ide na najnizu adresu.
    expect(Array.from(cpu.memory.slice(0, 4))).toEqual([0x78, 0x56, 0x34, 0x12]);
  });

  it("negativna vrednost prezivi upis i citanje", () => {
    const cpu = run(["LI x1, -5", "SW x1, 4(x0)", "LW x2, 4(x0)"].join("\n"));
    expect(cpu.registers[2]).toBe(-5);
  });

  it("adresa je zbir registra i offseta", () => {
    const cpu = run(["LI x1, 8", "LI x2, 99", "SW x2, 4(x1)"].join("\n"));
    expect(cpu.readWord(12)).toBe(99);
  });

  it("citanje iz nedirane memorije daje nulu", () => {
    const cpu = run("LW x1, 100(x0)");
    expect(cpu.registers[1]).toBe(0);
  });

  it("pamti adrese u koje je upisivano", () => {
    const cpu = run(["LI x1, 7", "SW x1, 0(x0)", "SW x1, 8(x0)"].join("\n"));
    expect([...cpu.writtenWords].sort((a, b) => a - b)).toEqual([0, 8]);
  });

  it("neporavnata adresa je greska", () => {
    const cpu = cpuFor("LW x1, 2(x0)");
    const result = cpu.step();
    expect(result.status).toBe("error");
    expect(result.message).toContain("poravnata");
  });

  it("adresa van memorije je greska", () => {
    // 2000 + 2000 + 96 = 4096, tacno iza kraja memorije od 4096 bajtova.
    const cpu = cpuFor(["LI x1, 2000", "LI x2, 2000", "ADD x3, x1, x2", "SW x1, 96(x3)"].join("\n"));

    let result = cpu.step();
    while (result.status === "ok") {
      result = cpu.step();
    }

    expect(result.status).toBe("error");
    expect(result.message).toContain("van memorije");
  });

  it("negativna adresa je greska", () => {
    const cpu = cpuFor("LW x1, -4(x0)");
    const result = cpu.step();
    expect(result.status).toBe("error");
    expect(result.message).toContain("van memorije");
  });

  it("reset brise memoriju i spisak upisanih adresa", () => {
    const cpu = run(["LI x1, 7", "SW x1, 0(x0)"].join("\n"));
    expect(cpu.writtenWords.size).toBe(1);

    cpu.reset();
    expect(cpu.readWord(0)).toBe(0);
    expect(cpu.writtenWords.size).toBe(0);
  });
});

describe("cpu - registar x0", () => {
  it("citanje iz x0 uvek daje nulu", () => {
    const cpu = run("ADD x1, x0, x0");
    expect(cpu.registers[1]).toBe(0);
  });

  it("upis u x0 se odbacuje", () => {
    const cpu = run("LI x0, 99");
    expect(cpu.registers[0]).toBe(0);
  });
});

describe("cpu - tok izvrsavanja", () => {
  it("PC raste za 4 po instrukciji", () => {
    const cpu = cpuFor("NOP\nNOP");
    expect(cpu.pc).toBe(0);
    cpu.step();
    expect(cpu.pc).toBe(4);
    cpu.step();
    expect(cpu.pc).toBe(8);
  });

  it("step vraca liniju izvorne instrukcije", () => {
    const cpu = cpuFor("\n\nLI x1, 1");
    expect(cpu.step().line).toBe(3);
  });

  it("posle poslednje instrukcije status je halted", () => {
    const cpu = cpuFor("NOP");
    expect(cpu.step().status).toBe("ok");
    expect(cpu.step().status).toBe("halted");
  });

  it("prazan program je odmah zavrsen", () => {
    const cpu = cpuFor("# samo komentar");
    expect(cpu.step().status).toBe("halted");
  });

  it("reset vraca registre i PC na nulu", () => {
    const cpu = run("LI x1, 5\nLI x2, 7");
    expect(cpu.registers[1]).toBe(5);

    cpu.reset();
    expect(cpu.pc).toBe(0);
    expect(cpu.registers[1]).toBe(0);
    expect(cpu.registers[2]).toBe(0);
  });

  it("instrukcije iz kasnijih milestone-ova jos nisu podrzane", () => {
    const cpu = cpuFor("BEQ x1, x0, kraj\nkraj:");
    const result = cpu.step();
    expect(result.status).toBe("error");
    expect(result.message).toContain("BEQ");
    expect(result.line).toBe(1);
  });
});

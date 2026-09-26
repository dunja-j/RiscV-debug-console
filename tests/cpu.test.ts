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

  it("poslednja poravnata rec u memoriji je dostupna", () => {
    const cpu = run(["LI x1, 2047", "LI x2, 77", "SW x2, 2045(x1)", "LW x3, 2045(x1)"].join("\n"));
    expect(cpu.readWord(4092)).toBe(77);
    expect(cpu.registers[3]).toBe(77);
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
});

describe("cpu - grane", () => {
  it("BEQ skace kad su registri jednaki", () => {
    const cpu = run(["BEQ x0, x0, kraj", "LI x1, 99", "kraj:"].join("\n"));
    expect(cpu.registers[1]).toBe(0);
  });

  it("BEQ ne skace kad se registri razlikuju", () => {
    const cpu = run(["LI x1, 1", "BEQ x1, x0, kraj", "LI x2, 99", "kraj:"].join("\n"));
    expect(cpu.registers[2]).toBe(99);
  });

  it("BNE skace kad se registri razlikuju", () => {
    const cpu = run(["LI x1, 1", "BNE x1, x0, kraj", "LI x2, 99", "kraj:"].join("\n"));
    expect(cpu.registers[2]).toBe(0);
  });

  it("BNE ne skace kad su registri jednaki", () => {
    const cpu = run(["BNE x0, x0, kraj", "LI x1, 99", "kraj:"].join("\n"));
    expect(cpu.registers[1]).toBe(99);
  });

  it("BLT poredi sa znakom", () => {
    // -1 < 1, iako bi kao brojevi bez znaka odnos bio obrnut.
    const cpu = run(["LI x1, -1", "LI x2, 1", "BLT x1, x2, kraj", "LI x3, 99", "kraj:"].join("\n"));
    expect(cpu.registers[3]).toBe(0);
  });

  it("BLT ne skace kad prvi registar nije manji", () => {
    const cpu = run(["LI x1, 1", "LI x2, -1", "BLT x1, x2, kraj", "LI x3, 99", "kraj:"].join("\n"));
    expect(cpu.registers[3]).toBe(99);
  });

  it("petlja broji do 10", () => {
    const cpu = run(
      [
        "LI x1, 0", // brojac
        "LI x2, 10", // granica
        "petlja:",
        "ADDI x1, x1, 1",
        "BLT x1, x2, petlja",
      ].join("\n"),
    );
    expect(cpu.registers[1]).toBe(10);
  });

  it("grana unazad vraca PC na tacnu instrukciju", () => {
    const cpu = cpuFor(["petlja:", "ADDI x1, x1, 1", "BNE x0, x0, petlja"].join("\n"));
    cpu.step();
    expect(cpu.pc).toBe(4);
  });
});

describe("cpu - skokovi", () => {
  it("JAL upisuje povratnu adresu i skace", () => {
    const cpu = cpuFor(["JAL x1, kraj", "NOP", "kraj:"].join("\n"));
    cpu.step();
    expect(cpu.registers[1]).toBe(4); // adresa instrukcije posle JAL
    expect(cpu.pc).toBe(8);
  });

  it("J ne cuva povratnu adresu jer pise u x0", () => {
    const cpu = cpuFor(["J kraj", "NOP", "kraj:"].join("\n"));
    cpu.step();
    expect(cpu.registers[0]).toBe(0);
    expect(cpu.pc).toBe(8);
  });

  it("JAL i RET izvrsavaju poziv funkcije", () => {
    const cpu = run(
      [
        "LI x5, 1",
        "JAL x1, funkcija",
        "ADDI x5, x5, 10", // izvrsava se posle povratka
        "J kraj",
        "funkcija:",
        "ADDI x5, x5, 100",
        "RET",
        "kraj:",
      ].join("\n"),
    );
    expect(cpu.registers[5]).toBe(111);
  });

  it("JALR racuna odrediste iz registra i offseta", () => {
    const cpu = cpuFor(["LI x1, 8", "JALR x2, 0(x1)", "NOP", "NOP"].join("\n"));
    cpu.step();
    cpu.step();
    expect(cpu.pc).toBe(8);
    expect(cpu.registers[2]).toBe(8); // povratna adresa je instrukcija posle JALR
  });

  it("JALR brise najnizi bit odredisne adrese", () => {
    const cpu = cpuFor(["LI x1, 9", "JALR x2, 0(x1)", "NOP"].join("\n"));
    cpu.step();
    const result = cpu.step();

    expect(result.status).toBe("ok");
    expect(cpu.pc).toBe(8);
  });

  it("JALR racuna odrediste pre upisa kada su rd i rs1 isti", () => {
    const cpu = cpuFor(["LI x1, 12", "JALR x1, 0(x1)", "NOP", "NOP"].join("\n"));
    cpu.step();
    cpu.step();

    expect(cpu.pc).toBe(12);
    expect(cpu.registers[1]).toBe(8);
  });

  it("neispravan JALR ne upisuje povratnu adresu", () => {
    const cpu = cpuFor(["LI x1, 2", "LI x2, 7", "JALR x2, 0(x1)"].join("\n"));
    cpu.step();
    cpu.step();
    const result = cpu.step();

    expect(result.status).toBe("error");
    expect(cpu.registers[2]).toBe(7);
  });

  it("skok tacno iza poslednje instrukcije zavrsava program", () => {
    const cpu = cpuFor(["J kraj", "NOP", "kraj:"].join("\n"));
    expect(cpu.step().status).toBe("ok");
    expect(cpu.step().status).toBe("halted");
  });

  it("skok van programa je greska", () => {
    const cpu = cpuFor(["LI x1, 400", "JALR x0, 0(x1)"].join("\n"));
    cpu.step();
    const result = cpu.step();
    expect(result.status).toBe("error");
    expect(result.message).toContain("van programa");
  });

  it("skok na neporavnatu adresu je greska", () => {
    const cpu = cpuFor(["LI x1, 2", "JALR x0, 0(x1)"].join("\n"));
    cpu.step();
    const result = cpu.step();
    expect(result.status).toBe("error");
    expect(result.message).toContain("neporavnatu");
  });
});

describe("cpu - run i limit instrukcija", () => {
  it("run izvrsava ceo program", () => {
    const cpu = cpuFor(["LI x1, 5", "LI x2, 7", "ADD x3, x1, x2"].join("\n"));
    expect(cpu.run().status).toBe("halted");
    expect(cpu.registers[3]).toBe(12);
  });

  it("run prepoznaje kraj kada je izvrsio tacno maxSteps instrukcija", () => {
    const cpu = cpuFor(["LI x1, 5", "LI x2, 7", "ADD x3, x1, x2"].join("\n"));
    expect(cpu.run({ maxSteps: 3 }).status).toBe("halted");
    expect(cpu.registers[3]).toBe(12);
  });

  it("run prekida beskonacnu petlju", () => {
    const cpu = cpuFor(["petlja:", "J petlja"].join("\n"));
    const result = cpu.run({ maxSteps: 1000 });
    expect(result.status).toBe("error");
    expect(result.message).toContain("beskonacna petlja");
  });

  it("run vraca gresku iz izvrsavanja", () => {
    const cpu = cpuFor("LW x1, 2(x0)");
    const result = cpu.run();
    expect(result.status).toBe("error");
    expect(result.message).toContain("poravnata");
  });

  it("run staje pred instrukcijom sa breakpointom", () => {
    const cpu = cpuFor(["LI x1, 1", "LI x2, 2", "LI x3, 3"].join("\n"));
    const result = cpu.run({ breakpoints: new Set([3]) });

    expect(result.status).toBe("breakpoint");
    expect(result.line).toBe(3);
    // Instrukcija sa breakpointa jos nije izvrsena.
    expect(cpu.registers[2]).toBe(2);
    expect(cpu.registers[3]).toBe(0);
  });

  it("ponovni run sa zaustavljene instrukcije ide dalje", () => {
    const cpu = cpuFor(["LI x1, 1", "LI x2, 2", "LI x3, 3"].join("\n"));
    const breakpoints = new Set([2]);

    expect(cpu.run({ breakpoints }).status).toBe("breakpoint");
    // Bez izvrsavanja bar jednog koraka, Run bi ovde ponovo stao na istoj liniji.
    expect(cpu.run({ breakpoints }).status).toBe("halted");
    expect(cpu.registers[3]).toBe(3);
  });

  it("run izvrsava trenutnu instrukciju i kad je na njoj breakpoint", () => {
    const cpu = cpuFor(["LI x1, 1", "LI x2, 2"].join("\n"));
    expect(cpu.run({ breakpoints: new Set([1]) }).status).toBe("halted");
    expect(cpu.registers[1]).toBe(1);
  });

  it("run nastavlja kad step dovede PC na instrukciju sa breakpointom", () => {
    const cpu = cpuFor(["LI x1, 1", "LI x2, 2"].join("\n"));
    expect(cpu.step().status).toBe("ok");
    expect(cpu.pc).toBe(4);

    expect(cpu.run({ breakpoints: new Set([2]) }).status).toBe("halted");
    expect(cpu.registers[2]).toBe(2);
  });

  it("breakpoint na liniji koja se ne izvrsava nema efekta", () => {
    const cpu = cpuFor(["# komentar", "LI x1, 1"].join("\n"));
    expect(cpu.run({ breakpoints: new Set([1]) }).status).toBe("halted");
  });
});

describe("cpu - koriscenje registara", () => {
  it("pamti registre u koje je pisano", () => {
    const cpu = run(["LI x1, 5", "LI x3, 7"].join("\n"));
    expect([...cpu.usedRegisters].sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it("registar ostaje zabelezen i kad mu se vrednost vrati na nulu", () => {
    const cpu = run(["LI x1, 5", "LI x1, 0"].join("\n"));
    expect(cpu.usedRegisters.has(1)).toBe(true);
  });

  it("x0 se nikad ne belezi", () => {
    const cpu = run("LI x0, 99");
    expect(cpu.usedRegisters.size).toBe(0);
  });

  it("reset brise spisak koriscenih registara", () => {
    const cpu = run("LI x1, 5");
    cpu.reset();
    expect(cpu.usedRegisters.size).toBe(0);
  });
});

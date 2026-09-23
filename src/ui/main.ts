import { assemble } from "../core/assembler";
import { Cpu } from "../core/cpu";

// PRIVREMENI UI (M3.5): textarea + Step + prikaz registara.
// Sluzi samo da se rad simulatora vidi pre nego sto u M6 stigne pravi raspored.

const PRIMER = ["# saberi 5 i 7", "LI x1, 5", "LI x2, 7", "ADD x3, x1, x2", "MV x4, x3"].join("\n");

const REGISTER_COUNT = 32;

const sourceInput = element<HTMLTextAreaElement>("#source");
const stepButton = element<HTMLButtonElement>("#step");
const resetButton = element<HTMLButtonElement>("#reset");
const statusOutput = element<HTMLElement>("#status");
const errorsOutput = element<HTMLElement>("#errors");
const programOutput = element<HTMLElement>("#program");
const registersOutput = element<HTMLElement>("#registers");

/** Procesor postoji tek kad se kod uspesno asemblira; izmena koda ga ponistava. */
let cpu: Cpu | null = null;

sourceInput.value = PRIMER;
sourceInput.addEventListener("input", reset);
stepButton.addEventListener("click", step);
resetButton.addEventListener("click", reset);
reset();

function step(): void {
  const running = cpu ?? loadProgram();
  if (running === null) {
    return;
  }

  const result = running.step();
  if (result.status === "halted") {
    setStatus("program zavrsen");
  } else if (result.status === "error") {
    setStatus(`greska (linija ${result.line}): ${result.message}`);
  } else {
    setStatus(`izvrsena linija ${result.line}`);
  }

  render();
}

function reset(): void {
  cpu = null;
  if (loadProgram() !== null) {
    setStatus("spremno");
  }
  render();
}

/** Asemblira kod iz editora; vraca null i ispisuje greske ako ih ima. */
function loadProgram(): Cpu | null {
  const { program, errors } = assemble(sourceInput.value);

  if (errors.length > 0) {
    errorsOutput.textContent = errors.map((e) => `Linija ${e.line}: ${e.message}`).join("\n");
    setStatus("kod se ne moze asemblirati");
    return null;
  }

  errorsOutput.textContent = "";
  cpu = new Cpu(program);
  return cpu;
}

function render(): void {
  programOutput.textContent = renderProgram();
  registersOutput.textContent = renderRegisters();
}

/** Izvorni kod sa markerom > na liniji koja se izvrsava sledeca. */
function renderProgram(): string {
  const currentLine = cpu?.currentInstruction?.sourceLine ?? null;

  return sourceInput.value
    .split("\n")
    .map((text, index) => {
      const marker = index + 1 === currentLine ? ">" : " ";
      return `${marker} ${String(index + 1).padStart(2)} | ${text}`;
    })
    .join("\n");
}

function renderRegisters(): string {
  const registers = cpu?.registers ?? new Int32Array(REGISTER_COUNT);

  const rows: string[] = [];
  for (let i = 0; i < REGISTER_COUNT; i++) {
    const value = registers[i];
    const hex = (value >>> 0).toString(16).toUpperCase().padStart(8, "0");
    rows.push(`x${String(i).padEnd(2)} ${hex} ${String(value).padStart(12)}`);
  }
  return rows.join("\n");
}

function setStatus(text: string): void {
  statusOutput.textContent = text;
}

function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (node === null) {
    throw new Error(`U HTML-u nema elementa '${selector}'`);
  }
  return node;
}

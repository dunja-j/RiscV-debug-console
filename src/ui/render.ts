import type { Cpu } from "../core/cpu";
import type { AsmError } from "../core/types";

// Iscrtavanje prikaza. Ovaj modul ne zna nista o dugmadima ni o dogadjajima -
// dobije stanje i ispise ga; sve povezivanje je u main.ts.
//
// Tekst se svuda upisuje preko textContent, nikad preko innerHTML: kod koji korisnik
// otkuca ne sme da se tumaci kao HTML.

const WORD_SIZE = 4;

/** Ispisuje kod sa brojevima linija, markerom tekuce instrukcije i mestom za breakpoint. */
export function renderListing(
  container: HTMLElement,
  source: string,
  currentLine: number | null,
): void {
  const rows = source.split("\n").map((text, index) => {
    const lineNumber = index + 1;
    const isCurrent = lineNumber === currentLine;

    const row = document.createElement("div");
    row.className = isCurrent ? "linija tekuca" : "linija";

    row.append(
      cell("breakpoint", ""),
      cell("marker", isCurrent ? ">" : ""),
      cell("broj", String(lineNumber)),
      cell("kod", text),
    );
    return row;
  });

  container.replaceChildren(...rows);
}

/** Ispisuje samo registre u koje je pisano. */
export function renderRegisters(container: HTMLElement, cpu: Cpu | null): void {
  const used = cpu === null ? [] : [...cpu.usedRegisters].sort((a, b) => a - b);

  if (cpu === null || used.length === 0) {
    container.replaceChildren(note("nijedan registar jos nije koriscen"));
    return;
  }

  container.replaceChildren(...used.map((num) => valueRow(`x${num}`, cpu.registers[num])));
}

/** Ispisuje samo reci memorije u koje je pisano. */
export function renderMemory(container: HTMLElement, cpu: Cpu | null): void {
  const written = cpu === null ? [] : [...cpu.writtenWords].sort((a, b) => a - b);

  if (cpu === null || written.length === 0) {
    container.replaceChildren(note("memorija jos nije menjana"));
    return;
  }

  container.replaceChildren(
    ...written.map((address) => valueRow(`${toHex(address, WORD_SIZE)}:`, cpu.readWord(address))),
  );
}

export function renderErrors(container: HTMLElement, errors: AsmError[]): void {
  const rows = errors.map((error) => {
    const row = document.createElement("div");
    row.textContent = `Linija ${error.line}: ${error.message}`;
    return row;
  });

  container.replaceChildren(...rows);
}

/** Red oblika: ime, heksadecimalna vrednost, decimalna vrednost sa znakom. */
function valueRow(label: string, value: number): HTMLElement {
  const row = document.createElement("div");
  row.className = "vrednost";
  row.append(cell("ime", label), cell("hex", toHex(value, 8)), cell("dec", String(value)));
  return row;
}

function cell(className: string, text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

function note(text: string): HTMLElement {
  const element = document.createElement("div");
  element.className = "napomena";
  element.textContent = text;
  return element;
}

/** `>>> 0` tumaci bitove kao broj bez znaka, pa se -1 ispisuje kao FFFFFFFF. */
function toHex(value: number, digits: number): string {
  return (value >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(digits, "0");
}

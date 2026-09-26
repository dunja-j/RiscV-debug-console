import { assemble } from "../core/assembler";
import { Cpu } from "../core/cpu";
import type { StepResult } from "../core/cpu";
import { PROGRAM_EXAMPLES } from "./examples";
import { renderErrors, renderListing, renderMemory, renderRegisters } from "./render";

// Povezivanje UI-ja sa logikom iz core/. Ovaj modul drzi stanje ekrana
// (rezim, ucitani procesor, breakpointi) i reaguje na dogadjaje;
// iscrtavanje je u render.ts.

/** U rezimu pisanja kod se menja; u rezimu izvrsavanja je zakljucan. */
type Mode = "pisanje" | "izvrsavanje";

const editor = element<HTMLTextAreaElement>("#editor");
const exampleSelect = element<HTMLSelectElement>("#example");
const listing = element<HTMLElement>("#listing");
const errorsPanel = element<HTMLElement>("#errors");
const registersPanel = element<HTMLElement>("#registers");
const memoryPanel = element<HTMLElement>("#memory");
const statusOutput = element<HTMLElement>("#status");

const assembleButton = element<HTMLButtonElement>("#assemble");
const editButton = element<HTMLButtonElement>("#edit");
const runButton = element<HTMLButtonElement>("#run");
const stepButton = element<HTMLButtonElement>("#step");
const resetButton = element<HTMLButtonElement>("#reset");
const breakpointButton = element<HTMLButtonElement>("#breakpoint");

let mode: Mode = "pisanje";
let cpu: Cpu | null = null;

/** Linije editora na kojima izvrsavanje treba da stane. */
const breakpoints = new Set<number>();
/** Linije koje nose instrukciju - samo na njima breakpoint ima smisla. */
let executableLines: ReadonlySet<number> = new Set();
/** Registri promenjeni poslednjom akcijom, radi isticanja u prikazu. */
let changedRegisters: ReadonlySet<number> = new Set();
/** Program je stigao do kraja ili je prekinut greskom. */
let finished = false;

for (const example of PROGRAM_EXAMPLES) {
  const option = document.createElement("option");
  option.value = example.id;
  option.textContent = example.name;
  exampleSelect.append(option);
}

editor.value = PROGRAM_EXAMPLES[0].source;
editor.addEventListener("input", onEdit);
exampleSelect.addEventListener("change", onExampleSelected);
assembleButton.addEventListener("click", enterRunMode);
editButton.addEventListener("click", enterEditMode);
runButton.addEventListener("click", onRun);
stepButton.addEventListener("click", onStep);
resetButton.addEventListener("click", onReset);
breakpointButton.addEventListener("click", toggleBreakpointAtCurrentLine);
listing.addEventListener("click", onListingClick);

enterEditMode();

/** Asemblira kod i prelazi u rezim izvrsavanja; kod sa greskama ostaje u pisanju. */
function enterRunMode(): void {
  const result = assemble(editor.value);
  renderErrors(errorsPanel, result.errors);

  if (result.errors.length > 0) {
    setStatus(`gresaka u kodu: ${result.errors.length}`);
    return;
  }

  cpu = new Cpu(result.program);
  executableLines = new Set(result.program.map((instruction) => instruction.sourceLine));
  mode = "izvrsavanje";
  finished = false;
  changedRegisters = new Set();
  setStatus("spremno za izvrsavanje");
  render();
}

function enterEditMode(): void {
  cpu = null;
  mode = "pisanje";
  finished = false;
  changedRegisters = new Set();
  // Izmenom koda se brojevi linija pomeraju, pa bi breakpointi zavrsili na pogresnim mestima.
  breakpoints.clear();
  renderErrors(errorsPanel, []);
  setStatus("rezim pisanja");
  render();
}

/** Izmena koda ponistava ranije prijavljene greske - vise se ne odnose na tekst u editoru. */
function onEdit(): void {
  renderErrors(errorsPanel, []);
  setStatus("kod je izmenjen - pritisni Asembliraj");
}

function onExampleSelected(): void {
  const example = PROGRAM_EXAMPLES.find((item) => item.id === exampleSelect.value);
  if (example === undefined) {
    return;
  }

  editor.value = example.source;
  exampleSelect.value = "";
  onEdit();
  editor.focus();
  editor.setSelectionRange(0, 0);
  editor.scrollTop = 0;
}

function onStep(): void {
  if (cpu === null) {
    return;
  }
  const before = Int32Array.from(cpu.registers);
  applyResult(cpu.step(), before);
}

function onRun(): void {
  if (cpu === null) {
    return;
  }
  const before = Int32Array.from(cpu.registers);
  applyResult(cpu.run({ breakpoints }), before);
}

function onReset(): void {
  if (cpu === null) {
    return;
  }
  cpu.reset();
  finished = false;
  changedRegisters = new Set();
  setStatus("ponisteno - izvrsavanje krece od pocetka");
  render();
}

/** Belezi ishod koraka: poruka u statusu, istaknuti registri i eventualni kraj izvrsavanja. */
function applyResult(result: StepResult, before: Int32Array): void {
  if (cpu === null) {
    return;
  }
  changedRegisters = changedSince(before, cpu.registers);

  switch (result.status) {
    case "ok":
      setStatus(`izvrsena linija ${result.line}`);
      break;
    case "breakpoint":
      setStatus(`zaustavljeno na breakpointu (linija ${result.line})`);
      break;
    case "halted":
      finished = true;
      setStatus("program zavrsen");
      break;
    case "error":
      finished = true;
      setStatus(`greska (linija ${result.line}): ${result.message}`);
      break;
  }

  render();
}

function changedSince(before: Int32Array, after: Int32Array): Set<number> {
  const changed = new Set<number>();
  for (let i = 0; i < after.length; i++) {
    if (before[i] !== after[i]) {
      changed.add(i);
    }
  }
  return changed;
}

function onListingClick(event: MouseEvent): void {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }
  const row = event.target.closest<HTMLElement>(".linija");
  const line = Number(row?.dataset.line);
  if (Number.isInteger(line)) {
    toggleBreakpoint(line);
  }
}

function toggleBreakpointAtCurrentLine(): void {
  const line = cpu?.currentInstruction?.sourceLine;
  if (line !== undefined) {
    toggleBreakpoint(line);
  }
}

function toggleBreakpoint(line: number): void {
  if (!executableLines.has(line)) {
    setStatus(`linija ${line} ne nosi instrukciju`);
    return;
  }

  if (breakpoints.has(line)) {
    breakpoints.delete(line);
  } else {
    breakpoints.add(line);
  }
  render();
}

function render(): void {
  const running = mode === "izvrsavanje";

  editor.hidden = running;
  listing.hidden = !running;

  assembleButton.disabled = running;
  editButton.disabled = !running;
  exampleSelect.disabled = running;
  runButton.disabled = !running || finished;
  stepButton.disabled = !running || finished;
  resetButton.disabled = !running;
  breakpointButton.disabled = !running || finished;

  if (running) {
    const currentLine = cpu?.currentInstruction?.sourceLine ?? null;
    renderListing(listing, editor.value, currentLine, breakpoints, executableLines);
  }

  renderRegisters(registersPanel, cpu, changedRegisters);
  renderMemory(memoryPanel, cpu);
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

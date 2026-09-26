import { assemble } from "../core/assembler";
import { Cpu } from "../core/cpu";
import { renderErrors, renderListing, renderMemory, renderRegisters } from "./render";

// Povezivanje UI-ja sa logikom iz core/. Ovaj modul drzi stanje ekrana
// (rezim i ucitani procesor) i reaguje na dogadjaje; iscrtavanje je u render.ts.
//
// M6 pravi izgled i oba rezima; dugmad Step, Run, Reset i Breakpoint
// dobijaju ponasanje u M7.

const PRIMER = [
  "# zbir brojeva od 1 do 5",
  "LI x1, 0        # zbir",
  "LI x2, 1        # brojac",
  "LI x3, 6        # granica",
  "",
  "petlja:",
  "ADD x1, x1, x2",
  "ADDI x2, x2, 1",
  "BLT x2, x3, petlja",
  "",
  "SW x1, 0(x0)    # rezultat u memoriju",
].join("\n");

/** U rezimu pisanja kod se menja; u rezimu izvrsavanja je zakljucan. */
type Mode = "pisanje" | "izvrsavanje";

const editor = element<HTMLTextAreaElement>("#editor");
const listing = element<HTMLElement>("#listing");
const errorsPanel = element<HTMLElement>("#errors");
const registersPanel = element<HTMLElement>("#registers");
const memoryPanel = element<HTMLElement>("#memory");
const statusOutput = element<HTMLElement>("#status");

const assembleButton = element<HTMLButtonElement>("#assemble");
const editButton = element<HTMLButtonElement>("#edit");

let mode: Mode = "pisanje";
let cpu: Cpu | null = null;

editor.value = PRIMER;
editor.addEventListener("input", checkCode);
assembleButton.addEventListener("click", enterRunMode);
editButton.addEventListener("click", enterEditMode);

enterEditMode();

/** Asemblira kod i prelazi u rezim izvrsavanja; kod sa greskama ostaje u pisanju. */
function enterRunMode(): void {
  const result = assemble(editor.value);
  renderErrors(errorsPanel, result.errors);

  if (result.errors.length > 0) {
    setStatus("kod ima gresaka - ispravi ih pre pokretanja");
    return;
  }

  cpu = new Cpu(result.program);
  mode = "izvrsavanje";
  setStatus("spremno za izvrsavanje");
  render();
}

function enterEditMode(): void {
  cpu = null;
  mode = "pisanje";
  checkCode();
  render();
}

/** Prijavljuje greske dok se kuca, ne menjajuci rezim. */
function checkCode(): void {
  const { errors } = assemble(editor.value);
  renderErrors(errorsPanel, errors);
  setStatus(errors.length === 0 ? "kod je ispravan" : `gresaka u kodu: ${errors.length}`);
}

function render(): void {
  const running = mode === "izvrsavanje";

  editor.hidden = running;
  listing.hidden = !running;
  assembleButton.disabled = running;
  editButton.disabled = !running;

  if (running) {
    renderListing(listing, editor.value, cpu?.currentInstruction?.sourceLine ?? null);
  }

  renderRegisters(registersPanel, cpu);
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

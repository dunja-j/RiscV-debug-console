interface InstructionDocumentation {
  mnemonic: string;
  format: string;
  description: string;
}

const INSTRUCTIONS: readonly InstructionDocumentation[] = [
  {
    mnemonic: "ADD",
    format: "ADD rd, rs1, rs2",
    description: "Sabira registre rs1 i rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "SUB",
    format: "SUB rd, rs1, rs2",
    description: "Oduzima rs2 od rs1 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "ADDI",
    format: "ADDI rd, rs1, imm",
    description: "Sabira rs1 i konstantu imm i rezultat upisuje u rd.",
  },
  {
    mnemonic: "AND",
    format: "AND rd, rs1, rs2",
    description: "Vrsi bitsko AND nad rs1 i rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "OR",
    format: "OR rd, rs1, rs2",
    description: "Vrsi bitsko OR nad rs1 i rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "XOR",
    format: "XOR rd, rs1, rs2",
    description: "Vrsi bitsko XOR nad rs1 i rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "SLL",
    format: "SLL rd, rs1, rs2",
    description: "Pomera rs1 ulevo za broj mesta iz rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "SRL",
    format: "SRL rd, rs1, rs2",
    description: "Logicki pomera rs1 udesno za broj mesta iz rs2 i rezultat upisuje u rd.",
  },
  {
    mnemonic: "LW",
    format: "LW rd, offset(rs1)",
    description: "Ucitava rec sa adrese rs1 + offset u rd.",
  },
  {
    mnemonic: "SW",
    format: "SW rs2, offset(rs1)",
    description: "Upisuje vrednost iz rs2 na adresu rs1 + offset.",
  },
  {
    mnemonic: "BEQ",
    format: "BEQ rs1, rs2, labela",
    description: "Skace na labelu ako su rs1 i rs2 jednaki.",
  },
  {
    mnemonic: "BNE",
    format: "BNE rs1, rs2, labela",
    description: "Skace na labelu ako rs1 i rs2 nisu jednaki.",
  },
  {
    mnemonic: "BLT",
    format: "BLT rs1, rs2, labela",
    description: "Skace na labelu ako je rs1 manje od rs2.",
  },
  {
    mnemonic: "JAL",
    format: "JAL rd, labela",
    description: "Skace na labelu i upisuje povratnu adresu u rd.",
  },
  {
    mnemonic: "JALR",
    format: "JALR rd, offset(rs1)",
    description: "Skace na adresu rs1 + offset i upisuje povratnu adresu u rd.",
  },
];

const PSEUDO_INSTRUCTIONS: readonly InstructionDocumentation[] = [
  {
    mnemonic: "LI",
    format: "LI rd, imm",
    description: "Ucitava konstantu imm u rd.",
  },
  {
    mnemonic: "MV",
    format: "MV rd, rs",
    description: "Kopira vrednost iz rs u rd.",
  },
  {
    mnemonic: "NOP",
    format: "NOP",
    description: "Ne menja stanje procesora.",
  },
  {
    mnemonic: "J",
    format: "J labela",
    description: "Bezuslovno skace na labelu.",
  },
  {
    mnemonic: "RET",
    format: "RET",
    description: "Vraca se na adresu iz registra x1.",
  },
];

export function initializeDocumentation(
  dialog: HTMLDialogElement,
  openButton: HTMLButtonElement,
  content: HTMLElement,
): void {
  content.replaceChildren(
    section("Instrukcije", INSTRUCTIONS),
    section("Pseudo-instrukcije", PSEUDO_INSTRUCTIONS),
    note("Registri: x0-x31 | Komentar: # | Labela: ime: | Konstante: decimalne ili 0x hex"),
  );

  openButton.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
  });
}

function section(title: string, instructions: readonly InstructionDocumentation[]): HTMLElement {
  const sectionElement = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = title;

  const table = document.createElement("table");
  table.append(tableHeader(), tableBody(instructions));
  sectionElement.append(heading, table);
  return sectionElement;
}

function tableHeader(): HTMLTableSectionElement {
  const head = document.createElement("thead");
  const row = document.createElement("tr");
  row.append(headerCell("Instrukcija"), headerCell("Format"), headerCell("Opis"));
  head.append(row);
  return head;
}

function tableBody(instructions: readonly InstructionDocumentation[]): HTMLTableSectionElement {
  const body = document.createElement("tbody");
  for (const instruction of instructions) {
    const row = document.createElement("tr");
    row.append(
      codeCell(instruction.mnemonic),
      codeCell(instruction.format),
      textCell(instruction.description),
    );
    body.append(row);
  }
  return body;
}

function headerCell(text: string): HTMLTableCellElement {
  const cell = document.createElement("th");
  cell.scope = "col";
  cell.textContent = text;
  return cell;
}

function codeCell(text: string): HTMLTableCellElement {
  const cell = document.createElement("td");
  const code = document.createElement("code");
  code.textContent = text;
  cell.append(code);
  return cell;
}

function textCell(text: string): HTMLTableCellElement {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function note(text: string): HTMLElement {
  const paragraph = document.createElement("p");
  paragraph.className = "dokumentacija-napomena";
  paragraph.textContent = text;
  return paragraph;
}

// Turns the AI's Markdown answer into clean sections and question cards.

export const cleanText = (text) =>
  String(text)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[\u2B50\u2605\u2606\u2600-\u27BF\uFE0F\u200D]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

// The PDF font only supports basic Latin characters.
export const pdfSafe = (text) =>
  String(text)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");

export function importanceLevel(text) {
  const value = String(text || "").toLowerCase();

  if (/extreme|super|critical|must/.test(value)) return "high";
  if (/very/.test(value)) return "mid";
  if (/important/.test(value)) return "low";

  return "none";
}

function titleCase(text) {
  if (!text || text !== text.toUpperCase()) return text;

  return text
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bVtu\b/g, "VTU")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bOcr\b/g, "OCR")
    .replace(/\bPdf\b/g, "PDF");
}

const KNOWN_LABEL =
  /^(question or concept|question|importance|why it is important|why it matters|why|reason for priority|reason|repeated in|number of appearances|appearances|evidence of repetition|evidence|supporting papers?|supporting paper names)\s*:\s*(.+)$/i;

function makeRow(rawText) {
  const text = cleanText(rawText);
  const match = text.match(KNOWN_LABEL);

  if (match) return { label: match[1], value: match[2].trim() };

  return { text };
}

export function parseReport(markdown) {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");

  const report = { title: "", sections: [] };

  let section = null;
  let card = null;

  const getSection = () => {
    if (!section) {
      section = { number: "", title: "", blocks: [] };
      report.sections.push(section);
    }
    return section;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("```") || /^[-*_]{3,}$/.test(line)) {
      continue;
    }

    let match = line.match(/^#\s+(.+)$/);

    if (match) {
      report.title = cleanText(match[1]);
      section = null;
      card = null;
      continue;
    }

    match = line.match(/^##\s+(.+)$/);

    if (match) {
      const heading = cleanText(match[1]);
      const parts = heading.match(/^(\d+)[.)]\s*(.*)$/);

      section = {
        number: parts ? parts[1] : "",
        title: titleCase(parts ? parts[2] : heading),
        blocks: [],
      };

      report.sections.push(section);
      card = null;
      continue;
    }

    match = line.match(/^#{3,6}\s+(.+)$/);

    if (match) {
      card = {
        type: "card",
        title: titleCase(cleanText(match[1])),
        rows: [],
      };

      getSection().blocks.push(card);
      continue;
    }

    const bullet = line.match(/^[-*\u2022]\s+(.+)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);

    const row = makeRow(bullet ? bullet[1] : numbered ? numbered[2] : line);

    // "Question: ..." starts a new card
    if (row.label && /^question/i.test(row.label)) {
      card = { type: "card", title: row.value, rows: [] };
      getSection().blocks.push(card);
      continue;
    }

    if (card) {
      card.rows.push(row);
    } else {
      getSection().blocks.push({
        type: numbered ? "number" : bullet ? "bullet" : "para",
        n: numbered ? numbered[1] : "",
        row,
      });
    }
  }

  return report;
}

// Plain text of a block, used by the search box
export function blockText(block) {
  if (block.type === "card") {
    const rows = block.rows
      .map((row) => (row.label ? `${row.label} ${row.value}` : row.text))
      .join(" ");

    return `${block.title} ${rows}`;
  }

  const row = block.row || {};

  return row.label ? `${row.label} ${row.value}` : row.text || "";
}
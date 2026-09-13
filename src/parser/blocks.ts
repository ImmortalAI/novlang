export interface RawBlock {
  kind: "heading" | "sceneBreak" | "blockquote" | "footnoteDef" | "paragraph";
  text: string;
  startLine: number;
  quoteParagraphs?: { text: string; startLine: number }[];
  footnoteId?: string;
}

const FOOTNOTE_DEF_RE = /^\[\^([^\]]+)\]:\s?(.*)$/;

function isBlank(line: string): boolean {
  return line.trim() === "";
}

function isSceneBreak(line: string): boolean {
  return line.trim() === "***";
}

function isQuoteLine(line: string): boolean {
  return line.startsWith(">");
}

function isQuoteBlankLine(line: string): boolean {
  return line.trim() === ">";
}

function stripQuoteMarker(line: string): string {
  return line.replace(/^>\s?/, "");
}

export function splitIntoRawBlocks(source: string): RawBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: RawBlock[] = [];
  let i = 0;

  if (lines.length > 0 && /^#\s+/.test(lines[0])) {
    blocks.push({
      kind: "heading",
      text: lines[0].replace(/^#\s+/, ""),
      startLine: 1,
    });
    i = 1;
  }

  while (i < lines.length) {
    if (isBlank(lines[i])) {
      i++;
      continue;
    }
    if (isSceneBreak(lines[i])) {
      blocks.push({ kind: "sceneBreak", text: "", startLine: i + 1 });
      i++;
      continue;
    }
    if (isQuoteLine(lines[i])) {
      const startLine = i + 1;
      const quoteLines: { line: string; lineNo: number }[] = [];
      while (i < lines.length && isQuoteLine(lines[i])) {
        quoteLines.push({ line: lines[i], lineNo: i + 1 });
        i++;
      }
      const quoteParagraphs: { text: string; startLine: number }[] = [];
      let current: string[] = [];
      let currentStart = startLine;
      for (const { line, lineNo } of quoteLines) {
        if (isQuoteBlankLine(line)) {
          if (current.length > 0) {
            quoteParagraphs.push({ text: current.join("\n"), startLine: currentStart });
            current = [];
          }
          continue;
        }
        if (current.length === 0) currentStart = lineNo;
        current.push(stripQuoteMarker(line));
      }
      if (current.length > 0) {
        quoteParagraphs.push({ text: current.join("\n"), startLine: currentStart });
      }
      blocks.push({ kind: "blockquote", text: "", startLine, quoteParagraphs });
      continue;
    }
    const footnoteMatch = FOOTNOTE_DEF_RE.exec(lines[i]);
    if (footnoteMatch) {
      const startLine = i + 1;
      const chunkLines = [footnoteMatch[2]];
      i++;
      while (i < lines.length && !isBlank(lines[i])) {
        chunkLines.push(lines[i]);
        i++;
      }
      blocks.push({
        kind: "footnoteDef",
        text: chunkLines.join("\n"),
        startLine,
        footnoteId: footnoteMatch[1],
      });
      continue;
    }
    const startLine = i + 1;
    const chunkLines: string[] = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !isSceneBreak(lines[i]) &&
      !isQuoteLine(lines[i]) &&
      !FOOTNOTE_DEF_RE.test(lines[i])
    ) {
      chunkLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: chunkLines.join("\n"), startLine });
  }

  return blocks;
}

export interface RawBlock {
  kind: "heading" | "paragraph";
  text: string;
  startLine: number;
}

function isBlank(line: string): boolean {
  return line.trim() === "";
}

export function splitIntoRawBlocks(source: string): RawBlock[] {
  const lines = source.split("\n");
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
    const startLine = i + 1;
    const chunkLines: string[] = [];
    while (i < lines.length && !isBlank(lines[i])) {
      chunkLines.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", text: chunkLines.join("\n"), startLine });
  }

  return blocks;
}

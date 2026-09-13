import type { Diagnostic, InlineNode } from "../types";

const ESCAPABLE = new Set(["*", "\\", "[", "]", "!"]);

export function parseInline(
  text: string,
  startLine: number,
  diagnostics: Diagnostic[]
): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length && ESCAPABLE.has(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }
    buffer += ch;
    i++;
  }
  if (buffer) nodes.push({ type: "text", value: buffer });
  return nodes;
}

import type { Diagnostic, InlineNode } from "../types";
import { computePosition } from "./position";

const ESCAPABLE = new Set(["*", "\\", "[", "]", "!"]);

type RawItem =
  | { kind: "text"; value: string }
  | { kind: "image"; alt: string; src: string }
  | { kind: "delim"; count: number; canOpen: boolean; canClose: boolean; offset: number };

// Brackets inside the alt text are not supported in v1: `![a[b]c](x.png)` stays literal.
function matchImage(
  text: string,
  start: number
): { alt: string; src: string; length: number } | null {
  const head = /^!\[([^\]]*)\]\(/.exec(text.slice(start));
  if (!head) return null;
  const srcStart = start + head[0].length;
  let depth = 1;
  for (let i = srcStart; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) {
        return {
          alt: head[1],
          src: text.slice(srcStart, i),
          length: i + 1 - start,
        };
      }
    }
  }
  return null;
}

function tokenize(text: string): RawItem[] {
  const items: RawItem[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      items.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length && ESCAPABLE.has(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }
    if (ch === "!" && text[i + 1] === "[") {
      const image = matchImage(text, i);
      if (image) {
        flush();
        items.push({ kind: "image", alt: image.alt, src: image.src });
        i += image.length;
        continue;
      }
    }
    if (ch === "*") {
      const start = i;
      let count = 0;
      while (text[i] === "*") {
        count++;
        i++;
      }
      const prev = start > 0 ? text[start - 1] : undefined;
      const next = i < text.length ? text[i] : undefined;
      flush();
      items.push({
        kind: "delim",
        count,
        canOpen: next !== undefined && !/\s/.test(next),
        canClose: prev !== undefined && !/\s/.test(prev),
        offset: start,
      });
      continue;
    }
    buffer += ch;
    i++;
  }
  flush();
  return items;
}

function mergeAdjacentText(nodes: InlineNode[]): InlineNode[] {
  const merged: InlineNode[] = [];
  for (const node of nodes) {
    const last = merged[merged.length - 1];
    if (node.type === "text" && last?.type === "text") {
      merged[merged.length - 1] = { type: "text", value: last.value + node.value };
    } else {
      merged.push(node);
    }
  }
  return merged;
}

interface OpenDelim {
  outputIndex: number;
  count: number;
  offset: number;
}

function resolveDelimiters(
  items: RawItem[],
  startLine: number,
  text: string,
  diagnostics: Diagnostic[]
): InlineNode[] {
  const output: InlineNode[] = [];
  const stack: OpenDelim[] = [];
  const unmatchedOffsets: number[] = [];

  for (const item of items) {
    if (item.kind === "text") {
      output.push({ type: "text", value: item.value });
      continue;
    }

    if (item.kind === "image") {
      output.push({ type: "image", alt: item.alt, src: item.src });
      continue;
    }

    let remaining = item.count;
    let offset = item.offset;

    while (remaining > 0 && item.canClose && stack.length > 0) {
      const top = stack[stack.length - 1];
      const usable = remaining >= 2 && top.count >= 2 ? 2 : 1;
      const content = mergeAdjacentText(output.splice(top.outputIndex));
      output.push(
        usable === 2
          ? { type: "strong", children: content }
          : { type: "emphasis", children: content }
      );
      top.count -= usable;
      remaining -= usable;
      offset += usable;
      if (top.count === 0) stack.pop();
    }

    if (remaining > 0) {
      if (item.canOpen) {
        stack.push({ outputIndex: output.length, count: remaining, offset });
      } else {
        output.push({ type: "text", value: "*".repeat(remaining) });
        unmatchedOffsets.push(offset);
      }
    }
  }

  // Splice leftover openers back as literal text, highest index first so that
  // the not-yet-processed lower indices stay valid.
  for (let k = stack.length - 1; k >= 0; k--) {
    const entry = stack[k];
    output.splice(entry.outputIndex, 0, { type: "text", value: "*".repeat(entry.count) });
    unmatchedOffsets.push(entry.offset);
  }

  for (const offset of unmatchedOffsets.sort((a, b) => a - b)) {
    diagnostics.push({
      severity: "warning",
      message: "Unmatched '*' delimiter, rendered as literal text",
      position: computePosition(startLine, text, offset),
    });
  }

  return mergeAdjacentText(output);
}

export function parseInline(
  text: string,
  startLine: number,
  diagnostics: Diagnostic[]
): InlineNode[] {
  return resolveDelimiters(tokenize(text), startLine, text, diagnostics);
}

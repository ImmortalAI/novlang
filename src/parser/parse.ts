import type { BlockNode, Diagnostic, ParseResult } from "../types";
import { splitIntoRawBlocks, type RawBlock } from "./blocks";
import { parseInline } from "./inline";

export function parse(source: string): ParseResult {
  const diagnostics: Diagnostic[] = [];
  const rawBlocks = splitIntoRawBlocks(source);

  const footnoteDefsById = new Map<string, RawBlock>();
  for (const block of rawBlocks) {
    if (block.kind !== "footnoteDef") continue;
    const id = block.footnoteId!;
    if (footnoteDefsById.has(id)) {
      diagnostics.push({
        severity: "warning",
        message: `Duplicate footnote definition for "^${id}"; using the first occurrence`,
        position: { line: block.startLine, column: 1 },
      });
      continue;
    }
    footnoteDefsById.set(id, block);
  }

  const children: BlockNode[] = [];
  for (const block of rawBlocks) {
    if (block.kind === "heading") {
      children.push({
        type: "heading",
        children: parseInline(block.text, block.startLine, diagnostics),
      });
    } else if (block.kind === "sceneBreak") {
      children.push({ type: "sceneBreak" });
    } else if (block.kind === "blockquote") {
      children.push({
        type: "blockquote",
        children: (block.quoteParagraphs ?? []).map((p) => ({
          type: "paragraph" as const,
          children: parseInline(p.text, p.startLine, diagnostics),
        })),
      });
    } else if (block.kind === "footnoteDef") {
      // A duplicate id was already diagnosed above; only the winning block is emitted.
      if (footnoteDefsById.get(block.footnoteId!) !== block) continue;
      children.push({
        type: "footnoteDef",
        id: block.footnoteId!,
        children: [
          {
            type: "paragraph",
            children: parseInline(block.text, block.startLine, diagnostics),
          },
        ],
      });
    } else {
      children.push({
        type: "paragraph",
        children: parseInline(block.text, block.startLine, diagnostics),
      });
    }
  }

  return { document: { type: "document", children }, diagnostics };
}

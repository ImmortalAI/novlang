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
        message: `Duplicate footnote definition for "^${id}"; the first one is used and this text is kept as a paragraph`,
        position: { line: block.startLine, column: 1 },
      });
      continue;
    }
    footnoteDefsById.set(id, block);
  }

  const footnoteIds = new Set(footnoteDefsById.keys());

  const children: BlockNode[] = [];
  for (const block of rawBlocks) {
    if (block.kind === "heading") {
      children.push({
        type: "heading",
        children: parseInline(block.text, block.startLine, diagnostics, footnoteIds),
      });
    } else if (block.kind === "sceneBreak") {
      children.push({ type: "sceneBreak" });
    } else if (block.kind === "blockquote") {
      children.push({
        type: "blockquote",
        children: (block.quoteParagraphs ?? []).map((p) => ({
          type: "paragraph" as const,
          children: parseInline(p.text, p.startLine, diagnostics, footnoteIds),
        })),
      });
    } else if (block.kind === "footnoteDef") {
      // A duplicate id was already diagnosed above. The losing definition keeps its
      // text as a paragraph rather than vanishing — this library never discards what
      // the writer typed. It must not become a second footnoteDef: two elements with
      // id="fn-1" is invalid HTML and an epubcheck duplicate-ID error.
      if (footnoteDefsById.get(block.footnoteId!) !== block) {
        children.push({
          type: "paragraph",
          children: parseInline(block.text, block.startLine, diagnostics, footnoteIds),
        });
        continue;
      }
      children.push({
        type: "footnoteDef",
        id: block.footnoteId!,
        children: [
          {
            type: "paragraph",
            children: parseInline(block.text, block.startLine, diagnostics, footnoteIds),
          },
        ],
      });
    } else {
      children.push({
        type: "paragraph",
        children: parseInline(block.text, block.startLine, diagnostics, footnoteIds),
      });
    }
  }

  diagnostics.sort(
    (a, b) =>
      (a.position?.line ?? 0) - (b.position?.line ?? 0) ||
      (a.position?.column ?? 0) - (b.position?.column ?? 0)
  );

  return { document: { type: "document", children }, diagnostics };
}

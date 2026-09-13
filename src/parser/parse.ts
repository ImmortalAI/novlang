import type { BlockNode, Diagnostic, ParseResult } from "../types";
import { splitIntoRawBlocks } from "./blocks";

export function parse(source: string): ParseResult {
  const diagnostics: Diagnostic[] = [];
  const rawBlocks = splitIntoRawBlocks(source);
  const children: BlockNode[] = [];

  for (const block of rawBlocks) {
    if (block.kind === "heading") {
      children.push({
        type: "heading",
        children: [{ type: "text", value: block.text }],
      });
    } else if (block.kind === "sceneBreak") {
      children.push({ type: "sceneBreak" });
    } else if (block.kind === "blockquote") {
      children.push({
        type: "blockquote",
        children: (block.quoteParagraphs ?? []).map((p) => ({
          type: "paragraph" as const,
          children: [{ type: "text" as const, value: p.text }],
        })),
      });
    } else {
      children.push({
        type: "paragraph",
        children: [{ type: "text", value: block.text }],
      });
    }
  }

  return { document: { type: "document", children }, diagnostics };
}

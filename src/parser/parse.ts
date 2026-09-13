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
    } else {
      children.push({
        type: "paragraph",
        children: [{ type: "text", value: block.text }],
      });
    }
  }

  return { document: { type: "document", children }, diagnostics };
}

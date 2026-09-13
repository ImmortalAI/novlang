import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("footnoteDef", () => {
  it("parses '[^id]: text' as a footnote definition block", () => {
    const { document, diagnostics } = parse("[^1]: This is the footnote text.");
    expect(diagnostics).toEqual([]);
    expect(document.children).toEqual([
      {
        type: "footnoteDef",
        id: "1",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "This is the footnote text." }],
          },
        ],
      },
    ]);
  });

  it("keeps definitions in source order regardless of where they appear", () => {
    const { document } = parse("[^b]: second defined first\n\n[^a]: first defined second");
    expect(document.children.map((b) => (b.type === "footnoteDef" ? b.id : null))).toEqual([
      "b",
      "a",
    ]);
  });

  it("warns on a duplicate footnote id and keeps the first occurrence", () => {
    const { document, diagnostics } = parse("[^1]: first text\n\n[^1]: second text");
    expect(document.children).toHaveLength(1);
    const def = document.children[0];
    if (def.type !== "footnoteDef") throw new Error("expected footnoteDef");
    expect(def.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "first text" }] },
    ]);
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        message: 'Duplicate footnote definition for "^1"; using the first occurrence',
        position: { line: 3, column: 1 },
      },
    ]);
  });
});

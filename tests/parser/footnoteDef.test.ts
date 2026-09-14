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

  it("keeps back-to-back definitions separate with no blank line between them", () => {
    const { document, diagnostics } = parse("[^1]: Note one.\n[^2]: Note two.");
    expect(diagnostics).toEqual([]);
    expect(document.children).toEqual([
      {
        type: "footnoteDef",
        id: "1",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Note one." }] }],
      },
      {
        type: "footnoteDef",
        id: "2",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Note two." }] }],
      },
    ]);
  });

  it("warns on a duplicate footnote id, keeps the first, and never drops the loser's text", () => {
    const { document, diagnostics } = parse("[^1]: first text\n\n[^1]: second text");
    expect(document.children).toEqual([
      {
        type: "footnoteDef",
        id: "1",
        children: [{ type: "paragraph", children: [{ type: "text", value: "first text" }] }],
      },
      { type: "paragraph", children: [{ type: "text", value: "second text" }] },
    ]);
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        message:
          'Duplicate footnote definition for "^1"; the first one is used and this text is kept as a paragraph',
        position: { line: 3, column: 1 },
      },
    ]);
  });

  it("ends a definition at a scene break", () => {
    const { document } = parse("[^1]: note\n***\nAfter.");
    expect(document.children).toEqual([
      {
        type: "footnoteDef",
        id: "1",
        children: [{ type: "paragraph", children: [{ type: "text", value: "note" }] }],
      },
      { type: "sceneBreak" },
      { type: "paragraph", children: [{ type: "text", value: "After." }] },
    ]);
  });

  it("ends a definition at a quote line", () => {
    const { document } = parse("[^1]: note\n> Quoted.");
    expect(document.children).toEqual([
      {
        type: "footnoteDef",
        id: "1",
        children: [{ type: "paragraph", children: [{ type: "text", value: "note" }] }],
      },
      {
        type: "blockquote",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Quoted." }] }],
      },
    ]);
  });
});

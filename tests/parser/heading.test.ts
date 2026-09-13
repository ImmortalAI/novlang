import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("heading", () => {
  it("parses a leading '# ' line as the chapter heading", () => {
    const { document, diagnostics } = parse("# Глава 12. Пробуждение");
    expect(diagnostics).toEqual([]);
    expect(document.children[0]).toEqual({
      type: "heading",
      children: [{ type: "text", value: "Глава 12. Пробуждение" }],
    });
  });

  it("does not treat a '#' line after the first line as a heading", () => {
    const { document } = parse("first paragraph\n\n# not a heading");
    expect(document.children.every((b) => b.type !== "heading")).toBe(true);
  });
});

describe("paragraph", () => {
  it("splits multiple paragraphs on blank lines", () => {
    const { document } = parse("First paragraph.\n\nSecond paragraph.");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "First paragraph." }] },
      { type: "paragraph", children: [{ type: "text", value: "Second paragraph." }] },
    ]);
  });

  it("keeps the newline when joining wrapped lines of one paragraph", () => {
    const { document } = parse("Line one\nline two continues.");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "text", value: "Line one\nline two continues." }],
      },
    ]);
  });
});

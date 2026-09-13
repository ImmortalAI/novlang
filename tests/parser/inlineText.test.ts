import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("inline text & escaping", () => {
  it("keeps plain text as a single text node", () => {
    const { document } = parse("Just plain text.");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Just plain text." }] },
    ]);
  });

  it("un-escapes a backslash-escaped asterisk to a literal character", () => {
    const { document, diagnostics } = parse("\\*не курсив\\*");
    expect(diagnostics).toEqual([]);
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "*не курсив*" }] },
    ]);
  });

  it("un-escapes backslash-escaped brackets and bang", () => {
    const { document } = parse("\\[not a ref\\] and \\!not an image");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "text", value: "[not a ref] and !not an image" }],
      },
    ]);
  });
});

describe("wrapped paragraph keeps its newline", () => {
  it("reports the real source line for content on a paragraph's second line", () => {
    const { document } = parse("line one\nline two");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "line one\nline two" }] },
    ]);
  });
});

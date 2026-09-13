import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("inline footnote reference", () => {
  it("parses [^id] as a resolved footnoteRef when a matching def exists", () => {
    const { document, diagnostics } = parse("See note.[^1]\n\n[^1]: The note text.");
    expect(diagnostics).toEqual([]);
    expect(document.children[0]).toEqual({
      type: "paragraph",
      children: [
        { type: "text", value: "See note." },
        { type: "footnoteRef", id: "1", resolved: true },
      ],
    });
  });

  it("resolves a reference that appears before its definition", () => {
    const { diagnostics } = parse("Ref first.[^a]\n\n[^a]: Defined later.");
    expect(diagnostics).toEqual([]);
  });

  it("returns diagnostics in source order across a whole document", () => {
    const { diagnostics } = parse("Line one *unclosed\n\n[^1]: a\n\n[^1]: b");
    expect(diagnostics.map((d) => d.position)).toEqual([
      { line: 1, column: 10 },
      { line: 5, column: 1 },
    ]);
  });

  it("marks [^id] unresolved and warns when no matching def exists", () => {
    const { document, diagnostics } = parse("See note.[^missing]");
    expect(document.children[0]).toEqual({
      type: "paragraph",
      children: [
        { type: "text", value: "See note." },
        { type: "footnoteRef", id: "missing", resolved: false },
      ],
    });
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        message: 'Footnote reference "^missing" has no matching definition',
        position: { line: 1, column: 10 },
      },
    ]);
  });
});

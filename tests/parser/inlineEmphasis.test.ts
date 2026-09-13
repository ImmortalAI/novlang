import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("inline emphasis & strong", () => {
  it("parses *text* as emphasis", () => {
    const { document } = parse("*тихо прошептал он*");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "emphasis", children: [{ type: "text", value: "тихо прошептал он" }] },
        ],
      },
    ]);
  });

  it("parses **text** as strong", () => {
    const { document } = parse("**ВНИМАНИЕ!**");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "strong", children: [{ type: "text", value: "ВНИМАНИЕ!" }] }],
      },
    ]);
  });

  it("parses ***text*** as emphasis wrapping strong", () => {
    const { document } = parse("***важно***");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "emphasis",
            children: [{ type: "strong", children: [{ type: "text", value: "важно" }] }],
          },
        ],
      },
    ]);
  });

  it("nests strong inside emphasis when delimiters interleave", () => {
    const { document } = parse("*a **b** c*");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "emphasis",
            children: [
              { type: "text", value: "a " },
              { type: "strong", children: [{ type: "text", value: "b" }] },
              { type: "text", value: " c" },
            ],
          },
        ],
      },
    ]);
  });

  it("renders an unmatched '*' as literal text and reports a diagnostic", () => {
    const { document, diagnostics } = parse("one *star");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "one *star" }] },
    ]);
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        message: "Unmatched '*' delimiter, rendered as literal text",
        position: { line: 1, column: 5 },
      },
    ]);
  });

  it("reports the correct source line for an unmatched '*' on a wrapped line", () => {
    const { diagnostics } = parse("line one\nline two *unclosed");
    expect(diagnostics).toEqual([
      {
        severity: "warning",
        message: "Unmatched '*' delimiter, rendered as literal text",
        position: { line: 2, column: 10 },
      },
    ]);
  });

  it("merges adjacent text nodes inside an emphasis", () => {
    const { document } = parse("*a ** b*");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "emphasis", children: [{ type: "text", value: "a ** b" }] }],
      },
    ]);
  });

  it("reports multiple unmatched delimiters in source order", () => {
    const { diagnostics } = parse("*a ** b");
    expect(diagnostics.map((d) => d.position)).toEqual([
      { line: 1, column: 1 },
      { line: 1, column: 4 },
    ]);
  });
});

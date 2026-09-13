import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("sceneBreak", () => {
  it("parses a line containing only '***' as a scene break", () => {
    const { document } = parse("Before.\n\n***\n\nAfter.");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Before." }] },
      { type: "sceneBreak" },
      { type: "paragraph", children: [{ type: "text", value: "After." }] },
    ]);
  });

  it("ends a paragraph at a scene break even without a blank line", () => {
    const { document } = parse("Before.\n***\nAfter.");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Before." }] },
      { type: "sceneBreak" },
      { type: "paragraph", children: [{ type: "text", value: "After." }] },
    ]);
  });

  it("does not treat '*** trailing text' on one line as a scene break", () => {
    const { document } = parse("*** not a break");
    expect(document.children[0].type).toBe("paragraph");
  });
});

describe("CRLF input", () => {
  it("normalizes Windows line endings so no carriage return leaks into the AST", () => {
    const { document } = parse("# Title\r\n\r\nLine one\r\nline two\r\n\r\n***\r\n\r\nAfter.");
    expect(document.children).toEqual([
      { type: "heading", children: [{ type: "text", value: "Title" }] },
      { type: "paragraph", children: [{ type: "text", value: "Line one\nline two" }] },
      { type: "sceneBreak" },
      { type: "paragraph", children: [{ type: "text", value: "After." }] },
    ]);
  });
});

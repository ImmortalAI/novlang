import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("blockquote", () => {
  it("parses '>' prefixed lines as a single-paragraph blockquote", () => {
    const { document } = parse("> Dear reader,\n> it was a dark night.");
    expect(document.children).toEqual([
      {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Dear reader,\nit was a dark night." }],
          },
        ],
      },
    ]);
  });

  it("keeps a multi-paragraph blockquote as one block when blank lines are also quoted", () => {
    const { document } = parse("> Paragraph one.\n>\n> Paragraph two.");
    expect(document.children).toEqual([
      {
        type: "blockquote",
        children: [
          { type: "paragraph", children: [{ type: "text", value: "Paragraph one." }] },
          { type: "paragraph", children: [{ type: "text", value: "Paragraph two." }] },
        ],
      },
    ]);
  });

  it("ends the blockquote at a genuinely blank line", () => {
    const { document } = parse("> Quoted.\n\nNot quoted.");
    expect(document.children).toEqual([
      {
        type: "blockquote",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Quoted." }] }],
      },
      { type: "paragraph", children: [{ type: "text", value: "Not quoted." }] },
    ]);
  });

  it("ends a paragraph at a quote line even without a blank line", () => {
    const { document } = parse("Narration.\n> Quoted.");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "Narration." }] },
      {
        type: "blockquote",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Quoted." }] }],
      },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";

describe("inline image", () => {
  it("parses ![alt](src) as an image node", () => {
    const { document } = parse("![Обложка главы](images/ch12.png)");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "image", alt: "Обложка главы", src: "images/ch12.png" }],
      },
    ]);
  });

  it("allows an image inside emphasis", () => {
    const { document } = parse("*see ![alt](a.png) here*");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "emphasis",
            children: [
              { type: "text", value: "see " },
              { type: "image", alt: "alt", src: "a.png" },
              { type: "text", value: " here" },
            ],
          },
        ],
      },
    ]);
  });

  it("leaves an incomplete image marker as literal text", () => {
    const { document } = parse("![broken");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "![broken" }] },
    ]);
  });
});

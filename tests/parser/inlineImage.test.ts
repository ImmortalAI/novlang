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

  it("keeps balanced parentheses inside the src", () => {
    const { document } = parse("![Снимок](Снимок экрана (3).png)");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [{ type: "image", alt: "Снимок", src: "Снимок экрана (3).png" }],
      },
    ]);
  });

  it("keeps two images on one line independent", () => {
    const { document } = parse("![a](x.png) and ![b](y.png)");
    expect(document.children).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "image", alt: "a", src: "x.png" },
          { type: "text", value: " and " },
          { type: "image", alt: "b", src: "y.png" },
        ],
      },
    ]);
  });

  it("leaves an unbalanced parenthesis in the src literal", () => {
    const { document } = parse("![alt](unclosed.png");
    expect(document.children).toEqual([
      { type: "paragraph", children: [{ type: "text", value: "![alt](unclosed.png" }] },
    ]);
  });
});

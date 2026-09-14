import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";
import { renderToHTML } from "../../src/renderer/renderToHTML";

describe("renderToHTML (HTML mode)", () => {
  it("renders heading, paragraph, emphasis, and strong", () => {
    const { document } = parse("# Глава 1\n\nA *soft* and **loud** line.");
    expect(renderToHTML(document)).toBe(
      "<h1>Глава 1</h1>\n<p>A <em>soft</em> and <strong>loud</strong> line.</p>"
    );
  });

  it("renders a scene break as a centered ornament paragraph", () => {
    const { document } = parse("One.\n\n***\n\nTwo.");
    expect(renderToHTML(document)).toBe(
      '<p>One.</p>\n<p class="novlang-scene-break">⁘</p>\n<p>Two.</p>'
    );
  });

  it("renders a blockquote wrapping its paragraphs", () => {
    const { document } = parse("> Line one.\n>\n> Line two.");
    expect(renderToHTML(document)).toBe(
      "<blockquote>\n<p>Line one.</p>\n<p>Line two.</p>\n</blockquote>"
    );
  });

  it("renders an image with an escaped alt attribute", () => {
    const { document } = parse('![Cover "art"](img.png)');
    expect(renderToHTML(document)).toBe(
      '<p><img src="img.png" alt="Cover &quot;art&quot;"></p>'
    );
  });

  it("renders a resolved footnote ref as a linked marker and its def as a div", () => {
    const { document } = parse("Note.[^1]\n\n[^1]: Explanation.");
    expect(renderToHTML(document)).toBe(
      '<p>Note.<sup><a href="#fn-1">1</a></sup></p>\n' +
        '<div class="footnote-def" id="fn-1">\n<p>Explanation.</p>\n</div>'
    );
  });

  it("renders an unresolved footnote ref as a plain, non-linked marker", () => {
    const { document } = parse("Note.[^missing]");
    expect(renderToHTML(document)).toBe("<p>Note.<sup>[missing]</sup></p>");
  });

  it("escapes HTML-significant characters in text", () => {
    const { document } = parse("5 < 6 & 6 > 5");
    expect(renderToHTML(document)).toBe("<p>5 &lt; 6 &amp; 6 &gt; 5</p>");
  });
});

import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";
import { renderToHTML } from "../../src/renderer/renderToHTML";

describe("renderToHTML (xhtmlMode)", () => {
  it("self-closes <img> tags", () => {
    const { document } = parse("![alt](a.png)");
    expect(renderToHTML(document, { xhtmlMode: true })).toBe(
      '<p><img src="a.png" alt="alt"/></p>'
    );
  });

  it("marks resolved footnote refs with epub:type and wraps defs in <aside>", () => {
    const { document } = parse("Note.[^1]\n\n[^1]: Explanation.");
    expect(renderToHTML(document, { xhtmlMode: true })).toBe(
      '<p>Note.<sup><a epub:type="noteref" href="#fn-1">1</a></sup></p>\n' +
        '<aside epub:type="footnote" id="fn-1">\n<p>Explanation.</p>\n</aside>'
    );
  });

  it("still renders unresolved footnote refs as a plain marker in xhtmlMode", () => {
    const { document } = parse("Note.[^missing]");
    expect(renderToHTML(document, { xhtmlMode: true })).toBe(
      "<p>Note.<sup>[missing]</sup></p>"
    );
  });

  it("leaves HTML mode output unchanged", () => {
    const { document } = parse("![alt](a.png)");
    expect(renderToHTML(document)).toBe('<p><img src="a.png" alt="alt"></p>');
  });
});

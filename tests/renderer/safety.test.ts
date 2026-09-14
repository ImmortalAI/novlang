import { describe, expect, it } from "vitest";
import { parse } from "../../src/parser/parse";
import { renderToHTML } from "../../src/renderer/renderToHTML";

describe("footnote anchors are safe identifiers", () => {
  it("encodes a space in a footnote id, and ref and def still match", () => {
    const { document, diagnostics } = parse("Note.[^note 1]\n\n[^note 1]: text");
    expect(diagnostics).toEqual([]);
    const html = renderToHTML(document);
    expect(html).toContain('href="#fn-note_20_1"');
    expect(html).toContain('id="fn-note_20_1"');
    expect(html).not.toMatch(/id="[^"]* [^"]*"/);
  });

  it("leaves a plain alphanumeric id unchanged", () => {
    const { document } = parse("Note.[^1]\n\n[^1]: text");
    const html = renderToHTML(document);
    expect(html).toContain('href="#fn-1"');
    expect(html).toContain('id="fn-1"');
  });
});

describe("output never carries XML-forbidden characters", () => {
  it("strips control characters that would make XHTML non-well-formed", () => {
    const { document } = parse("Текст с\u000B \u007Fконтролем\u000C.");
    const xhtml = renderToHTML(document, { xhtmlMode: true });
    expect(xhtml).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    expect(xhtml).toContain("Текст с контролем.");
  });

  it("preserves a non-breaking space, which XML allows", () => {
    const { document } = parse("слово\u00A0слово");
    expect(renderToHTML(document)).toContain("слово\u00A0слово");
  });
});

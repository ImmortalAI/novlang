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
    const soh = String.fromCharCode(0x01);
    const del = String.fromCharCode(0x7f);
    const { document } = parse(`Текст${soh} с${del} контролем.`);
    const xhtml = renderToHTML(document, { xhtmlMode: true });
    expect(xhtml).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
    expect(xhtml).toContain("Текст с контролем.");
  });

  it("turns a Word manual line break into whitespace instead of joining words", () => {
    const verticalTab = String.fromCharCode(0x0b); // Word's manual line break
    const { document } = parse(`строка${verticalTab}строка`);
    const html = renderToHTML(document);
    expect(html).not.toContain("строкастрока");
    expect(html).toBe("<p>строка\nстрока</p>");
  });

  it("turns a PDF page break into whitespace too", () => {
    const formFeed = String.fromCharCode(0x0c); // page break in PDF-extracted text
    const { document } = parse(`конец${formFeed}Начало`);
    expect(renderToHTML(document, { xhtmlMode: true })).toBe("<p>конец\nНачало</p>");
  });

  it("preserves a non-breaking space, which XML allows", () => {
    const { document } = parse("слово\u00A0слово");
    expect(renderToHTML(document)).toContain("слово\u00A0слово");
  });
});

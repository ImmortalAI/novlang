import { describe, expect, it } from "vitest";
import { parse, renderToHTML } from "../../src/index";

const CHAPTER = `# Глава 12. Пробуждение

Он открыл глаза. *Тихо,* — подумал он, — **слишком тихо**.

> Дорогой читатель,
>
> прости меня.

***

Через миг всё изменилось.[^1]

![Иллюстрация](images/ch12.png)

[^1]: Или так ему показалось.
`;

describe("full chapter integration", () => {
  it("parses a realistic chapter with no diagnostics", () => {
    const { diagnostics } = parse(CHAPTER);
    expect(diagnostics).toEqual([]);
  });

  it("renders the full chapter to HTML", () => {
    const { document } = parse(CHAPTER);
    expect(renderToHTML(document)).toMatchSnapshot();
  });

  it("renders the full chapter to XHTML", () => {
    const { document } = parse(CHAPTER);
    expect(renderToHTML(document, { xhtmlMode: true })).toMatchSnapshot();
  });
});

describe("documented limitation: crossed delimiter runs", () => {
  // Design Decision 11. v1 uses the simple flanking rules, not CommonMark's
  // "rule of three", so a run that can both open and close is always spent as a
  // closer. These assertions exist to keep that behaviour deliberate: if a future
  // change implements rule-of-three, these are the expectations that must change
  // with it, consciously.
  it("spends an open-and-close run as a closer, without a warning", () => {
    const { document, diagnostics } = parse("*a**b**c*");
    expect(diagnostics).toEqual([]);
    expect(renderToHTML(document)).toBe("<p><em>a</em><em>b</em><em>c</em></p>");
  });

  it("parses the spaced form the way a writer expects", () => {
    const { document, diagnostics } = parse("*a **b** c*");
    expect(diagnostics).toEqual([]);
    expect(renderToHTML(document)).toBe("<p><em>a <strong>b</strong> c</em></p>");
  });
});

describe("footnote references in nested positions", () => {
  // The Task 9 review noted nothing regression-guarded a reference nested inside
  // emphasis or inside a blockquote, which are exactly the shapes the renderer
  // walks recursively. Both resolve correctly; these lock that down.
  it("resolves and renders a reference inside emphasis", () => {
    const { document, diagnostics } = parse("*курсив[^1]*\n\n[^1]: note");
    expect(diagnostics).toEqual([]);
    expect(renderToHTML(document)).toBe(
      '<p><em>курсив<sup><a href="#fn-1">1</a></sup></em></p>\n' +
        '<div class="footnote-def" id="fn-1">\n<p>note</p>\n</div>'
    );
  });

  it("resolves and renders a reference inside a blockquote", () => {
    const { document, diagnostics } = parse("> Письмо.[^1]\n\n[^1]: note");
    expect(diagnostics).toEqual([]);
    expect(renderToHTML(document, { xhtmlMode: true })).toBe(
      '<blockquote>\n<p>Письмо.<sup><a epub:type="noteref" href="#fn-1">1</a></sup></p>\n</blockquote>\n' +
        '<aside epub:type="footnote" id="fn-1">\n<p>note</p>\n</aside>'
    );
  });
});

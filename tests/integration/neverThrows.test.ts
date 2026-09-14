import { describe, expect, it } from "vitest";
import { parse, renderToHTML } from "../../src/index";

const ADVERSARIAL_INPUTS = [
  "",
  " ",
  "*",
  "**",
  "***",
  "****",
  "\\",
  "[^",
  "[^]",
  "[^1",
  "![",
  "![]()",
  ">",
  ">>>",
  ">\n>\n>",
  "*".repeat(500),
  "# ".repeat(100),
  "[^1]: \n\n[^1]: \n\n[^1]: ",
  "*a*b*c*d*e*",
  "***a**b*",
  "# \n\n> \n\n***\n\n[^x]: ",
  // Deeply nested emphasis: ~500 levels. The resolver is iterative so parsing is
  // safe, but the renderer walks the tree recursively, and this is the input that
  // proves the depth a real document could never reach is still handled.
  "*x ".repeat(500) + "y" + " x*".repeat(500),
];

function label(input: string): string {
  return input.length > 24
    ? `${JSON.stringify(input.slice(0, 20))}…(${input.length} chars)`
    : JSON.stringify(input);
}

describe("never throws on malformed input", () => {
  for (const input of ADVERSARIAL_INPUTS) {
    it(`handles ${label(input)}`, () => {
      let html = "";
      let xhtml = "";
      expect(() => {
        const { document, diagnostics } = parse(input);
        expect(Array.isArray(diagnostics)).toBe(true);
        html = renderToHTML(document);
        xhtml = renderToHTML(document, { xhtmlMode: true });
      }).not.toThrow();

      // A floor against silent data loss, not a proof of it. Crash-safety alone
      // would let a regression that vaporised the writer's text pass this whole
      // suite, and never losing typed text is the library's central promise. The
      // real content guarantees live in the unit tests and the chapter snapshot;
      // this only asserts that letters and digits present in the input still
      // appear in both renderings. It is deliberately vacuous for the
      // pure-syntax inputs, where no character's survival is guaranteed —
      // asterisks legitimately disappear by becoming <em>/<strong> tags.
      for (const ch of new Set(input.match(/[\p{L}\p{N}]/gu) ?? [])) {
        expect(html).toContain(ch);
        expect(xhtml).toContain(ch);
      }
    });
  }
});

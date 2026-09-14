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

describe("never throws on malformed input", () => {
  for (const input of ADVERSARIAL_INPUTS) {
    it(`does not throw for: ${JSON.stringify(input)}`, () => {
      expect(() => {
        const { document, diagnostics } = parse(input);
        expect(Array.isArray(diagnostics)).toBe(true);
        renderToHTML(document);
        renderToHTML(document, { xhtmlMode: true });
      }).not.toThrow();
    });
  }
});

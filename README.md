# novlang

Markup language and parser/renderer library for novel chapter text.
One NovLang document is one chapter.

## Install

```sh
pnpm install novlang
```

## Usage

```ts
import { parse, renderToHTML } from "novlang";

const { document, diagnostics } = parse(source);

const html = renderToHTML(document); // live preview
const xhtml = renderToHTML(document, { xhtmlMode: true }); // EPUB chapter body
```

`parse` never throws. Everything it cannot make sense of is reported in
`diagnostics` as `{ severity: "warning", message, position? }`, with
1-based `line`/`column`, so an editor can highlight warnings inline while
the writer keeps typing.

## Syntax

| Element | Syntax |
|---|---|
| Chapter heading | `# Title` on the first line |
| Emphasis | `*text*` |
| Strong | `**text**` |
| Strong + emphasis | `***text***` |
| Scene break | `***` alone on a line |
| Image | `![alt](path)` |
| Footnote reference | `[^1]` |
| Footnote definition | `[^1]: text` (anywhere in the file) |
| Blockquote / letter | `>` at the start of each line; a `>`-only line separates paragraphs inside the quote |
| Paragraphs | separated by a blank line |
| Escaping | `\` before `*`, `[`, `]`, `!`, or `\` |

`\` escapes only `*`, `[`, `]`, `!` and `\`; before any other character it is not
an escape and the backslash appears in the output, so `\>` renders a visible
backslash.

### Emphasis edge cases

Emphasis and strong nest as you would expect when the markers are separated by
spaces: `*тихо, **очень** тихо*` gives italic text with bold inside it.

When the markers are crossed *without* spaces, NovLang resolves them more simply
than CommonMark does: `*a**b**c*` becomes three separate italic runs rather than
italic-with-bold-inside. No text is ever lost, and nothing is reported as an
error, but the emphasis is regrouped. Write the spaced form when you want nesting.

Diagnostic `line` numbers are always exact. `column` is measured within the
block's own text, so on a heading, a quoted line, or a footnote definition it is
shifted left by the width of the stripped prefix (`# `, `> `, `[^1]: `).

## Rendering notes

`xhtmlMode` emits strict XHTML for EPUB: self-closing `<img/>`, and EPUB3
popup footnotes via `epub:type="noteref"` and `<aside epub:type="footnote">`.
The consuming XHTML document must declare the namespace on its root element:

```xml
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
```

Book-level metadata (title, author, cover, chapter order) is out of scope —
that belongs to the consuming application's book manifest.

## Styling the output

The renderer emits structural markup only; the consuming application supplies the
CSS. The elements worth targeting:

| Element | HTML mode | XHTML mode |
|---|---|---|
| Scene break | `<p class="novlang-scene-break">` | `<p class="novlang-scene-break">` |
| Footnote definition | `<div class="footnote-def">` | `<aside epub:type="footnote">` (no class) |

The footnote definition carries no class in XHTML mode, so a live preview and an
EPUB stylesheet need different selectors to reach it.

The scene break is rendered as a single ornament character; it only reads as the
centred ornament `parser.md` calls a "центрированный орнамент" once you centre it
yourself:

```css
.novlang-scene-break {
  text-align: center;
}
```

Readers capable of popup footnotes also render the `<aside>` inline in the flow
unless it is hidden, so without this rule the footnote text appears twice. The
`@namespace` line is required — a namespaced selector without it is invalid, and
the reading system silently drops the rule:

```css
@namespace epub url("http://www.idpf.org/2007/ops");

aside[epub|type~="footnote"] {
  display: none;
}
```

Footnote definitions render without a visible number or back-link, on the
assumption that a popup-capable reading system supplies that affordance itself.

## License

MIT

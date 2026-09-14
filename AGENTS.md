# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## What this is

**NovLang** is a markup language for novel chapters (a Markdown-compatible subset
plus footnotes and scene breaks), and this repo is its TypeScript parser/renderer
library, published to npm as **`novlang-js`** (the name `novlang` belongs to an
unrelated package).

- One NovLang document is one chapter. Book metadata (title, author, cover, chapter
  order) is out of scope — it belongs to the consuming app.
- The first consumer is the `easy-digital-book` editor (Tauri + Vue): live preview
  in the editor, XHTML chapters for EPUB. The library itself must stay UI-agnostic.
- Public API: `parse(source) → { document, diagnostics }` and
  `renderToHTML(document, { xhtmlMode? }) → string`, plus the AST types.

## Invariants — do not break these

1. **`parse` and `renderToHTML` never throw**, on any input. Malformed markup
   degrades to literal text and a `diagnostics` entry (`severity: "warning"`).
2. **Never discard the writer's text.** Unmatched `*` stays a literal asterisk, an
   undefined footnote ref renders as a visible `[id]` marker, a duplicate footnote
   definition is kept as a paragraph.
3. **`xhtmlMode` output must be well-formed XML and epubcheck-clean**: all text
   and attributes go through `escapeHtml`/`escapeAttr`, XML-forbidden control
   characters are stripped, element ids are unique, footnote anchors go through
   `footnoteAnchor` (an injective escape).
4. **Zero runtime dependencies**, and nothing Node-, browser- or UI-framework
   specific — it runs in a Tauri webview and in Node alike. `dependencies` in
   `package.json` stays empty.
5. **Rendered markup is consumer-facing API.** Class names (`novlang-scene-break`,
   `footnote-def`), `epub:type` attributes and anchor ids (`fn-…`) are targeted by
   consumers' CSS and links; changing them is a breaking change.
6. Out of scope for v1 (YAGNI): output formats other than HTML/XHTML, nested
   footnotes, a CLI, grammar dialects.

## Project layout

```
src/
  index.ts              public entry: re-exports parse, renderToHTML and the types
  types.ts              AST (NovLangDocument, BlockNode, InlineNode), Diagnostic,
                        Position, RenderOptions, ParseResult
  parser/
    parse.ts            orchestrator: raw blocks → footnote resolution → inline
                        parsing → diagnostics sorted by position
    blocks.ts           splitIntoRawBlocks: lines → heading / sceneBreak /
                        blockquote / footnoteDef / paragraph (BOM, CRLF, leading
                        blank lines handled here)
    inline.ts           parseInline: tokenize (escapes, images, footnote refs,
                        `*` runs) → iterative delimiter-stack resolver for
                        emphasis/strong → merge adjacent text
    position.ts         computePosition: offset inside a block → 1-based line/column
  renderer/
    renderToHTML.ts     public renderer entry
    renderBlock.ts      block nodes → <h1>, <p>, <blockquote>, scene break,
                        footnote definition (<div> in HTML, <aside epub:type> in XHTML)
    renderInline.ts     inline nodes → <em>, <strong>, <img>, <sup> footnote refs
    escape.ts           escapeHtml, escapeAttr, footnoteAnchor
tests/
  parser/               one file per grammar rule: input → expected AST + diagnostics
  renderer/             html, xhtml (xhtmlMode) and safety (escaping, anchors,
                        forbidden characters)
  integration/
    fullChapter.test.ts snapshot of a realistic chapter (__snapshots__/)
    neverThrows.test.ts adversarial inputs: no throw, no lost text
  smoke.test.ts         scaffold sanity check
.github/workflows/
  ci.yml                typecheck + test + build on Node 18/20/22/24 (push to main, PRs)
  publish.yml           publishes to npm on a pushed `v*` tag (trusted publishing)
docs/superpowers/plans/ the original v1 implementation plan (historical record)
parser.md               original design brief, in Russian (historical record)
README.md               user-facing docs: syntax, rendering notes, styling
tsup.config.ts          build: src/index.ts → dist/ as ESM + CJS + .d.ts + sourcemaps
vitest.config.ts        tests/**/*.test.ts
tsconfig.json           strict, noEmit — type-checks src and tests; tsup does the build
```

`dist/` and `node_modules/` are gitignored; `.superpowers/` is local tooling state.

### Grammar at a glance

| Element | Syntax | AST node |
|---|---|---|
| Chapter heading | `# Title`, first non-blank line only | `heading` |
| Paragraph | lines separated by a blank line | `paragraph` |
| Scene break | `***` alone on a line | `sceneBreak` |
| Blockquote | `>` on every line; a `>`-only line splits paragraphs | `blockquote` |
| Footnote definition | `[^id]: text` | `footnoteDef` |
| Emphasis / strong | `*a*`, `**a**`, `***a***` | `emphasis`, `strong` |
| Image | `![alt](src)` (parentheses in src are depth-matched) | `image` |
| Footnote reference | `[^id]` | `footnoteRef` (`resolved: boolean`) |
| Escape | `\` before `*` `[` `]` `!` `\` only | `text` |

README.md is the authoritative description of edge cases (crossed emphasis,
diagnostic columns, required EPUB CSS). Keep it in sync with behavior changes.

### Diagnostics currently emitted

- `Unmatched '*' delimiter, rendered as literal text`
- `Footnote reference "^id" has no matching definition`
- `Duplicate footnote definition for "^id"; …` (first definition wins)

`line` is always exact; `column` is relative to the block's own text, so it is
shifted by stripped prefixes (`# `, `> `, `[^1]: `).

## Toolchain

- **pnpm** (version pinned in `packageManager`, currently 12.x) — use it for
  installs and scripts; don't create `package-lock.json`.
- Node **>= 18** for consumers (`engines`); CI tests 18–24.
- TypeScript (strict), **tsup** for the build, **Vitest** for tests.

## Commands

```bash
pnpm install                        # install dev dependencies (CI: --frozen-lockfile)

pnpm typecheck                      # tsc --noEmit over src and tests
pnpm test                           # full Vitest run
pnpm test:watch                     # watch mode
pnpm test tests/parser/heading.test.ts   # one file
pnpm test -t "footnote anchors"     # tests whose name matches
pnpm test -u                        # update snapshots — only for an intended output change
pnpm build                          # tsup → dist/

npm pack --dry-run                  # list what would be published (dist, README, LICENSE)
```

Before claiming work is done, run `pnpm typecheck && pnpm test && pnpm build`.
That is exactly what CI and `prepublishOnly` run.

## Working conventions

- **Test first.** A grammar or rendering change starts with a failing test in the
  matching `tests/parser/*` or `tests/renderer/*` file. A new tricky input that
  once broke something goes into `neverThrows.test.ts`.
- A changed snapshot must be reviewed as a real output change, not blindly
  updated.
- Comments explain *why* (writer workflows, EPUB/XML constraints), not what —
  follow the style in `escape.ts` and `parse.ts`.
- Keep the parser/renderer split: the parser produces no HTML, the renderer does
  no parsing.
- Adding a public type or function means exporting it from `src/index.ts`; changing
  the AST shape is an API change for consumers.
- Commit messages use Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`,
  `chore:`.

## Releasing

Publishing is done **only by CI** (`publish.yml`) via npm Trusted Publishing
(OIDC, no tokens, provenance attached). Do not run `npm publish` locally.

```bash
git status                          # must be clean and in sync with origin/main
npm version patch                   # or minor / major: bumps package.json, commits, tags vX.Y.Z
git push --follow-tags              # the pushed tag triggers publish.yml
```

- Change the version only through `npm version`: `publish.yml` fails if the tag
  does not equal `v` + `package.json` version.
- A published version number can never be reused, even after unpublishing.
- While on 0.x, a breaking change to the API or rendered markup bumps **minor**.

Verify a release:

```bash
gh run list --workflow publish.yml --limit 1          # CI publish run status
gh run watch <run-id> --exit-status                   # follow it to completion
npm view novlang-js dist-tags versions --prefer-online
```

The registry can answer 404 for about a minute after a successful publish — that is
cache propagation, not a failure.

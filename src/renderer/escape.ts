// XML 1.0 forbids these code points outright — not even as numeric references — so
// letting one through would make xhtmlMode output non-well-formed and a reading
// system would refuse the chapter. They reach a writer by paste: U+000C is the page
// break in text extracted from PDFs, U+000B and U+007F arrive from Word and OCR.
// Tab, newline and carriage return are legal and preserved, and so is U+00A0
// (non-breaking space), which sits above this range and matters for Russian typography.
//
// The two that separate text become a newline instead of being dropped: U+000B is
// Word's manual line break, so deleting it outright would render "строка" and
// "строка" as the single joined word "строкастрока". HTML collapses the newline to a
// space, which is what the writer saw in Word.
//
// Both classes are written with \x escapes on purpose: literal control bytes in
// source are invisible to a reader and do not survive copy-paste intact.
const XML_FORBIDDEN_BREAK = /[\x0B\x0C]/g;
const XML_FORBIDDEN = /[\x00-\x08\x0E-\x1F\x7F]/g;

export function escapeHtml(value: string): string {
  return value
    .replace(XML_FORBIDDEN_BREAK, "\n")
    .replace(XML_FORBIDDEN, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

// A footnote id is whatever the writer typed between "[^" and "]", so it can hold
// spaces and punctuation that are invalid in an HTML id, an XML ID and a URL
// fragment. The escape is injective — a literal underscore doubles — so two
// different ids can never collide on one anchor. Plain letters and digits pass
// through unchanged, which keeps ordinary footnotes readable.
export function footnoteAnchor(id: string): string {
  const safe = id
    .replace(/_/g, "__")
    .replace(/[^\p{L}\p{N}._-]/gu, (ch) => `_${ch.codePointAt(0)!.toString(16)}_`);
  return `fn-${safe}`;
}

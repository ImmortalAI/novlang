// XML 1.0 forbids these code points outright — not even as numeric references — so
// letting one through would make xhtmlMode output non-well-formed and a reading
// system would refuse the chapter. They reach a writer by paste: U+000C is the page
// break in text extracted from PDFs, U+000B and U+007F arrive from Word and OCR.
// Tab, newline and carriage return are legal and preserved, and so is U+00A0
// (non-breaking space), which sits above this range and matters for Russian typography.
const XML_FORBIDDEN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function escapeHtml(value: string): string {
  return value
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

export type DiagnosticSeverity = "warning";

export interface Position {
  line: number;
  column: number;
}

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  position?: Position;
}

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "emphasis"; children: InlineNode[] }
  | { type: "strong"; children: InlineNode[] }
  | { type: "image"; alt: string; src: string }
  | { type: "footnoteRef"; id: string; resolved: boolean };

export type BlockNode =
  | { type: "heading"; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "sceneBreak" }
  | { type: "blockquote"; children: BlockNode[] }
  | { type: "footnoteDef"; id: string; children: BlockNode[] };

export interface NovLangDocument {
  type: "document";
  children: BlockNode[];
}

export interface RenderOptions {
  xhtmlMode?: boolean;
}

export interface ParseResult {
  document: NovLangDocument;
  diagnostics: Diagnostic[];
}

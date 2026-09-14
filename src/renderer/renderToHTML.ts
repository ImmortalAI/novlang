import type { NovLangDocument, RenderOptions } from "../types";
import { renderBlockNodes } from "./renderBlock";

export function renderToHTML(
  document: NovLangDocument,
  options: RenderOptions = {}
): string {
  return renderBlockNodes(document.children, options);
}

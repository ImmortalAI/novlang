import type { BlockNode, RenderOptions } from "../types";
import { escapeAttr } from "./escape";
import { renderInlineNodes } from "./renderInline";

export function renderBlockNode(node: BlockNode, options: RenderOptions): string {
  switch (node.type) {
    case "heading":
      return `<h1>${renderInlineNodes(node.children, options)}</h1>`;
    case "paragraph":
      return `<p>${renderInlineNodes(node.children, options)}</p>`;
    case "sceneBreak":
      return `<p class="novlang-scene-break">⁘</p>`;
    case "blockquote":
      return `<blockquote>\n${renderBlockNodes(node.children, options)}\n</blockquote>`;
    case "footnoteDef": {
      const body = renderBlockNodes(node.children, options);
      const id = escapeAttr(node.id);
      return options.xhtmlMode
        ? `<aside epub:type="footnote" id="fn-${id}">\n${body}\n</aside>`
        : `<div class="footnote-def" id="fn-${id}">\n${body}\n</div>`;
    }
  }
}

export function renderBlockNodes(nodes: BlockNode[], options: RenderOptions): string {
  return nodes.map((node) => renderBlockNode(node, options)).join("\n");
}

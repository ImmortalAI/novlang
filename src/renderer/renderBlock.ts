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
    case "footnoteDef":
      return `<div class="footnote-def" id="fn-${escapeAttr(node.id)}">\n${renderBlockNodes(
        node.children,
        options
      )}\n</div>`;
  }
}

export function renderBlockNodes(nodes: BlockNode[], options: RenderOptions): string {
  return nodes.map((node) => renderBlockNode(node, options)).join("\n");
}

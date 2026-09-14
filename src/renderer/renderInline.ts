import type { InlineNode, RenderOptions } from "../types";
import { escapeAttr, escapeHtml } from "./escape";

export function renderInlineNode(node: InlineNode, options: RenderOptions): string {
  switch (node.type) {
    case "text":
      return escapeHtml(node.value);
    case "emphasis":
      return `<em>${renderInlineNodes(node.children, options)}</em>`;
    case "strong":
      return `<strong>${renderInlineNodes(node.children, options)}</strong>`;
    case "image": {
      const attrs = `src="${escapeAttr(node.src)}" alt="${escapeAttr(node.alt)}"`;
      return options.xhtmlMode ? `<img ${attrs}/>` : `<img ${attrs}>`;
    }
    case "footnoteRef": {
      if (!node.resolved) {
        return `<sup>[${escapeHtml(node.id)}]</sup>`;
      }
      const href = `href="#fn-${escapeAttr(node.id)}"`;
      const label = escapeHtml(node.id);
      return options.xhtmlMode
        ? `<sup><a epub:type="noteref" ${href}>${label}</a></sup>`
        : `<sup><a ${href}>${label}</a></sup>`;
    }
  }
}

export function renderInlineNodes(nodes: InlineNode[], options: RenderOptions): string {
  return nodes.map((node) => renderInlineNode(node, options)).join("");
}

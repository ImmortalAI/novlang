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
    case "image":
      return `<img src="${escapeAttr(node.src)}" alt="${escapeAttr(node.alt)}">`;
    case "footnoteRef":
      if (!node.resolved) {
        return `<sup>[${escapeHtml(node.id)}]</sup>`;
      }
      return `<sup><a href="#fn-${escapeAttr(node.id)}">${escapeHtml(node.id)}</a></sup>`;
  }
}

export function renderInlineNodes(nodes: InlineNode[], options: RenderOptions): string {
  return nodes.map((node) => renderInlineNode(node, options)).join("");
}

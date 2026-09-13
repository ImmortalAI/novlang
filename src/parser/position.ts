import type { Position } from "../types";

export function computePosition(
  blockStartLine: number,
  text: string,
  offset: number
): Position {
  const before = text.slice(0, offset);
  const lines = before.split("\n");
  return {
    line: blockStartLine + lines.length - 1,
    column: lines[lines.length - 1].length + 1,
  };
}

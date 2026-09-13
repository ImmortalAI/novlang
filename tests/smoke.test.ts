import { describe, expect, it } from "vitest";
import type { NovLangDocument } from "../src/types";

describe("scaffold", () => {
  it("resolves types and builds a minimal document literal", () => {
    const doc: NovLangDocument = { type: "document", children: [] };
    expect(doc.type).toBe("document");
  });
});

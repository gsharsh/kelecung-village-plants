import { describe, expect, it } from "vitest";
import { normalizePlantName, normalizeSlug } from "@/lib/slug";

describe("slug utilities", () => {
  it("normalizes names to URL-safe slugs without spaces", () => {
    expect(normalizeSlug("  Laksa Leaf Plant  ")).toBe("laksaleafplant");
  });

  it("returns plant when slug normalization empties the value", () => {
    expect(normalizeSlug("___")).toBe("plant");
  });

  it("normalizes plant names for stable uniqueness checks", () => {
    expect(normalizePlantName("   Aloe    Vera   ")).toBe("Aloe Vera");
  });
});

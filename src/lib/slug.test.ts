import { describe, expect, it } from "vitest";
import { normalizeSlug, pickFirstFreeSlug } from "@/lib/slug";

describe("slug utilities", () => {
  it("normalizes names to URL-safe slugs", () => {
    expect(normalizeSlug("  Laksa Leaf Plant  ")).toBe("laksa-leaf-plant");
  });

  it("returns base slug when not taken", () => {
    expect(pickFirstFreeSlug("banana", ["pepper", "ginger"]))
      .toBe("banana");
  });

  it("adds numeric suffix when slug already exists", () => {
    expect(pickFirstFreeSlug("banana", ["banana", "banana-2", "banana-3"]))
      .toBe("banana-4");
  });

  it("ignores similarly named but different slugs", () => {
    expect(pickFirstFreeSlug("banana", ["bananas", "banana-leaf"]))
      .toBe("banana");
  });
});

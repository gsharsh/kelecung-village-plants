import slugify from "slugify";

export function normalizeSlug(value: string) {
  const normalized = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
    replacement: "",
  });

  return normalized || "plant";
}

export function normalizePlantName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

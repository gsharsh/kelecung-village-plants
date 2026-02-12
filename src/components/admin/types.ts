import type { BlockKind } from "@/lib/types/plant";

export interface EditableBlock {
  client_id: string;
  id?: string;
  block_kind: BlockKind;
  title: string;
  body: string;
  image_url: string;
  payload: Record<string, unknown>;
}

export function createDefaultPayload(kind: BlockKind) {
  if (kind === "about") {
    return { text: "" };
  }

  if (kind === "edible_recipe") {
    return {
      recipeTitle: "",
      ingredients: [],
      instructions: [],
    };
  }

  return {
    useType: "medicinal",
    details: "",
    steps: [],
  };
}

export function createEmptyBlock(kind: BlockKind): EditableBlock {
  return {
    client_id: crypto.randomUUID(),
    block_kind: kind,
    title: "",
    body: "",
    image_url: "",
    payload: createDefaultPayload(kind),
  };
}

export function toLineInput(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.filter((item): item is string => typeof item === "string").join("\n");
}

export function parseLineInput(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

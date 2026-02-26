import { z } from "zod";
import type { PlantDocumentInput, PlantType } from "@/lib/types/plant";

export const plantTypeSchema = z.enum(["edible", "inedible"]);

export const blockKindSchema = z.enum(["about", "edible_recipe", "inedible_use"]);

export const aboutPayloadSchema = z.object({
  text: z.string().trim().min(1),
});

export const edibleRecipePayloadSchema = z.object({
  recipeTitle: z.string().trim().min(1),
  ingredients: z.array(z.string().trim().min(1)).min(1),
  instructions: z.array(z.string().trim().min(1)).min(1),
});

export const inedibleUsePayloadSchema = z.object({
  useType: z.enum(["medicinal", "ornamental", "material", "other"]),
  details: z.string().default(""),
  steps: z.array(z.string().trim().min(1)).default([]),
});

export const plantBlockInputSchema = z.object({
  id: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
  block_kind: blockKindSchema,
  title: z.string().max(200).nullable().optional(),
  body: z.string().max(10_000).nullable().optional(),
  image_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const plantDocumentInputSchema = z.object({
  id: z.string().uuid().optional(),
  type: plantTypeSchema,
  name: z.string().max(160),
  scientific_name: z.string().max(220),
  short_description: z.string().max(500),
  hero_image_url: z
    .string()
    .url()
    .or(z.literal(""))
    .transform((value) => value.trim()),
  blocks: z.array(plantBlockInputSchema).default([]),
});

export function validatePlantForPublish(input: PlantDocumentInput) {
  const errors: string[] = [];

  if (!input.name.trim()) {
    errors.push("Name is required.");
  }

  if (!input.scientific_name.trim()) {
    errors.push("Scientific name is required.");
  }

  if (!input.short_description.trim()) {
    errors.push("Short description is required.");
  }

  if (!input.hero_image_url.trim()) {
    errors.push("Hero image is required.");
  }

  const aboutBlocks = input.blocks.filter((block) => block.block_kind === "about");
  if (aboutBlocks.length < 1) {
    errors.push("At least one About block is required.");
  }

  for (const block of aboutBlocks) {
    const parsed = aboutPayloadSchema.safeParse(block.payload ?? {});
    if (!parsed.success) {
      errors.push("About blocks must include non-empty text.");
      break;
    }
  }

  if (input.type === "edible") {
    validateEdibleRules(input, errors);
  }

  if (input.type === "inedible") {
    validateInedibleRules(input, errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateEdibleRules(input: PlantDocumentInput, errors: string[]) {
  const recipeBlocks = input.blocks.filter((block) => block.block_kind === "edible_recipe");

  if (recipeBlocks.length < 1) {
    errors.push("Edible plants require at least one recipe block.");
    return;
  }

  for (const block of recipeBlocks) {
    const parsed = edibleRecipePayloadSchema.safeParse(block.payload ?? {});
    if (!parsed.success) {
      errors.push("Recipe blocks need recipe title, ingredients, and instructions.");
      break;
    }

    if (!block.image_url?.trim()) {
      errors.push("Recipe blocks require a dish image.");
      break;
    }
  }
}

function validateInedibleRules(input: PlantDocumentInput, errors: string[]) {
  const useBlocks = input.blocks.filter((block) => block.block_kind === "inedible_use");

  if (useBlocks.length < 1) {
    errors.push("Inedible plants require at least one use block.");
    return;
  }

  for (const block of useBlocks) {
    const parsed = inedibleUsePayloadSchema.safeParse(block.payload ?? {});
    if (!parsed.success) {
      errors.push("Use blocks must include a use type.");
      break;
    }
  }
}

export function allowedBlockKinds(type: PlantType) {
  if (type === "edible") {
    return ["about", "edible_recipe"] as const;
  }

  return ["about", "inedible_use"] as const;
}

import { describe, expect, it } from "vitest";
import type { PlantDocumentInput } from "@/lib/types/plant";
import { validatePlantForPublish } from "@/lib/validation/plant";

function buildBasePlant(type: PlantDocumentInput["type"]): PlantDocumentInput {
  return {
    type,
    slug: type === "edible" ? "moringa" : "hibiscus",
    name: type === "edible" ? "Moringa" : "Hibiscus",
    scientific_name: "Plantus testus",
    short_description: "A useful village plant.",
    hero_image_url: "https://example.com/hero.jpg",
    blocks: [
      {
        block_kind: "about",
        payload: {
          text: "About plant",
        },
      },
    ],
  };
}

describe("validatePlantForPublish", () => {
  it("rejects edible plant without recipe block", () => {
    const plant = buildBasePlant("edible");
    const result = validatePlantForPublish(plant);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Edible plants require at least one recipe block.");
  });

  it("accepts edible plant with complete recipe block", () => {
    const plant = buildBasePlant("edible");
    plant.blocks.push({
      block_kind: "edible_recipe",
      image_url: "https://example.com/dish.jpg",
      payload: {
        recipeTitle: "Moringa Soup",
        ingredients: ["Moringa leaves"],
        instructions: ["Boil water", "Add leaves"],
      },
    });

    const result = validatePlantForPublish(plant);
    expect(result.isValid).toBe(true);
  });

  it("rejects inedible plant use block with no details and no steps", () => {
    const plant = buildBasePlant("inedible");
    plant.blocks.push({
      block_kind: "inedible_use",
      payload: {
        useType: "medicinal",
        details: "",
        steps: [],
      },
    });

    const result = validatePlantForPublish(plant);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Each use block needs details text or at least one step.");
  });

  it("accepts inedible plant with valid use block", () => {
    const plant = buildBasePlant("inedible");
    plant.blocks.push({
      block_kind: "inedible_use",
      payload: {
        useType: "ornamental",
        details: "Used as decoration around village entrances.",
        steps: [],
      },
    });

    const result = validatePlantForPublish(plant);
    expect(result.isValid).toBe(true);
  });
});

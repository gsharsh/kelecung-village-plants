import type { Plant, PlantWithBlocks } from "@/lib/types/plant";

const now = new Date().toISOString();

const ediblePlant: PlantWithBlocks = {
  id: "demo-edible",
  type: "edible",
  slug: "moringa",
  name: "Moringa",
  scientific_name: "Moringa oleifera",
  short_description:
    "A nutrient-rich village favorite used for soups, stir-fries, and herbal preparations.",
  hero_image_url:
    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1600&q=80",
  status: "published",
  published_at: now,
  created_at: now,
  updated_at: now,
  deleted_at: null,
  blocks: [
    {
      id: "demo-edible-about",
      plant_id: "demo-edible",
      position: 0,
      block_kind: "about",
      title: "Village Story",
      body: null,
      image_url: null,
      payload: {
        text: "Moringa grows quickly in warm climates and is known locally for its leaves, pods, and resilience.",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-edible-recipe",
      plant_id: "demo-edible",
      position: 1,
      block_kind: "edible_recipe",
      title: "Moringa Leaf Coconut Soup",
      body: null,
      image_url:
        "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1400&q=80",
      payload: {
        recipeTitle: "Moringa Leaf Coconut Soup",
        ingredients: ["2 cups moringa leaves", "1 cup coconut milk", "1 clove garlic", "Salt to taste"],
        instructions: [
          "Saute garlic until fragrant.",
          "Add coconut milk and simmer.",
          "Stir in moringa leaves for 2-3 minutes.",
          "Season and serve warm.",
        ],
      },
      created_at: now,
      updated_at: now,
    },
  ],
};

const inediblePlant: PlantWithBlocks = {
  id: "demo-inedible",
  type: "inedible",
  slug: "hibiscus",
  name: "Hibiscus",
  scientific_name: "Hibiscus rosa-sinensis",
  short_description:
    "A bright flowering plant commonly used for ornamental landscaping and traditional remedies.",
  hero_image_url:
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80",
  status: "published",
  published_at: now,
  created_at: now,
  updated_at: now,
  deleted_at: null,
  blocks: [
    {
      id: "demo-inedible-about",
      plant_id: "demo-inedible",
      position: 0,
      block_kind: "about",
      title: "About Hibiscus",
      body: null,
      image_url: null,
      payload: {
        text: "Hibiscus is planted near village pathways for color and shade, with petals also used in local preparations.",
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-inedible-use-1",
      plant_id: "demo-inedible",
      position: 1,
      block_kind: "inedible_use",
      title: "Ornamental Border",
      body: null,
      image_url:
        "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1400&q=80",
      payload: {
        useType: "ornamental",
        details: "Planted as a living border around walking paths and guest bungalows.",
        steps: ["Trim lightly every two weeks.", "Remove dry flowers.", "Water every morning in dry season."],
      },
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-inedible-use-2",
      plant_id: "demo-inedible",
      position: 2,
      block_kind: "inedible_use",
      title: "Traditional Remedy Prep",
      body: null,
      image_url: null,
      payload: {
        useType: "medicinal",
        details: "Petals are dried and steeped for a mild herbal rinse.",
        steps: [],
      },
      created_at: now,
      updated_at: now,
    },
  ],
};

export const MOCK_PLANTS_WITH_BLOCKS: PlantWithBlocks[] = [ediblePlant, inediblePlant];

export const MOCK_PLANTS: Plant[] = MOCK_PLANTS_WITH_BLOCKS.map((plant) => ({
  id: plant.id,
  type: plant.type,
  slug: plant.slug,
  name: plant.name,
  scientific_name: plant.scientific_name,
  short_description: plant.short_description,
  hero_image_url: plant.hero_image_url,
  status: plant.status,
  published_at: plant.published_at,
  created_at: plant.created_at,
  updated_at: plant.updated_at,
  deleted_at: plant.deleted_at,
}));

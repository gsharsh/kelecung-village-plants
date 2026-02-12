export type PlantType = "edible" | "inedible";

export type PlantStatus = "draft" | "published";

export type BlockKind = "about" | "edible_recipe" | "inedible_use";

export type InedibleUseType = "medicinal" | "ornamental" | "material" | "other";

export interface EdibleRecipePayload {
  recipeTitle: string;
  ingredients: string[];
  instructions: string[];
}

export interface InedibleUsePayload {
  useType: InedibleUseType;
  details: string;
  steps: string[];
}

export interface AboutPayload {
  text: string;
}

export type BlockPayload = AboutPayload | EdibleRecipePayload | InedibleUsePayload | Record<string, unknown>;

export interface Plant {
  id: string;
  type: PlantType;
  slug: string;
  name: string;
  scientific_name: string;
  short_description: string;
  hero_image_url: string;
  status: PlantStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PlantBlock {
  id: string;
  plant_id: string;
  position: number;
  block_kind: BlockKind;
  title: string | null;
  body: string | null;
  image_url: string | null;
  payload: BlockPayload;
  created_at: string;
  updated_at: string;
}

export interface PlantWithBlocks extends Plant {
  blocks: PlantBlock[];
}

export interface PlantDocumentInput {
  id?: string;
  type: PlantType;
  slug?: string;
  name: string;
  scientific_name: string;
  short_description: string;
  hero_image_url: string;
  blocks: Array<{
    id?: string;
    position?: number;
    block_kind: BlockKind;
    title?: string | null;
    body?: string | null;
    image_url?: string | null;
    payload?: Record<string, unknown>;
  }>;
}

export const ALLOWED_BLOCK_KINDS_BY_TYPE: Record<PlantType, BlockKind[]> = {
  edible: ["about", "edible_recipe"],
  inedible: ["about", "inedible_use"],
};

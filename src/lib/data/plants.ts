import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Plant, PlantBlock, PlantType, PlantWithBlocks } from "@/lib/types/plant";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { MOCK_PLANTS, MOCK_PLANTS_WITH_BLOCKS } from "@/lib/data/mockPlants";

interface HomeQueryOptions {
  q?: string;
  type?: "all" | PlantType;
}

export async function getPublishedPlants({ q, type = "all" }: HomeQueryOptions) {
  if (!hasPublicSupabaseEnv()) {
    return filterMockPlants({ q, type });
  }

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("plants")
      .select("*")
      .eq("status", "published")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (type === "edible" || type === "inedible") {
      query = query.eq("type", type);
    }

    const search = q?.trim();
    if (search) {
      const safe = search.replace(/,/g, " ");
      query = query.or(
        `name.ilike.%${safe}%,scientific_name.ilike.%${safe}%,short_description.ilike.%${safe}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Plant[];
  } catch {
    return filterMockPlants({ q, type });
  }
}

export async function getPublishedPlantBySlug(slug: string) {
  if (!hasPublicSupabaseEnv()) {
    return findMockPlantBySlug(slug);
  }

  try {
    const supabase = await createServerSupabaseClient();

    const { data: plant, error: plantError } = await supabase
      .from("plants")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (plantError) {
      throw new Error(plantError.message);
    }

    if (!plant) {
      return null;
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("plant_blocks")
      .select("*")
      .eq("plant_id", plant.id)
      .order("position", { ascending: true });

    if (blocksError) {
      throw new Error(blocksError.message);
    }

    return {
      ...(plant as Plant),
      blocks: (blocks ?? []) as PlantBlock[],
    } satisfies PlantWithBlocks;
  } catch {
    return findMockPlantBySlug(slug);
  }
}

function filterMockPlants({ q, type = "all" }: HomeQueryOptions) {
  const search = q?.trim().toLowerCase();
  return MOCK_PLANTS.filter((plant) => {
    if (type !== "all" && plant.type !== type) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [plant.name, plant.scientific_name, plant.short_description].some((field) =>
      field.toLowerCase().includes(search),
    );
  });
}

function findMockPlantBySlug(slug: string) {
  return MOCK_PLANTS_WITH_BLOCKS.find((plant) => plant.slug === slug) ?? null;
}

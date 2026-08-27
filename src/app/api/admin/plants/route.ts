import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin";
import { handleApiError, jsonError } from "@/lib/api";
import { normalizePlantName, normalizeSlug } from "@/lib/slug";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALLOWED_BLOCK_KINDS_BY_TYPE, type PlantDocumentInput } from "@/lib/types/plant";
import { plantDocumentInputSchema, validatePlantForPublish } from "@/lib/validation/plant";

function sanitizeBlocks(input: PlantDocumentInput) {
  const allowedKinds = ALLOWED_BLOCK_KINDS_BY_TYPE[input.type];
  return input.blocks.filter((block) => allowedKinds.includes(block.block_kind));
}

type ExistingPlantSummary = {
  id: string;
  name: string;
  slug: string;
};

function hasNameConflict(plants: ExistingPlantSummary[], name: string) {
  const normalizedIncomingName = normalizePlantName(name).toLowerCase();
  return plants.some((plant) => normalizePlantName(plant.name).toLowerCase() === normalizedIncomingName);
}

function hasSlugConflict(plants: ExistingPlantSummary[], slug: string) {
  return plants.some((plant) => plant.slug === slug);
}

export async function GET() {
  try {
    await assertAdminUser();

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("plants")
      .select("id, slug, name, scientific_name, type, status, created_at, updated_at, published_at")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });

    if (error) {
      return jsonError(500, error.message);
    }

    return NextResponse.json({ plants: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await assertAdminUser();

    const payload = await request.json();
    const parsed = plantDocumentInputSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(400, "Invalid payload", parsed.error.issues.map((issue) => issue.message));
    }

    const supabase = createAdminSupabaseClient();
    const input: PlantDocumentInput = {
      ...parsed.data,
      name: normalizePlantName(parsed.data.name),
      blocks: sanitizeBlocks(parsed.data),
    };

    const slug = normalizeSlug(input.name);

    const { data: existingPlants, error: existingPlantsError } = await supabase
      .from("plants")
      .select("id, name, slug")
      .is("deleted_at", null);

    if (existingPlantsError) {
      return jsonError(500, existingPlantsError.message);
    }

    const activePlants = (existingPlants ?? []) as ExistingPlantSummary[];

    if (hasNameConflict(activePlants, input.name)) {
      return jsonError(409, "Plant name must be unique.");
    }

    if (hasSlugConflict(activePlants, slug)) {
      return jsonError(409, "This plant name creates a duplicate URL. Rename the plant slightly.");
    }

    const publishValidation = validatePlantForPublish(input);
    if (!publishValidation.isValid) {
      return jsonError(400, "Cannot save published plant", publishValidation.errors);
    }

    const publishedAt = new Date().toISOString();

    const { data: insertedPlant, error: plantError } = await supabase
      .from("plants")
      .insert({
        type: input.type,
        slug,
        name: input.name,
        scientific_name: input.scientific_name,
        short_description: input.short_description,
        hero_image_url: input.hero_image_url,
        status: "published",
        published_at: publishedAt,
      })
      .select("id, slug, status, published_at")
      .single();

    if (plantError || !insertedPlant) {
      return jsonError(500, plantError?.message || "Failed to create plant.");
    }

    if (input.blocks.length > 0) {
      const { error: blocksError } = await supabase.from("plant_blocks").insert(
        input.blocks.map((block, index) => ({
          plant_id: insertedPlant.id,
          position: index,
          block_kind: block.block_kind,
          title: block.title || null,
          body: block.body || null,
          image_url: block.image_url || null,
          payload: block.payload || {},
        })),
      );

      if (blocksError) {
        await supabase.from("plants").delete().eq("id", insertedPlant.id);
        return jsonError(500, blocksError.message);
      }
    }

    revalidatePath("/");
    revalidatePath(`/plants/${insertedPlant.slug}`);

    return NextResponse.json(insertedPlant, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

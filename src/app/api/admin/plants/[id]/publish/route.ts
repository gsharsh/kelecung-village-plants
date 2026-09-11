import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin";
import { handleApiError, jsonError } from "@/lib/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { PlantDocumentInput } from "@/lib/types/plant";
import { validatePlantForPublish } from "@/lib/validation/plant";

type RouteParams = Promise<{ id: string }>;

export async function POST(_request: Request, context: { params: RouteParams }) {
  try {
    await assertAdminUser();

    const { id } = await context.params;
    const supabase = createAdminSupabaseClient();

    const { data: plant, error: plantError } = await supabase
      .from("plants")
      .select("id, type, slug, name, scientific_name, short_description, hero_image_url, status, published_at")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (plantError) {
      return jsonError(500, plantError.message);
    }

    if (!plant) {
      return jsonError(404, "Plant not found.");
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("plant_blocks")
      .select("id, block_kind, title, body, image_url, payload")
      .eq("plant_id", id)
      .order("position", { ascending: true });

    if (blocksError) {
      return jsonError(500, blocksError.message);
    }

    const publishCandidate: PlantDocumentInput = {
      type: plant.type,
      name: plant.name,
      scientific_name: plant.scientific_name,
      short_description: plant.short_description,
      hero_image_url: plant.hero_image_url,
      blocks: (blocks ?? []).map((block) => ({
        id: block.id,
        block_kind: block.block_kind,
        title: block.title,
        body: block.body,
        image_url: block.image_url,
        payload: (block.payload as Record<string, unknown>) || {},
      })),
    };

    const publishValidation = validatePlantForPublish(publishCandidate);
    if (!publishValidation.isValid) {
      return jsonError(400, "Cannot publish plant", publishValidation.errors);
    }

    const publishedAt = plant.published_at || new Date().toISOString();

    const { data: updatedPlant, error: updateError } = await supabase
      .from("plants")
      .update({
        status: "published",
        published_at: publishedAt,
      })
      .eq("id", id)
      .select("id, slug, status, published_at")
      .single();

    if (updateError || !updatedPlant) {
      return jsonError(500, updateError?.message || "Failed to publish plant.");
    }

    revalidatePath("/");
    revalidatePath(`/plants/${updatedPlant.slug}`);

    return NextResponse.json(updatedPlant);
  } catch (error) {
    return handleApiError(error);
  }
}

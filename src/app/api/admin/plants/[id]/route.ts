import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin";
import { handleApiError, jsonError } from "@/lib/api";
import { ensureUniqueSlug } from "@/lib/slug";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALLOWED_BLOCK_KINDS_BY_TYPE, type PlantDocumentInput } from "@/lib/types/plant";
import { plantDocumentInputSchema, validatePlantForPublish } from "@/lib/validation/plant";

type RouteParams = Promise<{ id: string }>;

function sanitizeBlocks(input: PlantDocumentInput) {
  const allowedKinds = ALLOWED_BLOCK_KINDS_BY_TYPE[input.type];
  return input.blocks.filter((block) => allowedKinds.includes(block.block_kind));
}

export async function PATCH(request: Request, context: { params: RouteParams }) {
  try {
    await assertAdminUser();

    const { id } = await context.params;
    const payload = await request.json();
    const parsed = plantDocumentInputSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(400, "Invalid payload", parsed.error.issues.map((issue) => issue.message));
    }

    const supabase = createAdminSupabaseClient();

    const { data: existingPlant, error: existingError } = await supabase
      .from("plants")
      .select("id, slug, status, published_at")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) {
      return jsonError(500, existingError.message);
    }

    if (!existingPlant) {
      return jsonError(404, "Plant not found.");
    }

    const input: PlantDocumentInput = {
      ...parsed.data,
      blocks: sanitizeBlocks(parsed.data),
    };

    const incomingSlug = input.slug?.trim() || input.name;

    let slug = existingPlant.slug;

    if (existingPlant.published_at) {
      if (input.slug && input.slug.trim() !== existingPlant.slug) {
        return jsonError(400, "Slug cannot be changed after first publish.");
      }
    } else {
      slug = await ensureUniqueSlug(supabase, incomingSlug, id);
    }

    const shouldValidatePublish = existingPlant.status === "published";

    if (shouldValidatePublish) {
      const publishValidation = validatePlantForPublish({
        ...input,
        slug,
      });

      if (!publishValidation.isValid) {
        return jsonError(400, "Cannot save published plant", publishValidation.errors);
      }
    }

    const { error: updateError } = await supabase
      .from("plants")
      .update({
        type: input.type,
        slug,
        name: input.name,
        scientific_name: input.scientific_name,
        short_description: input.short_description,
        hero_image_url: input.hero_image_url,
      })
      .eq("id", id);

    if (updateError) {
      return jsonError(500, updateError.message);
    }

    const { error: deleteBlocksError } = await supabase.from("plant_blocks").delete().eq("plant_id", id);
    if (deleteBlocksError) {
      return jsonError(500, deleteBlocksError.message);
    }

    if (input.blocks.length > 0) {
      const { error: insertBlocksError } = await supabase.from("plant_blocks").insert(
        input.blocks.map((block, index) => ({
          plant_id: id,
          position: index,
          block_kind: block.block_kind,
          title: block.title || null,
          body: block.body || null,
          image_url: block.image_url || null,
          payload: block.payload || {},
        })),
      );

      if (insertBlocksError) {
        return jsonError(500, insertBlocksError.message);
      }
    }

    const { data: updatedPlant, error: updatedError } = await supabase
      .from("plants")
      .select("id, slug, status, published_at")
      .eq("id", id)
      .single();

    if (updatedError || !updatedPlant) {
      return jsonError(500, updatedError?.message || "Failed to load updated plant.");
    }

    revalidatePath("/");
    revalidatePath(`/plants/${updatedPlant.slug}`);

    return NextResponse.json(updatedPlant);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: RouteParams }) {
  try {
    await assertAdminUser();

    const { id } = await context.params;
    const supabase = createAdminSupabaseClient();

    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("id, slug")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      return jsonError(500, fetchError.message);
    }

    if (!plant) {
      return jsonError(404, "Plant not found.");
    }

    const { error: deleteError } = await supabase
      .from("plants")
      .update({
        deleted_at: new Date().toISOString(),
        status: "draft",
      })
      .eq("id", id);

    if (deleteError) {
      return jsonError(500, deleteError.message);
    }

    revalidatePath("/");
    revalidatePath(`/plants/${plant.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

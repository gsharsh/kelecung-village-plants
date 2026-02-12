import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { assertAdminUser } from "@/lib/auth/admin";
import { handleApiError, jsonError } from "@/lib/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RouteParams = Promise<{ id: string }>;

export async function POST(_request: Request, context: { params: RouteParams }) {
  try {
    await assertAdminUser();

    const { id } = await context.params;
    const supabase = createAdminSupabaseClient();

    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("id, slug, published_at")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) {
      return jsonError(500, fetchError.message);
    }

    if (!plant) {
      return jsonError(404, "Plant not found.");
    }

    const { data: updatedPlant, error: updateError } = await supabase
      .from("plants")
      .update({
        status: "draft",
      })
      .eq("id", id)
      .select("id, slug, status, published_at")
      .single();

    if (updateError || !updatedPlant) {
      return jsonError(500, updateError?.message || "Failed to unpublish plant.");
    }

    revalidatePath("/");
    revalidatePath(`/plants/${plant.slug}`);

    return NextResponse.json(updatedPlant);
  } catch (error) {
    return handleApiError(error);
  }
}

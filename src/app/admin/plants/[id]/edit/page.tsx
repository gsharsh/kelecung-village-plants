import Link from "next/link";
import { notFound } from "next/navigation";
import { PlantForm } from "@/components/admin/PlantForm";
import { assertAdminUser } from "@/lib/auth/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;

export default async function EditPlantPage({ params }: { params: PageParams }) {
  await assertAdminUser();

  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: plant, error: plantError } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (plantError) {
    throw new Error(plantError.message);
  }

  if (!plant) {
    notFound();
  }

  const { data: blocks, error: blocksError } = await supabase
    .from("plant_blocks")
    .select("*")
    .eq("plant_id", id)
    .order("position", { ascending: true });

  if (blocksError) {
    throw new Error(blocksError.message);
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold text-[var(--text-900)]">Edit Plant</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="secondary-btn">
              Back to admin
            </Link>
            <Link href={`/plants/${plant.slug}`} className="secondary-btn">
              View public page
            </Link>
          </div>
        </div>

        <PlantForm plantId={plant.id} initialPlant={plant} initialBlocks={blocks ?? []} />
      </div>
    </div>
  );
}

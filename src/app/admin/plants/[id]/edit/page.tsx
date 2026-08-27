import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
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
    <div className="admin-page">
      <AdminHeader title={`Edit ${plant.name}`} description="Update the plant profile, arrange its content, and review the visitor preview before publishing." compact>
        <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white">← Plant library</Link>
        <Link href={`/plants/${plant.slug}`} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-[var(--forest-950)] hover:bg-[var(--sage-100)]">View live page ↗</Link>
      </AdminHeader>
      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10"><PlantForm plantId={plant.id} initialPlant={plant} initialBlocks={blocks ?? []} /></main>
    </div>
  );
}

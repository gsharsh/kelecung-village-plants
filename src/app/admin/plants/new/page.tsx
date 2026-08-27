import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PlantForm } from "@/components/admin/PlantForm";
import { assertAdminUser } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  await assertAdminUser();

  return (
    <div className="admin-page">
      <AdminHeader title="Create a plant" description="Add the essential details first, then build the page with flexible story, recipe, or use blocks." compact>
        <Link href="/admin" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white">← Plant library</Link>
      </AdminHeader>
      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10 lg:py-10"><PlantForm /></main>
    </div>
  );
}

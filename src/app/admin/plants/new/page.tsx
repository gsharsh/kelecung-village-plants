import Link from "next/link";
import { PlantForm } from "@/components/admin/PlantForm";
import { assertAdminUser } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function NewPlantPage() {
  await assertAdminUser();

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-[var(--text-900)]">Create Plant</h1>
          <Link href="/admin" className="secondary-btn">
            Back to admin
          </Link>
        </div>

        <PlantForm />
      </div>
    </div>
  );
}

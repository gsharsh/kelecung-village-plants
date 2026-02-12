import Link from "next/link";
import { assertAdminUser } from "@/lib/auth/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SignOutButton } from "@/components/admin/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await assertAdminUser();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("plants")
    .select("id, name, scientific_name, slug, type, status, updated_at, deleted_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const plants = data ?? [];

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="card-surface flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text-900)]">Plant Admin</h1>
            <p className="mt-1 text-sm text-[var(--text-700)]">Manage plant entries, ordering blocks, and visibility.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/plants/new" className="primary-btn">
              + New plant
            </Link>
            <SignOutButton />
          </div>
        </header>

        <section className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--leaf-100)] text-[var(--text-700)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plants.map((plant) => (
                  <tr key={plant.id} className="border-t border-[var(--line)] text-[var(--text-900)]">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{plant.name}</p>
                      <p className="text-xs italic text-[var(--text-700)]">{plant.scientific_name}</p>
                      <p className="text-xs text-[var(--text-700)]">/{plant.slug}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{plant.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          plant.status === "published"
                            ? "bg-[var(--leaf-100)] text-[var(--brand-700)]"
                            : "bg-[var(--earth-100)] text-[var(--text-700)]"
                        }`}
                      >
                        {plant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-700)]">
                      {new Date(plant.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/plants/${plant.id}/edit`} className="secondary-btn px-3 py-1.5 text-xs">
                          Edit
                        </Link>
                        <Link href={`/plants/${plant.slug}`} className="secondary-btn px-3 py-1.5 text-xs">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {plants.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[var(--text-700)]" colSpan={5}>
                      No plants yet. Create your first plant.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { assertAdminUser } from "@/lib/auth/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
type AdminSearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminDashboardPage({ searchParams }: { searchParams: AdminSearchParams }) {
  await assertAdminUser();
  const { q = "", status = "all" } = await searchParams;
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("plants").select("id, name, scientific_name, slug, type, status, updated_at, deleted_at").is("deleted_at", null).order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const allPlants = data ?? [];
  const search = q.trim().toLowerCase();
  const plants = allPlants.filter((plant) => {
    const matchesStatus = status === "all" || plant.status === status;
    const matchesSearch = !search || [plant.name, plant.scientific_name, plant.slug].some((value) => value.toLowerCase().includes(search));
    return matchesStatus && matchesSearch;
  });
  const publishedCount = allPlants.filter((plant) => plant.status === "published").length;
  const draftCount = allPlants.length - publishedCount;

  return (
    <div className="admin-page">
      <AdminHeader title="Plant library" description="Create, update, and publish the stories visitors see across the Kelecung plant guide.">
        <Link href="/admin/plants/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--ochre-500)] px-5 text-sm font-bold text-[var(--forest-950)] hover:bg-[#dda34f]">+ Add a plant</Link>
      </AdminHeader>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section aria-label="Collection overview" className="grid gap-3 sm:grid-cols-3">
          {[["Total plants", allPlants.length, "Across the collection"], ["Published", publishedCount, "Visible to visitors"], ["Drafts", draftCount, "Waiting for review"]].map(([label, value, hint]) => (
            <article key={label} className="admin-panel p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-700)]">{label}</p><div className="mt-3 flex items-end justify-between gap-4"><strong className="font-heading text-4xl font-semibold">{value}</strong><span className="pb-1 text-xs text-[var(--ink-700)]">{hint}</span></div></article>
          ))}
        </section>

        <section className="admin-panel mt-6 overflow-hidden">
          <div className="border-b border-[var(--line)] p-4 sm:p-5">
            <form className="grid gap-3 sm:grid-cols-[1fr_170px_auto]" method="get">
              <div><label htmlFor="admin-search" className="sr-only">Search plants</label><input id="admin-search" name="q" defaultValue={q} className="text-input" placeholder="Search plants…" /></div>
              <div><label htmlFor="status-filter" className="sr-only">Filter by status</label><select id="status-filter" name="status" defaultValue={status} className="select-input"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
              <button className="primary-btn">Apply filters</button>
            </form>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--cream-100)]/55 px-5 py-3">
            <h2 className="admin-section-title">All entries</h2><p className="text-xs font-semibold text-[var(--ink-700)]">{plants.length} {plants.length === 1 ? "result" : "results"}</p>
          </div>

          {plants.length ? (
            <div className="divide-y divide-[var(--line)]">
              {plants.map((plant) => (
                <article key={plant.id} className="grid gap-4 p-5 transition-colors hover:bg-[var(--cream-50)] md:grid-cols-[minmax(0,1fr)_130px_150px_auto] md:items-center">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="admin-section-title truncate">{plant.name}</h3><span className={`status-pill ${plant.status === "published" ? "" : "!border-amber-200 !bg-amber-50 !text-amber-800"}`}>{plant.status === "published" ? "● Published" : "○ Draft"}</span></div><p className="mt-1 truncate text-xs italic text-[var(--ink-700)]">{plant.scientific_name}</p><p className="mt-1 truncate text-[0.68rem] text-[var(--ink-700)]/70">/plants/{plant.slug}</p></div>
                  <div><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-700)] md:hidden">Type</p><p className="mt-1 text-sm font-semibold capitalize md:mt-0">{plant.type}</p></div>
                  <div><p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-700)] md:hidden">Last updated</p><p className="mt-1 text-xs text-[var(--ink-700)] md:mt-0">{new Date(plant.updated_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                  <div className="flex gap-2 md:justify-end"><Link href={`/admin/plants/${plant.id}/edit`} className="primary-btn !min-h-9 !px-3 !py-1.5 !text-xs">Edit</Link><Link href={`/plants/${plant.slug}`} className="secondary-btn !min-h-9 !px-3 !py-1.5 !text-xs">Preview ↗</Link></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center sm:p-16"><span className="text-4xl text-[var(--moss-500)]" aria-hidden="true">✦</span><h2 className="mt-4 text-2xl font-semibold">No matching plants</h2><p className="mt-2 text-sm text-[var(--ink-700)]">Clear the filters or create a new entry.</p><div className="mt-6 flex justify-center gap-2"><Link href="/admin" className="secondary-btn">Clear filters</Link><Link href="/admin/plants/new" className="primary-btn">Add a plant</Link></div></div>
          )}
        </section>
      </main>
    </div>
  );
}

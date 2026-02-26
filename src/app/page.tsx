import { PlantCard } from "@/components/public/PlantCard";
import { getPublishedPlants } from "@/lib/data/plants";
import { hasPublicSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type HomeSearchParams = Promise<{
  q?: string;
  type?: string;
}>;

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Edible", value: "edible" },
  { label: "Inedible", value: "inedible" },
] as const;

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const { q = "", type = "all" } = await searchParams;
  const normalizedType = type === "edible" || type === "inedible" ? type : "all";

  const plants = await getPublishedPlants({ q, type: normalizedType });
  const isDemoPreview = !hasPublicSupabaseEnv();

  return (
    <div className="hero-glow min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white/85 p-5 shadow-sm backdrop-blur">
          {isDemoPreview ? (
            <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Preview mode: showing demo content until Supabase env vars are configured.
            </p>
          ) : null}
          <p className="mb-3 inline-flex rounded-full border border-[rgba(0,130,54,0.25)] bg-[var(--leaf-100)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-700)]">
            Kelecung&apos;s Village
          </p>
          <h1 className="max-w-none whitespace-nowrap text-[clamp(1.55rem,3.2vw,2.55rem)] font-semibold tracking-tight text-[var(--text-900)]">
            Explore the plants of Kelecung
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--text-700)]">
            Discover botanical stories, recipes, medicinal uses, and practical village knowledge in one curated guide.
          </p>

          <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, scientific name, or description"
              className="text-input"
            />
            <button className="primary-btn">Search</button>

            <input type="hidden" name="type" value={normalizedType} />
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <a
                key={filter.value}
                href={`/?type=${filter.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  normalizedType === filter.value
                    ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--text-700)] hover:border-[rgba(0,130,54,0.35)]"
                }`}
              >
                {filter.label}
              </a>
            ))}
          </div>
        </header>

        <section>
          {plants.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} />
              ))}
            </div>
          ) : (
            <div className="card-surface p-8 text-center">
              <h2 className="text-2xl font-semibold text-[var(--text-900)]">No plants found</h2>
              <p className="mt-2 text-[var(--text-700)]">Try changing your search terms or plant type filter.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

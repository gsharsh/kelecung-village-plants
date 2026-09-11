import Image from "next/image";
import Link from "next/link";
import { PlantCard } from "@/components/public/PlantCard";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { getPublishedPlants } from "@/lib/data/plants";
import { hasPublicSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type HomeSearchParams = Promise<{ q?: string; type?: string }>;

const FILTERS = [
  { label: "All plants", value: "all" },
  { label: "Edible", value: "edible" },
  { label: "Useful & ornamental", value: "inedible" },
] as const;

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const { q = "", type = "all" } = await searchParams;
  const normalizedType = type === "edible" || type === "inedible" ? type : "all";
  const plants = await getPublishedPlants({ q, type: normalizedType });
  const isDemoPreview = !hasPublicSupabaseEnv();
  const heroPlant = plants[0];

  return (
    <div className="page-shell">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-[var(--forest-950)] text-white">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-24">
            <div className="relative z-10">
              <p className="eyebrow !text-[var(--sage-300)]">A living field guide</p>
              <h1 className="mt-6 max-w-3xl text-[clamp(3.2rem,8vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.045em]">
                Meet the plants of <span className="text-[var(--sage-300)]">Kelecung.</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/68 sm:text-lg">
                Wander through a village collection shaped by food, craft, beauty, and generations of local knowledge.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="#explore" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--ochre-500)] px-6 text-sm font-bold text-[var(--forest-950)] transition-transform hover:-translate-y-0.5">
                  Explore the collection <span aria-hidden="true">↓</span>
                </Link>
                <span className="text-sm font-semibold text-white/52">{plants.length} {plants.length === 1 ? "plant" : "plants"} to discover</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -left-7 top-12 hidden h-32 w-32 rounded-full border border-white/12 md:block" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem_2.5rem_8rem_2.5rem] border border-white/15 bg-[var(--forest-800)] shadow-2xl">
                {heroPlant ? (
                  <Image src={heroPlant.hero_image_url} alt={`${heroPlant.name} growing in Kelecung Village`} fill priority unoptimized sizes="(max-width: 1024px) 90vw, 44vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-7xl text-white/20" aria-hidden="true">✦</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-950)]/75 via-transparent to-transparent" />
                {heroPlant ? (
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--sage-300)]">Featured from the garden</p>
                    <p className="mt-2 font-heading text-3xl font-semibold">{heroPlant.name}</p>
                    <p className="mt-1 text-sm italic text-white/65">{heroPlant.scientific_name}</p>
                  </div>
                ) : null}
              </div>
              <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md sm:-left-8">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">Village wisdom</p>
                <p className="mt-1 font-heading text-lg">Collected with care</p>
              </div>
            </div>
          </div>
        </section>

        <section id="explore" className="scroll-mt-6 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-7xl">
            {isDemoPreview ? (
              <div className="mb-8 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                <span aria-hidden="true">◎</span><span><strong>Preview collection.</strong> Demo plants are shown until the live collection is connected.</span>
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div>
                <p className="eyebrow">Explore the collection</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Find a plant,<br />follow its story.</h2>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[0_20px_50px_-38px_rgba(16,40,29,.55)]">
                <form className="flex flex-col gap-2 sm:flex-row" method="get" role="search">
                  <label htmlFor="plant-search" className="sr-only">Search the plant collection</label>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-700)]" aria-hidden="true">⌕</span>
                    <input id="plant-search" type="search" name="q" defaultValue={q} placeholder="Search common or scientific name…" className="text-input min-h-12 !border-0 !bg-transparent !pl-10 !shadow-none" />
                  </div>
                  <input type="hidden" name="type" value={normalizedType} />
                  <button className="primary-btn min-h-12 sm:px-6">Search collection</button>
                </form>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-y border-[var(--line)] py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2" aria-label="Filter plants by type">
                {FILTERS.map((filter) => (
                  <Link key={filter.value} href={`/?type=${filter.value}${q ? `&q=${encodeURIComponent(q)}` : ""}#explore`} aria-current={normalizedType === filter.value ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${normalizedType === filter.value ? "bg-[var(--forest-900)] text-white" : "bg-[var(--cream-100)] text-[var(--ink-700)] hover:bg-[var(--sage-100)]"}`}>
                    {filter.label}
                  </Link>
                ))}
              </div>
              <p className="text-sm text-[var(--ink-700)]" aria-live="polite">Showing <strong className="text-[var(--ink-900)]">{plants.length}</strong> {plants.length === 1 ? "plant" : "plants"}{q ? <> for “{q}”</> : null}</p>
            </div>

            {plants.length > 0 ? (
              <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {plants.map((plant, index) => <PlantCard key={plant.id} plant={plant} priority={index < 3} />)}
              </div>
            ) : (
              <div className="mt-10 rounded-[2rem] border border-dashed border-[var(--line-strong)] bg-white/65 p-10 text-center sm:p-16">
                <span className="text-4xl text-[var(--moss-500)]" aria-hidden="true">✦</span>
                <h2 className="mt-4 text-3xl font-semibold">No plants found</h2>
                <p className="mx-auto mt-3 max-w-md text-[var(--ink-700)]">Try a shorter search or browse the full collection. The garden may still surprise you.</p>
                <Link href="/#explore" className="secondary-btn mt-6">Clear search and filters</Link>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-[var(--cream-100)] px-5 py-16 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {[
              ["01", "Edible harvests", "Discover leaves, fruits, and roots used in familiar village dishes."],
              ["02", "Everyday uses", "Learn how plants support craft, remedies, shade, and daily life."],
              ["03", "Living stories", "See each plant as part of a place, a practice, and a community."],
            ].map(([number, title, copy]) => (
              <article key={number} className="border-l border-[var(--line-strong)] pl-6">
                <p className="text-xs font-bold tracking-[0.18em] text-[var(--ochre-500)]">{number}</p>
                <h3 className="mt-5 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-700)]">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

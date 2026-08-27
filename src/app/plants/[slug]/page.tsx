import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlantBlocksRenderer } from "@/components/public/PlantBlocksRenderer";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { getPublishedPlantBySlug } from "@/lib/data/plants";

export const dynamic = "force-dynamic";
type PageParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { slug } = await params;
  const plant = await getPublishedPlantBySlug(slug);
  if (!plant) return { title: "Plant not found" };

  return {
    title: plant.name,
    description: plant.short_description,
    openGraph: { title: `${plant.name} | Kelecung Village`, description: plant.short_description, images: [{ url: plant.hero_image_url }] },
    twitter: { card: "summary_large_image", title: `${plant.name} | Kelecung Village`, description: plant.short_description, images: [plant.hero_image_url] },
  };
}

export default async function PlantDetailPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const plant = await getPublishedPlantBySlug(slug);
  if (!plant) notFound();

  const typeLabel = plant.type === "edible" ? "Edible plant" : "Useful & ornamental plant";

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden bg-[var(--forest-950)] text-white">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8 lg:px-10">
            <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-xs font-semibold text-white/50">
              <Link href="/" className="transition-colors hover:text-white">Plant guide</Link>
              <span aria-hidden="true">/</span>
              <span className="text-white/80">{plant.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[.84fr_1.16fr] lg:items-end">
              <div className="pb-4 lg:pb-12">
                <p className="eyebrow !text-[var(--sage-300)]">{typeLabel}</p>
                <h1 className="mt-6 text-[clamp(3.7rem,8vw,7.2rem)] font-semibold leading-[0.86] tracking-[-0.055em]">{plant.name}</h1>
                <p className="mt-5 font-heading text-xl italic text-[var(--sage-300)] sm:text-2xl">{plant.scientific_name}</p>
                <p className="mt-7 max-w-xl whitespace-pre-line text-base leading-7 text-white/68">{plant.short_description}</p>
                <Link href="#plant-story" className="mt-8 inline-flex items-center gap-3 text-sm font-bold text-white">
                  Read its story <span className="grid size-8 place-items-center rounded-full border border-white/25" aria-hidden="true">↓</span>
                </Link>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-t-[2rem] border border-white/12 bg-[var(--forest-800)] lg:rounded-[2rem_2rem_0_0]">
                <Image src={plant.hero_image_url} alt={`${plant.name} — ${plant.scientific_name}`} fill priority unoptimized sizes="(max-width: 1024px) 100vw, 58vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-950)]/25 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section id="plant-story" className="scroll-mt-6 px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-8 lg:h-fit">
              <Link href="/#explore" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--forest-800)] hover:text-[var(--forest-700)]"><span aria-hidden="true">←</span> All plants</Link>
              <div className="mt-8 border-l border-[var(--line-strong)] pl-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-700)]">In this guide</p>
                <ol className="mt-4 space-y-3 text-sm font-semibold text-[var(--forest-800)]">
                  {plant.blocks.map((block, index) => <li key={block.id}><a href={`#section-${index + 1}`} className="transition-colors hover:text-[var(--ochre-500)]">{block.title || (block.block_kind === "about" ? "About" : block.block_kind === "edible_recipe" ? "Recipe" : "Village use")}</a></li>)}
                </ol>
              </div>
            </aside>

            <PlantBlocksRenderer type={plant.type} blocks={plant.blocks} />
          </div>
        </section>

        <section className="px-5 pb-16 sm:px-8 lg:px-10 lg:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 rounded-[2rem] bg-[var(--sage-100)] p-7 sm:flex-row sm:items-center sm:p-10">
            <div><p className="eyebrow">Keep exploring</p><h2 className="mt-3 text-3xl font-semibold">There is more growing nearby.</h2></div>
            <Link href="/#explore" className="primary-btn shrink-0">Browse all plants <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

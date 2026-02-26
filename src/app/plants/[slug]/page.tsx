import Link from "next/link";
import { notFound } from "next/navigation";
import { PlantLinkShare } from "@/components/public/PlantLinkShare";
import { PlantBlocksRenderer } from "@/components/public/PlantBlocksRenderer";
import { getPublishedPlantBySlug } from "@/lib/data/plants";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ slug: string }>;

export default async function PlantDetailPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const plant = await getPublishedPlantBySlug(slug);

  if (!plant) {
    notFound();
  }

  return (
    <div className="hero-glow min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="card-surface overflow-hidden p-6 sm:p-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)] hover:text-[var(--brand-600)]"
          >
            <span aria-hidden="true">←</span>
            Back to all plants
          </Link>

          <div className="grid gap-5 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div>
              <span className="botanical-pill">{plant.type === "edible" ? "Edible" : "Inedible"}</span>
              <h1 className="mt-3 text-4xl font-semibold text-[var(--text-900)]">{plant.name}</h1>
              <p className="mt-2 text-lg italic text-[var(--text-700)]">{plant.scientific_name}</p>
              <p className="mt-4 whitespace-pre-line leading-7 text-[var(--text-700)]">{plant.short_description}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
              <img src={plant.hero_image_url} alt={plant.name} className="h-full min-h-64 w-full object-cover" />
            </div>
          </div>
        </header>

        <main className="mt-6">
          <PlantBlocksRenderer type={plant.type} blocks={plant.blocks} />
          <PlantLinkShare slug={plant.slug} />
        </main>
      </div>
    </div>
  );
}

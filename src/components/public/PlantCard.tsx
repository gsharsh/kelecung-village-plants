import Image from "next/image";
import Link from "next/link";
import type { Plant } from "@/lib/types/plant";

interface PlantCardProps { plant: Plant; priority?: boolean; }

export function PlantCard({ plant, priority = false }: PlantCardProps) {
  const typeLabel = plant.type === "edible" ? "Edible" : "Useful & ornamental";

  return (
    <Link href={`/plants/${plant.slug}`} className="group block" aria-label={`Explore ${plant.name}`}>
      <article className="h-full">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem] bg-[var(--earth-100)]">
          <Image src={plant.hero_image_url} alt={plant.name} fill priority={priority} unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-950)]/28 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-4 top-4 rounded-full border border-white/35 bg-[var(--forest-950)]/72 px-3 py-1.5 text-[0.67rem] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md">{typeLabel}</span>
          <span className="absolute bottom-4 right-4 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-lg text-[var(--forest-900)] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" aria-hidden="true">↗</span>
        </div>
        <div className="px-1 pb-2 pt-5">
          <p className="text-xs font-semibold italic text-[var(--moss-500)]">{plant.scientific_name}</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em] transition-colors group-hover:text-[var(--forest-700)]">{plant.name}</h2>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--ink-700)]">{plant.short_description}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--forest-800)]">Discover this plant <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></span>
        </div>
      </article>
    </Link>
  );
}

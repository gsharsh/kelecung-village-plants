import Link from "next/link";
import type { Plant } from "@/lib/types/plant";

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  return (
    <Link
      href={`/plants/${plant.slug}`}
      className="plant-glass-card group flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="aspect-[16/10] overflow-hidden bg-white/20">
        <img
          src={plant.hero_image_url}
          alt={plant.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-900)]">{plant.name}</h2>
            <p className="mt-1 text-sm italic text-[var(--text-700)]">{plant.scientific_name}</p>
          </div>
          <span className="botanical-pill shrink-0">{plant.type === "edible" ? "Edible" : "Inedible"}</span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[var(--text-700)]">{plant.short_description}</p>
      </div>
    </Link>
  );
}

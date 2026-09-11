import Image from "next/image";
import type { PlantBlock, PlantType } from "@/lib/types/plant";

interface PlantBlocksRendererProps { type: PlantType; blocks: PlantBlock[]; }
function asString(value: unknown) { return typeof value === "string" ? value : ""; }
function asStringArray(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []; }

export function PlantBlocksRenderer({ type, blocks }: PlantBlocksRendererProps) {
  if (blocks.length === 0) return <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white/60 p-8 text-center text-sm text-[var(--ink-700)]">More village knowledge will be added here soon.</div>;

  return (
    <div className="space-y-7">
      {blocks.map((block, index) => {
        const sectionLabel = String(index + 1).padStart(2, "0");

        if (block.block_kind === "about") {
          const text = asString((block.payload as { text?: string })?.text) || block.body || "";
          return (
            <section id={`section-${index + 1}`} key={block.id} className="scroll-mt-8 border-b border-[var(--line)] pb-10">
              <p className="text-xs font-bold tracking-[0.16em] text-[var(--ochre-500)]">{sectionLabel} — THE STORY</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{block.title || "About this plant"}</h2>
              <p className="mt-6 max-w-3xl whitespace-pre-line font-heading text-xl leading-9 text-[var(--ink-700)] sm:text-2xl">{text}</p>
            </section>
          );
        }

        if (block.block_kind === "edible_recipe") {
          const payload = block.payload as { recipeTitle?: string; ingredients?: string[]; instructions?: string[] };
          const recipeTitle = asString(payload.recipeTitle);
          const ingredients = asStringArray(payload.ingredients);
          const instructions = asStringArray(payload.instructions);
          return (
            <section id={`section-${index + 1}`} key={block.id} className="scroll-mt-8 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white">
              {block.image_url ? <div className="relative aspect-[16/7] bg-[var(--earth-100)]"><Image src={block.image_url} alt={recipeTitle || "Prepared village recipe"} fill unoptimized sizes="(max-width: 1024px) 100vw, 800px" className="object-cover" /></div> : null}
              <div className="p-6 sm:p-9">
                <p className="text-xs font-bold tracking-[0.16em] text-[var(--ochre-500)]">{sectionLabel} — FROM THE KITCHEN</p>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{block.title || recipeTitle || "Village recipe"}</h2>
                <div className="mt-8 grid gap-8 md:grid-cols-[.78fr_1.22fr]">
                  <div className="rounded-2xl bg-[var(--cream-100)] p-5">
                    <h3 className="admin-section-title text-[var(--forest-900)]">Ingredients</h3>
                    {ingredients.length ? <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--ink-700)]">{ingredients.map((item, i) => <li key={`${block.id}-ingredient-${i}`} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--moss-500)]" />{item}</li>)}</ul> : <p className="mt-3 text-sm text-[var(--ink-700)]">Ingredients coming soon.</p>}
                  </div>
                  <div>
                    <h3 className="admin-section-title text-[var(--forest-900)]">Method</h3>
                    {instructions.length ? <ol className="mt-4 space-y-5">{instructions.map((item, i) => <li key={`${block.id}-instruction-${i}`} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-[var(--ink-700)]"><span className="grid size-8 place-items-center rounded-full border border-[var(--line-strong)] text-xs font-bold text-[var(--forest-800)]">{i + 1}</span><span>{item}</span></li>)}</ol> : <p className="mt-3 text-sm text-[var(--ink-700)]">Method coming soon.</p>}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        const payload = block.payload as { useType?: string; details?: string; steps?: string[] };
        const useType = asString(payload.useType);
        const details = asString(payload.details);
        const steps = asStringArray(payload.steps);
        return (
          <section id={`section-${index + 1}`} key={block.id} className="scroll-mt-8 grid overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white md:grid-cols-[.92fr_1.08fr]">
            {block.image_url ? <div className="relative min-h-72 bg-[var(--earth-100)]"><Image src={block.image_url} alt={block.title || `${type} plant use`} fill unoptimized sizes="(max-width: 768px) 100vw, 400px" className="object-cover" /></div> : <div className="grid min-h-52 place-items-center bg-[var(--sage-100)] font-heading text-6xl text-[var(--forest-700)]/25" aria-hidden="true">✦</div>}
            <div className="p-6 sm:p-9">
              <p className="text-xs font-bold tracking-[0.16em] text-[var(--ochre-500)]">{sectionLabel} — VILLAGE USE</p>
              <div className="mt-4 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-semibold sm:text-4xl">{block.title || "How it is used"}</h2>{useType ? <span className="botanical-pill capitalize">{useType}</span> : null}</div>
              {details ? <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[var(--ink-700)]">{details}</p> : null}
              {steps.length ? <ol className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">{steps.map((step, i) => <li key={`${block.id}-step-${i}`} className="flex gap-3 text-sm leading-6 text-[var(--ink-700)]"><strong className="text-[var(--forest-800)]">{String(i + 1).padStart(2, "0")}</strong><span>{step}</span></li>)}</ol> : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

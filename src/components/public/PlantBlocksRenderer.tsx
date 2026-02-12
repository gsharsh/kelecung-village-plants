import type { PlantBlock, PlantType } from "@/lib/types/plant";

interface PlantBlocksRendererProps {
  type: PlantType;
  blocks: PlantBlock[];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function PlantBlocksRenderer({ blocks }: PlantBlocksRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => {
        if (block.block_kind === "about") {
          const text = asString((block.payload as { text?: string })?.text);
          return (
            <section key={block.id} className="card-surface p-6">
              <h3 className="mb-3 text-2xl font-semibold text-[var(--text-900)]">{block.title || "About"}</h3>
              <p className="whitespace-pre-line leading-7 text-[var(--text-700)]">{text || block.body || ""}</p>
            </section>
          );
        }

        if (block.block_kind === "edible_recipe") {
          const payload = block.payload as {
            recipeTitle?: string;
            ingredients?: string[];
            instructions?: string[];
          };

          const recipeTitle = asString(payload.recipeTitle);
          const ingredients = asStringArray(payload.ingredients);
          const instructions = asStringArray(payload.instructions);

          return (
            <section key={block.id} className="card-surface p-6">
              <h3 className="mb-1 text-2xl font-semibold text-[var(--text-900)]">
                {block.title || recipeTitle || "Recipe"}
              </h3>

              {block.image_url ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                  <img src={block.image_url} alt={recipeTitle || "Dish"} className="h-64 w-full object-cover" />
                </div>
              ) : null}

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-lg font-semibold text-[var(--text-900)]">Ingredients</h4>
                  {ingredients.length > 0 ? (
                    <ul className="list-disc space-y-1 pl-5 text-[var(--text-700)]">
                      {ingredients.map((ingredient, index) => (
                        <li key={`${block.id}-ingredient-${index}`}>{ingredient}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted text-sm">No ingredients listed yet.</p>
                  )}
                </div>

                <div>
                  <h4 className="mb-2 text-lg font-semibold text-[var(--text-900)]">Instructions</h4>
                  {instructions.length > 0 ? (
                    <ol className="list-decimal space-y-2 pl-5 text-[var(--text-700)]">
                      {instructions.map((instruction, index) => (
                        <li key={`${block.id}-instruction-${index}`}>{instruction}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="muted text-sm">No instructions listed yet.</p>
                  )}
                </div>
              </div>
            </section>
          );
        }

        const payload = block.payload as {
          useType?: string;
          details?: string;
          steps?: string[];
        };
        const useType = asString(payload.useType);
        const details = asString(payload.details);
        const steps = asStringArray(payload.steps);

        return (
          <section key={block.id} className="card-surface p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-[var(--text-900)]">{block.title || "Use Case"}</h3>
              {useType ? <span className="botanical-pill capitalize">{useType}</span> : null}
            </div>

            {block.image_url ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--line)]">
                <img src={block.image_url} alt={block.title || "Use case image"} className="h-60 w-full object-cover" />
              </div>
            ) : null}

            {details ? <p className="whitespace-pre-line leading-7 text-[var(--text-700)]">{details}</p> : null}

            {steps.length > 0 ? (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-[var(--text-700)]">
                {steps.map((step, index) => (
                  <li key={`${block.id}-step-${index}`}>{step}</li>
                ))}
              </ol>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

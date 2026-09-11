"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BlockKind, PlantType } from "@/lib/types/plant";
import { ALLOWED_BLOCK_KINDS_BY_TYPE } from "@/lib/types/plant";
import { cn } from "@/lib/utils";
import { createEmptyBlock, parseLineInput, toLineInput, type EditableBlock } from "@/components/admin/types";

interface BlockEditorProps {
  type: PlantType;
  blocks: EditableBlock[];
  onChange: (blocks: EditableBlock[]) => void;
  onUploadBlockImage: (clientId: string, file: File) => Promise<void>;
}

const BLOCK_LABELS: Record<BlockKind, string> = {
  about: "About",
  edible_recipe: "Recipe",
  inedible_use: "Use Case",
};

export function BlockEditor({ type, blocks, onChange, onUploadBlockImage }: BlockEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addableKinds = ALLOWED_BLOCK_KINDS_BY_TYPE[type];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = blocks.findIndex((block) => block.client_id === active.id);
    const newIndex = blocks.findIndex((block) => block.client_id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  function addBlock(kind: BlockKind) {
    onChange([...blocks, createEmptyBlock(kind)]);
  }

  function removeBlock(clientId: string) {
    onChange(blocks.filter((block) => block.client_id !== clientId));
  }

  function updateBlock(clientId: string, patch: Partial<EditableBlock>) {
    onChange(
      blocks.map((block) =>
        block.client_id === clientId
          ? {
              ...block,
              ...patch,
            }
          : block,
      ),
    );
  }

  function updatePayload(clientId: string, patch: Record<string, unknown>) {
    onChange(
      blocks.map((block) =>
        block.client_id === clientId
          ? {
              ...block,
              payload: {
                ...block.payload,
                ...patch,
              },
            }
          : block,
      ),
    );
  }

  return (
    <section className="admin-panel overflow-hidden">
      <div className="border-b border-[var(--line)] bg-[var(--cream-100)]/55 p-5 sm:p-6">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--moss-500)]">Step 2</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="admin-section-title">Build the plant page</h2><p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">Add sections, fill in the story, then drag them into the right order.</p></div>
          <div className="flex flex-wrap gap-2" aria-label="Add content section">
          {addableKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className="secondary-btn !min-h-9 !px-3 !py-1.5 !text-xs"
              onClick={() => addBlock(kind)}
            >
              + Add {BLOCK_LABELS[kind].toLowerCase()}
            </button>
          ))}
          </div>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="m-5 grid min-h-40 place-items-center rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--cream-50)] p-6 text-center sm:m-6">
          <div><span className="text-3xl text-[var(--moss-500)]/60" aria-hidden="true">✦</span><p className="mt-3 text-sm font-bold">Start with a story section</p><p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">Use the buttons above to add the first piece of this plant page.</p></div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((block) => block.client_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 p-5 sm:p-6">
              {blocks.map((block, index) => (
                <SortableBlockCard
                  key={block.client_id}
                  block={block}
                  index={index}
                  onRemove={() => removeBlock(block.client_id)}
                  onChange={updateBlock}
                  onPayloadChange={updatePayload}
                  onUploadBlockImage={onUploadBlockImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

interface SortableBlockCardProps {
  block: EditableBlock;
  index: number;
  onRemove: () => void;
  onChange: (clientId: string, patch: Partial<EditableBlock>) => void;
  onPayloadChange: (clientId: string, patch: Record<string, unknown>) => void;
  onUploadBlockImage: (clientId: string, file: File) => Promise<void>;
}

function SortableBlockCard({ block, index, onRemove, onChange, onPayloadChange, onUploadBlockImage }: SortableBlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.client_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-[var(--line)] bg-white shadow-[0_12px_35px_-30px_rgba(16,40,29,.65)]",
        isDragging && "border-[var(--brand-600)] shadow-lg",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--cream-50)] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-sm text-[var(--ink-700)] active:cursor-grabbing"
            aria-label={`Drag section ${index + 1} to reorder`}
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          <div><p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--ink-700)]">Section {index + 1}</p><p className="text-sm font-bold text-[var(--forest-900)]">{BLOCK_LABELS[block.block_kind]}</p></div>
        </div>

        <button type="button" onClick={onRemove} className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--danger)] hover:bg-red-50">
          Remove
        </button>
      </div>

      <div className="grid gap-4 p-4 sm:p-5">
        <div>
          <label htmlFor={`${block.client_id}-title`} className="field-label">Section heading <span className="font-normal text-[var(--ink-700)]">(optional)</span></label>
          <input
            id={`${block.client_id}-title`}
            className="text-input"
            placeholder="Give this section a clear title"
            value={block.title}
            onChange={(event) => onChange(block.client_id, { title: event.target.value })}
          />
        </div>

        {block.block_kind === "about" ? (
          <div>
            <label htmlFor={`${block.client_id}-about`} className="field-label">Plant story</label>
            <textarea
              id={`${block.client_id}-about`}
              className="text-area"
              placeholder="Share its origins, how it grows, and what it means locally…"
              value={typeof block.payload.text === "string" ? block.payload.text : ""}
              onChange={(event) => onPayloadChange(block.client_id, { text: event.target.value })}
            />
          </div>
        ) : null}

        {block.block_kind === "edible_recipe" ? (
          <div className="grid gap-3">
            <div>
              <label htmlFor={`${block.client_id}-recipe`} className="field-label">Recipe name</label>
              <input
                id={`${block.client_id}-recipe`}
                className="text-input"
                placeholder="e.g. Moringa leaf coconut soup"
                value={typeof block.payload.recipeTitle === "string" ? block.payload.recipeTitle : ""}
                onChange={(event) => onPayloadChange(block.client_id, { recipeTitle: event.target.value })}
              />
            </div>

            <div>
              <label htmlFor={`${block.client_id}-ingredients`} className="field-label">Ingredients</label>
              <textarea
                id={`${block.client_id}-ingredients`}
                className="text-area"
                placeholder={"Add one ingredient per line\n2 cups fresh leaves\n1 cup coconut milk"}
                value={toLineInput(block.payload.ingredients)}
                onChange={(event) => onPayloadChange(block.client_id, { ingredients: parseLineInput(event.target.value) })}
              />
            </div>

            <div>
              <label htmlFor={`${block.client_id}-instructions`} className="field-label">Method</label>
              <textarea
                id={`${block.client_id}-instructions`}
                className="text-area"
                placeholder={"Add one step per line\nWash and prepare the leaves\nSimmer gently for 10 minutes"}
                value={toLineInput(block.payload.instructions)}
                onChange={(event) => onPayloadChange(block.client_id, { instructions: parseLineInput(event.target.value) })}
              />
            </div>
          </div>
        ) : null}

        {block.block_kind === "inedible_use" ? (
          <div className="grid gap-3">
            <div>
              <label htmlFor={`${block.client_id}-use-type`} className="field-label">Type of use</label>
              <select
                id={`${block.client_id}-use-type`}
                className="select-input"
                value={typeof block.payload.useType === "string" ? block.payload.useType : "medicinal"}
                onChange={(event) => onPayloadChange(block.client_id, { useType: event.target.value })}
              >
                <option value="medicinal">Medicinal</option>
                <option value="ornamental">Ornamental</option>
                <option value="material">Material</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor={`${block.client_id}-details`} className="field-label">Description <span className="font-normal text-[var(--ink-700)]">(optional)</span></label>
              <textarea
                id={`${block.client_id}-details`}
                className="text-area"
                placeholder="Explain how the plant is used in village life…"
                value={typeof block.payload.details === "string" ? block.payload.details : ""}
                onChange={(event) => onPayloadChange(block.client_id, { details: event.target.value })}
              />
            </div>

            <div>
              <label htmlFor={`${block.client_id}-steps`} className="field-label">Steps <span className="font-normal text-[var(--ink-700)]">(optional)</span></label>
              <textarea
                id={`${block.client_id}-steps`}
                className="text-area"
                placeholder="Add one step per line"
                value={toLineInput(block.payload.steps)}
                onChange={(event) => onPayloadChange(block.client_id, { steps: parseLineInput(event.target.value) })}
              />
            </div>
          </div>
        ) : null}

        <div className="border-t border-[var(--line)] pt-4">
          <label htmlFor={`${block.client_id}-image`} className="field-label">Supporting image <span className="font-normal text-[var(--ink-700)]">(optional)</span></label>
          <input
            id={`${block.client_id}-image`}
            className="text-input"
            type="url"
            placeholder="https://…"
            value={block.image_url}
            onChange={(event) => onChange(block.client_id, { image_url: event.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="secondary-btn !min-h-9 cursor-pointer !px-3 !py-1.5 !text-xs"><span aria-hidden="true">↑</span> Upload image
          <input className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void onUploadBlockImage(block.client_id, file);
              event.target.value = "";
            }}
          /></label>
          {block.image_url ? (
            <a href={block.image_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[var(--brand-700)] hover:underline">
              View current image ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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
    <section className="card-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--text-900)]">Content Blocks</h2>
        <div className="flex flex-wrap gap-2">
          {addableKinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className="secondary-btn px-3 py-1.5 text-xs"
              onClick={() => addBlock(kind)}
            >
              + {BLOCK_LABELS[kind]}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-[var(--text-700)]">Drag cards to reorder their layout on the public page.</p>

      {blocks.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-white p-5 text-sm text-[var(--text-700)]">
          Add blocks to build this plant page.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((block) => block.client_id)} strategy={verticalListSortingStrategy}>
            <div className="mt-5 space-y-3">
              {blocks.map((block) => (
                <SortableBlockCard
                  key={block.client_id}
                  block={block}
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
  onRemove: () => void;
  onChange: (clientId: string, patch: Partial<EditableBlock>) => void;
  onPayloadChange: (clientId: string, patch: Record<string, unknown>) => void;
  onUploadBlockImage: (clientId: string, file: File) => Promise<void>;
}

function SortableBlockCard({ block, onRemove, onChange, onPayloadChange, onUploadBlockImage }: SortableBlockCardProps) {
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
        "rounded-2xl border border-[var(--line)] bg-white p-4",
        isDragging && "border-[var(--brand-600)] shadow-md",
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab rounded-md border border-[var(--line)] px-2 py-1 text-sm"
            aria-label="Drag block"
            {...attributes}
            {...listeners}
          >
            ⋮⋮
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-700)]">
            {BLOCK_LABELS[block.block_kind]}
          </p>
        </div>

        <button type="button" onClick={onRemove} className="danger-btn px-3 py-1.5 text-xs">
          Remove
        </button>
      </div>

      <div className="grid gap-3">
        <div>
          <label className="field-label">Card title (optional)</label>
          <input
            className="text-input"
            value={block.title}
            onChange={(event) => onChange(block.client_id, { title: event.target.value })}
          />
        </div>

        {block.block_kind === "about" ? (
          <div>
            <label className="field-label">About text</label>
            <textarea
              className="text-area"
              value={typeof block.payload.text === "string" ? block.payload.text : ""}
              onChange={(event) => onPayloadChange(block.client_id, { text: event.target.value })}
            />
          </div>
        ) : null}

        {block.block_kind === "edible_recipe" ? (
          <div className="grid gap-3">
            <div>
              <label className="field-label">Recipe title</label>
              <input
                className="text-input"
                value={typeof block.payload.recipeTitle === "string" ? block.payload.recipeTitle : ""}
                onChange={(event) => onPayloadChange(block.client_id, { recipeTitle: event.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Ingredients (one per line)</label>
              <textarea
                className="text-area"
                value={toLineInput(block.payload.ingredients)}
                onChange={(event) => onPayloadChange(block.client_id, { ingredients: parseLineInput(event.target.value) })}
              />
            </div>

            <div>
              <label className="field-label">Instructions (one step per line)</label>
              <textarea
                className="text-area"
                value={toLineInput(block.payload.instructions)}
                onChange={(event) => onPayloadChange(block.client_id, { instructions: parseLineInput(event.target.value) })}
              />
            </div>
          </div>
        ) : null}

        {block.block_kind === "inedible_use" ? (
          <div className="grid gap-3">
            <div>
              <label className="field-label">Use type</label>
              <select
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
              <label className="field-label">Details (optional)</label>
              <textarea
                className="text-area"
                value={typeof block.payload.details === "string" ? block.payload.details : ""}
                onChange={(event) => onPayloadChange(block.client_id, { details: event.target.value })}
              />
            </div>

            <div>
              <label className="field-label">Steps (optional, one per line)</label>
              <textarea
                className="text-area"
                value={toLineInput(block.payload.steps)}
                onChange={(event) => onPayloadChange(block.client_id, { steps: parseLineInput(event.target.value) })}
              />
            </div>
          </div>
        ) : null}

        <div>
          <label className="field-label">Block image URL (optional)</label>
          <input
            className="text-input"
            value={block.image_url}
            onChange={(event) => onChange(block.client_id, { image_url: event.target.value })}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
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
          />
          {block.image_url ? (
            <a href={block.image_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--brand-700)]">
              Open image
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

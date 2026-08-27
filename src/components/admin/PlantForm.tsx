"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { BlockEditor } from "@/components/admin/BlockEditor";
import type { EditableBlock } from "@/components/admin/types";
import { PlantBlocksRenderer } from "@/components/public/PlantBlocksRenderer";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  ALLOWED_BLOCK_KINDS_BY_TYPE,
  type Plant,
  type PlantBlock,
  type PlantStatus,
  type PlantType,
} from "@/lib/types/plant";

interface PlantFormValues {
  type: PlantType;
  slug: string;
  name: string;
  scientific_name: string;
  short_description: string;
  hero_image_url: string;
}

interface PlantFormProps {
  plantId?: string;
  initialPlant?: Plant;
  initialBlocks?: PlantBlock[];
}

interface SavePlantResponse {
  id: string;
  slug: string;
  status: PlantStatus;
  published_at: string | null;
}

interface ApiErrorResponse {
  error: string;
  details?: string[];
}

function getApiErrorResponse(payload: unknown): ApiErrorResponse | null {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    const typed = payload as { error: string; details?: unknown };
    return {
      error: typed.error,
      details: Array.isArray(typed.details)
        ? typed.details.filter((detail): detail is string => typeof detail === "string")
        : undefined,
    };
  }

  return null;
}

export function PlantForm({ plantId, initialPlant, initialBlocks = [] }: PlantFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PlantStatus>(initialPlant?.status ?? "published");
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPlant?.published_at ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<EditableBlock[]>(() => {
    if (!initialBlocks.length) {
      return [];
    }

    return initialBlocks.map((block) => ({
      client_id: block.id,
      id: block.id,
      block_kind: block.block_kind,
      title: block.title ?? "",
      body: block.body ?? "",
      image_url: block.image_url ?? "",
      payload: block.payload as Record<string, unknown>,
    }));
  });

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<PlantFormValues>({
    defaultValues: {
      type: initialPlant?.type ?? "edible",
      slug: initialPlant?.slug ?? "",
      name: initialPlant?.name ?? "",
      scientific_name: initialPlant?.scientific_name ?? "",
      short_description: initialPlant?.short_description ?? "",
      hero_image_url: initialPlant?.hero_image_url ?? "",
    },
  });

  const currentType = watch("type");
  const slugValue = watch("slug");
  const nameValue = watch("name");
  const scientificNameValue = watch("scientific_name");
  const shortDescriptionValue = watch("short_description");
  const heroImageUrl = watch("hero_image_url");
  const slugLocked = Boolean(publishedAt);

  useEffect(() => {
    setBlocks((previous) => previous.filter((block) => ALLOWED_BLOCK_KINDS_BY_TYPE[currentType].includes(block.block_kind)));
  }, [currentType]);

  const previewPlant = {
    id: plantId || "preview",
    type: currentType,
    slug: slugValue,
    name: nameValue,
    scientific_name: scientificNameValue,
    short_description: shortDescriptionValue,
    hero_image_url: heroImageUrl,
    status,
    published_at: publishedAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  async function uploadFile(file: File, scope: "hero" | "block", blockClientId?: string) {
    setError(null);

    const body = {
      scope,
      plantId: plantId ?? `draft-${previewPlant.slug || "plant"}`,
      blockId: blockClientId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    };

    const prepare = await fetch("/api/admin/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const prepareJson = (await prepare.json()) as
      | {
          error: string;
        }
      | {
          path: string;
          token: string;
          publicUrl: string;
        };

    if (!prepare.ok || "error" in prepareJson) {
      throw new Error("error" in prepareJson ? prepareJson.error : "Unable to prepare upload.");
    }

    const supabase = createBrowserSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from("plants-public")
      .uploadToSignedUrl(prepareJson.path, prepareJson.token, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return prepareJson.publicUrl;
  }

  async function onUploadHeroImage(file: File) {
    try {
      const url = await uploadFile(file, "hero");
      setValue("hero_image_url", url, { shouldDirty: true });
      setNotice("Hero image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload hero image.");
    }
  }

  async function onUploadBlockImage(clientId: string, file: File) {
    try {
      const url = await uploadFile(file, "block", clientId);
      setBlocks((previous) =>
        previous.map((block) =>
          block.client_id === clientId
            ? {
                ...block,
                image_url: url,
              }
            : block,
        ),
      );
      setNotice("Block image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload block image.");
    }
  }

  async function savePlant(values: PlantFormValues) {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        ...values,
        blocks: blocks.map((block, index) => ({
          id: block.id,
          position: index,
          block_kind: block.block_kind,
          title: block.title || null,
          body: block.body || null,
          image_url: block.image_url || null,
          payload: block.payload,
        })),
      };

      const endpoint = plantId ? `/api/admin/plants/${plantId}` : "/api/admin/plants";
      const method = plantId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseJson = (await response.json()) as SavePlantResponse | ApiErrorResponse;
      const apiError = getApiErrorResponse(responseJson);

      if (!response.ok || apiError) {
        if (apiError?.details?.length) {
          throw new Error(`${apiError.error} ${apiError.details.join(" ")}`);
        }

        throw new Error(apiError?.error || "Failed to save plant.");
      }

      const savedPlant = responseJson as SavePlantResponse;

      setStatus(savedPlant.status);
      setPublishedAt(savedPlant.published_at);
      setNotice(savedPlant.status === "published" ? "Saved and visible publicly." : "Draft saved.");

      if (!plantId) {
        router.push(`/admin/plants/${savedPlant.id}/edit`);
      }

      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save plant.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishPlant() {
    if (!plantId) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/plants/${plantId}/publish`, {
        method: "POST",
      });

      const json = (await response.json()) as SavePlantResponse | ApiErrorResponse;
      const apiError = getApiErrorResponse(json);
      if (!response.ok || apiError) {
        if (apiError?.details?.length) {
          throw new Error(`${apiError.error} ${apiError.details.join(" ")}`);
        }
        throw new Error(apiError?.error || "Failed to publish.");
      }

      const publishedPlant = json as SavePlantResponse;
      setStatus("published");
      setPublishedAt(publishedPlant.published_at);
      setNotice("Plant published.");
      router.refresh();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Failed to publish.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function unpublishPlant() {
    if (!plantId) {
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/plants/${plantId}/unpublish`, {
        method: "POST",
      });

      const json = (await response.json()) as SavePlantResponse | ApiErrorResponse;
      const apiError = getApiErrorResponse(json);
      if (!response.ok || apiError) {
        throw new Error(apiError?.error || "Failed to unpublish.");
      }

      setStatus("draft");
      setNotice("Plant unpublished and hidden from public pages.");
      router.refresh();
    } catch (unpublishError) {
      setError(unpublishError instanceof Error ? unpublishError.message : "Failed to unpublish.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function deletePlant() {
    if (!plantId) {
      return;
    }

    const confirmed = window.confirm("Soft delete this plant? It will be hidden from public pages.");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/plants/${plantId}`, {
        method: "DELETE",
      });

      const json = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || json.error) {
        throw new Error(json.error || "Delete failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete plant.");
    } finally {
      setIsDeleting(false);
    }
  }

  const previewBlocks: PlantBlock[] = blocks.map((block, index) => ({
    id: block.id || block.client_id,
    plant_id: plantId || "preview",
    position: index,
    block_kind: block.block_kind,
    title: block.title || null,
    body: block.body || null,
    image_url: block.image_url || null,
    payload: block.payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  return (
    <form onSubmit={handleSubmit(savePlant)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
      <div className="space-y-6">
        <div className="admin-panel flex flex-wrap items-center gap-4 px-5 py-4 text-xs font-bold text-[var(--ink-700)]">
          <span className="flex items-center gap-2 text-[var(--forest-800)]"><span className="grid size-6 place-items-center rounded-full bg-[var(--forest-900)] text-[0.65rem] text-white">1</span> Plant details</span>
          <span aria-hidden="true" className="text-[var(--line-strong)]">→</span>
          <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[var(--sage-100)] text-[0.65rem]">2</span> Page content</span>
          <span aria-hidden="true" className="text-[var(--line-strong)]">→</span>
          <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-[var(--sage-100)] text-[0.65rem]">3</span> Review & publish</span>
        </div>

        <section className="admin-panel overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] bg-[var(--cream-100)]/55 p-5 sm:p-6">
            <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--moss-500)]">Step 1</p><h2 className="admin-section-title mt-1">Plant details</h2><p className="mt-1 text-xs leading-5 text-[var(--ink-700)]">The core information visitors will see first.</p></div>
            <span className={`status-pill ${status === "draft" ? "!border-amber-200 !bg-amber-50 !text-amber-800" : ""}`}>{status === "published" ? "● Live on website" : "○ Draft"}</span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><label htmlFor="plant-name" className="field-label">Common name <span aria-hidden="true">*</span></label><input id="plant-name" className="text-input" required placeholder="e.g. Moringa" {...register("name")} /></div>
              <div><label htmlFor="scientific-name" className="field-label">Scientific name <span aria-hidden="true">*</span></label><input id="scientific-name" className="text-input italic" required placeholder="e.g. Moringa oleifera" {...register("scientific_name")} /></div>
              <div><label htmlFor="plant-type" className="field-label">Plant category</label><select id="plant-type" className="select-input" {...register("type")}><option value="edible">Edible</option><option value="inedible">Useful & ornamental</option></select><p className="field-help">This determines which content blocks are available.</p></div>
              <div><label htmlFor="plant-slug" className="field-label">Page URL</label><div className="flex overflow-hidden rounded-xl border border-[var(--line-strong)] bg-white focus-within:border-[var(--forest-700)]"><span className="grid place-items-center border-r border-[var(--line)] bg-[var(--cream-100)] px-3 text-xs text-[var(--ink-700)]">/plants/</span><input id="plant-slug" className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none disabled:bg-[var(--cream-100)]" disabled={slugLocked} placeholder="moringa" {...register("slug")} /></div><p className="field-help">{slugLocked ? "Locked after the first publish to keep links reliable." : "Leave blank to generate it from the common name."}</p></div>
            </div>

            <div className="mt-5"><label htmlFor="short-description" className="field-label">Short introduction <span aria-hidden="true">*</span></label><textarea id="short-description" className="text-area" required maxLength={360} placeholder="Give visitors a concise, inviting overview of this plant and its place in village life." {...register("short_description")} /><p className="field-help">Aim for one or two sentences. This appears on the collection card and plant page.</p></div>

            <div className="mt-7 border-t border-[var(--line)] pt-6">
              <div className="mb-4"><h3 className="admin-section-title">Cover image</h3><p className="mt-1 text-xs text-[var(--ink-700)]">Use a clear landscape or portrait photo with the plant as the focus.</p></div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><label htmlFor="hero-image-url" className="field-label">Image URL <span aria-hidden="true">*</span></label><input id="hero-image-url" type="url" className="text-input" required placeholder="https://…" {...register("hero_image_url")} /></div><label className="secondary-btn min-h-[46px] cursor-pointer"><span aria-hidden="true">↑</span> Upload image<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void onUploadHeroImage(file); event.target.value = ""; }} /></label></div>
              {heroImageUrl ? <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--earth-100)]"><img src={heroImageUrl} alt="Selected cover preview" className="h-64 w-full object-cover" /></div> : <div className="mt-4 grid h-40 place-items-center rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--cream-100)] text-xs font-semibold text-[var(--ink-700)]">Your cover image will appear here</div>}
            </div>
          </div>
        </section>

        <BlockEditor type={currentType} blocks={blocks} onChange={setBlocks} onUploadBlockImage={onUploadBlockImage} />
      </div>

      <aside className="space-y-5 xl:sticky xl:top-5">
        <section className="admin-panel overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[var(--cream-100)]/55 p-5"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--moss-500)]">Step 3</p><h2 className="admin-section-title mt-1">Review & publish</h2></div>
          <div className="p-5">
            <div className={`rounded-xl border p-3 text-xs leading-5 ${status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><strong>{status === "published" ? "This page is live." : "This page is hidden."}</strong> {status === "published" ? "Saved changes will update the public website immediately." : "You can keep editing before publishing it."}</div>
            <div className="mt-4 grid gap-2">
              <button type="submit" className="primary-btn min-h-12" disabled={isSaving || isSubmitting}>{isSaving || isSubmitting ? "Saving…" : status === "published" ? "Save live changes" : "Save draft"}</button>
              {plantId && status === "draft" ? <button type="button" className="secondary-btn" disabled={isPublishing} onClick={publishPlant}>{isPublishing ? "Publishing…" : "Publish to website"}</button> : null}
              {plantId && status === "published" ? <button type="button" className="secondary-btn" disabled={isPublishing} onClick={unpublishPlant}>{isPublishing ? "Updating…" : "Unpublish page"}</button> : null}
            </div>
            {notice ? <p role="status" className="mt-4 rounded-lg bg-[var(--sage-100)] p-3 text-xs font-semibold text-[var(--forest-800)]">✓ {notice}</p> : null}
            {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-semibold leading-5 text-[var(--danger)]">{error}</p> : null}
            {plantId ? <div className="mt-5 border-t border-[var(--line)] pt-5"><button type="button" className="text-xs font-bold text-[var(--danger)] underline decoration-transparent underline-offset-4 hover:decoration-current" disabled={isDeleting} onClick={deletePlant}>{isDeleting ? "Deleting…" : "Delete this plant"}</button><p className="mt-1 text-[0.68rem] leading-5 text-[var(--ink-700)]">Removes it from the public guide without erasing its database record.</p></div> : null}
          </div>
        </section>

        <section className="admin-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--cream-100)]/55 px-5 py-4"><h2 className="admin-section-title">Visitor preview</h2><span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--ink-700)]">Live preview</span></div>
          {previewPlant.hero_image_url ? <div className="relative h-48 overflow-hidden bg-[var(--earth-100)]"><img src={previewPlant.hero_image_url} alt="Visitor preview" className="h-full w-full object-cover" /><span className="absolute left-4 top-4 rounded-full bg-[var(--forest-950)]/80 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white">{previewPlant.type === "edible" ? "Edible" : "Useful & ornamental"}</span></div> : <div className="grid h-36 place-items-center bg-[var(--cream-100)] text-3xl text-[var(--moss-500)]/40" aria-hidden="true">✦</div>}
          <div className="p-5"><h3 className="text-3xl font-semibold">{previewPlant.name || "Plant name"}</h3><p className="mt-1 text-xs italic text-[var(--moss-500)]">{previewPlant.scientific_name || "Scientific name"}</p><p className="mt-3 text-xs leading-6 text-[var(--ink-700)]">{previewPlant.short_description || "Your short introduction will appear here."}</p><div className="mt-5 max-h-[28rem] overflow-y-auto border-t border-[var(--line)] pt-5"><PlantBlocksRenderer type={previewPlant.type} blocks={previewBlocks} /></div></div>
        </section>
      </aside>
    </form>
  );
}

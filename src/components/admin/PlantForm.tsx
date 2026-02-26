"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import type { EditableBlock } from "@/components/admin/types";
import { PlantBlocksRenderer } from "@/components/public/PlantBlocksRenderer";
import { normalizeSlug } from "@/lib/slug";
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
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [heroFileLabel, setHeroFileLabel] = useState("No file selected.");
  const [siteOrigin, setSiteOrigin] = useState(() => (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, ""));
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement | null>(null);

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
      name: initialPlant?.name ?? "",
      scientific_name: initialPlant?.scientific_name ?? "",
      short_description: initialPlant?.short_description ?? "",
      hero_image_url: initialPlant?.hero_image_url ?? "",
    },
  });

  const currentType = watch("type");
  const nameValue = watch("name");
  const scientificNameValue = watch("scientific_name");
  const shortDescriptionValue = watch("short_description");
  const heroImageUrl = watch("hero_image_url");
  const trimmedName = nameValue.trim();
  const slugPreview = trimmedName ? normalizeSlug(trimmedName) : "yourplantname";
  const linkPath = `/plants/${slugPreview}`;
  const publicLink = siteOrigin ? `${siteOrigin}${linkPath}` : linkPath;

  useEffect(() => {
    setBlocks((previous) => previous.filter((block) => ALLOWED_BLOCK_KINDS_BY_TYPE[currentType].includes(block.block_kind)));
  }, [currentType]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteOrigin(window.location.origin);
    }
  }, []);

  const previewPlant = {
    id: plantId || "preview",
    type: currentType,
    slug: slugPreview,
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
      plantId: plantId ?? `draft-${slugPreview || "plant"}`,
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
    setIsUploadingHero(true);
    setHeroFileLabel(file.name);

    try {
      const url = await uploadFile(file, "hero");
      setValue("hero_image_url", url, { shouldDirty: true });
      setNotice("Hero image uploaded.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload hero image.");
    } finally {
      setIsUploadingHero(false);
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
    <form onSubmit={handleSubmit(savePlant)} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <section className="card-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--text-900)]">Plant Basics</h2>
            <span className={`botanical-pill ${status === "draft" ? "bg-[var(--earth-100)]" : ""}`}>
              {status === "published" ? "Public" : "Unpublished"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Plant type</label>
              <select className="select-input" {...register("type")}> 
                <option value="edible">Edible</option>
                <option value="inedible">Inedible</option>
              </select>
            </div>

            <div>
              <label className="field-label">Name</label>
              <input className="text-input" {...register("name")} />
            </div>

            <div>
              <label className="field-label">Scientific name</label>
              <input className="text-input" {...register("scientific_name")} />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-1)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-700)]">
                Public link preview
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-white px-3 py-2 text-sm text-[var(--text-900)]">{publicLink}</code>
                <CopyLinkButton
                  value={publicLink}
                  label="Copy link"
                  className="px-3 py-2 text-sm"
                  disabled={!trimmedName}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--text-700)]">
                Plant names must be unique. The URL is generated automatically from the plant name.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="field-label">Short description</label>
            <textarea className="text-area" {...register("short_description")} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="field-label">Hero image URL</label>
              <input className="text-input" {...register("hero_image_url")} />
            </div>

            <div>
              <label className="field-label">Upload hero image</label>
              <input
                ref={heroFileInputRef}
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  void onUploadHeroImage(file);
                  event.target.value = "";
                }}
              />
              <div className="rounded-xl border border-dashed border-[rgba(0,130,54,0.35)] bg-[var(--leaf-100)]/45 p-3">
                <p className="text-xs text-[var(--text-700)]">PNG, JPG, WEBP, or GIF. Max size: 5MB.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="primary-btn px-3 py-2 text-sm"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={isUploadingHero}
                  >
                    {isUploadingHero ? "Uploading..." : "Select image"}
                  </button>
                  <span className="text-sm text-[var(--text-700)]">{heroFileLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {heroImageUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--earth-100)]">
              <img src={heroImageUrl} alt="Hero preview" className="h-56 w-full object-cover" />
            </div>
          ) : null}
        </section>

        <BlockEditor
          type={currentType}
          blocks={blocks}
          onChange={setBlocks}
          onUploadBlockImage={onUploadBlockImage}
        />
      </div>

      <aside className="space-y-6">
        <section className="card-surface p-5">
          <h2 className="text-xl font-semibold text-[var(--text-900)]">Actions</h2>

          <div className="mt-4 grid gap-2">
            <button type="submit" className="primary-btn" disabled={isSaving || isSubmitting}>
              {isSaving || isSubmitting ? "Saving..." : status === "published" ? "Save (Live)" : "Save Draft"}
            </button>

            {plantId && status === "draft" ? (
              <button type="button" className="secondary-btn" disabled={isPublishing} onClick={publishPlant}>
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            ) : null}

            {plantId && status === "published" ? (
              <button type="button" className="secondary-btn" disabled={isPublishing} onClick={unpublishPlant}>
                {isPublishing ? "Updating..." : "Unpublish"}
              </button>
            ) : null}

            {plantId ? (
              <button type="button" className="danger-btn" disabled={isDeleting} onClick={deletePlant}>
                {isDeleting ? "Deleting..." : "Soft delete"}
              </button>
            ) : null}
          </div>

          {notice ? <p className="mt-3 text-sm font-medium text-[var(--brand-700)]">{notice}</p> : null}
          {error ? <p className="mt-3 text-sm font-medium text-[var(--danger)]">{error}</p> : null}
        </section>

        <section className="card-surface p-5">
          <h2 className="mb-3 text-xl font-semibold text-[var(--text-900)]">Live Preview</h2>
          {previewPlant.hero_image_url ? (
            <div className="overflow-hidden rounded-xl border border-[var(--line)]">
              <img src={previewPlant.hero_image_url} alt="Live preview" className="h-44 w-full object-cover" />
            </div>
          ) : null}
          <h3 className="mt-4 text-2xl font-semibold text-[var(--text-900)]">{previewPlant.name || "Plant name"}</h3>
          <p className="mt-1 text-sm italic text-[var(--text-700)]">{previewPlant.scientific_name || "Scientific name"}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-700)]">{previewPlant.short_description || "Short description"}</p>

          <div className="mt-4 max-h-[34rem] space-y-4 overflow-y-auto pr-2">
            <PlantBlocksRenderer type={previewPlant.type} blocks={previewBlocks} />
          </div>
        </section>
      </aside>
    </form>
  );
}

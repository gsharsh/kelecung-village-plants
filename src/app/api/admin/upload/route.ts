import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminUser } from "@/lib/auth/admin";
import { handleApiError, jsonError } from "@/lib/api";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

const uploadSchema = z.object({
  scope: z.enum(["hero", "block"]),
  plantId: z.string().min(1),
  blockId: z.string().optional(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  try {
    await assertAdminUser();

    const payload = await request.json();
    const parsed = uploadSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonError(400, "Invalid upload payload", parsed.error.issues.map((issue) => issue.message));
    }

    if (!ALLOWED_MIME_TYPES.includes(parsed.data.mimeType)) {
      return jsonError(400, "Unsupported file type.");
    }

    if (parsed.data.size > MAX_UPLOAD_BYTES) {
      return jsonError(400, "Image exceeds 5MB limit.");
    }

    const timestamp = Date.now();
    const cleanName = `${timestamp}-${sanitizeFileName(parsed.data.fileName)}`;

    const path =
      parsed.data.scope === "hero"
        ? `plants/${parsed.data.plantId}/hero/${cleanName}`
        : `plants/${parsed.data.plantId}/blocks/${parsed.data.blockId || `block-${timestamp}`}/${cleanName}`;

    const supabase = createAdminSupabaseClient();

    const { data: signedData, error: signedError } = await supabase.storage
      .from("plants-public")
      .createSignedUploadUrl(path);

    if (signedError || !signedData) {
      return jsonError(500, signedError?.message || "Failed to create signed upload URL.");
    }

    const { data: publicData } = supabase.storage.from("plants-public").getPublicUrl(path);

    return NextResponse.json({
      path,
      token: signedData.token,
      signedUrl: signedData.signedUrl,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

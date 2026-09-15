import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import {
  ACCEPTED_IMAGE_TYPES,
  BUCKETS,
  MAX_UPLOAD_BYTES,
  type BucketName,
} from "@/lib/constants";

export const runtime = "nodejs";
// Uploads must never be statically cached.
export const dynamic = "force-dynamic";

function extensionFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

// POST /api/upload — validate and store an image, return its public URL + path.
// Admin only. Server-side validation of type and size (defence in depth).
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get("file");
    const bucketParam = (form.get("bucket") as string) || BUCKETS.portfolio;

    const bucket = (Object.values(BUCKETS) as string[]).includes(bucketParam)
      ? (bucketParam as BucketName)
      : BUCKETS.portfolio;

    if (!(file instanceof File)) {
      return fail("No file was provided.", 400);
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
      return fail(
        "Unsupported file type. Please upload a JPG, PNG or WebP image.",
        415,
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return fail("This image is too large. The maximum size is 10 MB.", 413);
    }

    const admin = createAdminClient();
    const ext = extensionFor(file.type);
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(path, bytes, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] storage error:", uploadError);
      return fail("Unable to upload this image. Please try again.", 500);
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(bucket).getPublicUrl(path);

    return ok({
      url: publicUrl,
      path,
      bucket,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    return handleError(error);
  }
}

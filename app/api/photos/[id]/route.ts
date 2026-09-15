import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { photoUpdateSchema } from "@/lib/validations";
import { BUCKETS } from "@/lib/constants";

// PATCH /api/photos/:id — edit photo metadata / flags.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const parsed = photoUpdateSchema.parse(body);

    const { data, error } = await supabase
      .from("photos")
      .update(parsed)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return fail("Could not update the photo.", 400);
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/photos/:id — delete the row AND the stored object.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    const { data: photo } = await supabase
      .from("photos")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) return fail("Could not delete the photo.", 400);

    // Storage cleanup — best effort. Skip clearly-demo seed objects.
    if (photo?.storage_path && !photo.storage_path.startsWith("demo/")) {
      try {
        const admin = createAdminClient();
        await admin.storage.from(BUCKETS.portfolio).remove([photo.storage_path]);
      } catch (e) {
        console.error("[photos] storage cleanup failed:", e);
      }
    }

    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

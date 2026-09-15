import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { categorySchema, categoryDeleteSchema } from "@/lib/validations";
import { BUCKETS } from "@/lib/constants";

// PATCH /api/categories/:id — edit category fields.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const input = categorySchema.partial().parse(await request.json());

    const { data, error } = await supabase
      .from("categories")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505")
        return fail("A category with that name or slug already exists.", 409);
      return fail("Could not update the category.", 400);
    }
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/categories/:id
 * Body decides what happens to photos in a non-empty category:
 *   mode = "move"   -> reassign photos to target_category_id, then delete
 *   mode = "delete" -> delete the photos (and their storage objects), then delete
 *   mode = "cancel" -> do nothing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const { mode, target_category_id } = categoryDeleteSchema.parse(body);

    if (mode === "cancel") return ok({ cancelled: true });

    const { count } = await supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    const photoCount = count ?? 0;

    if (photoCount > 0) {
      if (mode === "move") {
        if (!target_category_id)
          return fail("Choose a category to move the photos into.", 400);
        if (target_category_id === id)
          return fail("Choose a different destination category.", 400);
        const { error: moveErr } = await supabase
          .from("photos")
          .update({ category_id: target_category_id })
          .eq("category_id", id);
        if (moveErr) return fail("Could not move the photos.", 400);
      } else if (mode === "delete") {
        const { data: rows } = await supabase
          .from("photos")
          .select("storage_path")
          .eq("category_id", id);
        const { error: delErr } = await supabase
          .from("photos")
          .delete()
          .eq("category_id", id);
        if (delErr) return fail("Could not delete the photos.", 400);

        const paths = (rows ?? [])
          .map((r) => r.storage_path)
          .filter((p): p is string => !!p && !p.startsWith("demo/"));
        if (paths.length) {
          try {
            const admin = createAdminClient();
            await admin.storage.from(BUCKETS.portfolio).remove(paths);
          } catch (e) {
            console.error("[categories] storage cleanup failed:", e);
          }
        }
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return fail("Could not delete the category.", 400);
    return ok({ id, photosHandled: photoCount, mode });
  } catch (error) {
    return handleError(error);
  }
}

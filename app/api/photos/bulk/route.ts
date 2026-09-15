import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { photoBulkSchema } from "@/lib/validations";
import { BUCKETS } from "@/lib/constants";
import type { Database } from "@/types/database";

type PhotoUpdate = Database["public"]["Tables"]["photos"]["Update"];

// POST /api/photos/bulk — apply an action to many photos at once.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { ids, action, category_id } = photoBulkSchema.parse(
      await request.json(),
    );

    if (action === "delete") {
      const { data: rows } = await supabase
        .from("photos")
        .select("storage_path")
        .in("id", ids);

      const { error } = await supabase.from("photos").delete().in("id", ids);
      if (error) return fail("Could not delete the selected photos.", 400);

      const paths = (rows ?? [])
        .map((r) => r.storage_path)
        .filter((p): p is string => !!p && !p.startsWith("demo/"));
      if (paths.length) {
        try {
          const admin = createAdminClient();
          await admin.storage.from(BUCKETS.portfolio).remove(paths);
        } catch (e) {
          console.error("[photos/bulk] storage cleanup failed:", e);
        }
      }
      return ok({ affected: ids.length });
    }

    const patch: PhotoUpdate = {};
    if (action === "publish") patch.is_published = true;
    if (action === "unpublish") patch.is_published = false;
    if (action === "feature") patch.is_featured = true;
    if (action === "unfeature") patch.is_featured = false;
    if (action === "move") {
      if (category_id === undefined)
        return fail("Choose a category to move photos into.", 400);
      patch.category_id = category_id;
    }

    const { error } = await supabase.from("photos").update(patch).in("id", ids);
    if (error) return fail("Could not update the selected photos.", 400);
    return ok({ affected: ids.length });
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { reorderSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { items } = reorderSchema.parse(await request.json());
    const results = await Promise.all(
      items.map((item) =>
        supabase
          .from("services")
          .update({ display_order: item.display_order })
          .eq("id", item.id),
      ),
    );
    if (results.some((r) => r.error)) return fail("Could not save the new order.", 400);
    return ok({ affected: items.length });
  } catch (error) {
    return handleError(error);
  }
}

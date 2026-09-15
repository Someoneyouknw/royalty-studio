import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { settingsSchema } from "@/lib/validations";
import { DEFAULT_SETTINGS } from "@/lib/constants";

// GET /api/settings — public read of the single settings row.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    return ok(data ?? DEFAULT_SETTINGS);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/settings — admin update. Upserts the singleton row.
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const input = settingsSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("site_settings")
      .upsert({ id: 1, ...input })
      .select("*")
      .single();

    if (error) {
      console.error("[settings] update error:", error);
      return fail("Could not save settings.", 400);
    }
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, created, handleError, fail } from "@/lib/api";
import { serviceSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/services — RLS returns active-only for anon, all for admins.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const input = serviceSchema.parse(await request.json());
    const slug = input.slug || slugify(input.title);

    const { data, error } = await supabase
      .from("services")
      .insert({ ...input, slug })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505")
        return fail("A service with that title or slug already exists.", 409);
      return fail("Could not create the service.", 400);
    }
    return created(data);
  } catch (error) {
    return handleError(error);
  }
}

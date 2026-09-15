import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, created, handleError, fail } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

// GET /api/categories — list with photo counts (RLS decides active-only vs all).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*, photos(count)")
      .order("display_order", { ascending: true });
    if (error) throw error;

    const categories = (data ?? []).map(
      (c: Record<string, unknown> & { photos?: { count: number }[] }) => ({
        ...c,
        photo_count: c.photos?.[0]?.count ?? 0,
      }),
    );
    return ok(categories);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/categories — create a category.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const input = categorySchema.parse(await request.json());
    const slug = input.slug || slugify(input.name);

    const { data, error } = await supabase
      .from("categories")
      .insert({ ...input, slug })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505")
        return fail("A category with that name or slug already exists.", 409);
      return fail("Could not create the category.", 400);
    }
    return created(data);
  } catch (error) {
    return handleError(error);
  }
}

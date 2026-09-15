import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, created, handleError, fail } from "@/lib/api";
import { photoCreateSchema } from "@/lib/validations";

// GET /api/photos — admin listing with search, filters and sorting.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("category");
    const featured = searchParams.get("featured");
    const published = searchParams.get("published");
    const sort = searchParams.get("sort") ?? "newest";

    let query = supabase.from("photos").select("*, category:categories(*)", {
      count: "exact",
    });

    if (search) query = query.ilike("title", `%${search}%`);
    if (categoryId && categoryId !== "all") query = query.eq("category_id", categoryId);
    if (featured === "true") query = query.eq("is_featured", true);
    if (published === "true") query = query.eq("is_published", true);
    if (published === "false") query = query.eq("is_published", false);

    if (sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (sort === "order")
      query = query.order("display_order", { ascending: true });
    else query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) throw error;
    return ok({ photos: data ?? [], total: count ?? 0 });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/photos — create a photo record after the file is uploaded.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();
    const parsed = photoCreateSchema.parse(body);

    const { data, error } = await supabase
      .from("photos")
      .insert(parsed)
      .select("*")
      .single();

    if (error) return fail("Could not save the photo.", 400);
    return created(data);
  } catch (error) {
    return handleError(error);
  }
}

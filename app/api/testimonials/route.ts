import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, created, handleError, fail } from "@/lib/api";
import { testimonialSchema } from "@/lib/validations";

// GET /api/testimonials — RLS returns published-only for anon, all for admins.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
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
    const input = testimonialSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("testimonials")
      .insert(input)
      .select("*")
      .single();
    if (error) return fail("Could not create the testimonial.", 400);
    return created(data);
  } catch (error) {
    return handleError(error);
  }
}

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { testimonialSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const input = testimonialSchema.partial().parse(await request.json());
    const { data, error } = await supabase
      .from("testimonials")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail("Could not update the testimonial.", 400);
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return fail("Could not delete the testimonial.", 400);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

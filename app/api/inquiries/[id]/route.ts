import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { inquiryUpdateSchema } from "@/lib/validations";

// PATCH /api/inquiries/:id — change status (new/contacted/confirmed/…).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const { status } = inquiryUpdateSchema.parse(await request.json());
    const { data, error } = await supabase
      .from("inquiries")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail("Could not update the inquiry.", 400);
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
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) return fail("Could not delete the inquiry.", 400);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

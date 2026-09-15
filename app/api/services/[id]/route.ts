import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { serviceSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const input = serviceSchema.partial().parse(await request.json());

    const { data, error } = await supabase
      .from("services")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505")
        return fail("A service with that title or slug already exists.", 409);
      return fail("Could not update the service.", 400);
    }
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
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return fail("Could not delete the service.", 400);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

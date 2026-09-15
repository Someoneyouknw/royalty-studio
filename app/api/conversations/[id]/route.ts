import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError, fail } from "@/lib/api";
import { z } from "zod";
import type { Database } from "@/types/database";

type ConversationUpdate = Database["public"]["Tables"]["conversations"]["Update"];

const patchSchema = z.object({
  action: z.enum(["close", "reopen", "mark_read"]),
});

// PATCH /api/conversations/:id — close, reopen, or mark admin-read.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const supabase = await createClient();
    const { action } = patchSchema.parse(await request.json());

    const patch: ConversationUpdate = {};
    if (action === "close") patch.status = "closed";
    if (action === "reopen") patch.status = "open";
    if (action === "mark_read") patch.admin_unread = 0;

    const { data, error } = await supabase
      .from("conversations")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return fail("Could not update the conversation.", 400);
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
    // Messages cascade-delete via the FK.
    const { error } = await supabase.from("conversations").delete().eq("id", id);
    if (error) return fail("Could not delete the conversation.", 400);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

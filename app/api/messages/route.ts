import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { created, handleError, fail } from "@/lib/api";
import { z } from "zod";

const adminReplySchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

// POST /api/messages — admin reply into a conversation.
// (Visitors send messages directly via the Supabase client under RLS so the
// realtime chat updates instantly; admins can also reply through the inbox UI
// which uses this endpoint.)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const { conversation_id, message } = adminReplySchema.parse(
      await request.json(),
    );

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_type: "admin",
        sender_id: admin.id,
        message,
      })
      .select("*")
      .single();

    if (error) return fail("Could not send the reply.", 400);

    // Clear the admin's unread badge and (re)open the conversation.
    await supabase
      .from("conversations")
      .update({ admin_unread: 0, status: "open" })
      .eq("id", conversation_id);

    return created(data);
  } catch (error) {
    return handleError(error);
  }
}

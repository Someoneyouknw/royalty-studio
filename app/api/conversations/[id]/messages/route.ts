import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ok, handleError } from "@/lib/api";

// GET /api/conversations/:id/messages
// RLS ensures only the conversation's owner (anon visitor) or an admin can read.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

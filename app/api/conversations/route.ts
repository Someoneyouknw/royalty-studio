import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { ok, handleError } from "@/lib/api";
import type { ConversationStatus } from "@/types/database";

// GET /api/conversations — admin inbox listing (most recent first).
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const unreadOnly = searchParams.get("unread") === "true";

    let query = supabase.from("conversations").select("*");
    if (search) {
      query = query.or(
        `visitor_name.ilike.%${search}%,visitor_email.ilike.%${search}%,visitor_phone.ilike.%${search}%`,
      );
    }
    if (status && status !== "all")
      query = query.eq("status", status as ConversationStatus);
    if (unreadOnly) query = query.gt("admin_unread", 0);

    const { data, error } = await query.order("last_message_at", {
      ascending: false,
      nullsFirst: false,
    });
    if (error) throw error;
    return ok(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

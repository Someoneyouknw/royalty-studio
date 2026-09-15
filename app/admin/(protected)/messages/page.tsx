import { createClient } from "@/lib/supabase/server";
import { ChatInbox } from "@/components/admin/chat-inbox";
import type { Conversation } from "@/types/database";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  return <ChatInbox initial={(data as Conversation[]) ?? []} />;
}

import { createClient } from "@/lib/supabase/server";
import { InquiriesManager } from "@/components/admin/inquiries-manager";
import type { Inquiry, Service } from "@/types/database";

type Row = Inquiry & { service: { id: string; title: string } | null };

export default async function AdminInquiriesPage() {
  const supabase = await createClient();
  const [{ data: inquiries }, { data: services }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*, service:services(id, title)")
      .order("created_at", { ascending: false }),
    supabase.from("services").select("id, title").order("display_order"),
  ]);

  return (
    <InquiriesManager
      initial={(inquiries as Row[]) ?? []}
      services={(services as Pick<Service, "id" | "title">[]) ?? []}
    />
  );
}

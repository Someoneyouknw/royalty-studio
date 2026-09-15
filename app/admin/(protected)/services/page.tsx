import { createClient } from "@/lib/supabase/server";
import { ServicesManager } from "@/components/admin/services-manager";
import type { Service } from "@/types/database";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true });

  return <ServicesManager initial={(data as Service[]) ?? []} openNew={isNew === "1"} />;
}

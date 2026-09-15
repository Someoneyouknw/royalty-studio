import { createClient } from "@/lib/supabase/server";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import type { Testimonial } from "@/types/database";

export default async function AdminTestimonialsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return <TestimonialsManager initial={(data as Testimonial[]) ?? []} />;
}

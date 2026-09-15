import { createClient } from "@/lib/supabase/server";
import { PhotoManager } from "@/components/admin/photo-manager";
import type { Category, PhotoWithCategory } from "@/types/database";

export default async function AdminPortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ upload?: string; featured?: string }>;
}) {
  const { upload, featured } = await searchParams;
  const supabase = await createClient();

  const [{ data: photos }, { data: categories }] = await Promise.all([
    supabase
      .from("photos")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("display_order"),
  ]);

  return (
    <PhotoManager
      initial={(photos as PhotoWithCategory[]) ?? []}
      categories={(categories as Category[]) ?? []}
      openUpload={upload === "1"}
      initialFeatured={featured === "true"}
    />
  );
}

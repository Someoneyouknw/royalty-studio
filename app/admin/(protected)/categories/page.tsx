import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/admin/categories-manager";
import type { Category, CategoryWithCount } from "@/types/database";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*, photos(count)")
    .order("display_order", { ascending: true });

  const categories: CategoryWithCount[] = (
    (data as unknown as (Category & { photos: { count: number }[] })[]) ?? []
  ).map((c) => ({ ...c, photo_count: c.photos?.[0]?.count ?? 0 }));

  return <CategoriesManager initial={categories} openNew={isNew === "1"} />;
}

import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type {
  Category,
  CategoryWithCount,
  Photo,
  Service,
  SiteSettings,
  Testimonial,
} from "@/types/database";

/**
 * Server-side data access for public pages.
 *
 * Every function swallows connection/query errors and returns a safe empty
 * value. This keeps the public site resilient (it renders polished empty
 * states instead of crashing) and lets `next build` prerender pages even when
 * Supabase credentials are placeholders.
 */

export async function getSettings(): Promise<SiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    // Fill any nulls with sensible defaults for required display fields.
    // NOTE: spreading `data` over the defaults lets a NULL column overwrite a
    // default, so display-critical media/text fields are coalesced explicitly.
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      studio_name: data.studio_name || DEFAULT_SETTINGS.studio_name,
      logo_url: data.logo_url || DEFAULT_SETTINGS.logo_url,
      hero_image_url: data.hero_image_url || DEFAULT_SETTINGS.hero_image_url,
      hero_title: data.hero_title || DEFAULT_SETTINGS.hero_title,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getActiveCategories(): Promise<Category[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("*, photos(count)")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return (
      (data as unknown as (Category & { photos: { count: number }[] })[]) ?? []
    ).map((c) => ({
      ...c,
      photo_count: c.photos?.[0]?.count ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getFeaturedPhotos(limit = 9): Promise<Photo[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export interface PortfolioQuery {
  categorySlug?: string;
  page?: number;
  pageSize?: number;
}

export async function getPublishedPhotos({
  categorySlug,
  page = 1,
  pageSize = 12,
}: PortfolioQuery): Promise<{ photos: Photo[]; total: number }> {
  try {
    const supabase = createPublicClient();
    let categoryId: string | undefined;

    if (categorySlug && categorySlug !== "all") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (!cat) return { photos: [], total: 0 };
      categoryId = cat.id;
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("photos")
      .select("*", { count: "exact" })
      .eq("is_published", true);

    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, count } = await query
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    return { photos: data ?? [], total: count ?? 0 };
  } catch {
    return { photos: [], total: 0 };
  }
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getActiveServices(): Promise<Service[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

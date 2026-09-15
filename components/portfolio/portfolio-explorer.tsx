"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import type { Category, Photo } from "@/types/database";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PhotoMasonry } from "@/components/gallery/photo-masonry";

const PAGE_SIZE = 12;

export function PortfolioExplorer({
  categories,
  initialPhotos,
  initialTotal,
  initialCategory,
}: {
  categories: Category[];
  initialPhotos: Photo[];
  initialTotal: number;
  initialCategory: string;
}) {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [active, setActive] = useState(initialCategory);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  const fetchPage = useCallback(
    async (slug: string, pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        let categoryId: string | undefined;
        if (slug !== "all") {
          categoryId = categories.find((c) => c.slug === slug)?.id;
          if (!categoryId) {
            setPhotos([]);
            setTotal(0);
            return;
          }
        }
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        let query = supabase
          .from("photos")
          .select("*", { count: "exact" })
          .eq("is_published", true);
        if (categoryId) query = query.eq("category_id", categoryId);
        const { data, count } = await query
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: false })
          .range(from, to);

        setTotal(count ?? 0);
        setPhotos((prev) => (append ? [...prev, ...(data ?? [])] : data ?? []));
      } finally {
        setLoading(false);
      }
    },
    [categories, supabase],
  );

  // Refetch when the active category changes (skip the very first render — it
  // was server-rendered).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPage(1);
    fetchPage(active, 1, false);
    const url = active === "all" ? "/portfolio" : `/portfolio?category=${active}`;
    router.replace(url, { scroll: false });
  }, [active, fetchPage, router]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(active, next, true);
  };

  const filters = [{ name: "All", slug: "all" }, ...categories];
  const hasMore = photos.length < total;

  return (
    <div>
      {/* Category filter rail */}
      <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 pb-1 sm:justify-center">
        {filters.map((f) => (
          <button
            key={f.slug}
            type="button"
            onClick={() => setActive(f.slug)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active === f.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {f.name}
          </button>
        ))}
      </div>

      {loading && photos.length === 0 ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full break-inside-avoid"
              style={{ height: 200 + (i % 3) * 80 }}
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No photographs in this collection yet"
          description="Please check back soon — new work is added regularly."
        />
      ) : (
        <PhotoMasonry photos={photos} />
      )}

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <Button variant="outline" size="lg" onClick={loadMore} loading={loading}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

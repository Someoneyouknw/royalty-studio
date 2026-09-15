import type { Metadata } from "next";
import {
  getActiveCategories,
  getPublishedPhotos,
} from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { PortfolioExplorer } from "@/components/portfolio/portfolio-explorer";

export const metadata: Metadata = {
  title: "Our Portfolio",
  description:
    "Browse the Royalty Studio portfolio — weddings, portraits, outdoor sessions, studio work and more.",
  alternates: { canonical: "/portfolio" },
};

export const revalidate = 300;

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const [categories, { photos, total }] = await Promise.all([
    getActiveCategories(),
    getPublishedPhotos({ categorySlug: category, page: 1, pageSize: 12 }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Our Work"
        title="Our Portfolio"
        description="A collection of moments we've had the privilege to capture. Filter by category to explore."
      />
      <section className="container py-16 md:py-20">
        <PortfolioExplorer
          categories={categories}
          initialPhotos={photos}
          initialTotal={total}
          initialCategory={category}
        />
      </section>
    </>
  );
}

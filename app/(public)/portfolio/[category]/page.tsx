import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getActiveCategories,
  getCategoryBySlug,
  getPublishedPhotos,
} from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { PortfolioExplorer } from "@/components/portfolio/portfolio-explorer";
import { BreadcrumbJsonLd } from "@/components/seo/structured-data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Portfolio" };
  return {
    title: `${category.name} Photography`,
    description:
      category.description ||
      `${category.name} photography by Royalty Studio.`,
    alternates: { canonical: `/portfolio/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categories, { photos, total }] = await Promise.all([
    getActiveCategories(),
    getPublishedPhotos({ categorySlug: slug, page: 1, pageSize: 12 }),
  ]);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Portfolio", path: "/portfolio" },
          { name: category.name, path: `/portfolio/${category.slug}` },
        ]}
      />
      <PageHeader
        eyebrow="Portfolio"
        title={category.name}
        description={category.description || undefined}
      />
      <section className="container py-16 md:py-20">
        <PortfolioExplorer
          categories={categories}
          initialPhotos={photos}
          initialTotal={total}
          initialCategory={slug}
        />
      </section>
    </>
  );
}

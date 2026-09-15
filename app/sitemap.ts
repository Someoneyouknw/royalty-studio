import type { MetadataRoute } from "next";
import { getActiveCategories } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ["", "/portfolio", "/services", "/about", "/contact"].map(
    (path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const categories = await getActiveCategories();
  const categoryRoutes = categories.map((c) => ({
    url: `${siteUrl}/portfolio/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes];
}

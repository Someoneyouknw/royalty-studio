import type { SiteSettings } from "@/types/database";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** JSON-LD LocalBusiness / PhotographyBusiness. Only includes known facts. */
export function BusinessJsonLd({ settings }: { settings: SiteSettings }) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PhotographyBusiness",
    name: settings.studio_name,
    url: siteUrl,
  };
  if (settings.seo_description) data.description = settings.seo_description;
  if (settings.tagline) data.slogan = settings.tagline;
  if (settings.logo_url) data.logo = settings.logo_url;
  if (settings.hero_image_url || settings.og_image_url)
    data.image = settings.og_image_url || settings.hero_image_url;
  if (settings.phone) data.telephone = settings.phone;
  if (settings.email) data.email = settings.email;
  if (settings.address) {
    data.address = { "@type": "PostalAddress", streetAddress: settings.address };
  }
  if (settings.opening_hours) data.openingHours = settings.opening_hours;

  const sameAs = [
    settings.instagram_url,
    settings.facebook_url,
    settings.tiktok_url,
    settings.youtube_url,
    settings.x_url,
  ].filter((v): v is string => !!v);
  if (sameAs.length) data.sameAs = sameAs;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** JSON-LD BreadcrumbList. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

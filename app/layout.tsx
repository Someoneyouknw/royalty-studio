import type { Metadata, Viewport } from "next";
// Self-hosted fonts (no runtime Google Fonts dependency).
import "@fontsource-variable/inter";
import "@fontsource-variable/archivo";
import "@fontsource-variable/playfair-display";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSettings } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seo_title || `${settings.studio_name} — Premium Photography`;
  const description =
    settings.seo_description ||
    "Premium photography capturing weddings, portraits, events and more.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${settings.studio_name}`,
    },
    description,
    applicationName: settings.studio_name,
    openGraph: {
      type: "website",
      siteName: settings.studio_name,
      title,
      description,
      url: siteUrl,
      images: settings.og_image_url
        ? [{ url: settings.og_image_url }]
        : settings.hero_image_url
          ? [{ url: settings.hero_image_url }]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.og_image_url ? [settings.og_image_url] : undefined,
    },
    icons: settings.favicon_url ? { icon: settings.favicon_url } : undefined,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

import type { SiteSettings } from "@/types/database";

export const SITE_NAME = "Royalty Studio";
export const SITE_TAGLINE = "Capturing Moments. Creating Memories.";

/** Public navigation used by the navbar, mobile menu and footer. */
export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Admin sidebar navigation. */
export const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Portfolio", href: "/admin/portfolio", icon: "Images" },
  { label: "Categories", href: "/admin/categories", icon: "FolderTree" },
  { label: "Services", href: "/admin/services", icon: "Camera" },
  { label: "Testimonials", href: "/admin/testimonials", icon: "Quote" },
  { label: "Inquiries", href: "/admin/inquiries", icon: "Inbox" },
  { label: "Messages", href: "/admin/messages", icon: "MessagesSquare" },
  { label: "Website Settings", href: "/admin/settings", icon: "Settings" },
  { label: "Account", href: "/admin/account", icon: "UserCog" },
] as const;

/** Supabase Storage bucket names (created by the storage migration). */
export const BUCKETS = {
  portfolio: "portfolio",
  branding: "branding",
  services: "services",
  testimonials: "testimonials",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload validation limits shared by client and server. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** Social platforms supported by settings + footer. */
export const SOCIAL_PLATFORMS = [
  { key: "instagram_url", label: "Instagram", icon: "Instagram" },
  { key: "facebook_url", label: "Facebook", icon: "Facebook" },
  { key: "tiktok_url", label: "TikTok", icon: "Music2" },
  { key: "youtube_url", label: "YouTube", icon: "Youtube" },
  { key: "x_url", label: "X", icon: "Twitter" },
] as const;

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export const PRICE_TYPES = [
  { value: "starting_from", label: "Starting from" },
  { value: "fixed", label: "Fixed price" },
  { value: "custom", label: "Custom / on request" },
] as const;

/**
 * Fallback settings used only when the database has no site_settings row yet
 * (e.g. before migrations/seed run). Clearly-marked placeholders — replace them
 * in the admin Settings page. Nothing here is presented as a real business.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  studio_name: SITE_NAME,
  tagline: SITE_TAGLINE,
  logo_url: "/logo.png",
  favicon_url: null,
  phone: "+234 000 000 0000",
  whatsapp: "2340000000000",
  whatsapp_default_message:
    "Hello Royalty Studio, I would like to make an inquiry about a photography session.",
  email: "hello@royaltystudio.example",
  address: "Your studio address here",
  map_embed_url: null,
  opening_hours: "Mon–Sat: 9:00 AM – 6:00 PM",
  // Placeholder links so the footer social icons are visible out of the box.
  // The admin replaces these with the studio's real pages in Settings → Social
  // (clear a field to hide that icon).
  instagram_url: "https://www.instagram.com/",
  facebook_url: "https://www.facebook.com/",
  tiktok_url: "https://www.tiktok.com/",
  youtube_url: null,
  x_url: null,
  hero_image_url: null,
  hero_title: "Royalty Studio",
  // Hidden by default — the admin can add these back in Settings → Homepage.
  hero_subtitle: null,
  hero_labels: null,
  about_image_url: null,
  about_text:
    "Royalty Studio is a photography practice devoted to preserving the moments that matter. Update this introduction in the admin Settings.",
  seo_title: `${SITE_NAME} — Premium Photography`,
  seo_description:
    "Royalty Studio is a premium photography studio capturing weddings, portraits, events and more.",
  og_image_url: null,
  updated_at: new Date(0).toISOString(),
};

import Link from "next/link";
import { Instagram, Facebook, Youtube, Twitter } from "lucide-react";
import type { SiteSettings } from "@/types/database";
import { cn } from "@/lib/utils";

// lucide-react has no TikTok brand mark, so use a proper TikTok glyph.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 3.4-2.46V9.7a5.72 5.72 0 0 0-.81-.06A5.68 5.68 0 0 0 4.2 15.31a5.68 5.68 0 0 0 9.75 3.96 5.68 5.68 0 0 0 1.6-3.96V9.01a7.34 7.34 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.25-1.48Z" />
    </svg>
  );
}

const PLATFORMS: {
  key: keyof SiteSettings;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "instagram_url", label: "Instagram", Icon: Instagram },
  { key: "facebook_url", label: "Facebook", Icon: Facebook },
  { key: "tiktok_url", label: "TikTok", Icon: TikTokIcon },
  { key: "youtube_url", label: "YouTube", Icon: Youtube },
  { key: "x_url", label: "X", Icon: Twitter },
];

export function SocialLinks({
  settings,
  className,
  iconClassName,
}: {
  settings: SiteSettings;
  className?: string;
  iconClassName?: string;
}) {
  const links = PLATFORMS.filter((p) => {
    const value = settings[p.key];
    return typeof value === "string" && value.trim().length > 0;
  });

  if (links.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {links.map(({ key, label, Icon }) => (
        <Link
          key={key}
          href={String(settings[key])}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${settings.studio_name} on ${label}`}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-current transition-colors hover:border-primary hover:text-primary",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </Link>
      ))}
    </div>
  );
}

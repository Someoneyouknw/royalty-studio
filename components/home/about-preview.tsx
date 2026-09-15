import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/types/database";
import { Button } from "@/components/ui/button";

const FALLBACK_ABOUT =
  "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80";

export function AboutPreview({ settings }: { settings: SiteSettings }) {
  return (
    <section className="bg-cream/60 py-20 md:py-28">
      <div className="container grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={settings.about_image_url || FALLBACK_ABOUT}
            alt={`Inside ${settings.studio_name}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="eyebrow mb-3">Our Story</p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            We don&apos;t just take pictures. We preserve moments.
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            {settings.about_text ||
              "Royalty Studio is a photography practice devoted to preserving the moments that matter."}
          </p>
          <Button asChild variant="outline" className="mt-7">
            <Link href="/about">Learn more about us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

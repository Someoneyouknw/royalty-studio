import Link from "next/link";
import type { Photo } from "@/types/database";
import { SectionHeading } from "@/components/shared/section-heading";
import { PhotoMasonry } from "@/components/gallery/photo-masonry";
import { Button } from "@/components/ui/button";

export function FeaturedWork({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="container py-20 md:py-28">
      <SectionHeading
        eyebrow="Portfolio"
        title="Featured Work"
        subtitle="Some of our favorite moments, captured with intention."
      />
      <div className="mt-12">
        <PhotoMasonry photos={photos} />
      </div>
      <div className="mt-12 flex justify-center">
        <Button asChild variant="outline" size="lg">
          <Link href="/portfolio">View full portfolio</Link>
        </Button>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Camera } from "lucide-react";
import type { CategoryWithCount } from "@/types/database";
import { SectionHeading } from "@/components/shared/section-heading";

export function CategoryShowcase({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  if (categories.length === 0) return null;
  return (
    <section className="bg-cream/60 py-20 md:py-28">
      <div className="container">
        <SectionHeading
          eyebrow="Collections"
          title="Explore by Category"
          subtitle="Every kind of moment has its own story. Find the one that speaks to yours."
        />
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/portfolio/${category.slug}`}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl bg-ink"
            >
              {category.cover_image_url ? (
                <Image
                  src={category.cover_image_url}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                  <Camera className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="relative p-4">
                <h3 className="font-serif text-lg font-semibold text-white">
                  {category.name}
                </h3>
                <p className="text-xs text-white/70">
                  {category.photo_count}{" "}
                  {category.photo_count === 1 ? "photo" : "photos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

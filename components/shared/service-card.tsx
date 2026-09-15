import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera } from "lucide-react";
import type { Service } from "@/types/database";

function formatPrice(service: Service): string | null {
  if (service.price_type === "custom" || service.price == null) return null;
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(service.price);
  return service.price_type === "starting_from" ? `From ${formatted}` : formatted;
}

export function ServiceCard({ service }: { service: Service }) {
  const price = formatPrice(service);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Camera className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg font-semibold">{service.title}</h3>
          {price && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {price}
            </span>
          )}
        </div>
        {service.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
            {service.description}
          </p>
        )}
        <Link
          href={`/contact?service=${service.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:gap-2.5"
        >
          Learn more <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

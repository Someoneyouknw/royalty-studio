import Link from "next/link";
import type { Service } from "@/types/database";
import { SectionHeading } from "@/components/shared/section-heading";
import { ServiceCard } from "@/components/shared/service-card";
import { Button } from "@/components/ui/button";

export function ServicesPreview({ services }: { services: Service[] }) {
  if (services.length === 0) return null;
  const shown = services.slice(0, 6);
  return (
    <section className="container py-20 md:py-28">
      <SectionHeading
        eyebrow="What We Offer"
        title="Photography Services"
        subtitle="Thoughtful coverage tailored to the moment — from intimate portraits to full-day celebrations."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
      <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/contact">Book a Session</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/services">See all services</Link>
        </Button>
      </div>
    </section>
  );
}

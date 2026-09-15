import type { Metadata } from "next";
import Link from "next/link";
import { Camera } from "lucide-react";
import { getActiveServices, getSettings } from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceCard } from "@/components/shared/service-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Photography services from Royalty Studio — weddings, portraits, studio, events, prints and more.",
  alternates: { canonical: "/services" },
};

export const revalidate = 300;

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getActiveServices(),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="What We Offer"
        title="Our Services"
        description="Every session is tailored to you. Explore what we offer and reach out for a personalised quote."
      />
      <section className="container py-16 md:py-20">
        {services.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="Services coming soon"
            description="We're finalising our service list. In the meantime, get in touch and we'll be glad to help."
            action={
              <Link
                href="/contact"
                className="text-sm font-medium text-primary hover:underline"
              >
                Contact us →
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
      <CtaBand settings={settings} />
    </>
  );
}

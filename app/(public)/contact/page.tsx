import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { getActiveServices, getSettings } from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { BookingForm } from "@/components/booking/booking-form";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { SocialLinks } from "@/components/shared/social-links";
import { BusinessJsonLd } from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "Contact & Booking",
  description:
    "Get in touch with Royalty Studio to book a photography session or ask a question.",
  alternates: { canonical: "/contact" },
};

export const revalidate = 300;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const [settings, services] = await Promise.all([
    getSettings(),
    getActiveServices(),
  ]);

  const contactItems = [
    settings.phone && {
      icon: Phone,
      label: "Phone",
      value: settings.phone,
      href: `tel:${settings.phone}`,
    },
    settings.email && {
      icon: Mail,
      label: "Email",
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    settings.address && {
      icon: MapPin,
      label: "Location",
      value: settings.address,
    },
    settings.opening_hours && {
      icon: Clock,
      label: "Hours",
      value: settings.opening_hours,
    },
  ].filter(Boolean) as {
    icon: typeof Phone;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <>
      <BusinessJsonLd settings={settings} />
      <PageHeader
        eyebrow="Get in Touch"
        title="Contact & Booking"
        description="Ready to work together? Send us the details of your session and we'll get right back to you."
      />

      <section className="container grid gap-12 py-16 md:grid-cols-[1fr_1.4fr] md:py-20">
        {/* Contact info */}
        <div>
          <h2 className="font-serif text-2xl font-semibold">Reach us directly</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Prefer to talk? Use any of the options below.
          </p>

          <ul className="mt-8 space-y-5">
            {contactItems.map((item) => (
              <li key={item.label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium text-foreground hover:text-primary"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="whitespace-pre-line text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <WhatsAppButton
              number={settings.whatsapp}
              message={settings.whatsapp_default_message}
              className="w-full sm:w-auto"
            />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Follow along
            </p>
            <SocialLinks
              settings={settings}
              iconClassName="border-border text-muted-foreground hover:text-primary"
            />
          </div>

          {/* Map — only shown when a real embed URL is configured. */}
          {settings.map_embed_url && (
            <div className="mt-8 overflow-hidden rounded-xl border border-border">
              <iframe
                src={settings.map_embed_url}
                title="Studio location"
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </div>

        {/* Booking form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl font-semibold">Send an inquiry</h2>
          </div>
          <BookingForm
            services={services.map((s) => ({ id: s.id, title: s.title, slug: s.slug }))}
            settings={settings}
            defaultServiceSlug={service}
          />
        </div>
      </section>
    </>
  );
}

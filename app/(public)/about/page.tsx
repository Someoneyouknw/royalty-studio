import type { Metadata } from "next";
import Image from "next/image";
import { Camera, Heart, Sparkles, ShieldCheck } from "lucide-react";
import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { CtaBand } from "@/components/home/cta-band";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Royalty Studio — our story, our approach, and our philosophy of preserving moments.",
  alternates: { canonical: "/about" },
};

export const revalidate = 300;

const FALLBACK_ABOUT =
  "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80";

const VALUES = [
  {
    icon: Heart,
    title: "Made with care",
    body: "Every frame is chosen with intention — we photograph the feeling, not just the moment.",
  },
  {
    icon: Sparkles,
    title: "A calm experience",
    body: "We keep sessions relaxed and unhurried, so you can be present while we do the work.",
  },
  {
    icon: ShieldCheck,
    title: "Dependable delivery",
    body: "Clear timelines, secure galleries, and images you'll be proud to share and print.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title={`Meet ${settings.studio_name}`}
        description={settings.tagline || undefined}
      />

      {/* Our Story */}
      <section className="container grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16 md:py-20">
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
          <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">
            {settings.about_text ||
              "Royalty Studio is a photography practice devoted to preserving the moments that matter."}
          </p>
        </div>
      </section>

      {/* Our Approach / Philosophy */}
      <section className="bg-cream/60 py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">Our Approach</p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Photography that feels like you
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our philosophy is simple: show up, pay attention, and let the real
              moments lead. The result is imagery that feels honest and timeless.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Why choose {settings.studio_name}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Because your moments deserve more than a snapshot. We bring
            professional craft, genuine warmth, and a reliable process to every
            booking — from the first message to the final gallery.
          </p>
        </div>
      </section>

      <CtaBand settings={settings} />
    </>
  );
}

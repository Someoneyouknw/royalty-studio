import Link from "next/link";
import type { SiteSettings } from "@/types/database";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";

export function CtaBand({ settings }: { settings: SiteSettings }) {
  return (
    <section className="bg-ink">
      <div className="container py-20 text-center md:py-24">
        <p className="eyebrow mb-3">Let&apos;s Create Together</p>
        <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
          Ready to create something memorable?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/70">
          Tell us about your vision and we&apos;ll help bring it to life.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full bg-white text-ink hover:bg-white/90">
            <Link href="/contact">Book a Session</Link>
          </Button>
          <WhatsAppButton
            number={settings.whatsapp}
            message={settings.whatsapp_default_message}
            size="lg"
            className="rounded-full border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white"
          />
        </div>
      </div>
    </section>
  );
}

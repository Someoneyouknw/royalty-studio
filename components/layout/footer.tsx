import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/types/database";
import { PUBLIC_NAV } from "@/lib/constants";
import { SocialLinks } from "@/components/shared/social-links";
import { buildWhatsappLink } from "@/lib/whatsapp";

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const wa = buildWhatsappLink(settings.whatsapp, settings.whatsapp_default_message);
  const hasSocial = [
    settings.instagram_url,
    settings.facebook_url,
    settings.tiktok_url,
    settings.youtube_url,
    settings.x_url,
  ].some((v) => typeof v === "string" && v.trim().length > 0);

  return (
    <footer className="bg-ink text-white/80">
      <div className="container grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:gap-12 md:py-16 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          {settings.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.studio_name}
              width={131}
              height={100}
              className="mb-4 h-11 w-auto object-contain"
            />
          ) : null}
          <p className="font-serif text-2xl font-semibold text-white">
            {settings.studio_name}
            <span className="text-primary">.</span>
          </p>
          {settings.tagline && (
            <p className="mt-3 max-w-xs text-sm text-white/60">{settings.tagline}</p>
          )}
          {hasSocial && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/80">
                Follow us on social media
              </p>
              <SocialLinks settings={settings} />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-white/60 transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            {settings.phone && (
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`tel:${settings.phone}`} className="hover:text-white">
                  {settings.phone}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${settings.email}`} className="hover:text-white">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Studio Hours
          </h3>
          <div className="mt-4 flex items-start gap-2.5 text-sm text-white/60">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="whitespace-pre-line">
              {settings.opening_hours || "By appointment"}
            </span>
          </div>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Book a session →
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-center text-xs text-white/50 sm:flex-row sm:text-left">
          <p>© {year} {settings.studio_name}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}

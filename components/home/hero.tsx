"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import type { SiteSettings } from "@/types/database";
import { Button } from "@/components/ui/button";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=2000&q=80";

export function Hero({ settings }: { settings: SiteSettings }) {
  const image = settings.hero_image_url || FALLBACK_HERO;
  const heading = (settings.hero_title || settings.studio_name).trim();
  const words = heading.split(/\s+/).slice(0, 3);
  // Admin-controlled. Blank in Settings = hidden.
  const subtitle = (settings.hero_subtitle ?? "").trim();
  const labels = (settings.hero_labels ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const showTopRow = labels.length > 0 || subtitle.length > 0;

  return (
    <section className="relative min-h-[94svh] w-full overflow-hidden bg-ink text-white">
      {/* Full-bleed image */}
      <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Cinematic legibility layers + warm brand wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_15%_0%,rgba(239,100,18,0.22),transparent_55%)]" />

      <div className="container relative z-10 flex min-h-[94svh] flex-col pb-10 pt-24 sm:pt-28 md:pt-32">
        {/* Top row: label stack + tagline (stacks on phones, splits on ≥sm).
            Both are admin-controlled and hidden when left blank. */}
        {showTopRow && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {labels.length > 0 ? (
              <motion.ul
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="label-stack text-white/70"
              >
                {labels.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </motion.ul>
            ) : (
              <span />
            )}

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-xs text-sm leading-relaxed text-white/85 sm:max-w-[15rem] sm:text-right"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Mega headline pinned to the bottom, overlapping the image */}
        <div className="mt-auto">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mega max-w-full text-[clamp(2.9rem,14vw,13rem)] [overflow-wrap:anywhere]"
          >
            {words.map((w, i) => (
              <span key={i} className="block">
                {w}
                {i === words.length - 1 && <span className="text-primary">.</span>}
              </span>
            ))}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Button
              asChild
              size="lg"
              className="w-full rounded-full bg-white text-ink hover:bg-white/90 sm:w-auto"
            >
              <Link href="/portfolio">
                Explore Our Work <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-white/40 bg-white/5 text-white backdrop-blur hover:bg-white/15 hover:text-white sm:w-auto"
            >
              <Link href="/contact">Book a Session</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 text-white/60 md:block">
        <ArrowDown className="h-5 w-5 animate-scroll-hint" aria-hidden />
      </div>
    </section>
  );
}

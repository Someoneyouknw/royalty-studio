"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { PUBLIC_NAV } from "@/lib/constants";
import type { SiteSettings } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Navbar({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Overlay (transparent, light text) only on the homepage hero before scroll.
  const overlay = isHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        overlay
          ? "bg-transparent"
          : "border-b border-border bg-background/90 backdrop-blur-md",
      )}
    >
      <div className="container flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-serif text-lg font-semibold tracking-tight md:text-xl",
            overlay ? "text-white" : "text-foreground",
          )}
        >
          {settings.logo_url ? (
            <span className="inline-flex items-center rounded-lg bg-ink px-2 py-1.5 shadow-sm">
              <Image
                src={settings.logo_url}
                alt={settings.studio_name}
                width={131}
                height={100}
                className="h-7 w-auto object-contain md:h-8"
                priority
              />
            </span>
          ) : (
            <span>
              {settings.studio_name}
              <span className="text-primary">.</span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {PUBLIC_NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "link-underline text-sm font-medium transition-colors",
                  overlay
                    ? "text-white/90 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
                  active && (overlay ? "text-white" : "text-foreground"),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden",
            overlay ? "text-white" : "text-foreground",
          )}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background transition-[max-height] duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
        )}
      >
        <nav className="container flex flex-col gap-1 py-3">
          {PUBLIC_NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-3 text-base font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Button asChild className="mt-2">
            <Link href="/contact">Book a Session</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

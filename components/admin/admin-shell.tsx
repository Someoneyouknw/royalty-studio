"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Images,
  FolderTree,
  Camera,
  Quote,
  Inbox,
  MessagesSquare,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ADMIN_NAV } from "@/lib/constants";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Images,
  FolderTree,
  Camera,
  Quote,
  Inbox,
  MessagesSquare,
  Settings,
  UserCog,
};

export function AdminShell({
  email,
  studioName,
  children,
}: {
  email: string;
  studioName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    await getBrowserClient().auth.signOut();
    toast.success("Signed out.");
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/admin/dashboard" className="font-serif text-lg font-semibold">
          {studioName}
          <span className="text-primary">.</span>
        </Link>
      </div>
      {nav}
      <div className="mt-auto space-y-1 border-t border-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" /> View website
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
        <p className="truncate px-3 pt-2 text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-background lg:block">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-background shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner}
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex w-full flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-serif text-lg font-semibold">
            {studioName}
            <span className="text-primary">.</span>
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

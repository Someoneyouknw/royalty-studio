import Link from "next/link";
import Image from "next/image";
import {
  Images,
  Star,
  FolderTree,
  Camera,
  Inbox,
  MessagesSquare,
  Upload,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, inquiryReference } from "@/lib/utils";
import { InquiryStatusBadge } from "@/components/admin/inquiry-status";
import type { Inquiry, Photo } from "@/types/database";

async function count(table: string, filters?: (q: any) => any): Promise<number> {
  const supabase = await createClient();
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filters) q = filters(q);
  const { count } = await q;
  return count ?? 0;
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    totalPhotos,
    featuredPhotos,
    categories,
    services,
    newInquiries,
    unreadConvos,
  ] = await Promise.all([
    count("photos"),
    count("photos", (q) => q.eq("is_featured", true)),
    count("categories"),
    count("services"),
    count("inquiries", (q) => q.eq("status", "new")),
    count("conversations", (q) => q.gt("admin_unread", 0)),
  ]);

  const { data: recentPhotos } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: recentInquiries } = await supabase
    .from("inquiries")
    .select("*, service:services(title)")
    .order("created_at", { ascending: false })
    .limit(5);

  const photos = (recentPhotos ?? []) as Photo[];
  const inquiries = (recentInquiries ?? []) as (Inquiry & {
    service: { title: string } | null;
  })[];

  return (
    <div>
      <PageTitle
        title="Dashboard"
        description="A snapshot of your studio's activity."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Images} label="Total Photos" value={totalPhotos} href="/admin/portfolio" />
        <StatCard icon={Star} label="Featured" value={featuredPhotos} href="/admin/portfolio?featured=true" />
        <StatCard icon={FolderTree} label="Categories" value={categories} href="/admin/categories" />
        <StatCard icon={Camera} label="Services" value={services} href="/admin/services" />
        <StatCard icon={Inbox} label="New Inquiries" value={newInquiries} href="/admin/inquiries" />
        <StatCard icon={MessagesSquare} label="Unread Chats" value={unreadConvos} href="/admin/messages" />
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/portfolio?upload=1">
            <Upload className="h-4 w-4" /> Upload Photos
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/categories?new=1">
            <Plus className="h-4 w-4" /> Add Category
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/services?new=1">
            <Plus className="h-4 w-4" /> Add Service
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/messages">View Messages</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/inquiries">View Inquiries</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent uploads */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Uploads</h2>
            <Link href="/admin/portfolio" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {photos.length === 0 ? (
            <EmptyState
              icon={Images}
              title="Your portfolio is waiting for its first upload"
              className="py-10"
            />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={p.thumbnail_url || p.image_url}
                    alt={p.alt_text || p.title || "Photo"}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                  {!p.is_published && (
                    <span className="absolute left-1 top-1">
                      <Badge variant="warning">Draft</Badge>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent inquiries */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Inquiries</h2>
            <Link href="/admin/inquiries" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {inquiries.length === 0 ? (
            <EmptyState icon={Inbox} title="No client inquiries yet" className="py-10" />
          ) : (
            <ul className="divide-y divide-border">
              {inquiries.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {i.service?.title || "General"} · {formatDate(i.created_at)} ·{" "}
                      {inquiryReference(i.id, i.created_at)}
                    </p>
                  </div>
                  <InquiryStatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

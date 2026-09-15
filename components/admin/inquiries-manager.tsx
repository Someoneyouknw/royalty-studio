"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Trash2,
  Inbox,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Inquiry, InquiryStatus, Service } from "@/types/database";
import { getBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/fetcher";
import { formatDate, inquiryReference } from "@/lib/utils";
import { buildWhatsappLink } from "@/lib/whatsapp";
import { INQUIRY_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { InquiryStatusBadge } from "@/components/admin/inquiry-status";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/admin/page-title";

type Row = Inquiry & { service: { id: string; title: string } | null };

export function InquiriesManager({
  initial,
  services,
}: {
  initial: Row[];
  services: Pick<Service, "id" | "title">[];
}) {
  const supabase = getBrowserClient();
  const [rows, setRows] = useState<Row[]>(initial);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [serviceId, setServiceId] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Row | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from("inquiries").select("*, service:services(id, title)");
      if (search.trim())
        q = q.or(
          `name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,phone.ilike.%${search.trim()}%`,
        );
      if (status !== "all") q = q.eq("status", status as InquiryStatus);
      if (serviceId !== "all") q = q.eq("service_id", serviceId);
      q = q.order("created_at", { ascending: sort === "oldest" });
      const { data } = await q;
      setRows((data as Row[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [supabase, search, status, serviceId, sort]);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    const t = setTimeout(fetchRows, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, serviceId, sort]);

  async function changeStatus(row: Row, next: InquiryStatus) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)));
    if (selected?.id === row.id) setSelected({ ...selected, status: next });
    try {
      await apiFetch(`/api/inquiries/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
    } catch {
      toast.error("Could not update status.");
      fetchRows();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/inquiries/${deleteTarget.id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Inquiry deleted.");
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
    } catch {
      toast.error("Could not delete.");
    }
  }

  return (
    <div>
      <PageTitle title="Inquiries" description="Booking requests and messages from your contact form." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {INQUIRY_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger className="w-auto min-w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-auto min-w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Inbox} title="No client inquiries yet" description="New booking requests will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{r.name}</p>
                    <InquiryStatusBadge status={r.status} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.service?.title || "General"} · {r.phone || r.email || "no contact"} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-3 pr-8">
                  <span>{selected.name}</span>
                  <InquiryStatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              <p className="text-xs text-muted-foreground">
                Ref {inquiryReference(selected.id, selected.created_at)} ·{" "}
                {formatDate(selected.created_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                } as Intl.DateTimeFormatOptions)}
              </p>

              <dl className="mt-2 space-y-2 text-sm">
                {selected.service && (
                  <Detail label="Service" value={selected.service.title} />
                )}
                {selected.preferred_date && (
                  <Detail icon={Calendar} label="Preferred date" value={`${selected.preferred_date}${selected.preferred_time ? ` at ${selected.preferred_time}` : ""}`} />
                )}
                {selected.location && <Detail icon={MapPin} label="Location" value={selected.location} />}
                {selected.number_of_people != null && (
                  <Detail icon={Users} label="People" value={String(selected.number_of_people)} />
                )}
                {selected.message && (
                  <div className="rounded-lg bg-muted p-3 text-sm">{selected.message}</div>
                )}
              </dl>

              {/* Contact quick actions */}
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${selected.phone}`}>
                      <Phone className="h-4 w-4" /> Call
                    </a>
                  </Button>
                )}
                {selected.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={
                        buildWhatsappLink(
                          selected.phone,
                          `Hello ${selected.name}, thank you for your inquiry with Royalty Studio.`,
                        ) || "#"
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                    </a>
                  </Button>
                )}
                {selected.email && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${selected.email}`}>
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  </Button>
                )}
              </div>

              {/* Status + delete */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => changeStatus(selected, v as InquiryStatus)}
                  >
                    <SelectTrigger className="w-auto min-w-[140px] capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INQUIRY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(selected)} aria-label="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this inquiry?"
        description="This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

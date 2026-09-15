import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { InquiryStatus } from "@/types/database";

const MAP: Record<InquiryStatus, { label: string; variant: BadgeProps["variant"] }> = {
  new: { label: "New", variant: "info" },
  contacted: { label: "Contacted", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const s = MAP[status] ?? MAP.new;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

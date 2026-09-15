"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { GripVertical, Pencil, Trash2, Plus, Camera, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Service, PriceType } from "@/types/database";
import { apiFetch } from "@/lib/fetcher";
import { slugify } from "@/lib/utils";
import { PRICE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/admin/page-title";

type Form = {
  id?: string;
  title: string;
  description: string;
  image_url: string | null;
  price: string;
  price_type: PriceType;
  is_active: boolean;
};
const EMPTY: Form = {
  title: "",
  description: "",
  image_url: null,
  price: "",
  price_type: "starting_from",
  is_active: true,
};

function Row({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: service.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground" aria-label="Reorder">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {service.image_url && (
          <Image src={service.image_url} alt="" fill sizes="48px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{service.title}</p>
          {!service.is_active && (
            <Badge variant="neutral">
              <EyeOff className="mr-1 h-3 w-3" /> Hidden
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {service.price != null && service.price_type !== "custom"
            ? `₦${Number(service.price).toLocaleString()}`
            : "Price on request"}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function ServicesManager({
  initial,
  openNew,
}: {
  initial: Service[];
  openNew?: boolean;
}) {
  const [items, setItems] = useState<Service[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (openNew) {
      setForm(EMPTY);
      setDialogOpen(true);
    }
  }, [openNew]);

  function openEdit(s: Service) {
    setForm({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      image_url: s.image_url,
      price: s.price != null ? String(s.price) : "",
      price_type: s.price_type,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        image_url: form.image_url,
        price: form.price_type === "custom" || form.price === "" ? null : Number(form.price),
        price_type: form.price_type,
        is_active: form.is_active,
      };
      if (form.id) {
        const updated = await apiFetch<Service>(`/api/services/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) => prev.map((s) => (s.id === form.id ? updated : s)));
        toast.success("Service updated.");
      } else {
        const createdSvc = await apiFetch<Service>("/api/services", {
          method: "POST",
          body: JSON.stringify({ ...payload, slug: slugify(form.title) }),
        });
        setItems((prev) => [...prev, createdSvc]);
        toast.success("Service created.");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save service.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/services/${deleteTarget.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Service deleted.");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const reordered = arrayMove(
      items,
      items.findIndex((i) => i.id === active.id),
      items.findIndex((i) => i.id === over.id),
    );
    setItems(reordered);
    try {
      await apiFetch("/api/services/reorder", {
        method: "POST",
        body: JSON.stringify({ items: reordered.map((s, i) => ({ id: s.id, display_order: i })) }),
      });
    } catch {
      toast.error("Could not save order.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Services"
        description="Manage the services you offer. Drag to reorder. Pricing is optional."
        action={
          <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Service
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No services yet"
          description="Add the photography services you offer."
          action={<Button onClick={() => setDialogOpen(true)}>Add Service</Button>}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((s) => (
                <Row key={s.id} service={s} onEdit={() => openEdit(s)} onDelete={() => setDeleteTarget(s)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit service" : "New service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-title">Title</Label>
              <Input id="s-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea id="s-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <ImageUploadField
              label="Service image"
              bucket="services"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Pricing type</Label>
                <Select
                  value={form.price_type}
                  onValueChange={(v) => setForm({ ...form, price_type: v as PriceType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-price">Price (₦)</Label>
                <Input
                  id="s-price"
                  type="number"
                  min={0}
                  value={form.price}
                  disabled={form.price_type === "custom"}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder={form.price_type === "custom" ? "On request" : "e.g. 50000"}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this service on the website.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{form.id ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This service will be removed from your website. This cannot be undone."
        destructive
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

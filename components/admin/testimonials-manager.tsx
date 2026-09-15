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
import { GripVertical, Pencil, Trash2, Plus, Quote, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import type { Testimonial } from "@/types/database";
import { apiFetch } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

type Form = {
  id?: string;
  client_name: string;
  client_role: string;
  testimonial: string;
  image_url: string | null;
  rating: number;
  is_featured: boolean;
  is_published: boolean;
};
const EMPTY: Form = {
  client_name: "",
  client_role: "",
  testimonial: "",
  image_url: null,
  rating: 5,
  is_featured: false,
  is_published: true,
};

function Row({
  t,
  onEdit,
  onDelete,
}: {
  t: Testimonial;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: t.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-3 rounded-lg border border-border bg-card p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button {...attributes} {...listeners} className="mt-1 cursor-grab touch-none text-muted-foreground" aria-label="Reorder">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{t.client_name}</p>
          {t.client_role && <span className="text-xs text-muted-foreground">· {t.client_role}</span>}
          {t.is_featured && <Badge>Featured</Badge>}
          {!t.is_published && (
            <Badge variant="neutral">
              <EyeOff className="mr-1 h-3 w-3" /> Hidden
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{t.testimonial}”</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function TestimonialsManager({ initial }: { initial: Testimonial[] }) {
  const [items, setItems] = useState<Testimonial[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function openEdit(t: Testimonial) {
    setForm({
      id: t.id,
      client_name: t.client_name,
      client_role: t.client_role ?? "",
      testimonial: t.testimonial,
      image_url: t.image_url,
      rating: t.rating ?? 5,
      is_featured: t.is_featured,
      is_published: t.is_published,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.client_name.trim() || !form.testimonial.trim()) {
      toast.error("Client name and testimonial are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name.trim(),
        client_role: form.client_role.trim() || undefined,
        testimonial: form.testimonial.trim(),
        image_url: form.image_url,
        rating: form.rating,
        is_featured: form.is_featured,
        is_published: form.is_published,
      };
      if (form.id) {
        const updated = await apiFetch<Testimonial>(`/api/testimonials/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) => prev.map((t) => (t.id === form.id ? updated : t)));
        toast.success("Testimonial updated.");
      } else {
        const createdT = await apiFetch<Testimonial>("/api/testimonials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setItems((prev) => [...prev, createdT]);
        toast.success("Testimonial added.");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/testimonials/${deleteTarget.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success("Testimonial deleted.");
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
      await apiFetch("/api/testimonials/reorder", {
        method: "POST",
        body: JSON.stringify({ items: reordered.map((t, i) => ({ id: t.id, display_order: i })) }),
      });
    } catch {
      toast.error("Could not save order.");
    }
  }

  return (
    <div>
      <PageTitle
        title="Testimonials"
        description="Real client words build trust. Only publish genuine testimonials."
        action={
          <Button onClick={() => { setForm(EMPTY); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Testimonial
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Quote}
          title="No testimonials yet"
          description="Add testimonials from your happy clients. Use their real words with permission."
          action={<Button onClick={() => setDialogOpen(true)}>Add Testimonial</Button>}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((t) => (
                <Row key={t.id} t={t} onEdit={() => openEdit(t)} onDelete={() => setDeleteTarget(t)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit testimonial" : "New testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Client name</Label>
                <Input id="t-name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-role">Role / context</Label>
                <Input id="t-role" value={form.client_role} onChange={(e) => setForm({ ...form, client_role: e.target.value })} placeholder="e.g. Wedding client" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-text">Testimonial</Label>
              <Textarea id="t-text" value={form.testimonial} onChange={(e) => setForm({ ...form, testimonial: e.target.value })} className="min-h-[100px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} stars`}>
                    <Star className={cn("h-6 w-6", n <= form.rating ? "fill-primary text-primary" : "text-muted-foreground/40")} />
                  </button>
                ))}
              </div>
            </div>
            <ImageUploadField
              label="Client photo (optional)"
              bucket="testimonials"
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              aspect="aspect-square max-w-[8rem]"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label>Featured</Label>
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label>Published</Label>
                <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{form.id ? "Save changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this testimonial?"
        description="This cannot be undone."
        destructive
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

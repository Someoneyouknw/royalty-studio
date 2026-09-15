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
import {
  GripVertical,
  Pencil,
  Trash2,
  Plus,
  FolderTree,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import type { CategoryWithCount } from "@/types/database";
import { apiFetch } from "@/lib/fetcher";
import { slugify } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { EmptyState } from "@/components/shared/empty-state";
import { PageTitle } from "@/components/admin/page-title";

type Cat = CategoryWithCount;
type FormState = {
  id?: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  is_active: boolean;
};

const EMPTY: FormState = {
  name: "",
  description: "",
  cover_image_url: null,
  is_active: true,
};

function SortableRow({
  cat,
  onEdit,
  onDelete,
}: {
  cat: Cat;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
        {cat.cover_image_url && (
          <Image src={cat.cover_image_url} alt="" fill sizes="48px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{cat.name}</p>
          {!cat.is_active && (
            <Badge variant="neutral">
              <EyeOff className="mr-1 h-3 w-3" /> Hidden
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          /{cat.slug} · {cat.photo_count} {cat.photo_count === 1 ? "photo" : "photos"}
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

export function CategoriesManager({
  initial,
  openNew,
}: {
  initial: Cat[];
  openNew?: boolean;
}) {
  const [items, setItems] = useState<Cat[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Cat | null>(null);
  const [deleteMode, setDeleteMode] = useState<"move" | "delete">("move");
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (openNew) {
      setForm(EMPTY);
      setDialogOpen(true);
    }
  }, [openNew]);

  function openCreate() {
    setForm(EMPTY);
    setDialogOpen(true);
  }
  function openEdit(cat: Cat) {
    setForm({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      cover_image_url: cat.cover_image_url,
      is_active: cat.is_active,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        cover_image_url: form.cover_image_url,
        is_active: form.is_active,
      };
      if (form.id) {
        const updated = await apiFetch<Cat>(`/api/categories/${form.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setItems((prev) =>
          prev.map((c) =>
            c.id === form.id ? { ...c, ...updated, photo_count: c.photo_count } : c,
          ),
        );
        toast.success("Category updated.");
      } else {
        const createdCat = await apiFetch<Cat>("/api/categories", {
          method: "POST",
          body: JSON.stringify({ ...payload, slug: slugify(form.name) }),
        });
        setItems((prev) => [...prev, { ...createdCat, photo_count: 0 }]);
        toast.success("Category created.");
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(cat: Cat) {
    setDeleteTarget(cat);
    setDeleteMode("move");
    setMoveTarget(items.find((c) => c.id !== cat.id)?.id ?? "");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const hasPhotos = deleteTarget.photo_count > 0;
    if (hasPhotos && deleteMode === "move" && !moveTarget) {
      toast.error("Choose a category to move the photos into.");
      return;
    }
    setDeleting(true);
    try {
      await apiFetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
        body: JSON.stringify(
          hasPhotos
            ? { mode: deleteMode, target_category_id: deleteMode === "move" ? moveTarget : undefined }
            : { mode: "move" },
        ),
      });
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Category deleted.");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete category.");
    } finally {
      setDeleting(false);
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    try {
      await apiFetch("/api/categories/reorder", {
        method: "POST",
        body: JSON.stringify({
          items: reordered.map((c, i) => ({ id: c.id, display_order: i })),
        }),
      });
    } catch {
      toast.error("Could not save the new order.");
    }
  }

  const otherCategories = items.filter((c) => c.id !== deleteTarget?.id);

  return (
    <div>
      <PageTitle
        title="Categories"
        description="Organise your portfolio. Drag to reorder how categories appear on the site."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to start organising your work."
          action={<Button onClick={openCreate}>Add Category</Button>}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((cat) => (
                <SortableRow
                  key={cat.id}
                  cat={cat}
                  onEdit={() => openEdit(cat)}
                  onDelete={() => requestDelete(cat)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Weddings"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A short description shown on the category page."
              />
            </div>
            <ImageUploadField
              label="Cover image"
              bucket="portfolio"
              value={form.cover_image_url}
              onChange={(url) => setForm({ ...form, cover_image_url: url })}
            />
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Show this category on the website.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {form.id ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safe delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description={
          deleteTarget && deleteTarget.photo_count > 0
            ? `This category contains ${deleteTarget.photo_count} photo(s). Choose what to do with them.`
            : "This category has no photos and will be removed."
        }
        confirmLabel="Delete category"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
      >
        {deleteTarget && deleteTarget.photo_count > 0 && (
          <div className="space-y-3">
            <label className="flex items-start gap-2 rounded-lg border border-border p-3">
              <input
                type="radio"
                name="delmode"
                className="mt-1"
                checked={deleteMode === "move"}
                onChange={() => setDeleteMode("move")}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">Move photos to another category</p>
                {deleteMode === "move" && (
                  <div className="mt-2">
                    <Select value={moveTarget} onValueChange={setMoveTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-border p-3">
              <input
                type="radio"
                name="delmode"
                className="mt-1"
                checked={deleteMode === "delete"}
                onChange={() => setDeleteMode("delete")}
              />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Delete the photos too
                </p>
                <p className="text-xs text-muted-foreground">
                  Permanently removes the photos and their files. This cannot be undone.
                </p>
              </div>
            </label>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

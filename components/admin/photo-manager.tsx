"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Upload,
  Search,
  Star,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  MoreVertical,
  Images,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Category, Photo, PhotoWithCategory } from "@/types/database";
import { getBrowserClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/admin/page-title";
import { PhotoUploader } from "@/components/admin/photo-uploader";

interface Filters {
  search: string;
  category: string;
  featured: string;
  published: string;
  sort: string;
}

export function PhotoManager({
  initial,
  categories,
  openUpload,
  initialFeatured,
}: {
  initial: PhotoWithCategory[];
  categories: Category[];
  openUpload?: boolean;
  initialFeatured?: boolean;
}) {
  const supabase = getBrowserClient();
  const [photos, setPhotos] = useState<PhotoWithCategory[]>(initial);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(!!openUpload);
  const [editTarget, setEditTarget] = useState<PhotoWithCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Photo | null>(null);
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    featured: initialFeatured ? "true" : "all",
    published: "all",
    sort: "newest",
  });

  const catName = useMemo(() => {
    const m = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? m.get(id) ?? "Uncategorised" : "Uncategorised");
  }, [categories]);

  const fetchPhotos = useCallback(
    async (f: Filters) => {
      setLoading(true);
      try {
        let q = supabase.from("photos").select("*, category:categories(*)");
        if (f.search.trim()) q = q.ilike("title", `%${f.search.trim()}%`);
        if (f.category !== "all") q = q.eq("category_id", f.category);
        if (f.featured === "true") q = q.eq("is_featured", true);
        if (f.published === "true") q = q.eq("is_published", true);
        if (f.published === "false") q = q.eq("is_published", false);
        q =
          f.sort === "oldest"
            ? q.order("created_at", { ascending: true })
            : f.sort === "order"
              ? q.order("display_order", { ascending: true })
              : q.order("created_at", { ascending: false });
        const { data } = await q;
        setPhotos((data as PhotoWithCategory[]) ?? []);
        setSelected(new Set());
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  // Debounced refetch on filter change (skip initial mount).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!mounted) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => fetchPhotos(filters), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const allSelected = photos.length > 0 && selected.size === photos.length;
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(photos.map((p) => p.id)));
  }

  async function patchPhoto(id: string, patch: Partial<Photo>) {
    // optimistic
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      await apiFetch(`/api/photos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
      fetchPhotos(filters);
    }
  }

  async function deletePhoto() {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/photos/${deleteTarget.id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Photo deleted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function bulk(action: string, categoryId?: string) {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      await apiFetch("/api/photos/bulk", {
        method: "POST",
        body: JSON.stringify({ ids, action, category_id: categoryId ?? null }),
      });
      toast.success(`Updated ${ids.length} photo(s).`);
      fetchPhotos(filters);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk action failed");
    }
  }

  return (
    <div>
      <PageTitle
        title="Portfolio"
        description="Upload and manage your photographs."
        action={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload Photos
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search by title…"
            className="pl-9"
          />
        </div>
        <FilterSelect
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
          placeholder="All categories"
          options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <FilterSelect
          value={filters.published}
          onChange={(v) => setFilters((f) => ({ ...f, published: v }))}
          options={[
            { value: "all", label: "All status" },
            { value: "true", label: "Published" },
            { value: "false", label: "Drafts" },
          ]}
        />
        <FilterSelect
          value={filters.featured}
          onChange={(v) => setFilters((f) => ({ ...f, featured: v }))}
          options={[
            { value: "all", label: "All" },
            { value: "true", label: "Featured" },
          ]}
        />
        <FilterSelect
          value={filters.sort}
          onChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "order", label: "Display order" },
          ]}
        />
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button size="sm" variant="outline" onClick={() => bulk("publish")}>Publish</Button>
          <Button size="sm" variant="outline" onClick={() => bulk("unpublish")}>Unpublish</Button>
          <Button size="sm" variant="outline" onClick={() => bulk("feature")}>Feature</Button>
          <Button size="sm" variant="outline" onClick={() => bulk("unfeature")}>Unfeature</Button>
          <div className="flex items-center gap-1">
            <FilterSelect
              value={bulkCategory}
              onChange={(v) => setBulkCategory(v)}
              placeholder="Move to…"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!bulkCategory}
              onClick={() => bulk("move", bulkCategory)}
            >
              Move
            </Button>
          </div>
          <Button size="sm" variant="destructive" onClick={() => bulk("delete")}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
      )}

      {photos.length > 0 && (
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Your portfolio is waiting for its first upload"
          description="Upload your photographs and organise them into categories."
          action={<Button onClick={() => setUploadOpen(true)}>Upload Photos</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group relative overflow-hidden rounded-lg border bg-card",
                selected.has(p.id) ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={p.thumbnail_url || p.image_url}
                  alt={p.alt_text || p.title || "Photo"}
                  fill
                  sizes="(max-width:640px) 50vw, 25vw"
                  className="object-cover"
                />
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="absolute left-2 top-2 h-4 w-4 cursor-pointer"
                  aria-label="Select photo"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  {p.is_featured && <Badge>Featured</Badge>}
                  {!p.is_published && <Badge variant="warning">Draft</Badge>}
                </div>
                {/* Hover actions */}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => patchPhoto(p.id, { is_featured: !p.is_featured })}
                      className="rounded-md bg-white/90 p-1.5 text-ink hover:bg-white"
                      aria-label="Toggle featured"
                      title="Feature"
                    >
                      <Star className={cn("h-4 w-4", p.is_featured && "fill-primary text-primary")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => patchPhoto(p.id, { is_published: !p.is_published })}
                      className="rounded-md bg-white/90 p-1.5 text-ink hover:bg-white"
                      aria-label="Toggle published"
                      title={p.is_published ? "Unpublish" : "Publish"}
                    >
                      {p.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="rounded-md bg-white/90 p-1.5 text-ink hover:bg-white"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTarget(p)}>
                        <Pencil className="h-4 w-4" /> Edit details
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-medium">{p.title || "Untitled"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {catName(p.category_id)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <PhotoUploader
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={categories}
        onUploaded={(created) =>
          setPhotos((prev) => [
            ...created.map((c) => ({
              ...c,
              category: categories.find((cat) => cat.id === c.category_id) ?? null,
            })),
            ...prev,
          ])
        }
      />

      <PhotoEditDialog
        photo={editTarget}
        categories={categories}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === updated.id
                ? {
                    ...p,
                    ...updated,
                    category:
                      categories.find((c) => c.id === updated.category_id) ?? null,
                  }
                : p,
            ),
          );
          setEditTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this photo?"
        description="This permanently removes the photo and its file. This cannot be undone."
        destructive
        confirmLabel="Delete"
        onConfirm={deletePhoto}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-auto min-w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PhotoEditDialog({
  photo,
  categories,
  onClose,
  onSaved,
}: {
  photo: PhotoWithCategory | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (p: Photo) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    alt_text: "",
    category_id: "" as string,
    is_featured: false,
    is_published: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (photo) {
      setForm({
        title: photo.title ?? "",
        description: photo.description ?? "",
        alt_text: photo.alt_text ?? "",
        category_id: photo.category_id ?? "",
        is_featured: photo.is_featured,
        is_published: photo.is_published,
      });
    }
  }, [photo]);

  async function save() {
    if (!photo) return;
    setSaving(true);
    try {
      const updated = await apiFetch<Photo>(`/api/photos/${photo.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title.trim() || undefined,
          description: form.description.trim() || undefined,
          alt_text: form.alt_text.trim() || undefined,
          category_id: form.category_id || null,
          is_featured: form.is_featured,
          is_published: form.is_published,
        }),
      });
      onSaved(updated);
      toast.success("Photo updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!photo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit photo</DialogTitle>
        </DialogHeader>
        {photo && (
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              <Image src={photo.image_url} alt="" fill sizes="500px" className="object-contain" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-title">Title</Label>
              <Input
                id="p-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-alt">Alt text (accessibility)</Label>
              <Input
                id="p-alt"
                value={form.alt_text}
                onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                placeholder="Describe the image for screen readers"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category_id || "none"}
                onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Uncategorised" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label>Featured</Label>
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label>Published</Label>
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

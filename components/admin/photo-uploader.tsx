"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Category, Photo } from "@/types/database";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { apiFetch } from "@/lib/fetcher";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

type Status = "pending" | "uploading" | "done" | "error";
interface Item {
  id: string;
  file: File;
  preview: string;
  title: string;
  status: Status;
  error?: string;
}

function getDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function deriveTitle(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .slice(0, 120);
}

export function PhotoUploader({
  open,
  onOpenChange,
  categories,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUploaded: (photos: Photo[]) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files);
    const valid: Item[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type as never)) {
        toast.error(`${file.name}: unsupported type`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        toast.error(`${file.name}: too large (max 10MB)`);
        continue;
      }
      valid.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        title: deriveTitle(file.name),
        status: "pending",
      });
    }
    setItems((prev) => [...prev, ...valid]);
  }, []);

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function reset() {
    items.forEach((i) => URL.revokeObjectURL(i.preview));
    setItems([]);
    setFeatured(false);
    setPublished(true);
  }

  async function startUpload() {
    if (items.length === 0) return;
    setBusy(true);
    const created: Photo[] = [];

    for (const item of items) {
      if (item.status === "done") continue;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)),
      );
      try {
        const dims = await getDimensions(item.file);
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("bucket", "portfolio");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const up = await res.json();
        if (!res.ok) throw new Error(up.error || "Upload failed");

        const photo = await apiFetch<Photo>("/api/photos", {
          method: "POST",
          body: JSON.stringify({
            image_url: up.data.url,
            thumbnail_url: up.data.url,
            storage_path: up.data.path,
            file_size: up.data.size,
            width: dims.width || null,
            height: dims.height || null,
            title: item.title || null,
            alt_text: item.title || null,
            category_id: categoryId || null,
            is_featured: featured,
            is_published: published,
          }),
        });
        created.push(photo);
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)),
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: e instanceof Error ? e.message : "Failed" }
              : i,
          ),
        );
      }
    }

    setBusy(false);
    if (created.length) {
      onUploaded(created);
      toast.success(`${created.length} photo(s) uploaded.`);
      if (created.length === items.length) {
        reset();
        onOpenChange(false);
      }
    }
  }

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload photos</DialogTitle>
        </DialogHeader>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30 hover:border-primary/50",
          )}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            Drag &amp; drop images here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP · up to 10MB each · select multiple
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Shared metadata */}
        {items.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Category (applied to all)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Uncategorised" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3">
                <Label className="cursor-pointer">Featured</Label>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3">
                <Label className="cursor-pointer">Published</Label>
                <Switch checked={published} onCheckedChange={setPublished} />
              </div>
            </div>

            {/* Previews with per-file title */}
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={item.preview} alt="" fill sizes="48px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, title: e.target.value } : i,
                          ),
                        )
                      }
                      className="h-8"
                      placeholder="Title (optional)"
                      disabled={busy}
                    />
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.file.name} · {formatBytes(item.file.size)}
                    </p>
                  </div>
                  {item.status === "uploading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                  {item.status === "done" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {item.status === "error" && (
                    <span title={item.error}>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </span>
                  )}
                  {item.status === "pending" && !busy && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button onClick={startUpload} loading={busy} disabled={items.length === 0}>
            {busy
              ? `Uploading… (${doneCount}/${items.length})`
              : `Upload ${items.length || ""} photo${items.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "@/types/database";

interface LightboxProps {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null;
  const touchStartX = useRef<number | null>(null);

  const goNext = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  // Lock body scroll without a layout jump (compensate scrollbar width).
  useEffect(() => {
    if (!open) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open]);

  if (index === null) return null;
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={photo.title || "Photo viewer"}
      onClick={onClose}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 50) (delta < 0 ? goNext : goPrev)();
        touchStartX.current = null;
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 text-white/90">
        <span className="text-sm tabular-nums">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-full p-2 hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Image */}
      <div className="relative flex flex-1 items-center justify-center px-2 pb-2">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 md:left-6"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
        )}

        {/* Full-resolution view; arbitrary aspect ratio, so a plain img is used. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photo.alt_text || photo.title || "Photograph"}
          className="max-h-full max-w-full select-none object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />

        {photos.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 md:right-6"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        )}
      </div>

      {/* Caption */}
      {(photo.title || photo.description) && (
        <div
          className="px-6 pb-6 pt-2 text-center text-white/90"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.title && <p className="font-serif text-lg">{photo.title}</p>}
          {photo.description && (
            <p className="mx-auto mt-1 max-w-xl text-sm text-white/60">
              {photo.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

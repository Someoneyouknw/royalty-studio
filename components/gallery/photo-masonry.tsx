"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Photo } from "@/types/database";
import { Lightbox } from "@/components/gallery/lightbox";

export function PhotoMasonry({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {photos.map((photo, i) => (
          <motion.button
            key={photo.id}
            type="button"
            onClick={() => setIndex(i)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.05 }}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`View ${photo.title || "photograph"}`}
          >
            <Image
              src={photo.image_url}
              alt={photo.alt_text || photo.title || "Photograph"}
              width={photo.width || 1200}
              height={photo.height || 800}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {photo.title && (
              <span className="pointer-events-none absolute bottom-3 left-3 right-3 translate-y-2 text-left font-serif text-sm text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {photo.title}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <Lightbox photos={photos} index={index} onClose={() => setIndex(null)} onIndexChange={setIndex} />
    </>
  );
}

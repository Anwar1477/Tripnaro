"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  if (!images.length) return null;
  const shown = images.slice(0, 5);

  return (
    <>
      <div className={cn("grid h-[17rem] gap-2 overflow-hidden rounded-(--radius-card) sm:h-[24rem]", shown.length > 1 ? "grid-cols-4 grid-rows-2" : "grid-cols-1")}>
        {shown.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setIndex(i)}
            className={cn("group relative overflow-hidden bg-ink-100", i === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:block", shown.length === 2 && i === 1 && "sm:col-span-2 sm:row-span-2", shown.length === 3 && i > 0 && "sm:col-span-2")}
            aria-label={`Open photo ${i + 1} of ${images.length}`}
          >
            <Image src={src} alt={i === 0 ? alt : ""} fill priority={i === 0} sizes={i === 0 ? "(max-width: 640px) 100vw, 50vw" : "25vw"} className="object-cover transition duration-500 group-hover:scale-105" />
            {i === shown.length - 1 && images.length > 1 && (
              <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-800 shadow">
                <Images className="size-4" /> {images.length} photos
              </span>
            )}
          </button>
        ))}
      </div>
      {index !== null && (
        <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[90] flex items-center justify-center bg-ink-900/95 p-4">
          <button type="button" onClick={close} className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close">
            <X className="size-5" />
          </button>
          <button type="button" onClick={() => step(-1)} className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo">
            <ChevronLeft className="size-6" />
          </button>
          <div className="relative h-[75vh] w-full max-w-5xl">
            <Image src={images[index]} alt={`${alt} photo ${index + 1}`} fill sizes="90vw" className="object-contain" />
          </div>
          <button type="button" onClick={() => step(1)} className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo">
            <ChevronRight className="size-6" />
          </button>
          <p className="absolute bottom-5 text-sm text-white/80">
            {index + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}

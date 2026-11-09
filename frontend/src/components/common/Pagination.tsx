"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalPages, onChange, className }: { page: number; totalPages: number; onChange: (page: number) => void; className?: string }) {
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  const btn = "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition";
  return (
    <nav aria-label="Pagination" className={cn("mt-8 flex items-center justify-center gap-1.5", className)}>
      <button type="button" className={cn(btn, "border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-40")} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-400">
            …
          </span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(btn, p === page ? "bg-brand-600 text-white" : "border border-ink-200 bg-white text-ink-700 hover:bg-ink-50")}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" className={cn(btn, "border border-ink-200 bg-white hover:bg-ink-50 disabled:opacity-40")} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

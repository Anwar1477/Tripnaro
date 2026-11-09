"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Lightweight popover: click-outside and Escape close it. */
export function Popover({
  trigger,
  children,
  className,
  panelClassName,
  align = "left",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  panelClassName?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-fade-up rounded-xl border border-ink-100 bg-white p-4 shadow-(--shadow-lift)",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** The labelled "box" used by every search form field. */
export function SearchBox({ label, icon, children, className }: { label: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("group relative rounded-xl border border-ink-200 bg-white px-3.5 pt-2 pb-2 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100 hover:border-ink-300", className)}>
      <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-ink-500 uppercase">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

export const searchInputClass = "mt-0.5 w-full min-w-0 bg-transparent text-[15px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-400 focus:outline-none";

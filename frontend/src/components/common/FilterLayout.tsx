"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { SelectFrame, selectClass } from "./FormControls";

/** Sidebar filters on desktop, slide-over sheet on mobile/tablet. */
export function FilterLayout({
  filters,
  children,
  activeCount = 0,
  onReset,
}: {
  filters: ReactNode;
  children: ReactNode;
  activeCount?: number;
  onReset?: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Filters</h2>
            {onReset && activeCount > 0 && (
              <button
                type="button"
                onClick={onReset}
                className="text-brand-700 text-sm font-semibold hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          {filters}
        </div>
      </aside>
      <div className="min-w-0">
        <Button variant="outline" className="mb-4 w-full lg:hidden" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="size-4" /> Filters{" "}
          {activeCount > 0 && (
            <span className="bg-brand-600 rounded-full px-2 text-xs text-white">{activeCount}</span>
          )}
        </Button>
        {children}
      </div>
      <div
        className={cn("fixed inset-0 z-[60] lg:hidden", open ? "visible" : "invisible")}
        aria-hidden={!open}
      >
        <div
          className={cn(
            "bg-ink-900/50 absolute inset-0 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(22rem,100%)] flex-col bg-white shadow-xl transition-transform",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="border-ink-100 flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-base font-bold">Filters</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
              className="hover:bg-ink-100 grid size-8 place-items-center rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{filters}</div>
          <div className="border-ink-100 flex gap-3 border-t p-4">
            {onReset && (
              <Button variant="outline" className="flex-1" onClick={onReset}>
                Reset
              </Button>
            )}
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-ink-100 border-b py-4 first:pt-0 last:border-0">
      <legend className="text-ink-900 mb-3 text-sm font-bold">{title}</legend>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

export function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="text-ink-600 flex items-center gap-2 text-sm">
      <span className="hidden whitespace-nowrap sm:inline">Sort by</span>
      <SelectFrame iconClassName="right-3">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("field h-10 w-auto py-0 pr-9 text-sm font-semibold", selectClass)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </SelectFrame>
    </label>
  );
}

"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Toolbar (search + select filters) shared by admin list pages. */
export function AdminToolbar({ q, onQ, filters = [], children }: { q: string; onQ: (v: string) => void; filters?: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }[]; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <label className="relative min-w-0 flex-1 sm:max-w-xs">
        <span className="sr-only">Search</span>
        <Search className="absolute top-3 left-3 size-4 text-ink-400" />
        <input className="field h-10 pl-9" placeholder="Search…" value={q} onChange={(e) => onQ(e.target.value)} />
      </label>
      {filters.map((f) => (
        <select key={f.label} aria-label={f.label} className="field h-10 w-auto" value={f.value} onChange={(e) => f.onChange(e.target.value)}>
          <option value="">{f.label}: all</option>
          {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {children}
    </div>
  );
}

export function Table({ head, children, minWidth = "48rem" }: { head: string[]; children: ReactNode; minWidth?: string }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-ink-100 bg-sand-50 text-xs text-ink-500 uppercase">
          <tr>{head.map((h, i) => <th key={h + i} className={cn("px-4 py-3 font-semibold", i === head.length - 1 && "text-right")}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export const opts = (...v: string[]) => v.map((x) => ({ value: x, label: x.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));

import type { ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { cn, titleCase } from "@/lib/utils";

const tones = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
  coral: "bg-coral-50 text-coral-700 ring-1 ring-coral-100",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  danger: "bg-red-50 text-red-700 ring-1 ring-red-100",
  dark: "bg-ink-900/80 text-white backdrop-blur",
};

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  confirmed: "success",
  completed: "brand",
  cancelled: "danger",
  unpaid: "warning",
  paid: "success",
  failed: "danger",
  refund_pending: "warning",
  refunded: "neutral",
  initiated: "warning",
  success: "success",
  submitted: "brand",
  under_review: "warning",
  documents_required: "coral",
  processing: "warning",
  approved: "success",
  rejected: "danger",
  requested: "warning",
  new: "brand",
  contacted: "success",
  closed: "neutral",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? "neutral"} className={className}>
      {titleCase(status)}
    </Badge>
  );
}

/** Marks sample inventory / simulated payments so nothing is mistaken for live availability. */
export function DemoBadge({ label = "Demo inventory", className }: { label?: string; className?: string }) {
  return (
    <Badge tone="warning" className={className}>
      <FlaskConical className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

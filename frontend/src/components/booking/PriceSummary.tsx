import { cn, formatPrice } from "@/lib/utils";
import type { Pricing } from "@/types";

/** Server-calculated price breakdown. The browser never computes the payable total itself. */
export function PriceSummary({ pricing, className, title = "Price details" }: { pricing: Pricing; className?: string; title?: string }) {
  return (
    <div className={cn("space-y-2 text-sm", className)}>
      <p className="font-bold text-ink-900">{title}</p>
      {pricing.breakdown.map((line, i) => (
        <div key={line.label + i} className={cn("flex justify-between gap-3", line.amount < 0 ? "text-emerald-700" : "text-ink-600")}>
          <span className="min-w-0">{line.label}</span>
          <span className="shrink-0 tabular-nums">{line.amount < 0 ? `− ${formatPrice(-line.amount)}` : formatPrice(line.amount)}</span>
        </div>
      ))}
      <div className="flex items-baseline justify-between border-t border-dashed border-ink-200 pt-3">
        <span className="font-bold text-ink-900">Total payable</span>
        <span className="text-xl font-bold text-ink-900 tabular-nums">{formatPrice(pricing.total)}</span>
      </div>
      <p className="text-xs text-ink-500">Includes taxes and fees. Final amount is confirmed by our servers.</p>
    </div>
  );
}

import { Tag } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { AppliedCoupon, Pricing } from "@/types";
import { Badge } from "../common/Badge";

/** "20% OFF" / "৳500 OFF" from a server-confirmed coupon, or null when the terms are unknown (old bookings). */
export function couponBadgeLabel(coupon: Pick<AppliedCoupon, "discountType" | "value">): string | null {
  if (!coupon.value || !coupon.discountType) return null;
  return coupon.discountType === "percent" ? `${coupon.value}% OFF` : `${formatPrice(coupon.value)} OFF`;
}

/** The discount badge. Render it only for a coupon the server has applied (quote or stored booking). */
export function DiscountBadge({ coupon, className }: { coupon: Pick<AppliedCoupon, "discountType" | "value">; className?: string }) {
  const label = couponBadgeLabel(coupon);
  return label ? (
    <Badge tone="success" className={cn("tracking-wide", className)}>
      {label}
    </Badge>
  ) : null;
}

const isCouponLine = (label: string) => label.startsWith("Coupon ");

/**
 * Server-calculated price breakdown. The browser never computes the payable total itself.
 *
 * Discount rows and badges appear only when the server has applied a coupon (`pricing.discount > 0`).
 * With no coupon there is no discount row, no badge and no placeholder space.
 */
export function PriceSummary({ pricing, coupon, className, title = "Price details" }: { pricing: Pricing; coupon?: AppliedCoupon | null; className?: string; title?: string }) {
  const discounted = pricing.discount > 0;
  const lines = pricing.breakdown.filter((l) => !(discounted && isCouponLine(l.label)) && !(isCouponLine(l.label) && l.amount === 0));
  const code = coupon?.code ?? pricing.breakdown.find((l) => isCouponLine(l.label))?.label.slice(7);

  return (
    <div className={cn("space-y-2 text-sm", className)}>
      <p className="font-bold text-ink-900">{title}</p>
      {lines.map((line, i) => (
        <div key={line.label + i} className={cn("flex justify-between gap-3", line.amount < 0 ? "text-emerald-700" : "text-ink-600")}>
          <span className="min-w-0">{line.label}</span>
          <span className="shrink-0 tabular-nums">{line.amount < 0 ? `− ${formatPrice(-line.amount)}` : formatPrice(line.amount)}</span>
        </div>
      ))}
      {discounted && (
        <div className="flex items-center justify-between gap-3 text-emerald-700" data-testid="coupon-discount-row">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Tag className="size-3.5 shrink-0" aria-hidden />
            <span className="font-semibold">Coupon{code ? ` ${code}` : ""}</span>
            {coupon && <DiscountBadge coupon={coupon} />}
          </span>
          <span className="shrink-0 font-semibold tabular-nums">− {formatPrice(pricing.discount)}</span>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-ink-200 pt-3">
        <span className="font-bold text-ink-900">Total payable</span>
        <span className="flex items-baseline gap-2">
          {discounted && (
            <span className="text-sm text-ink-400 tabular-nums line-through">
              <span className="sr-only">Original price </span>
              {formatPrice(pricing.total + pricing.discount)}
            </span>
          )}
          <span className="text-xl font-bold text-ink-900 tabular-nums">{formatPrice(pricing.total)}</span>
        </span>
      </div>
      <p className="text-xs text-ink-500">Includes taxes and fees. Final amount is confirmed by our servers.</p>
    </div>
  );
}

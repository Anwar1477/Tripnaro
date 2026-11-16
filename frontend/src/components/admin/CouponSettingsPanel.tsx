"use client";

import { useState } from "react";
import { BadgePercent, Power } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage, get, send } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { CouponStats } from "@/types";
import { Badge } from "../common/Badge";
import { ErrorState, Skeleton } from "../common/Feedback";

/**
 * Global coupon switch and usage statistics, shown above the coupon table (Admin → Coupons).
 * Turning coupons off hides every coupon UI on the site and makes the API reject coupons on
 * quotes, new bookings and payment of existing bookings.
 */
export function CouponSettingsPanel() {
  const stats = useAsync(() => get<CouponStats>("/admin/coupon-stats"), []);
  const [saving, setSaving] = useState(false);

  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.reload} className="mb-5" />;
  if (!stats.data) return <Skeleton className="mb-5 h-40" />;
  const { enabled, totals, byCode } = stats.data;

  async function toggle() {
    setSaving(true);
    try {
      // Dotted path: updates only this flag, leaving the other feature switches untouched.
      await send("put", "/admin/settings", { "features.coupons": !enabled });
      toast.success(enabled ? "Coupons turned off across the site" : "Coupons turned on");
      stats.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const tiles = [
    { label: "Coupons", value: totals.coupons.toLocaleString() },
    { label: "Live now", value: totals.live.toLocaleString() },
    { label: "Redemptions (paid)", value: totals.redeemed.toLocaleString() },
    { label: "On hold", value: totals.onHold.toLocaleString() },
    { label: "Discount given", value: formatPrice(totals.discountGiven) },
  ];

  return (
    <section className="mb-5 space-y-4" aria-label="Coupon system">
      <div className={cn("card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between", !enabled && "border-amber-200 bg-amber-50/60")}>
        <div className="flex items-start gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", enabled ? "bg-emerald-50 text-emerald-600" : "bg-amber-100 text-amber-700")}>
            <BadgePercent className="size-5" aria-hidden />
          </span>
          <div>
            <p className="flex items-center gap-2 font-bold text-ink-900">
              Coupon system <Badge tone={enabled ? "success" : "warning"}>{enabled ? "On" : "Off"}</Badge>
            </p>
            <p className="mt-0.5 text-sm text-ink-600">
              {enabled
                ? "Customers can apply active coupons at booking. Discounts are re-checked when payment starts."
                : "Coupon fields and offers are hidden, and the API rejects every coupon, including on unpaid bookings."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Coupon system"
          onClick={toggle}
          disabled={saving}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-(--radius-field) px-4 text-sm font-semibold transition disabled:opacity-55",
            enabled ? "border border-ink-200 bg-surface text-ink-800 hover:bg-ink-50" : "bg-brand-600 text-white hover:bg-brand-700",
          )}
        >
          <Power className="size-4" aria-hidden /> {enabled ? "Turn off coupons" : "Turn on coupons"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs font-semibold text-ink-500">{t.label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900 tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>

      {byCode.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="px-4 pt-4 text-left font-bold text-ink-900">Top coupons by redemptions</caption>
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-500">
                <th scope="col" className="px-4 py-2.5 font-semibold">Code</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Paid</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">On hold</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Discount given</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byCode.slice(0, 10).map((r) => (
                <tr key={r.code} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-2.5 font-mono font-semibold">{r.code}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.redeemed}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.onHold}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(r.discountGiven)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

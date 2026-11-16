"use client";

import { useId, useState } from "react";
import { BadgeCheck, Info, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AppliedCoupon } from "@/types";
import { Button } from "../common/Button";
import { DiscountBadge } from "./PriceSummary";

const CHANNELS: Record<string, string> = { bkash: "bKash", nagad: "Nagad", sslcommerz: "card / SSLCommerz", stripe: "international card" };

/**
 * Coupon entry for the booking summary.
 *
 * - `applied` must come from the server (quote or booking). Only then are the code, the "20% OFF"
 *   badge and the saving shown; typed text alone never shows a discount.
 * - While `pending`, Apply shows a spinner and further submits are ignored.
 * - The parent hides this component entirely when the admin has switched coupons off.
 */
export function CouponBox({
  applied,
  pending,
  error,
  onApply,
  onRemove,
  removing,
}: {
  applied: AppliedCoupon | null;
  pending: boolean;
  error: string | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  removing?: boolean;
}) {
  const [input, setInput] = useState("");
  const inputId = useId();
  const errorId = useId();

  if (applied) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-900" role="status">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="font-mono">{applied.code}</span> applied
              <DiscountBadge coupon={applied} />
            </p>
            <p className="mt-1 text-[13px] text-emerald-800">You save {formatPrice(applied.discount)} on this booking.</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            aria-label={`Remove coupon ${applied.code}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <X className="size-3.5" aria-hidden /> Remove
          </button>
        </div>
        {applied.capped && applied.maxDiscount ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-emerald-800">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden /> Maximum discount for this coupon ({formatPrice(applied.maxDiscount)}) reached.
          </p>
        ) : null}
        {applied.paymentChannel && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-emerald-800">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden /> Valid only when you pay with {CHANNELS[applied.paymentChannel] ?? applied.paymentChannel}.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const code = input.trim().toUpperCase();
        if (!code || pending) return;
        onApply(code);
      }}
    >
      <label htmlFor={inputId} className="label">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\s+/g, ""))}
          placeholder="Enter code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`field h-10 min-w-0 uppercase placeholder:normal-case ${error ? "field-error" : ""}`}
        />
        <Button type="submit" variant="secondary" size="sm" className="h-10 px-4" loading={pending} disabled={!input.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-[13px] text-coral-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

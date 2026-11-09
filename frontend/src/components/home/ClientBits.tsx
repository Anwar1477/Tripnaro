"use client";

import { useState } from "react";
import { Check, Copy, Mail, TicketPercent } from "lucide-react";
import { errorMessage } from "@/lib/api";
import { cn, formatDate, formatPrice, titleCase } from "@/lib/utils";
import { catalogService } from "@/services";
import { toast } from "@/store/toast";
import type { Coupon } from "@/types";
import { Button } from "../common/Button";

export function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative flex w-[19rem] shrink-0 snap-start flex-col rounded-(--radius-card) border border-dashed border-brand-300 bg-white p-5 shadow-(--shadow-card)">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
          <TicketPercent className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-bold leading-snug">{coupon.title}</p>
          <p className="mt-1 line-clamp-2 text-[13px] text-ink-500">{coupon.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {coupon.appliesTo.map((a) => (
          <span key={a} className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
            {titleCase(a)}
          </span>
        ))}
        {coupon.minAmount > 0 && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">Min {formatPrice(coupon.minAmount)}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <span className="text-xs text-ink-500">Valid till {formatDate(coupon.validTo, { year: undefined })}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(coupon.code);
              setCopied(true);
              toast.success(`Code ${coupon.code} copied`);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              toast.info(`Your code: ${coupon.code}`);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 font-mono text-sm font-bold text-brand-700 transition hover:bg-brand-100"
          aria-label={`Copy coupon code ${coupon.code}`}
        >
          {coupon.code}
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    setError(null);
    setLoading(true);
    try {
      const { message } = await catalogService.subscribe(email);
      toast.success(message);
      setEmail("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className={cn("w-full max-w-md", className)} aria-label="Newsletter signup">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input id="newsletter-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={cn("field h-12 pl-10", error && "field-error")} aria-invalid={!!error} />
        </div>
        <Button type="submit" variant="accent" size="lg" loading={loading} className="h-12">
          Subscribe
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-coral-200">
          {error}
        </p>
      )}
    </form>
  );
}

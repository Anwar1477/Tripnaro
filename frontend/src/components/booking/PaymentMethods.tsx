"use client";

import { useState } from "react";
import { CreditCard, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { paymentService } from "@/services";
import type { PaymentMethod } from "@/types";
import { Button } from "../common/Button";
import { Alert, Skeleton } from "../common/Feedback";
import { DemoBadge } from "../common/Badge";

const ICONS: Record<PaymentMethod["provider"], typeof CreditCard> = { demo: ShieldCheck, sslcommerz: CreditCard, bkash: Smartphone, nagad: Wallet, stripe: CreditCard };
const HINTS: Record<PaymentMethod["provider"], string> = {
  demo: "Simulated gateway for testing. No money moves.",
  sslcommerz: "Visa, Mastercard, Amex, DBBL Nexus & internet banking",
  bkash: "Pay from your bKash wallet",
  nagad: "Pay from your Nagad wallet",
  stripe: "International credit & debit cards",
};

/** Lists configured payment providers and starts a server-side payment session. */
export function PaymentMethods({ amount, bookingId, visaApplicationId }: { amount: number; bookingId?: string; visaApplicationId?: string }) {
  const methods = useAsync(() => paymentService.methods(), []);
  const [selected, setSelected] = useState<PaymentMethod["provider"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = methods.data ?? [];
  const current = selected ?? list.find((m) => m.available)?.provider ?? null;
  const anyLive = list.some((m) => m.available && !m.isDemo);

  async function pay() {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      const { redirectUrl } = await paymentService.initiate({ bookingId, visaApplicationId, provider: current });
      window.location.assign(redirectUrl);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="pay-h">
      <h2 id="pay-h" className="text-lg font-bold">Choose a payment method</h2>
      {methods.loading ? (
        <div className="mt-4 space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : methods.error ? (
        <Alert tone="error" className="mt-4">{methods.error}</Alert>
      ) : (
        <>
          {!anyLive && (
            <Alert tone="warning" title="Live payment gateways are not configured" className="mt-4">
              This environment has no SSLCommerz, bKash, Nagad or Stripe credentials, so those methods are disabled. Use the clearly marked demo gateway to test the flow. No real payment will be taken.
            </Alert>
          )}
          <div role="radiogroup" aria-label="Payment method" className="mt-4 grid gap-3 sm:grid-cols-2">
            {list.map((m) => {
              const Icon = ICONS[m.provider];
              const active = current === m.provider;
              return (
                <button
                  key={m.provider}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!m.available}
                  onClick={() => setSelected(m.provider)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition",
                    active ? "border-brand-600 bg-brand-50" : "border-ink-100 hover:border-ink-200",
                    !m.available && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", active ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-600")}>
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-ink-900">
                      {m.label} {m.isDemo && <DemoBadge label="Demo" />}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-500">{m.available ? HINTS[m.provider] : "Not configured on this server"}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {error && <Alert tone="error" className="mt-4">{error}</Alert>}
          <Button variant="accent" size="lg" className="mt-5 w-full sm:w-auto" onClick={pay} loading={busy} disabled={!current}>
            <Lock className="size-4" /> Pay {formatPrice(amount)}
          </Button>
          <p className="mt-3 text-xs text-ink-500">You&apos;ll be redirected to the payment provider. Your booking is confirmed only after our server verifies the payment with the provider.</p>
        </>
      )}
    </section>
  );
}

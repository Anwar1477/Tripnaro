"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import { DemoBadge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { ErrorState, PageLoader } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useRequireAuth } from "@/hooks/useAuth";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { paymentService } from "@/services";

/** Shows the payment outcome as recorded by the backend. Query-string flags are never trusted. */
export function PaymentResult() {
  const tx = useSearchParams().get("tx") ?? "";
  const { allowed } = useRequireAuth();
  const { data: p, loading, error, reload } = useAsync(() => paymentService.status(tx), [tx], { enabled: allowed && !!tx });

  if (!tx) return <ErrorState message="Missing transaction reference." />;
  if (!allowed || loading) return <PageLoader label="Verifying payment…" />;
  if (error || !p) return <ErrorState message={error ?? "Payment not found"} onRetry={reload} />;

  const ok = p.status === "success";
  const pending = p.status === "initiated";
  const Icon = ok ? CheckCircle2 : pending ? CircleAlert : XCircle;
  const subject = p.booking ?? p.visaApplication;
  const detailHref = p.booking ? `/my-account/bookings/${p.booking._id}` : p.visaApplication ? `/my-account/visa/${p.visaApplication._id}` : "/my-account";

  return (
    <div className="card p-6 text-center sm:p-10">
      <Icon className={`mx-auto size-16 ${ok ? "text-emerald-600" : pending ? "text-amber-500" : "text-coral-600"}`} />
      <h1 className="mt-4 font-display text-3xl font-semibold">{ok ? (p.booking ? "Booking confirmed!" : "Payment received") : pending ? "Payment pending" : p.status === "cancelled" ? "Payment cancelled" : "Payment failed"}</h1>
      {p.isDemo && <DemoBadge label="Demo payment: no real money was charged" className="mt-3" />}
      <p className="mx-auto mt-3 max-w-md text-ink-600">
        {ok
          ? p.booking
            ? "We've emailed your confirmation and e-ticket. You can also download it from your account."
            : "Your visa application fee is recorded. Our team will review your application."
          : pending
            ? "We're waiting for confirmation from the payment provider. Refresh in a moment."
            : (p.failureReason ?? "Your payment did not go through. No booking was confirmed; you can try again.")}
      </p>
      <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 rounded-xl bg-sand-50 p-4 text-left text-sm">
        <dt className="text-ink-500">Reference</dt>
        <dd className="text-right font-mono font-semibold">{subject?.reference}</dd>
        <dt className="text-ink-500">Amount</dt>
        <dd className="text-right font-semibold">{formatPrice(p.amount)}</dd>
        <dt className="text-ink-500">Method</dt>
        <dd className="text-right font-semibold">{p.method}</dd>
        <dt className="text-ink-500">Transaction</dt>
        <dd className="truncate text-right font-mono text-xs">{p.transactionId}</dd>
        {p.verifiedAt && (
          <>
            <dt className="text-ink-500">Verified</dt>
            <dd className="text-right">{formatDateTime(p.verifiedAt)}</dd>
          </>
        )}
      </dl>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {pending && <LinkButton href={`/payment/result?tx=${tx}`} variant="outline" onClick={() => reload()}>Refresh status</LinkButton>}
        {!ok && !pending && p.booking && <LinkButton href={`/checkout/${p.booking._id}`} variant="accent">Try again</LinkButton>}
        <LinkButton href={detailHref}>{ok ? "View details" : "Go to my account"}</LinkButton>
        <LinkButton href="/" variant="ghost">Back to home</LinkButton>
      </div>
    </div>
  );
}

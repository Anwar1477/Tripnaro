"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Alert, ErrorState, PageLoader } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useRequireAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { paymentService } from "@/services";

/**
 * Stand-in for an external hosted payment page. The decision is signed by the server and sent
 * through the same callback route a real provider would use. Nothing here charges money.
 */
export function DemoGateway() {
  const tx = useSearchParams().get("tx") ?? "";
  const { allowed } = useRequireAuth();
  const info = useAsync(() => paymentService.demoInfo(tx), [tx], { enabled: allowed && !!tx });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(outcome: "success" | "failed" | "cancelled") {
    setBusy(outcome);
    setError(null);
    try {
      const { callbackUrl } = await paymentService.demoDecide(tx, outcome);
      window.location.assign(callbackUrl);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(null);
    }
  }

  if (!allowed || info.loading) return <PageLoader />;
  if (info.error || !info.data) return <ErrorState message={info.error ?? "Payment not found"} />;
  const d = info.data;
  const subject = d.booking ? `${d.booking.title} (${d.booking.reference})` : d.visaApplication ? `${d.visaApplication.countryName} ${d.visaApplication.visaType} visa (${d.visaApplication.reference})` : "";

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 bg-amber-100 px-5 py-3 text-amber-900">
        <FlaskConical className="size-5 shrink-0" />
        <p className="text-sm font-bold">DEMO PAYMENT GATEWAY: no real money is charged</p>
      </div>
      <div className="space-y-4 p-6">
        <div>
          <p className="text-sm text-ink-500">Paying for</p>
          <p className="font-semibold">{subject}</p>
        </div>
        <div>
          <p className="text-sm text-ink-500">Amount</p>
          <p className="text-3xl font-bold">{formatPrice(d.amount)}</p>
          <p className="mt-1 font-mono text-xs text-ink-400">Transaction {d.transactionId}</p>
        </div>
        {d.status !== "initiated" ? (
          <Alert tone="info">This payment has already been processed ({d.status}).</Alert>
        ) : (
          <>
            <p className="text-sm text-ink-600">Choose the outcome to simulate. The result is verified by the Tripnaro server through the payment callback, just like a real provider.</p>
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid gap-2 sm:grid-cols-3">
              <Button onClick={() => decide("success")} loading={busy === "success"} disabled={!!busy}>Simulate success</Button>
              <Button variant="outline" onClick={() => decide("failed")} loading={busy === "failed"} disabled={!!busy}>Simulate failure</Button>
              <Button variant="ghost" onClick={() => decide("cancelled")} loading={busy === "cancelled"} disabled={!!busy}>Cancel</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

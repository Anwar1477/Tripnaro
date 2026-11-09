"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Feedback";
import { Input } from "@/components/common/FormControls";
import { VisaTimeline } from "@/components/visa/VisaTimeline";
import { errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { visaService } from "@/services";
import type { VisaApplication } from "@/types";

export function VisaTracker() {
  const sp = useSearchParams();
  const [reference, setReference] = useState(sp.get("reference") ?? "");
  const [passport, setPassport] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<VisaApplication | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim() || !passport.trim()) return setError("Enter both the reference and passport number");
    setBusy(true);
    setError(null);
    try {
      setApp(await visaService.track(reference.trim().toUpperCase(), passport.trim().toUpperCase()));
    } catch (err) {
      setApp(null);
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} noValidate className="card mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input label="Application reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TNV-…" autoComplete="off" />
        <Input label="Passport number" value={passport} onChange={(e) => setPassport(e.target.value)} autoComplete="off" />
        <Button type="submit" loading={busy}><Search className="size-4" /> Track</Button>
      </form>
      {error && <Alert tone="error" className="mt-4">{error}</Alert>}
      {app && (
        <section className="card mt-6 p-5 sm:p-6" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-ink-500">{app.reference}</p>
              <p className="text-lg font-bold">{app.countryName} · {app.visaType}</p>
              <p className="text-sm text-ink-600">Travel {formatDate(app.travelDate)}</p>
            </div>
            <div className="flex gap-2"><StatusBadge status={app.status} /><StatusBadge status={app.paymentStatus} /></div>
          </div>
          <VisaTimeline app={app} />
        </section>
      )}
    </>
  );
}

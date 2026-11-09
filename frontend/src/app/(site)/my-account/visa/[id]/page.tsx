"use client";

import { useParams } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { PaymentMethods } from "@/components/booking/PaymentMethods";
import { StatusBadge } from "@/components/common/Badge";
import { Alert, ErrorState, PageLoader } from "@/components/common/Feedback";
import { VisaTimeline } from "@/components/visa/VisaTimeline";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, formatPrice } from "@/lib/utils";
import { visaService } from "@/services";

export default function VisaApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: a, loading, error, reload } = useAsync(() => visaService.application(id), [id]);
  if (loading) return <PageLoader />;
  if (error || !a) return <ErrorState message={error ?? "Application not found"} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-ink-500">{a.reference}</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{a.countryName} · {a.visaType}</h1>
          <p className="text-sm text-ink-600">Travel {formatDate(a.travelDate)}{a.returnDate ? ` – ${formatDate(a.returnDate)}` : ""}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={a.status} /><StatusBadge status={a.paymentStatus} /></div>
      </div>
      {a.status === "documents_required" && <Alert tone="warning" title="More documents needed">{a.adminNotes ?? "Our visa team needs additional documents. Check your email for details."}</Alert>}
      {a.paymentStatus !== "paid" && a.status !== "rejected" && <PaymentMethods amount={a.fee} visaApplicationId={a._id} />}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-4 font-bold">Progress</h2><VisaTimeline app={a} /></section>
        <div className="space-y-5">
          <section className="card p-5 text-sm">
            <h2 className="font-bold">Applicant</h2>
            <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-1.5">
              <dt className="text-ink-500">Name</dt><dd>{a.applicant.firstName} {a.applicant.lastName}</dd>
              <dt className="text-ink-500">Passport</dt><dd>{a.applicant.passportNumber}</dd>
              <dt className="text-ink-500">Email</dt><dd className="break-all">{a.applicant.email}</dd>
              <dt className="text-ink-500">Phone</dt><dd>{a.applicant.phone}</dd>
              <dt className="text-ink-500">Fee</dt><dd className="font-bold">{formatPrice(a.fee)}</dd>
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="font-bold">Documents</h2>
            <ul className="mt-3 space-y-2">
              {a.documents.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2"><FileText className="size-4 shrink-0 text-brand-600" /><span className="truncate"><strong>{d.label}</strong> · {d.originalName}</span></span>
                  <a href={visaService.documentUrl(a._id, d._id)} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700 hover:underline"><Download className="size-4" />View</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

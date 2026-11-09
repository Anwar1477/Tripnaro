"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { DemoBadge, StatusBadge } from "@/components/common/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { formatDateTime, formatPrice } from "@/lib/utils";
import { accountService } from "@/services";

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => accountService.payments(page), [page]);
  return (
    <>
      <AccountHeading title="Payments" description="Every transaction, as verified by our payment servers." />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-48" /> : !data?.items.length ? (
        <EmptyState icon={CreditCard} title="No payments yet" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-ink-100 bg-sand-50 text-xs text-ink-500 uppercase">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">For</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      {p.booking ? <Link href={`/my-account/bookings/${p.booking._id}`} className="font-semibold text-brand-700 hover:underline">{p.booking.reference}</Link> : p.visaApplication ? <Link href={`/my-account/visa/${p.visaApplication._id}`} className="font-semibold text-brand-700 hover:underline">{p.visaApplication.reference}</Link> : "—"}
                      <span className="block font-mono text-xs text-ink-400">{p.transactionId}</span>
                    </td>
                    <td className="px-4 py-3"><span className="flex flex-wrap items-center gap-1.5">{p.method}{p.isDemo && <DemoBadge label="Demo" />}</span></td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}

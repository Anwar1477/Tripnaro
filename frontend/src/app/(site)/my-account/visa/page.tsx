"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { StatusBadge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, formatPrice } from "@/lib/utils";
import { visaService } from "@/services";

export default function MyVisaPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => visaService.mine(page), [page]);
  return (
    <>
      <AccountHeading title="Visa applications" action={<LinkButton href="/visa" size="sm">New application</LinkButton>} />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? <Skeleton className="h-40" /> : !data?.items.length ? (
        <EmptyState icon={FileText} title="No visa applications yet" description="Apply online and track every step here." action={<LinkButton href="/visa">Browse visas</LinkButton>} />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((a) => (
              <Link key={a._id} href={`/my-account/visa/${a._id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:shadow-(--shadow-lift)">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-500">{a.reference}</p>
                  <p className="font-bold">{a.countryName} · {a.visaType}</p>
                  <p className="text-sm text-ink-600">{a.applicant.firstName} {a.applicant.lastName} · Travel {formatDate(a.travelDate)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold">{formatPrice(a.fee)}</span>
                  <div className="flex gap-1"><StatusBadge status={a.status} /><StatusBadge status={a.paymentStatus} /></div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}

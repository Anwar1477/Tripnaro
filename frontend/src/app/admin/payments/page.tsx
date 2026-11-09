"use client";

import { useState } from "react";
import { AdminToolbar, opts, Table } from "@/components/admin/AdminTable";
import { DemoBadge, StatusBadge } from "@/components/common/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { getPaginated } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { Payment } from "@/types";

export default function AdminPaymentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const list = useAsync(() => getPaginated<Payment>("/admin/payments", { q: dq || undefined, status: status || undefined, provider: provider || undefined, page }), [dq, status, provider, page]);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold">Payments</h1>
      <p className="mb-5 text-sm text-ink-500">Statuses are set only by server-side verification with each provider. Demo transactions are marked and never move money.</p>
      <AdminToolbar
        q={q}
        onQ={(v) => { setQ(v); setPage(1); }}
        filters={[
          { label: "Status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: opts("initiated", "success", "failed", "cancelled", "refunded") },
          { label: "Provider", value: provider, onChange: (v) => { setProvider(v); setPage(1); }, options: opts("demo", "sslcommerz", "bkash", "nagad", "stripe") },
        ]}
      />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No payments" /> : (
        <>
          <Table head={["Transaction", "Customer", "For", "Provider", "Amount", "Status", "Created"]} minWidth="56rem">
            {list.data.items.map((p) => (
              <tr key={p._id}>
                <td className="px-4 py-2.5 font-mono text-xs">{p.transactionId}</td>
                <td className="px-4 py-2.5">{p.user?.name}<span className="block text-xs text-ink-500">{p.user?.email}</span></td>
                <td className="px-4 py-2.5">{p.booking?.reference ?? p.visaApplication?.reference ?? "—"}</td>
                <td className="px-4 py-2.5"><span className="flex flex-wrap items-center gap-1.5 capitalize">{p.provider}{p.isDemo && <DemoBadge label="Demo" />}</span></td>
                <td className="px-4 py-2.5 font-semibold">{formatPrice(p.amount)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={p.status} />{p.failureReason && <span className="block text-xs text-ink-500">{p.failureReason}</span>}</td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

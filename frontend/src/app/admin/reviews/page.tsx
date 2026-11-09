"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { AdminToolbar, opts } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorState, PageLoader, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage, getPaginated, send } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { Review } from "@/types";

function Reviews() {
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [page, setPage] = useState(1);
  const list = useAsync(() => getPaginated<Review>("/admin/reviews", { status: status || undefined, page }), [status, page]);

  async function act(r: Review, op: "approved" | "rejected" | "delete") {
    try {
      const res = op === "delete" ? await send<null>("delete", `/admin/reviews/${r._id}`) : await send<Review>("patch", `/admin/reviews/${r._id}`, { status: op });
      toast.success(res.message);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Reviews</h1>
      <AdminToolbar q="" onQ={() => {}} filters={[{ label: "Status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: opts("pending", "approved", "rejected") }]} />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No reviews here" /> : (
        <>
          <ul className="space-y-3">
            {list.data.items.map((r) => (
              <li key={r._id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm"><strong>{r.user?.name ?? "User"}</strong> on <span className="capitalize">{r.targetType}</span> <strong>{r.target?.name ?? r.target?.title}</strong></p>
                    <p className="text-xs text-ink-500">{formatDate(r.createdAt)} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm text-ink-700">{r.comment}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== "approved" && <Button size="sm" onClick={() => act(r, "approved")}><Check className="size-4" />Approve</Button>}
                  {r.status !== "rejected" && <Button size="sm" variant="outline" onClick={() => act(r, "rejected")}><X className="size-4" />Reject</Button>}
                  <Button size="sm" variant="ghost" className="text-coral-600" onClick={() => act(r, "delete")}><Trash2 className="size-4" />Delete</Button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

export default function AdminReviewsPage() {
  return <Suspense fallback={<PageLoader />}><Reviews /></Suspense>;
}

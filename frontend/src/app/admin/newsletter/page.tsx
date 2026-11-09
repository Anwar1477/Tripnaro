"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { AdminToolbar, Table } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/common/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { errorMessage, getPaginated, send } from "@/lib/api";
import { buttonClasses } from "@/components/common/Button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/store/toast";

interface Sub { _id: string; email: string; status: string; createdAt: string }

export default function AdminNewsletterPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const list = useAsync(() => getPaginated<Sub>("/admin/newsletter", { q: dq || undefined, page }), [dq, page]);

  async function remove(s: Sub) {
    try {
      const res = await send<null>("delete", `/admin/newsletter/${s._id}`);
      toast.success(res.message);
      list.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Newsletter subscribers</h1>
      <AdminToolbar q={q} onQ={(v) => { setQ(v); setPage(1); }}>
        <a href="/api/v1/admin/newsletter?format=csv" className={buttonClasses("outline", "sm", "h-10")}><Download className="size-4" />Export CSV</a>
      </AdminToolbar>
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No subscribers yet" /> : (
        <>
          <Table head={["Email", "Status", "Subscribed", ""]} minWidth="32rem">
            {list.data.items.map((s) => (
              <tr key={s._id}>
                <td className="px-4 py-2.5 font-medium">{s.email}</td>
                <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2.5">{formatDateTime(s.createdAt)}</td>
                <td className="px-4 py-2.5 text-right"><button type="button" onClick={() => remove(s)} className="grid size-8 place-items-center rounded-lg text-coral-600 hover:bg-coral-50" aria-label={`Remove ${s.email}`}><Trash2 className="size-4" /></button></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

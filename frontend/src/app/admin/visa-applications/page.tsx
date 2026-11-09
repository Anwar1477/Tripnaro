"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { AdminToolbar, opts, Table } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Alert, EmptyState, ErrorState, Skeleton } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { VisaTimeline } from "@/components/visa/VisaTimeline";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { errorMessage, getPaginated, send } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import { visaService } from "@/services";
import { toast } from "@/store/toast";
import type { VisaApplication, VisaStatus } from "@/types";

const STATUSES: VisaStatus[] = ["submitted", "under_review", "documents_required", "processing", "approved", "rejected"];

export default function AdminVisaPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const list = useAsync(() => getPaginated<VisaApplication>("/admin/visa-applications", { q: dq || undefined, status: status || undefined, page }), [dq, status, page]);
  const [sel, setSel] = useState<VisaApplication | null>(null);
  const [next, setNext] = useState<VisaStatus | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!sel || !next) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await send<VisaApplication>("patch", `/admin/visa-applications/${sel._id}`, { status: next, note: note || undefined });
      toast.success(res.message);
      setSel({ ...sel, ...res.data });
      setNext("");
      setNote("");
      list.reload();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Visa applications</h1>
      <AdminToolbar q={q} onQ={(v) => { setQ(v); setPage(1); }} filters={[{ label: "Status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: opts(...STATUSES) }]} />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No applications" /> : (
        <>
          <Table head={["Reference", "Applicant", "Visa", "Travel", "Fee", "Status", "Payment", ""]} minWidth="56rem">
            {list.data.items.map((a) => (
              <tr key={a._id}>
                <td className="px-4 py-2.5 font-mono text-xs font-bold">{a.reference}</td>
                <td className="px-4 py-2.5">{a.applicant.firstName} {a.applicant.lastName}<span className="block text-xs text-ink-500">{a.applicant.passportNumber}</span></td>
                <td className="px-4 py-2.5">{a.countryName} · {a.visaType}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(a.travelDate)}</td>
                <td className="px-4 py-2.5">{formatPrice(a.fee)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={a.paymentStatus} /></td>
                <td className="px-4 py-2.5 text-right"><Button size="sm" variant="outline" onClick={() => { setSel(a); setErr(null); setNext(""); }}>Review</Button></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.reference} · ${sel.countryName}` : ""} className="max-w-2xl">
        {sel && (
          <div className="space-y-5 text-sm">
            <dl className="grid grid-cols-[8rem_1fr] gap-y-1">
              <dt className="text-ink-500">Applicant</dt><dd>{sel.applicant.firstName} {sel.applicant.lastName}</dd>
              <dt className="text-ink-500">Passport</dt><dd>{sel.applicant.passportNumber}</dd>
              <dt className="text-ink-500">Contact</dt><dd className="break-all">{sel.applicant.email} · {sel.applicant.phone}</dd>
              <dt className="text-ink-500">Visa</dt><dd>{sel.visaType} · travel {formatDate(sel.travelDate)}</dd>
              <dt className="text-ink-500">Payment</dt><dd><StatusBadge status={sel.paymentStatus} /></dd>
            </dl>
            <div>
              <p className="font-bold">Documents</p>
              <ul className="mt-2 space-y-1">
                {sel.documents.map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-100 px-3 py-1.5">
                    <span className="truncate">{d.label}: {d.originalName}</span>
                    <a href={visaService.documentUrl(sel._id, d._id)} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-700"><Download className="size-4" />Open</a>
                  </li>
                ))}
              </ul>
            </div>
            <VisaTimeline app={sel} />
            <div className="rounded-xl border border-ink-100 p-4">
              <p className="font-bold">Update status</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <select aria-label="New status" className="field" value={next} onChange={(e) => setNext(e.target.value as VisaStatus)}>
                  <option value="">Choose…</option>
                  {STATUSES.filter((s) => s !== sel.status).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
                <input aria-label="Note to applicant" className="field" placeholder="Note to applicant (emailed)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={save} loading={busy} disabled={!next}>Save</Button>
              </div>
              {err && <Alert tone="error" className="mt-2">{err}</Alert>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

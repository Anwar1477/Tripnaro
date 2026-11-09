"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminToolbar, opts, Table } from "@/components/admin/AdminTable";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { StatusBadge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Alert, EmptyState, ErrorState, PageLoader, Skeleton } from "@/components/common/Feedback";
import { Modal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { errorMessage, getPaginated, send } from "@/lib/api";
import { formatDate, formatDateTime, formatPrice, titleCase } from "@/lib/utils";
import { toast } from "@/store/toast";
import type { Booking } from "@/types";

type AdminBooking = Booking & { user: { _id: string; name: string; email: string } };
const ACTIONS: { value: string; label: string; when: (b: AdminBooking) => boolean }[] = [
  { value: "confirm", label: "Confirm booking", when: (b) => b.status === "pending" },
  { value: "mark_paid", label: "Mark as paid (offline payment)", when: (b) => b.paymentStatus === "unpaid" || b.paymentStatus === "failed" },
  { value: "complete", label: "Mark completed", when: (b) => b.status === "confirmed" },
  { value: "cancel", label: "Cancel booking", when: (b) => b.status !== "cancelled" && b.status !== "completed" },
  { value: "approve_cancellation", label: "Approve cancellation request", when: (b) => b.cancellation?.status === "requested" },
  { value: "reject_cancellation", label: "Reject cancellation request", when: (b) => b.cancellation?.status === "requested" },
  { value: "process_refund", label: "Mark refund processed", when: (b) => b.paymentStatus === "refund_pending" },
];

function AdminBookings() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [cancellation, setCancellation] = useState(sp.get("cancellation") ?? "");
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 300);
  const list = useAsync(() => getPaginated<AdminBooking>("/admin/bookings", { q: dq || undefined, type: type || undefined, status: status || undefined, paymentStatus: paymentStatus || undefined, cancellation: cancellation || undefined, page, limit: 20 }), [dq, type, status, paymentStatus, cancellation, page]);
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function open(b: AdminBooking) {
    setSelected(b);
    setAction("");
    setNote("");
    setErr(null);
  }

  async function apply() {
    if (!selected || !action) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await send<AdminBooking>("patch", `/admin/bookings/${selected._id}`, { action, note: note || undefined });
      toast.success(res.message);
      setSelected({ ...selected, ...res.data, user: selected.user });
      setAction("");
      list.reload();
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-semibold">Bookings</h1>
      <AdminToolbar
        q={q}
        onQ={(v) => { setQ(v); setPage(1); }}
        filters={[
          { label: "Type", value: type, onChange: (v) => { setType(v); setPage(1); }, options: opts("flight", "hotel", "tour", "bus") },
          { label: "Status", value: status, onChange: (v) => { setStatus(v); setPage(1); }, options: opts("pending", "confirmed", "completed", "cancelled") },
          { label: "Payment", value: paymentStatus, onChange: (v) => { setPaymentStatus(v); setPage(1); }, options: opts("unpaid", "paid", "failed", "refund_pending", "refunded") },
          { label: "Cancellation", value: cancellation, onChange: (v) => { setCancellation(v); setPage(1); }, options: [{ value: "requested", label: "Requested" }] },
        ]}
      />
      {list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : list.loading && !list.data ? <Skeleton className="h-64" /> : !list.data?.items.length ? <EmptyState title="No bookings match" /> : (
        <>
          <Table head={["Reference", "Customer", "Item", "Date", "Total", "Status", "Payment", ""]} minWidth="60rem">
            {list.data.items.map((b) => (
              <tr key={b._id} className="hover:bg-sand-50/60">
                <td className="px-4 py-2.5"><span className="font-mono text-xs font-bold">{b.reference}</span><span className="block text-xs text-ink-500 capitalize">{b.type}</span></td>
                <td className="px-4 py-2.5">{b.user?.name}<span className="block text-xs text-ink-500">{b.user?.email}</span></td>
                <td className="max-w-56 truncate px-4 py-2.5">{b.title}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(b.startDate)}</td>
                <td className="px-4 py-2.5 font-semibold">{formatPrice(b.pricing.total)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={b.status} />{b.cancellation?.status === "requested" && <StatusBadge status="requested" className="ml-1" />}</td>
                <td className="px-4 py-2.5"><StatusBadge status={b.paymentStatus} /></td>
                <td className="px-4 py-2.5 text-right"><Button size="sm" variant="outline" onClick={() => open(b)}>Manage</Button></td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.meta.totalPages} onChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Booking ${selected.reference}` : ""} className="max-w-2xl">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2"><StatusBadge status={selected.status} /><StatusBadge status={selected.paymentStatus} />{selected.cancellation?.status && <StatusBadge status={`cancellation_${selected.cancellation.status}`} />}</div>
            <p className="font-bold">{selected.title}</p>
            <p className="text-ink-600">{selected.user?.name} · {selected.contact.email} · {selected.contact.phone}</p>
            {selected.cancellation?.reason && <Alert tone="warning" title="Cancellation reason">{selected.cancellation.reason}</Alert>}
            {selected.refund?.reason && <Alert tone="info" title={`Refund ${selected.refund.status}`}>{selected.refund.reason}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-bold">Travellers</p>
                <ul className="mt-1 text-ink-600">{selected.travelers.map((t, i) => <li key={i}>{t.firstName} {t.lastName} ({t.type}{t.seat ? `, ${t.seat}` : ""})</li>)}</ul>
                <p className="mt-3 font-bold">History</p>
                <ul className="mt-1 space-y-1 text-xs text-ink-600">{[...selected.statusHistory].reverse().slice(0, 6).map((h, i) => <li key={i}>{titleCase(h.status)} · {h.note} · {formatDateTime(h.at)}</li>)}</ul>
              </div>
              <PriceSummary pricing={selected.pricing} />
            </div>
            <div className="rounded-xl border border-ink-100 p-4">
              <p className="font-bold">Take action</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <select aria-label="Action" className="field" value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="">Choose…</option>
                  {ACTIONS.filter((a) => a.when(selected)).map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <input aria-label="Internal note" className="field" placeholder="Note (sent to history)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button onClick={apply} loading={busy} disabled={!action}>Apply</Button>
              </div>
              {action === "mark_paid" && <p className="mt-2 text-xs text-amber-700">Use only for verified offline payments (cash, bank transfer). This does not charge the customer.</p>}
              {err && <Alert tone="error" className="mt-2">{err}</Alert>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminBookingsPage() {
  return <Suspense fallback={<PageLoader />}><AdminBookings /></Suspense>;
}

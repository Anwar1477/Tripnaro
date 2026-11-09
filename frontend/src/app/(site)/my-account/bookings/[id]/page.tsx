"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Printer, XCircle } from "lucide-react";
import { TYPE_ICONS } from "@/components/account/BookingRow";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { StatusBadge } from "@/components/common/Badge";
import { Button, LinkButton } from "@/components/common/Button";
import { Alert, ErrorState, PageLoader } from "@/components/common/Feedback";
import { Textarea } from "@/components/common/FormControls";
import { Modal } from "@/components/common/Modal";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/lib/api";
import { formatDate, formatDateTime, formatPrice, titleCase } from "@/lib/utils";
import { bookingService } from "@/services";
import { toast } from "@/store/toast";
import type { Booking } from "@/types";

/** Readable rows from the type-specific `details` blob. */
function detailRows(b: Booking): [string, string][] {
  const d = b.details as Record<string, unknown>;
  const s = (v: unknown) => (v === undefined || v === null || v === "" ? null : String(v));
  const rows: [string, string | null][] = [];
  if (b.type === "hotel") rows.push(["Hotel", s(d.hotelName)], ["Room", s(d.roomName)], ["Check-in", formatDate(String(d.checkIn))], ["Check-out", formatDate(String(d.checkOut))], ["Nights", s(d.nights)], ["Rooms", s(d.rooms)], ["Guests", `${d.adults ?? 0} adults, ${d.children ?? 0} children`]);
  if (b.type === "tour") rows.push(["Tour", s(d.tourTitle)], ["Departure", formatDate(b.startDate, { weekday: "short" })], ["Duration", d.durationDays ? `${d.durationDays} days` : null], ["Travellers", `${d.adults ?? 0} adults, ${d.children ?? 0} children`]);
  if (b.type === "bus") rows.push(["Operator", s(d.operator)], ["Coach", `${d.coachNumber ?? ""} · ${d.busType ?? ""}`], ["Route", `${d.from} → ${d.to}`], ["Journey", `${formatDate(String(d.journeyDate))} at ${d.departureTime}`], ["Seats", Array.isArray(d.seats) ? d.seats.join(", ") : null], ["Boarding", s(d.boardingPoint)], ["Dropping", s(d.droppingPoint)]);
  if (b.type === "flight") {
    const legs = (d.legs as { from: string; to: string; flightNumber: string; airline?: { name: string }; departureAt: string }[] | undefined) ?? [];
    legs.forEach((l, i) => rows.push([`Flight ${i + 1}`, `${l.from} → ${l.to} · ${l.airline?.name ?? ""} ${l.flightNumber} · ${formatDateTime(l.departureAt)}`]));
    rows.push(["Cabin", s(d.cabinClass) && titleCase(String(d.cabinClass).replace("_", " "))], ["Provider", d.isDemoInventory ? "Demo inventory (not a real ticket)" : s(d.provider)]);
  }
  return rows.filter((r): r is [string, string] => !!r[1]);
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: b, loading, error, reload, setData } = useAsync(() => bookingService.get(id), [id]);
  const [modal, setModal] = useState<"cancel" | "refund" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <PageLoader />;
  if (error || !b) return <ErrorState message={error ?? "Booking not found"} onRetry={reload} />;

  const Icon = TYPE_ICONS[b.type];
  const started = new Date(b.startDate) < new Date();
  const canPay = b.status === "pending" && b.paymentStatus !== "paid";
  const canCancel = !["cancelled", "completed"].includes(b.status) && !started && b.cancellation?.status !== "requested";
  const canRefund = b.paymentStatus === "paid" && !["requested", "processed"].includes(b.refund?.status ?? "") && b.status !== "completed";

  async function submit() {
    if (reason.trim().length < 5) return setActionError("Please give a short reason (5+ characters).");
    setBusy(true);
    setActionError(null);
    try {
      const res = modal === "cancel" ? await bookingService.cancel(b!._id, reason) : await bookingService.refund(b!._id, reason);
      setData(res.data);
      toast.success(res.message);
      setModal(null);
      setReason("");
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print:text-black">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-brand-700 uppercase"><Icon className="size-4" />{b.type} booking</p>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">{b.title}</h1>
          <p className="mt-1 font-mono text-sm text-ink-500">Ref {b.reference} · Booked {formatDateTime(b.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {canPay && <LinkButton href={`/checkout/${b._id}`} variant="accent">Complete payment</LinkButton>}
          {b.status === "confirmed" && <Button variant="outline" onClick={() => window.print()}><Printer className="size-4" />Print e-ticket</Button>}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2"><StatusBadge status={b.status} /><StatusBadge status={b.paymentStatus} />{b.cancellation?.status === "requested" && <StatusBadge status="cancellation_requested" />}</div>
      {b.details?.isDemoInventory === true && <Alert tone="warning" className="mb-5">This booking used demo flight inventory and does not correspond to a real airline ticket.</Alert>}
      {b.refund?.status && <Alert tone="info" className="mb-5" title={`Refund ${b.refund.status}`}>{b.refund.amount ? `Amount ${formatPrice(b.refund.amount)}. ` : ""}{b.refund.reason}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">Trip details</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
              {detailRows(b).map(([k, v]) => <div key={k} className="contents"><dt className="text-ink-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="font-bold">Travellers</h2>
            <ul className="mt-3 divide-y divide-ink-100 text-sm">
              {b.travelers.map((t, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="font-medium">{[t.title, t.firstName, t.lastName].filter(Boolean).join(" ")}</span>
                  <span className="text-ink-500">{titleCase(t.type)}{t.seat ? ` · Seat ${t.seat}` : ""}{t.passportNumber ? ` · Passport ${t.passportNumber}` : ""}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-600">Contact: {b.contact.name} · {b.contact.email} · {b.contact.phone}</p>
            {b.specialRequests && <p className="mt-1 text-sm text-ink-600">Requests: {b.specialRequests}</p>}
          </section>
          <section className="card p-5 print:hidden">
            <h2 className="font-bold">History</h2>
            <ul className="mt-3 space-y-2 border-l-2 border-ink-100 pl-4 text-sm">
              {[...b.statusHistory].reverse().map((h, i) => (
                <li key={i}><span className="font-semibold">{titleCase(h.status)}</span>{h.note ? ` · ${h.note}` : ""}<span className="block text-xs text-ink-400">{formatDateTime(h.at)}</span></li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4">
          <div className="card p-5"><PriceSummary pricing={b.pricing} title="Payment summary" /></div>
          {(canCancel || canRefund) && (
            <div className="card space-y-2 p-5 print:hidden">
              <p className="font-bold">Need to change plans?</p>
              <p className="text-xs text-ink-500">Unpaid bookings cancel instantly. Paid bookings are reviewed against the supplier&apos;s policy.</p>
              {canCancel && <Button variant="outline" className="w-full" onClick={() => setModal("cancel")}><XCircle className="size-4" />{b.paymentStatus === "paid" ? "Request cancellation" : "Cancel booking"}</Button>}
              {canRefund && <Button variant="ghost" className="w-full" onClick={() => setModal("refund")}>Request refund</Button>}
            </div>
          )}
        </aside>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "cancel" ? "Cancel booking" : "Request a refund"}>
        <div className="space-y-3">
          <p className="text-sm text-ink-600">{modal === "cancel" ? "Tell us why you're cancelling. Refund eligibility depends on the fare and hotel/operator policy." : "Tell us why you'd like a refund. Our team will respond within 2 working days."}</p>
          <Textarea label="Reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          {actionError && <Alert tone="error">{actionError}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(null)}>Keep booking</Button>
            <Button variant="danger" loading={busy} onClick={submit}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

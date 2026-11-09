"use client";

import { Suspense } from "react";
import { Ticket } from "lucide-react";
import { AccountHeading } from "@/components/account/AccountShell";
import { BookingRow } from "@/components/account/BookingRow";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, PageLoader, Skeleton } from "@/components/common/Feedback";
import { Pagination } from "@/components/common/Pagination";
import { useAsync } from "@/hooks/useAsync";
import { useQueryState } from "@/hooks/useQueryState";
import { cn } from "@/lib/utils";
import { bookingService } from "@/services";

const TABS = [
  { v: "", l: "All" },
  { v: "flight", l: "Flights" },
  { v: "hotel", l: "Hotels" },
  { v: "tour", l: "Tours" },
  { v: "bus", l: "Bus" },
];
const STATUSES = [
  { v: "", l: "Any status" },
  { v: "upcoming", l: "Upcoming" },
  { v: "pending", l: "Pending payment" },
  { v: "confirmed", l: "Confirmed" },
  { v: "completed", l: "Completed" },
  { v: "cancelled", l: "Cancelled" },
];

function BookingsList() {
  const { params, set } = useQueryState();
  const type = params.get("type") ?? "";
  const status = params.get("status") ?? "";
  const page = Number(params.get("page") ?? 1);
  const { data, loading, error, reload } = useAsync(() => bookingService.mine({ type: type || undefined, status: status || undefined, page }), [type, status, page]);

  return (
    <>
      <AccountHeading title="My bookings" description="Flights, stays, tours and bus tickets in one place." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Booking type" className="flex flex-wrap gap-1 rounded-xl bg-ink-100 p-1">
          {TABS.map((t) => (
            <button key={t.v} role="tab" aria-selected={type === t.v} type="button" onClick={() => set({ type: t.v || undefined })} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", type === t.v ? "bg-white text-brand-700 shadow-sm" : "text-ink-600 hover:text-ink-900")}>
              {t.l}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => set({ status: e.target.value || undefined })} className="field h-10 w-auto">
          {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !data?.items.length ? (
        <EmptyState icon={Ticket} title="No bookings found" description="Try a different filter or plan something new." action={<LinkButton href="/">Start exploring</LinkButton>} />
      ) : (
        <>
          <div className="space-y-3">{data.items.map((b) => <BookingRow key={b._id} booking={b} />)}</div>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={(p) => set({ page: p }, { resetPage: false })} />
        </>
      )}
    </>
  );
}

export default function BookingsPage() {
  return <Suspense fallback={<PageLoader />}><BookingsList /></Suspense>;
}

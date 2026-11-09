"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import { PaymentMethods } from "@/components/booking/PaymentMethods";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { StatusBadge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { Alert, EmptyState, ErrorState, PageLoader } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { useRequireAuth } from "@/hooks/useAuth";
import { formatDateTime } from "@/lib/utils";
import { bookingService } from "@/services";

function useCountdown(until?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  return Math.max(0, new Date(until).getTime() - now);
}

export function Checkout({ bookingId }: { bookingId: string }) {
  const { allowed } = useRequireAuth();
  const { data: booking, loading, error, reload } = useAsync(() => bookingService.get(bookingId), [bookingId], { enabled: allowed });
  const left = useCountdown(booking?.status === "pending" ? booking.holdExpiresAt : undefined);

  if (!allowed || loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!booking) return null;

  const expired = left === 0;
  const payable = booking.status === "pending" && booking.paymentStatus !== "paid" && !expired;
  const mm = left !== null ? String(Math.floor(left / 60000)).padStart(2, "0") : "";
  const ss = left !== null ? String(Math.floor((left % 60000) / 1000)).padStart(2, "0") : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-5">
        {payable && left !== null && (
          <Alert tone="warning" title={`Complete payment within ${mm}:${ss}`}>
            We&apos;re holding your selection. After the timer ends, it&apos;s released to other travellers.
          </Alert>
        )}
        {payable ? (
          <PaymentMethods amount={booking.pricing.total} bookingId={booking._id} />
        ) : (
          <EmptyState
            title={booking.paymentStatus === "paid" ? "This booking is already paid" : expired ? "Your hold has expired" : `This booking is ${booking.status}`}
            description={booking.paymentStatus === "paid" ? "You'll find your e-ticket and invoice in your account." : "Start a new search to book again."}
            action={<LinkButton href={`/my-account/bookings/${booking._id}`}>View booking</LinkButton>}
          />
        )}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card overflow-hidden">
          {booking.image && <div className="relative h-32 bg-ink-100"><Image src={booking.image} alt="" fill sizes="22rem" className="object-cover" /></div>}
          <div className="space-y-2 p-4 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-ink-500">{booking.reference}</span>
              <StatusBadge status={booking.status} />
            </div>
            <p className="font-bold text-ink-900">{booking.title}</p>
            <p className="flex items-center gap-2 text-ink-600"><CalendarDays className="size-4" />{formatDateTime(booking.startDate)}</p>
            <p className="flex items-center gap-2 text-ink-600"><Users className="size-4" />{booking.travelers.length} traveller{booking.travelers.length > 1 ? "s" : ""} · {booking.contact.name}</p>
            {booking.holdExpiresAt && booking.status === "pending" && <p className="flex items-center gap-2 text-ink-600"><Clock className="size-4" />Hold until {formatDateTime(booking.holdExpiresAt)}</p>}
          </div>
        </div>
        <div className="card p-5"><PriceSummary pricing={booking.pricing} /></div>
      </aside>
    </div>
  );
}

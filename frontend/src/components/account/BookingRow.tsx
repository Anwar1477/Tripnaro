import Image from "next/image";
import Link from "next/link";
import { BedDouble, BusFront, Compass, Plane } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Booking } from "@/types";
import { StatusBadge } from "../common/Badge";

export const TYPE_ICONS = { flight: Plane, hotel: BedDouble, tour: Compass, bus: BusFront };

export function BookingRow({ booking }: { booking: Booking }) {
  const Icon = TYPE_ICONS[booking.type];
  return (
    <Link href={`/my-account/bookings/${booking._id}`} className="card flex gap-4 p-3 transition hover:shadow-(--shadow-lift) sm:p-4">
      <div className="relative hidden size-20 shrink-0 overflow-hidden rounded-xl bg-brand-50 sm:block">
        {booking.image ? <Image src={booking.image} alt="" fill sizes="80px" className="object-cover" /> : <Icon className="absolute inset-0 m-auto size-8 text-brand-600" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 uppercase"><Icon className="size-3.5" />{booking.type}</span>
          <span className="font-mono text-xs text-ink-500">{booking.reference}</span>
        </div>
        <p className="mt-0.5 truncate font-bold">{booking.title}</p>
        <p className="text-sm text-ink-600">{formatDate(booking.startDate, { weekday: "short" })} · {booking.travelers.length} traveller{booking.travelers.length > 1 ? "s" : ""}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-between gap-1">
        <span className="font-bold">{formatPrice(booking.pricing.total)}</span>
        <div className="flex flex-wrap justify-end gap-1"><StatusBadge status={booking.status} /><StatusBadge status={booking.paymentStatus} /></div>
      </div>
    </Link>
  );
}

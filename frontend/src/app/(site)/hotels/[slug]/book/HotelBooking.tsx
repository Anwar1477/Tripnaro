"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Coffee, RefreshCcw, Users } from "lucide-react";
import { BookingForm } from "@/components/booking/BookingForm";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, nightsBetween } from "@/lib/utils";
import { catalogService } from "@/services";

export function HotelBooking({ slug }: { slug: string }) {
  const sp = useSearchParams();
  const roomId = sp.get("room") ?? "";
  const checkIn = sp.get("checkIn") ?? "";
  const checkOut = sp.get("checkOut") ?? "";
  const rooms = Number(sp.get("rooms") ?? 1);
  const adults = Number(sp.get("adults") ?? 2);
  const children = Number(sp.get("children") ?? 0);
  const nights = nightsBetween(checkIn, checkOut);

  const { data, loading, error, reload } = useAsync(() => catalogService.hotel(slug, { checkIn, checkOut }), [slug, checkIn, checkOut]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const room = data?.rooms.find((r) => r._id === roomId);
  if (!data || !room || nights < 1)
    return <EmptyState title="This room selection is no longer valid" description="Pick your dates and room again to continue." action={<LinkButton href={`/hotels/${slug}#rooms`}>Back to rooms</LinkButton>} />;

  const { hotel } = data;
  const summary = (
    <>
      <div className="relative h-36 bg-ink-100">{hotel.images[0] && <Image src={hotel.images[0]} alt={hotel.name} fill sizes="22rem" className="object-cover" />}</div>
      <div className="space-y-2 p-4 text-sm">
        <p className="text-base font-bold">{hotel.name}</p>
        <p className="font-semibold text-brand-700">{room.name}</p>
        <p className="flex items-center gap-2 text-ink-600"><CalendarDays className="size-4" />{formatDate(checkIn)} → {formatDate(checkOut)} · {nights} night{nights > 1 ? "s" : ""}</p>
        <p className="flex items-center gap-2 text-ink-600"><Users className="size-4" />{rooms} room{rooms > 1 ? "s" : ""} · {adults} adult{adults > 1 ? "s" : ""}{children ? ` · ${children} child${children > 1 ? "ren" : ""}` : ""}</p>
        <p className="flex items-center gap-2 text-ink-600"><Coffee className="size-4" />{room.breakfastIncluded ? "Breakfast included" : "Room only"}</p>
        <p className="flex items-center gap-2 text-ink-600"><RefreshCcw className="size-4" />{room.refundable ? "Free cancellation (per hotel policy)" : "Non-refundable"}</p>
      </div>
    </>
  );

  return (
    <BookingForm
      type="hotel"
      payload={{ hotelId: hotel._id, roomId, checkIn, checkOut, rooms, adults, children }}
      travelerSlots={[{ type: "adult", label: "Lead guest" }]}
      travelerHeading="Lead guest"
      summary={summary}
    />
  );
}

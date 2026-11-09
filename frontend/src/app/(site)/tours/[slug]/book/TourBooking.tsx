"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import { BookingForm, type TravelerSlot } from "@/components/booking/BookingForm";
import { LinkButton } from "@/components/common/Button";
import { EmptyState, ErrorState, PageLoader } from "@/components/common/Feedback";
import { useAsync } from "@/hooks/useAsync";
import { formatDate } from "@/lib/utils";
import { catalogService } from "@/services";

export function TourBooking({ slug }: { slug: string }) {
  const sp = useSearchParams();
  const departureId = sp.get("departure") ?? "";
  const adults = Math.max(1, Number(sp.get("adults") ?? 1));
  const children = Math.max(0, Number(sp.get("children") ?? 0));
  const { data, loading, error, reload } = useAsync(() => catalogService.tour(slug), [slug]);

  const slots = useMemo<TravelerSlot[]>(
    () => [
      ...Array.from({ length: adults }, (_, i) => ({ type: "adult" as const, label: i === 0 ? "Lead traveller (adult)" : `Adult ${i + 1}` })),
      ...Array.from({ length: children }, (_, i) => ({ type: "child" as const, label: `Child ${i + 1}` })),
    ],
    [adults, children],
  );

  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const tour = data?.tour;
  const dep = tour?.departures.find((d) => d._id === departureId);
  if (!tour || !dep) return <EmptyState title="Choose a departure date" description="This departure is no longer available." action={<LinkButton href={`/tours/${slug}#book`}>Back to tour</LinkButton>} />;

  return (
    <BookingForm
      type="tour"
      payload={{ tourId: tour._id, departureId, adults, children }}
      travelerSlots={slots}
      summary={
        <>
          <div className="relative h-36 bg-ink-100">{tour.images[0] && <Image src={tour.images[0]} alt={tour.title} fill sizes="22rem" className="object-cover" />}</div>
          <div className="space-y-2 p-4 text-sm">
            <p className="text-base font-bold">{tour.title}</p>
            <p className="flex items-center gap-2 text-ink-600"><CalendarDays className="size-4" />Departs {formatDate(dep.date, { weekday: "short" })}</p>
            <p className="flex items-center gap-2 text-ink-600"><Clock className="size-4" />{tour.durationDays} days / {tour.durationNights} nights</p>
            <p className="flex items-center gap-2 text-ink-600"><Users className="size-4" />{adults} adult{adults > 1 ? "s" : ""}{children ? ` · ${children} child${children > 1 ? "ren" : ""}` : ""}</p>
            <p className={dep.seatsLeft <= 5 ? "font-semibold text-amber-700" : "text-emerald-700"}>{dep.seatsLeft} seats left on this date</p>
          </div>
        </>
      }
    />
  );
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Plane } from "lucide-react";
import { BookingForm, type TravelerSlot } from "@/components/booking/BookingForm";
import { DemoBadge } from "@/components/common/Badge";
import { LinkButton } from "@/components/common/Button";
import { Alert, EmptyState, PageLoader } from "@/components/common/Feedback";
import { CABIN_LABELS, formatDuration, localDate, localTime } from "@/lib/utils";
import { useFlightSelection } from "@/store/flight";

const noop = () => () => {};
const DOMESTIC = new Set(["DAC", "CGP", "CXB", "ZYL", "JSR", "RJH", "SPD", "BZL"]);

export function FlightReview() {
  const { selected, cabinClass, passengers } = useFlightSelection();
  // Session storage is only available after hydration.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);

  const slots = useMemo<TravelerSlot[]>(
    () => [
      ...Array.from({ length: passengers.adults }, (_, i) => ({ type: "adult" as const, label: `Adult ${i + 1}${i === 0 ? " (primary)" : ""}` })),
      ...Array.from({ length: passengers.children }, (_, i) => ({ type: "child" as const, label: `Child ${i + 1} (2–11 yrs)` })),
      ...Array.from({ length: passengers.infants }, (_, i) => ({ type: "infant" as const, label: `Infant ${i + 1} (under 2)` })),
    ],
    [passengers],
  );

  if (!hydrated) return <PageLoader />;
  if (!selected.length) return <EmptyState icon={Plane} title="No flight selected" description="Search and select a flight to continue." action={<LinkButton href="/flights">Search flights</LinkButton>} />;

  const international = selected.some((o) => !DOMESTIC.has(o.from) || !DOMESTIC.has(o.to));
  const isDemo = selected.some((o) => o.isDemo);

  return (
    <BookingForm
      type="flight"
      payload={{ offerIds: selected.map((o) => o.offerId), cabinClass, passengers }}
      travelerSlots={slots}
      travelerHeading="Passengers"
      requireDob
      requirePassport={international}
      note={
        <>
          {isDemo && (
            <Alert tone="warning" title="Demo flight inventory">
              This booking uses simulated flights because no airline provider is connected. It will not issue a real airline ticket.
            </Alert>
          )}
          {international && <Alert tone="info">International trip: passport details are required for every passenger, and passports must be valid for 6+ months.</Alert>}
        </>
      }
      summary={
        <div className="divide-y divide-ink-100">
          <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
            <p className="font-bold">Your trip</p>
            <span className="text-xs">{CABIN_LABELS[cabinClass]}</span>
          </div>
          {selected.map((o) => (
            <div key={o.offerId} className="space-y-1 p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{o.from} → {o.to}</p>
                {o.isDemo && <DemoBadge label="Demo" />}
              </div>
              <p className="text-ink-600">{localDate(o.departureAt)} · {localTime(o.departureAt)} – {localTime(o.arrivalAt)}</p>
              <p className="text-ink-600">{o.airline.name} {o.flightNumber} · {formatDuration(o.durationMinutes)} · {o.stops ? `${o.stops} stop` : "Non-stop"}</p>
              <p className="text-xs text-ink-500">Baggage {o.baggage.checked} · {o.refundable ? "Refundable" : "Non-refundable"}</p>
            </div>
          ))}
        </div>
      }
    />
  );
}

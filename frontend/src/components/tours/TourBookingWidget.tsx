"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import type { Tour } from "@/types";
import { Button } from "../common/Button";
import { Counter } from "../common/Misc";

/** Departure + traveller picker on the tour page. Prices shown are indicative; checkout re-quotes on the server. */
export function TourBookingWidget({ tour }: { tour: Tour }) {
  const router = useRouter();
  const open = tour.departures.filter((d) => d.seatsLeft > 0);
  const [departureId, setDepartureId] = useState(open[0]?._id ?? "");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const dep = tour.departures.find((d) => d._id === departureId);
  const seatsNeeded = adults + children;
  const estimate = dep ? dep.priceAdult * adults + dep.priceChild * children : 0;

  return (
    <div className="card p-5" id="book">
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">From</p>
      <p className="text-2xl font-bold">
        {formatPrice(tour.priceAdult)} <span className="text-sm font-normal text-ink-500">/ adult</span>
      </p>
      {tour.originalPrice && tour.originalPrice > tour.priceAdult && <p className="text-sm text-ink-400 line-through">{formatPrice(tour.originalPrice)}</p>}

      <p className="label mt-4 flex items-center gap-1.5"><CalendarDays className="size-4" /> Choose a departure</p>
      {tour.departures.length === 0 ? (
        <p className="text-sm text-ink-500">No upcoming departures. Request custom dates below.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Departure date">
          {tour.departures.map((d) => {
            const full = d.seatsLeft === 0;
            const active = d._id === departureId;
            return (
              <button
                key={d._id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={full}
                onClick={() => setDepartureId(d._id)}
                className={cn("flex w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition", active ? "border-brand-600 bg-brand-50" : "border-ink-100 hover:border-ink-200", full && "cursor-not-allowed opacity-50")}
              >
                <span>
                  <span className="block font-semibold">{formatDate(d.date, { weekday: "short" })}</span>
                  <span className={cn("text-xs", full ? "text-coral-600" : d.seatsLeft <= 5 ? "text-amber-700" : "text-emerald-700")}>{full ? "Sold out" : `${d.seatsLeft} seats left`}</span>
                </span>
                <span className="font-bold">{formatPrice(d.priceAdult)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 border-t border-ink-100 pt-2">
        <Counter label="Adults" hint="12+ years" value={adults} min={1} max={30} onChange={setAdults} />
        <Counter label="Children" hint="2–11 years" value={children} max={20} onChange={setChildren} />
      </div>

      {dep && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2 text-sm">
          <span className="text-ink-600">Estimated total</span>
          <span className="font-bold">{formatPrice(estimate)}</span>
        </div>
      )}
      {dep && seatsNeeded > dep.seatsLeft && <p className="mt-2 text-sm text-coral-600">Only {dep.seatsLeft} seats left on this date.</p>}
      <Button
        variant="accent"
        className="mt-4 w-full"
        disabled={!dep || seatsNeeded > dep.seatsLeft}
        onClick={() => router.push(`/tours/${tour.slug}/book?departure=${departureId}&adults=${adults}&children=${children}`)}
      >
        Book this tour
      </Button>
      {tour.customizable && (
        <Button variant="ghost" className="mt-2 w-full" onClick={() => router.push(`/tours/custom-request?destination=${encodeURIComponent(tour.destination?.name ?? tour.title)}&tour=${tour.slug}`)}>
          Customise this trip
        </Button>
      )}
    </div>
  );
}

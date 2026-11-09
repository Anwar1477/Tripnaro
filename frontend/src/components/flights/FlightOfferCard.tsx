"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, Luggage, Plane, RefreshCcw } from "lucide-react";
import { cn, formatDuration, formatPrice, localDate, localTime } from "@/lib/utils";
import type { FlightOffer } from "@/types";
import { Button } from "../common/Button";

function AirlineMark({ code, name }: { code: string; name: string }) {
  const hue = [...code].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: `hsl(${hue} 55% 42%)` }} aria-hidden title={name}>
      {code}
    </span>
  );
}

export function FlightOfferCard({ offer, onSelect, selected, actionLabel = "Select" }: { offer: FlightOffer; onSelect?: () => void; selected?: boolean; actionLabel?: string }) {
  const [open, setOpen] = useState(false);
  const dayDiff = Math.round((new Date(offer.arrivalAt.slice(0, 10)).getTime() - new Date(offer.departureAt.slice(0, 10)).getTime()) / 86_400_000);
  return (
    <article className={cn("card overflow-hidden transition", selected && "ring-2 ring-brand-500")}>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
        <div className="grid min-w-0 gap-4 sm:grid-cols-[10rem_1fr]">
          <div className="flex items-center gap-3">
            <AirlineMark code={offer.airline.code} name={offer.airline.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{offer.airline.name}</p>
              <p className="text-xs text-ink-500">{offer.flightNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-xl font-bold tabular-nums">{localTime(offer.departureAt)}</p>
              <p className="text-xs font-semibold text-ink-500">{offer.from}</p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center px-1">
              <p className="text-xs text-ink-500">{formatDuration(offer.durationMinutes)}</p>
              <div className="relative my-1 h-px w-full bg-ink-200">
                <Plane className="absolute -top-2 right-0 size-4 rotate-45 text-brand-600" />
                {offer.stops > 0 && <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full border-2 border-white bg-coral-500" />}
              </div>
              <p className={cn("text-xs font-semibold", offer.stops ? "text-coral-600" : "text-emerald-700")}>
                {offer.stops === 0 ? "Non-stop" : `${offer.stops} stop · ${offer.layovers.map((l) => l.airport).join(", ")}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums">
                {localTime(offer.arrivalAt)}
                {dayDiff > 0 && <sup className="ml-0.5 text-xs text-coral-600">+{dayDiff}</sup>}
              </p>
              <p className="text-xs font-semibold text-ink-500">{offer.to}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-ink-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-xl font-bold">{formatPrice(offer.fare.total)}</p>
            <p className="text-xs text-ink-500">{formatPrice(offer.fare.perAdult)} / adult</p>
            {offer.seatsLeft <= 5 && <p className="text-xs font-semibold text-amber-700">{offer.seatsLeft} seats left</p>}
          </div>
          {onSelect && (
            <Button variant={selected ? "primary" : "accent"} size="sm" onClick={onSelect}>
              {selected ? "Selected" : actionLabel}
            </Button>
          )}
        </div>
      </div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between border-t border-ink-100 bg-sand-50 px-4 py-2 text-xs font-semibold text-brand-700 hover:bg-sand-100 sm:px-5">
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-ink-600">
          <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{offer.baggage.cabin}</span>
          <span className="flex items-center gap-1"><Luggage className="size-3.5" />{offer.baggage.checked}</span>
          <span className={cn("flex items-center gap-1", offer.refundable ? "text-emerald-700" : "")}><RefreshCcw className="size-3.5" />{offer.refundable ? "Refundable" : "Non-refundable"}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">Details <ChevronDown className={cn("size-4 transition", open && "rotate-180")} /></span>
      </button>
      {open && (
        <div className="grid gap-4 border-t border-ink-100 p-4 text-sm sm:grid-cols-2 sm:p-5">
          <div>
            <p className="font-bold">Itinerary</p>
            <p className="mt-1 text-ink-600">{offer.fromCity ?? offer.from} → {offer.toCity ?? offer.to}</p>
            <p className="text-ink-600">Departs {localDate(offer.departureAt)} {localTime(offer.departureAt)} · Arrives {localDate(offer.arrivalAt)} {localTime(offer.arrivalAt)}</p>
            {offer.aircraft && <p className="text-ink-600">Aircraft: {offer.aircraft}</p>}
            {offer.layovers.map((l) => (
              <p key={l.airport} className="text-coral-700">Layover {l.city ?? l.airport}: {formatDuration(l.durationMinutes)}</p>
            ))}
          </div>
          <div>
            <p className="font-bold">Fare breakdown</p>
            {offer.fare.breakdown.map((b) => (
              <p key={b.label} className="mt-1 flex justify-between text-ink-600"><span>{b.label}</span><span>{formatPrice(b.amount)}</span></p>
            ))}
            <p className="mt-1 flex justify-between border-t border-ink-100 pt-1 font-bold"><span>Total</span><span>{formatPrice(offer.fare.total)}</span></p>
          </div>
        </div>
      )}
    </article>
  );
}

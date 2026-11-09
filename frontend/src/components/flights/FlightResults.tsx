"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, PlaneTakeoff } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { CABIN_LABELS, cn, formatDate, formatPrice } from "@/lib/utils";
import { flightService } from "@/services";
import { useFlightSelection } from "@/store/flight";
import type { FlightOffer } from "@/types";
import { DemoBadge } from "../common/Badge";
import { Button } from "../common/Button";
import { Alert, CardSkeleton, EmptyState, ErrorState } from "../common/Feedback";
import { Checkbox } from "../common/FormControls";
import { FilterGroup, FilterLayout, SortSelect } from "../common/FilterLayout";
import { FlightOfferCard } from "./FlightOfferCard";
import { parseFlightSearch } from "@/lib/flight-search";

const TIME_BANDS = [
  { id: "early", label: "Early morning (00–06)", from: 0, to: 6 },
  { id: "morning", label: "Morning (06–12)", from: 6, to: 12 },
  { id: "afternoon", label: "Afternoon (12–18)", from: 12, to: 18 },
  { id: "evening", label: "Evening (18–24)", from: 18, to: 24 },
];
const SORTS = [
  { value: "cheapest", label: "Cheapest" },
  { value: "fastest", label: "Fastest" },
  { value: "earliest", label: "Earliest departure" },
];

const hourOf = (iso: string) => Number(iso.slice(11, 13));

export function FlightResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const setSelection = useFlightSelection((s) => s.setSelection);
  const search = useMemo(() => parseFlightSearch(new URLSearchParams(sp.toString())), [sp]);
  const { data, loading, error, reload } = useAsync(
    () => (search ? flightService.search({ tripType: search.tripType, legs: search.legs, returnDate: search.returnDate, cabinClass: search.cabinClass, passengers: search.passengers }) : Promise.reject(new Error("Incomplete search. Please choose airports and dates."))),
    [sp.toString()],
  );

  const [legIndex, setLegIndex] = useState(0);
  const [picked, setPicked] = useState<FlightOffer[]>([]);
  const [sort, setSort] = useState("cheapest");
  const [airlines, setAirlines] = useState<string[]>([]);
  const [stops, setStops] = useState<number[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [refundableOnly, setRefundableOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const leg = data?.legs[legIndex];
  const offers = useMemo(() => leg?.offers ?? [], [leg]);
  const airlineList = useMemo(() => [...new Map(offers.map((o) => [o.airline.code, o.airline])).values()], [offers]);
  const priceBounds = useMemo(() => (offers.length ? { min: Math.min(...offers.map((o) => o.fare.total)), max: Math.max(...offers.map((o) => o.fare.total)) } : null), [offers]);

  const visible = useMemo(() => {
    const out = offers.filter(
      (o) =>
        (!airlines.length || airlines.includes(o.airline.code)) &&
        (!stops.length || stops.includes(Math.min(o.stops, 2))) &&
        (!times.length || times.some((t) => { const b = TIME_BANDS.find((x) => x.id === t)!; const h = hourOf(o.departureAt); return h >= b.from && h < b.to; })) &&
        (!refundableOnly || o.refundable) &&
        (maxPrice === null || o.fare.total <= maxPrice),
    );
    return out.sort((a, b) => (sort === "fastest" ? a.durationMinutes - b.durationMinutes : sort === "earliest" ? a.departureAt.localeCompare(b.departureAt) : a.fare.total - b.fare.total));
  }, [offers, airlines, stops, times, refundableOnly, maxPrice, sort]);

  function resetFilters() {
    setAirlines([]); setStops([]); setTimes([]); setRefundableOnly(false); setMaxPrice(null);
  }
  const toggle = <T,>(list: T[], v: T, setter: (l: T[]) => void) => setter(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function choose(offer: FlightOffer) {
    if (!data || !search) return;
    const next = [...picked.slice(0, legIndex), offer];
    setPicked(next);
    if (legIndex < data.legs.length - 1) {
      setLegIndex(legIndex + 1);
      resetFilters();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSelection(next, search.cabinClass, search.passengers);
      router.push("/flights/review");
    }
  }

  if (!search) return <EmptyState icon={PlaneTakeoff} title="Start a flight search" description="Choose where you're flying from and to, and your travel dates." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const activeCount = airlines.length + stops.length + times.length + (refundableOnly ? 1 : 0) + (maxPrice !== null ? 1 : 0);
  const pax = search.passengers.adults + search.passengers.children + search.passengers.infants;

  const filters = (
    <>
      {priceBounds && priceBounds.max > priceBounds.min && (
        <FilterGroup title="Max price">
          <input type="range" aria-label="Maximum price" className="w-full accent-brand-600" min={priceBounds.min} max={priceBounds.max} step={100} value={maxPrice ?? priceBounds.max} onChange={(e) => setMaxPrice(Number(e.target.value) >= priceBounds.max ? null : Number(e.target.value))} />
          <p className="text-xs text-ink-600">Up to {formatPrice(maxPrice ?? priceBounds.max)}</p>
        </FilterGroup>
      )}
      <FilterGroup title="Stops">
        {[{ v: 0, l: "Non-stop" }, { v: 1, l: "1 stop" }, { v: 2, l: "2+ stops" }].map((s) => (
          <Checkbox key={s.v} label={s.l} checked={stops.includes(s.v)} onChange={() => toggle(stops, s.v, setStops)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Departure time">
        {TIME_BANDS.map((t) => <Checkbox key={t.id} label={t.label} checked={times.includes(t.id)} onChange={() => toggle(times, t.id, setTimes)} />)}
      </FilterGroup>
      {airlineList.length > 0 && (
        <FilterGroup title="Airlines">
          {airlineList.map((a) => <Checkbox key={a.code} label={a.name} checked={airlines.includes(a.code)} onChange={() => toggle(airlines, a.code, setAirlines)} />)}
        </FilterGroup>
      )}
      <FilterGroup title="Fare type">
        <Checkbox label="Refundable only" checked={refundableOnly} onChange={() => setRefundableOnly((v) => !v)} />
      </FilterGroup>
    </>
  );

  return (
    <div className="space-y-4">
      {data?.isDemo && (
        <Alert tone="warning" title="Demo flight inventory">
          {data.notice ?? "No live airline provider is connected, so these are simulated schedules and fares for testing. They are not real airline availability."}
        </Alert>
      )}
      {data && data.legs.length > 1 && (
        <ol className="flex flex-wrap gap-2" aria-label="Journey legs">
          {data.legs.map((l, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={i > picked.length}
                onClick={() => { setLegIndex(i); resetFilters(); }}
                className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-40", i === legIndex ? "border-brand-600 bg-brand-600 text-white" : picked[i] ? "border-brand-200 bg-brand-50 text-brand-800" : "border-ink-200 bg-white text-ink-600")}
              >
                {i + 1}. {l.from} <ArrowRight className="size-3.5" /> {l.to}
                <span className="font-normal opacity-80">{formatDate(l.date, { year: undefined })}</span>
                {picked[i] && i !== legIndex && <span className="text-xs">· {formatPrice(picked[i].fare.total)}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
      <FilterLayout filters={filters} activeCount={activeCount} onReset={resetFilters}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink-600" aria-live="polite">
            {loading ? "Searching flights…" : leg ? (
              <span className="flex flex-wrap items-center gap-2">
                <strong className="text-ink-900">{visible.length}</strong> flights · {leg.from} → {leg.to} · {formatDate(leg.date, { weekday: "short" })} · {pax} traveller{pax > 1 ? "s" : ""} · {CABIN_LABELS[search.cabinClass]}
                {data?.isDemo && <DemoBadge />}
              </span>
            ) : null}
          </div>
          <SortSelect value={sort} onChange={setSort} options={SORTS} />
        </div>
        {loading ? (
          <div className="space-y-3"><CardSkeleton count={4} className="h-32" /></div>
        ) : !visible.length ? (
          <EmptyState icon={PlaneTakeoff} title={offers.length ? "No flights match these filters" : "No flights on this date"} description={offers.length ? "Clear some filters to see more options." : "Try another date or nearby airport."} action={offers.length ? <Button variant="outline" onClick={resetFilters}>Clear filters</Button> : undefined} />
        ) : (
          <div className="space-y-3">
            {visible.map((o) => (
              <FlightOfferCard key={o.offerId} offer={o} selected={picked[legIndex]?.offerId === o.offerId} onSelect={() => choose(o)} actionLabel={data && legIndex < data.legs.length - 1 ? "Select & continue" : "Select"} />
            ))}
          </div>
        )}
      </FilterLayout>
    </div>
  );
}

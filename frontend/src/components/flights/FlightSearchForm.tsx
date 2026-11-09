"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, CalendarDays, Plus, Search, Trash2, Users } from "lucide-react";
import { CABIN_LABELS, cn, todayInput } from "@/lib/utils";
import type { CabinClass, Passengers } from "@/types";
import { Button } from "../common/Button";
import { Counter } from "../common/Misc";
import { Popover, SearchBox, searchInputClass } from "../common/Popover";
import { AirportInput } from "./AirportInput";
import { flightSearchUrl } from "@/lib/flight-search";

type TripType = "one_way" | "round_trip" | "multi_city";
interface Leg {
  from: string;
  to: string;
  date: string;
}

export interface FlightSearchInitial {
  tripType?: TripType;
  legs?: Leg[];
  returnDate?: string;
  cabinClass?: CabinClass;
  passengers?: Passengers;
}

export function FlightSearchForm({ initial, compact = false }: { initial?: FlightSearchInitial; compact?: boolean }) {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>(initial?.tripType ?? "round_trip");
  const [legs, setLegs] = useState<Leg[]>(initial?.legs?.length ? initial.legs : [{ from: "DAC", to: "CXB", date: todayInput(7) }]);
  const [returnDate, setReturnDate] = useState(initial?.returnDate ?? todayInput(10));
  const [cabinClass, setCabin] = useState<CabinClass>(initial?.cabinClass ?? "economy");
  const [pax, setPax] = useState<Passengers>(initial?.passengers ?? { adults: 1, children: 0, infants: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleLegs = tripType === "multi_city" ? legs : legs.slice(0, 1);
  const updateLeg = (i: number, patch: Partial<Leg>) => setLegs((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  function changeTrip(t: TripType) {
    setTripType(t);
    if (t === "multi_city" && legs.length < 2) {
      setLegs([legs[0], { from: legs[0].to, to: "", date: returnDate || todayInput(12) }]);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    visibleLegs.forEach((l, i) => {
      if (!l.from) errs[`from${i}`] = "Choose origin";
      if (!l.to) errs[`to${i}`] = "Choose destination";
      if (l.from && l.from === l.to) errs[`to${i}`] = "Must differ from origin";
      if (!l.date) errs[`date${i}`] = "Pick a date";
      if (i > 0 && l.date < visibleLegs[i - 1].date) errs[`date${i}`] = "Must be after previous flight";
    });
    if (tripType === "round_trip" && returnDate < legs[0].date) errs.return = "Return must be after departure";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    router.push(flightSearchUrl({ tripType, legs: visibleLegs, returnDate, cabinClass, passengers: pax }));
  }

  const travellers = pax.adults + pax.children + pax.infants;

  return (
    <form onSubmit={submit} noValidate aria-label="Flight search">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["one_way", "One way"],
            ["round_trip", "Round trip"],
            ["multi_city", "Multi-city"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeTrip(value)}
            aria-pressed={tripType === value}
            className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition", tripType === value ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleLegs.map((leg, i) => (
          <div key={i} className={cn("grid gap-3", tripType === "multi_city" ? "md:grid-cols-[1fr_1fr_0.8fr_auto]" : compact ? "md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_0.75fr_1fr_auto]" : "md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.75fr_0.75fr_1fr]")}>
            <div className="relative grid gap-3 sm:grid-cols-2 md:col-span-2 lg:col-span-2">
              <AirportInput label="From" kind="from" value={leg.from} onChange={(from) => updateLeg(i, { from })} error={errors[`from${i}`]} />
              <AirportInput label="To" kind="to" value={leg.to} onChange={(to) => updateLeg(i, { to })} error={errors[`to${i}`]} />
              <button
                type="button"
                aria-label="Swap origin and destination"
                onClick={() => updateLeg(i, { from: leg.to, to: leg.from })}
                className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white text-brand-700 shadow-sm transition hover:rotate-180 sm:grid"
              >
                <ArrowLeftRight className="size-4" />
              </button>
            </div>
            <SearchBox label={tripType === "multi_city" ? `Flight ${i + 1} date` : "Departure"} icon={<CalendarDays className="size-3.5" />} className={cn(errors[`date${i}`] && "border-coral-400")}>
              <input type="date" aria-label="Departure date" className={searchInputClass} min={i > 0 ? visibleLegs[i - 1].date : todayInput()} value={leg.date} onChange={(e) => updateLeg(i, { date: e.target.value })} />
              {errors[`date${i}`] && <p className="text-xs text-coral-600">{errors[`date${i}`]}</p>}
            </SearchBox>
            {tripType !== "multi_city" && (
              <SearchBox label="Return" icon={<CalendarDays className="size-3.5" />} className={cn(tripType === "one_way" && "opacity-60", errors.return && "border-coral-400")}>
                {tripType === "round_trip" ? (
                  <input type="date" aria-label="Return date" className={searchInputClass} min={leg.date} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                ) : (
                  <button type="button" onClick={() => changeTrip("round_trip")} className={cn(searchInputClass, "text-left text-ink-400")}>
                    Add return
                  </button>
                )}
                {errors.return && <p className="text-xs text-coral-600">{errors.return}</p>}
              </SearchBox>
            )}
            {tripType === "multi_city" && (
              <button type="button" onClick={() => setLegs((ls) => ls.filter((_, j) => j !== i))} disabled={legs.length <= 2} aria-label={`Remove flight ${i + 1}`} className="grid h-full min-h-12 place-items-center rounded-xl border border-ink-200 px-3 text-ink-500 hover:text-coral-600 disabled:opacity-30">
                <Trash2 className="size-4" />
              </button>
            )}
            {i === 0 && tripType !== "multi_city" && (
              <PassengerCabin pax={pax} setPax={setPax} cabin={cabinClass} setCabin={setCabin} travellers={travellers} />
            )}
            {i === 0 && tripType !== "multi_city" && compact && (
              <Button type="submit" variant="accent" size="lg" className="h-full min-h-14">
                <Search className="size-5" /> Search
              </Button>
            )}
          </div>
        ))}
      </div>

      {tripType === "multi_city" && (
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
          <Button variant="secondary" onClick={() => setLegs((ls) => [...ls, { from: ls[ls.length - 1].to, to: "", date: ls[ls.length - 1].date }])} disabled={legs.length >= 5}>
            <Plus className="size-4" /> Add another flight
          </Button>
          <div className="md:ml-auto md:w-72">
            <PassengerCabin pax={pax} setPax={setPax} cabin={cabinClass} setCabin={setCabin} travellers={travellers} />
          </div>
        </div>
      )}

      {(!compact || tripType === "multi_city") && (
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto">
            <Search className="size-5" /> Search flights
          </Button>
        </div>
      )}
    </form>
  );
}

function PassengerCabin({
  pax,
  setPax,
  cabin,
  setCabin,
  travellers,
}: {
  pax: Passengers;
  setPax: (p: Passengers) => void;
  cabin: CabinClass;
  setCabin: (c: CabinClass) => void;
  travellers: number;
}) {
  const seated = pax.adults + pax.children;
  return (
    <Popover
      align="right"
      trigger={({ toggle, open }) => (
        <button type="button" onClick={toggle} aria-expanded={open} className="w-full text-left">
          <SearchBox label="Travellers & class" icon={<Users className="size-3.5" />}>
            <span className={cn(searchInputClass, "block truncate")}>
              {travellers} traveller{travellers > 1 ? "s" : ""}
            </span>
            <span className="block truncate text-xs text-ink-500">{CABIN_LABELS[cabin]}</span>
          </SearchBox>
        </button>
      )}
    >
      {(close) => (
        <div>
          <Counter label="Adults" hint="12+ years" value={pax.adults} min={1} max={9 - pax.children} onChange={(adults) => setPax({ ...pax, adults, infants: Math.min(pax.infants, adults) })} />
          <Counter label="Children" hint="2–11 years" value={pax.children} max={9 - pax.adults} onChange={(children) => setPax({ ...pax, children })} />
          <Counter label="Infants" hint="Under 2, on lap" value={pax.infants} max={pax.adults} onChange={(infants) => setPax({ ...pax, infants })} />
          {seated >= 9 && <p className="text-xs text-ink-500">Maximum 9 seated travellers per booking.</p>}
          <p className="mt-3 mb-2 text-sm font-semibold">Cabin class</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CABIN_LABELS) as CabinClass[]).map((c) => (
              <button key={c} type="button" onClick={() => setCabin(c)} aria-pressed={cabin === c} className={cn("rounded-lg border px-2 py-2 text-xs font-semibold", cabin === c ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:border-ink-300")}>
                {CABIN_LABELS[c]}
              </button>
            ))}
          </div>
          <Button className="mt-4 w-full" size="sm" onClick={close}>
            Done
          </Button>
        </div>
      )}
    </Popover>
  );
}

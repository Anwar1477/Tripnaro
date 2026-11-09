"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bus as BusIcon, Clock, MapPin, Star, Wifi } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
import { busService } from "@/services";
import { Checkbox } from "../common/FormControls";
import { CardSkeleton, EmptyState, ErrorState } from "../common/Feedback";
import { FilterGroup, FilterLayout, SortSelect } from "../common/FilterLayout";
import { buttonClasses } from "../common/Button";

const BUS_TYPES = ["AC", "Non-AC", "AC Sleeper", "Business Class"];
const SORTS = [
  { value: "departure", label: "Departure time" },
  { value: "cheapest", label: "Cheapest" },
  { value: "fastest", label: "Fastest" },
  { value: "rating", label: "Operator rating" },
];

function arrival(dep: string, minutes: number) {
  const [h, m] = dep.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const day = Math.floor(total / 1440);
  return `${String(Math.floor((total % 1440) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}${day ? ` (+${day})` : ""}`;
}

export function BusResults({ from, to, date }: { from: string; to: string; date: string }) {
  const { data, loading, error, reload } = useAsync(() => busService.search({ from, to, date }), [from, to, date]);
  const [types, setTypes] = useState<string[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [sort, setSort] = useState("departure");

  const operatorList = useMemo(() => [...new Set((data ?? []).map((b) => b.operator.name))], [data]);
  const visible = useMemo(() => {
    const list = (data ?? []).filter((b) => (!types.length || types.includes(b.busType)) && (!operators.length || operators.includes(b.operator.name)));
    return list.sort((a, b) => (sort === "cheapest" ? a.fare - b.fare : sort === "fastest" ? a.durationMinutes - b.durationMinutes : sort === "rating" ? b.operator.rating - a.operator.rating : a.departureTime.localeCompare(b.departureTime)));
  }, [data, types, operators, sort]);
  const toggle = (list: string[], v: string, set: (l: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const filters = (
    <>
      <FilterGroup title="Coach type">
        {BUS_TYPES.map((t) => <Checkbox key={t} label={t} checked={types.includes(t)} onChange={() => toggle(types, t, setTypes)} />)}
      </FilterGroup>
      {operatorList.length > 0 && (
        <FilterGroup title="Operators">
          {operatorList.map((o) => <Checkbox key={o} label={o} checked={operators.includes(o)} onChange={() => toggle(operators, o, setOperators)} />)}
        </FilterGroup>
      )}
    </>
  );

  return (
    <FilterLayout filters={filters} activeCount={types.length + operators.length} onReset={() => { setTypes([]); setOperators([]); }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live="polite">{loading ? "Searching coaches…" : <><strong className="text-ink-900">{visible.length}</strong> coaches · {from} → {to}</>}</p>
        <SortSelect value={sort} onChange={setSort} options={SORTS} />
      </div>
      {loading ? (
        <div className="space-y-3"><CardSkeleton count={3} /></div>
      ) : !visible.length ? (
        <EmptyState icon={BusIcon} title="No coaches found" description="Try another date or route." />
      ) : (
        <div className="space-y-3">
          {visible.map((b) => {
            const soldOut = (b.availableSeats ?? 0) === 0;
            return (
              <article key={b._id} className="card grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-bold">{b.operator.name}</p>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700"><Star className="size-3 fill-current" />{b.operator.rating.toFixed(1)}</span>
                    <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">{b.busType}</span>
                    <span className="text-xs text-ink-500">Coach {b.coachNumber} · {b.seatLayout}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div><p className="text-xl font-bold tabular-nums">{b.departureTime}</p><p className="text-xs text-ink-500">{b.from}</p></div>
                    <div className="flex flex-1 flex-col items-center"><p className="flex items-center gap-1 text-xs text-ink-500"><Clock className="size-3" />{formatDuration(b.durationMinutes)}</p><span className="my-1 h-px w-full max-w-40 bg-ink-200" /></div>
                    <div className="text-right"><p className="text-xl font-bold tabular-nums">{arrival(b.departureTime, b.durationMinutes)}</p><p className="text-xs text-ink-500">{b.to}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><MapPin className="size-3" />Boarding: {b.boardingPoints.map((p) => p.name).slice(0, 3).join(", ")}</span>
                    {b.amenities.length > 0 && <span className="flex items-center gap-1"><Wifi className="size-3" />{b.amenities.slice(0, 4).join(" · ")}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-ink-100 pt-3 md:flex-col md:items-end md:border-0 md:pt-0">
                  <div className="md:text-right">
                    <p className="text-xl font-bold">{formatPrice(b.fare)}</p>
                    <p className={cn("text-xs font-semibold", soldOut ? "text-coral-600" : (b.availableSeats ?? 0) <= 8 ? "text-amber-700" : "text-emerald-700")}>{soldOut ? "Sold out" : `${b.availableSeats} seats left`}</p>
                  </div>
                  {soldOut ? (
                    <span className={buttonClasses("outline", "sm", "pointer-events-none opacity-50")}>Sold out</span>
                  ) : (
                    <Link href={`/bus/${b._id}?date=${date}`} className={buttonClasses("accent", "sm")}>Select seats</Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </FilterLayout>
  );
}

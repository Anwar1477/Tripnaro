"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BedDouble, Building2, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, nightsBetween, todayInput, toDateInput, addDays } from "@/lib/utils";
import { catalogService } from "@/services";
import { Button } from "../common/Button";
import { Counter } from "../common/Misc";
import { Popover, SearchBox, searchInputClass } from "../common/Popover";

export interface HotelSearchState {
  destination: string;
  destinationLabel?: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  purpose?: string;
}

const PURPOSES = ["business", "couples", "families", "friends", "solo"];

export function hotelSearchParams(s: HotelSearchState) {
  const p = new URLSearchParams({ checkIn: s.checkIn, checkOut: s.checkOut, rooms: String(s.rooms), adults: String(s.adults), children: String(s.children) });
  if (s.destination) p.set("destination", s.destination);
  if (s.purpose) p.set("purpose", s.purpose);
  return p;
}

type Suggestion = { kind: "destination" | "hotel"; label: string; sub: string; value: string; slug: string };

export function HotelSearchForm({ initial, compact = false }: { initial?: Partial<HotelSearchState>; compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<HotelSearchState>({
    destination: initial?.destination ?? "coxs-bazar",
    destinationLabel: initial?.destinationLabel ?? (initial?.destination === undefined ? "Cox's Bazar" : undefined),
    checkIn: initial?.checkIn ?? todayInput(7),
    checkOut: initial?.checkOut ?? todayInput(9),
    rooms: initial?.rooms ?? 1,
    adults: initial?.adults ?? 2,
    children: initial?.children ?? 0,
    purpose: initial?.purpose,
  });
  const [query, setQuery] = useState(state.destinationLabel ?? state.destination);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounce(query, 200);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    const load = q.length >= 2 ? catalogService.suggestions(q).then((r) => [
      ...r.destinations.map((d) => ({ kind: "destination" as const, label: d.name, sub: d.country, value: d.slug, slug: d.slug })),
      ...r.hotels.map((h) => ({ kind: "hotel" as const, label: h.name, sub: `${h.area ? `${h.area}, ` : ""}${h.city}`, value: h.slug, slug: h.slug })),
    ]) : catalogService.destinations({ limit: 8, featured: "true" }).then((ds) => ds.map((d) => ({ kind: "destination" as const, label: d.name, sub: d.country, value: d.slug, slug: d.slug })));
    let cancelled = false;
    load.then((s) => !cancelled && setSuggestions(s)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => boxRef.current && !boxRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const nights = nightsBetween(state.checkIn, state.checkOut);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.checkIn || !state.checkOut || nights < 1) return setError("Check-out must be after check-in");
    if (nights > 30) return setError("Stays longer than 30 nights need a custom quote");
    setError(null);
    const destination = state.destination || query.trim();
    router.push(`/hotels?${hotelSearchParams({ ...state, destination })}`);
  }

  function pick(s: Suggestion) {
    setOpen(false);
    setQuery(s.label);
    if (s.kind === "hotel") {
      const p = hotelSearchParams({ ...state, destination: "" });
      p.delete("destination");
      router.push(`/hotels/${s.slug}?${p}`);
      return;
    }
    setState((st) => ({ ...st, destination: s.value, destinationLabel: s.label }));
  }

  const guests = state.adults + state.children;

  return (
    <form onSubmit={submit} noValidate aria-label="Hotel search">
      <div className={cn("grid gap-3 md:grid-cols-2", compact ? "lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr_auto]" : "lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr]")}>
        <div ref={boxRef} className="relative">
          <SearchBox label="City, hotel or area" icon={<MapPin className="size-3.5" />}>
            <input
              aria-label="Destination"
              className={searchInputClass}
              placeholder="Cox's Bazar, Sylhet, Bali…"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setState((st) => ({ ...st, destination: "", destinationLabel: undefined }));
                setOpen(true);
              }}
            />
            <p className="truncate text-xs text-ink-500">{state.destinationLabel ? "Destination selected" : "Type at least 2 letters"}</p>
          </SearchBox>
          {open && suggestions.length > 0 && (
            <ul role="listbox" className="absolute top-full left-0 z-40 mt-2 max-h-80 w-full min-w-72 overflow-y-auto rounded-xl border border-ink-100 bg-white p-1.5 shadow-(--shadow-lift)">
              {suggestions.map((s) => (
                <li key={`${s.kind}-${s.value}`} role="option" aria-selected={false} onMouseDown={(e) => { e.preventDefault(); pick(s); }} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-brand-50">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-600">{s.kind === "hotel" ? <Building2 className="size-4" /> : <MapPin className="size-4" />}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{s.label}</span>
                    <span className="block truncate text-xs text-ink-500">{s.kind === "hotel" ? `Hotel · ${s.sub}` : s.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <SearchBox label="Check-in" icon={<CalendarDays className="size-3.5" />}>
          <input
            type="date"
            aria-label="Check-in date"
            className={searchInputClass}
            min={todayInput()}
            value={state.checkIn}
            onChange={(e) => {
              const checkIn = e.target.value;
              setState((s) => ({ ...s, checkIn, checkOut: s.checkOut <= checkIn ? toDateInput(addDays(checkIn, 1)) : s.checkOut }));
            }}
          />
        </SearchBox>
        <SearchBox label={`Check-out${nights > 0 ? ` · ${nights} night${nights > 1 ? "s" : ""}` : ""}`} icon={<CalendarDays className="size-3.5" />} className={cn(error && "border-coral-400")}>
          <input type="date" aria-label="Check-out date" className={searchInputClass} min={toDateInput(addDays(state.checkIn, 1))} value={state.checkOut} onChange={(e) => setState((s) => ({ ...s, checkOut: e.target.value }))} />
        </SearchBox>
        <Popover
          align="right"
          trigger={({ toggle, open: o }) => (
            <button type="button" onClick={toggle} aria-expanded={o} className="w-full text-left">
              <SearchBox label="Rooms & guests" icon={<Users className="size-3.5" />}>
                <span className={cn(searchInputClass, "block truncate")}>
                  {state.rooms} room{state.rooms > 1 ? "s" : ""}, {guests} guest{guests > 1 ? "s" : ""}
                </span>
                <span className="block text-xs text-ink-500">
                  {state.adults} adult{state.adults > 1 ? "s" : ""}
                  {state.children ? `, ${state.children} child${state.children > 1 ? "ren" : ""}` : ""}
                </span>
              </SearchBox>
            </button>
          )}
        >
          {(close) => (
            <div>
              <Counter label="Rooms" value={state.rooms} min={1} max={8} onChange={(rooms) => setState((s) => ({ ...s, rooms, adults: Math.max(s.adults, rooms) }))} />
              <Counter label="Adults" hint="18+ years" value={state.adults} min={state.rooms} max={32} onChange={(adults) => setState((s) => ({ ...s, adults }))} />
              <Counter label="Children" hint="0–17 years" value={state.children} max={16} onChange={(children) => setState((s) => ({ ...s, children }))} />
              <Button className="mt-3 w-full" size="sm" onClick={close}>
                Done
              </Button>
            </div>
          )}
        </Popover>
        {compact && (
          <Button type="submit" variant="accent" size="lg" className="h-full min-h-14">
            <Search className="size-5" /> Search
          </Button>
        )}
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-coral-600">{error}</p>}
      {!compact && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Trip purpose">
            <span className="mr-1 flex items-center gap-1 text-xs font-bold tracking-wider text-ink-500 uppercase">
              <BedDouble className="size-3.5" /> Travelling for
            </span>
            {PURPOSES.map((p) => (
              <button key={p} type="button" aria-pressed={state.purpose === p} onClick={() => setState((s) => ({ ...s, purpose: s.purpose === p ? undefined : p }))} className={cn("rounded-full border px-3 py-1 text-[13px] font-semibold capitalize transition", state.purpose === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 text-ink-600 hover:border-ink-300")}>
                {p}
              </button>
            ))}
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full sm:w-auto">
            <Search className="size-5" /> Search hotels
          </Button>
        </div>
      )}
    </form>
  );
}

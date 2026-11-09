"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowLeftRight, CalendarDays, MapPin, Search } from "lucide-react";
import { cn, todayInput } from "@/lib/utils";
import { busService } from "@/services";
import { Button } from "../common/Button";
import { SearchBox, searchInputClass } from "../common/Popover";

export function BusSearchForm({ initial, compact = false }: { initial?: { from?: string; to?: string; date?: string }; compact?: boolean }) {
  const router = useRouter();
  const [cities, setCities] = useState<string[]>([]);
  const [from, setFrom] = useState(initial?.from ?? "Dhaka");
  const [to, setTo] = useState(initial?.to ?? "Cox's Bazar");
  const [date, setDate] = useState(initial?.date ?? todayInput(1));
  const [error, setError] = useState<string | null>(null);
  const listId = useId();

  useEffect(() => {
    busService.cities().then(setCities).catch(() => undefined);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return setError("Choose both cities");
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return setError("Departure and destination must differ");
    if (!date) return setError("Choose a journey date");
    setError(null);
    router.push(`/bus?${new URLSearchParams({ from: from.trim(), to: to.trim(), date })}`);
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Bus search">
      <datalist id={listId}>
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_auto]">
        <div className="relative grid gap-3 sm:grid-cols-2 md:col-span-2 lg:col-span-2">
          <SearchBox label="From" icon={<MapPin className="size-3.5" />}>
            <input list={listId} aria-label="Departure city" className={searchInputClass} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Departure city" />
          </SearchBox>
          <SearchBox label="To" icon={<MapPin className="size-3.5" />}>
            <input list={listId} aria-label="Destination city" className={searchInputClass} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Destination city" />
          </SearchBox>
          <button type="button" aria-label="Swap cities" onClick={() => { setFrom(to); setTo(from); }} className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-ink-200 bg-white text-brand-700 shadow-sm transition hover:rotate-180 sm:grid">
            <ArrowLeftRight className="size-4" />
          </button>
        </div>
        <SearchBox label="Journey date" icon={<CalendarDays className="size-3.5" />}>
          <input type="date" aria-label="Journey date" className={searchInputClass} min={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} />
        </SearchBox>
        <Button type="submit" variant="accent" size="lg" className={cn("h-full min-h-14 md:col-span-2 lg:col-span-1")}>
          <Search className="size-5" /> {compact ? "Search" : "Search buses"}
        </Button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-coral-600">{error}</p>}
    </form>
  );
}

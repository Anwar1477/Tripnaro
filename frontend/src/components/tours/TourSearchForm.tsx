"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Compass, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogService } from "@/services";
import type { Destination } from "@/types";
import { Button } from "../common/Button";
import { SelectFrame, selectClass } from "../common/FormControls";
import { SearchBox, searchInputClass } from "../common/Popover";

export const TOUR_CATEGORIES = [
  { value: "adventure", label: "Adventure" },
  { value: "family", label: "Family" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "group", label: "Group tours" },
  { value: "private", label: "Private tours" },
  { value: "day-trip", label: "Day trips" },
  { value: "cultural", label: "Cultural" },
  { value: "beach", label: "Beach" },
];

function nextMonths(count = 8) {
  const out: { value: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < count; i++) {
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

const searchSelectClass = cn(searchInputClass, selectClass, "select-search pr-6");

export function TourSearchForm({
  initial,
  compact = false,
}: {
  initial?: { destination?: string; month?: string; category?: string };
  compact?: boolean;
}) {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [month, setMonth] = useState(initial?.month ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");

  useEffect(() => {
    catalogService
      .destinations({ limit: 50 })
      .then(setDestinations)
      .catch(() => undefined);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (destination) p.set("destination", destination);
    if (month) p.set("month", month);
    if (category) p.set("category", category);
    router.push(`/tours${p.size ? `?${p}` : ""}`);
  }

  const domestic = destinations.filter((d) => d.scope === "domestic");
  const international = destinations.filter((d) => d.scope === "international");

  return (
    <form
      onSubmit={submit}
      aria-label="Tour search"
      className={cn(
        "grid gap-3 md:grid-cols-2",
        compact ? "lg:grid-cols-[1.4fr_1fr_1fr_auto]" : "lg:grid-cols-[1.4fr_1fr_1fr_auto]",
      )}
    >
      <SearchBox label="Destination" icon={<MapPin className="size-3.5" />}>
        <SelectFrame iconClassName="right-0">
          <select
            aria-label="Destination"
            className={searchSelectClass}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Anywhere</option>
            <optgroup label="Bangladesh">
              {domestic.map((d) => (
                <option key={d._id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="International">
              {international.map((d) => (
                <option key={d._id} value={d.slug}>
                  {d.name}, {d.country}
                </option>
              ))}
            </optgroup>
          </select>
        </SelectFrame>
      </SearchBox>
      <SearchBox label="Travel month" icon={<CalendarDays className="size-3.5" />}>
        <SelectFrame iconClassName="right-0">
          <select
            aria-label="Travel month"
            className={searchSelectClass}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Any time</option>
            {nextMonths().map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </SelectFrame>
      </SearchBox>
      <SearchBox label="Trip style" icon={<Compass className="size-3.5" />}>
        <SelectFrame iconClassName="right-0">
          <select
            aria-label="Trip style"
            className={searchSelectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All styles</option>
            {TOUR_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </SelectFrame>
      </SearchBox>
      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="h-full min-h-14 md:col-span-2 lg:col-span-1"
      >
        <Search className="size-5" /> {compact ? "Search" : "Find tours"}
      </Button>
    </form>
  );
}

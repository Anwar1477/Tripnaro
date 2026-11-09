"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PlaneLanding, PlaneTakeoff } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { flightService } from "@/services";
import type { Airport } from "@/types";
import { SearchBox, searchInputClass } from "../common/Popover";

let airportCache: Airport[] | null = null;

/** Accessible combobox with airport autocomplete (code, city or airport name). */
export function AirportInput({
  label,
  value,
  onChange,
  kind,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  kind: "from" | "to";
  error?: string;
  className?: string;
}) {
  const [all, setAll] = useState<Airport[]>(airportCache ?? []);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Airport[] | null>(null);
  const debounced = useDebounce(query, 200);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (airportCache) return;
    flightService.airports().then((a) => {
      airportCache = a;
      setAll(a);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!debounced || debounced.length < 2) return;
    let cancelled = false;
    flightService.airports(debounced).then((r) => !cancelled && setRemote(r)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => wrapRef.current && !wrapRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selected = all.find((a) => a.code === value);
  const options = (query.length >= 2 && remote) || (query ? all.filter((a) => `${a.code} ${a.city} ${a.name}`.toLowerCase().includes(query.toLowerCase())) : all);
  const shown = options.slice(0, 8);

  function choose(a: Airport) {
    onChange(a.code);
    setQuery("");
    setOpen(false);
  }

  const Icon = kind === "from" ? PlaneTakeoff : PlaneLanding;
  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <SearchBox label={label} icon={<Icon className="size-3.5" />} className={cn(error && "border-coral-400")}>
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={label}
          className={searchInputClass}
          placeholder={kind === "from" ? "City or airport" : "Where to?"}
          value={open ? query : selected ? `${selected.city} (${selected.code})` : value}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, shown.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && shown[active]) {
              e.preventDefault();
              choose(shown[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
        />
        <p className="truncate text-xs text-ink-500">{selected ? selected.name : error ?? "Select an airport"}</p>
      </SearchBox>
      {open && (
        <ul id={listId} role="listbox" className="absolute top-full left-0 z-40 mt-2 max-h-80 w-full min-w-72 overflow-y-auto rounded-xl border border-ink-100 bg-white p-1.5 shadow-(--shadow-lift)">
          {shown.length === 0 && <li className="px-3 py-3 text-sm text-ink-500">No airports match “{query}”</li>}
          {shown.map((a, i) => (
            <li
              key={a.code}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(a);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", i === active && "bg-brand-50")}
            >
              <span className="w-11 shrink-0 rounded-md bg-ink-100 py-1 text-center text-xs font-bold text-ink-700">{a.code}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {a.city}, {a.country}
                </span>
                <span className="block truncate text-xs text-ink-500">{a.name}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

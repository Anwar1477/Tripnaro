"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BusSearchForm } from "../bus/BusSearchForm";
import { FlightSearchForm } from "../flights/FlightSearchForm";
import { HotelSearchForm } from "../hotels/HotelSearchForm";
import { PRIMARY_NAV } from "../layout/nav";
import { TourSearchForm } from "../tours/TourSearchForm";
import { VisaSearchForm } from "../visa/VisaSearchForm";

type Tab = "flights" | "hotels" | "tours" | "bus" | "visa";

/** Tabbed search used in the homepage hero. */
export function SearchPanel({ initialTab = "flights" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div className="rounded-[1.5rem] bg-surface p-2 shadow-(--shadow-search)">
      {/* Phones: all five products visible as an icon grid (no hidden, scroll-only tabs). */}
      <div role="tablist" aria-label="What would you like to book?" className="grid grid-cols-5 gap-1 rounded-2xl bg-ink-50 p-1 sm:flex">
        {PRIMARY_NAV.map(({ label, href, icon: Icon }) => {
          const key = href.slice(1) as Tab;
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              id={`tab-${key}`}
              aria-selected={active}
              aria-controls={`panel-${key}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(e) => {
                // WAI-ARIA tabs: arrows / Home / End move between tabs (automatic activation).
                const keys = PRIMARY_NAV.map((n) => n.href.slice(1) as Tab);
                const i = keys.indexOf(key);
                const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: keys.length - 1 }[e.key];
                if (next === undefined) return;
                e.preventDefault();
                const target = keys[(next + keys.length) % keys.length];
                setTab(target);
                document.getElementById(`tab-${target}`)?.focus();
              }}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-bold transition sm:min-w-fit sm:flex-1 sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                active ? "bg-surface text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-800",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-3 sm:p-5">
        {tab === "flights" && <FlightSearchForm />}
        {tab === "hotels" && <HotelSearchForm />}
        {tab === "tours" && <TourSearchForm />}
        {tab === "bus" && <BusSearchForm />}
        {tab === "visa" && <VisaSearchForm />}
      </div>
    </div>
  );
}

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
    <div className="rounded-[1.5rem] bg-white p-2 shadow-(--shadow-search)">
      <div role="tablist" aria-label="What would you like to book?" className="scrollbar-none flex gap-1 overflow-x-auto rounded-2xl bg-ink-50 p-1">
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
              onClick={() => setTab(key)}
              className={cn(
                "flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                active ? "bg-white text-brand-700 shadow-sm" : "text-ink-500 hover:text-ink-800",
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

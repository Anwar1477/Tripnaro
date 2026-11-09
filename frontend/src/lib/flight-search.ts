import type { FlightSearchInitial } from "@/components/flights/FlightSearchForm";
import type { FlightSearchBody } from "@/services";
import type { CabinClass } from "@/types";
import { todayInput } from "./utils";

type Reader = { get(key: string): string | null };

/** Parses the shareable search URL into an API search body. */
export function parseFlightSearch(sp: Reader): (FlightSearchBody & { initial: FlightSearchInitial }) | null {
  const tripType = (sp.get("trip") as FlightSearchBody["tripType"]) ?? "one_way";
  const cabinClass = (sp.get("cabin") as CabinClass) ?? "economy";
  const passengers = { adults: Math.max(1, Number(sp.get("adults") ?? 1)), children: Number(sp.get("children") ?? 0), infants: Number(sp.get("infants") ?? 0) };
  let legs: FlightSearchBody["legs"];
  if (tripType === "multi_city") {
    legs = (sp.get("legs") ?? "").split(",").filter(Boolean).map((s) => {
      const [from, to, ...d] = s.split("-");
      return { from, to, date: d.join("-") };
    });
  } else {
    const from = sp.get("from");
    const to = sp.get("to");
    const date = sp.get("date");
    if (!from || !to || !date) return null;
    legs = [{ from, to, date }];
  }
  if (!legs.length || legs.some((l) => !l.from || !l.to || !/^\d{4}-\d{2}-\d{2}$/.test(l.date))) return null;
  const returnDate = tripType === "round_trip" ? (sp.get("return") ?? undefined) : undefined;
  return { tripType, legs, returnDate, cabinClass, passengers, initial: { tripType, legs, returnDate: returnDate ?? todayInput(10), cabinClass, passengers } };
}


/** Serialises a search into a shareable URL (search state lives in the query string). */
export function flightSearchUrl(s: Required<FlightSearchInitial>) {
  const p = new URLSearchParams({
    trip: s.tripType,
    cabin: s.cabinClass,
    adults: String(s.passengers.adults),
    children: String(s.passengers.children),
    infants: String(s.passengers.infants),
  });
  if (s.tripType === "multi_city") p.set("legs", s.legs.map((l) => `${l.from}-${l.to}-${l.date}`).join(","));
  else {
    p.set("from", s.legs[0].from);
    p.set("to", s.legs[0].to);
    p.set("date", s.legs[0].date);
    if (s.tripType === "round_trip") p.set("return", s.returnDate);
  }
  return `/flights/search?${p}`;
}


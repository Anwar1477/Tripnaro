"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CabinClass, FlightOffer, Passengers } from "@/types";

interface FlightSelectionState {
  cabinClass: CabinClass;
  passengers: Passengers;
  /** One selected offer per leg (outbound, return, or each multi-city leg). */
  selected: FlightOffer[];
  setSelection: (selected: FlightOffer[], cabinClass: CabinClass, passengers: Passengers) => void;
  clear: () => void;
}

/**
 * Keeps the chosen flight offers between the results page and passenger details.
 * Only offer ids are sent to the API; prices are always re-checked on the server.
 */
export const useFlightSelection = create<FlightSelectionState>()(
  persist(
    (set) => ({
      cabinClass: "economy",
      passengers: { adults: 1, children: 0, infants: 0 },
      selected: [],
      setSelection: (selected, cabinClass, passengers) => set({ selected, cabinClass, passengers }),
      clear: () => set({ selected: [] }),
    }),
    { name: "tripnaro-flight-selection", storage: createJSONStorage(() => sessionStorage) },
  ),
);

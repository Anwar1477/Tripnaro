import type { CabinClass } from '../../models/Flight';

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightLegQuery {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
}

export interface FlightSearchQuery {
  legs: FlightLegQuery[];
  cabinClass: CabinClass;
  passengers: PassengerCounts;
}

export interface FlightSegment {
  from: string;
  to: string;
  departureAt: string; // ISO
  arrivalAt: string;
}

export interface FlightOffer {
  offerId: string;
  /** Internal schedule id (demo provider) used to track seat inventory. */
  scheduleId?: string;
  provider: string;
  isDemo: boolean;
  legIndex: number;
  airline: { code: string; name: string; logo?: string };
  flightNumber: string;
  aircraft?: string;
  from: string;
  to: string;
  fromCity?: string;
  toCity?: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  layovers: { airport: string; city?: string; durationMinutes: number }[];
  cabinClass: CabinClass;
  baggage: { cabin: string; checked: string };
  refundable: boolean;
  seatsLeft: number;
  fare: {
    currency: string;
    perAdult: number;
    baseTotal: number;
    taxesTotal: number;
    total: number;
    breakdown: { label: string; amount: number }[];
  };
}

/** Contract every flight inventory source (demo, Amadeus, Sabre, Travelport, NDC …) implements. */
export interface FlightProvider {
  readonly name: string;
  readonly isDemo: boolean;
  isConfigured(): boolean;
  search(query: FlightSearchQuery): Promise<FlightOffer[][]>; // one result list per leg
  /** Re-prices an offer server-side. Never trust a price sent by the browser. */
  priceOffer(offerId: string, cabinClass: CabinClass, passengers: PassengerCounts): Promise<FlightOffer>;
}

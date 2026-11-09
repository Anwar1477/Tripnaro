import { env } from '../../config/env';
import type { CabinClass } from '../../models/Flight';
import { ApiError } from '../../utils/ApiError';
import type { FlightOffer, FlightProvider, FlightSearchQuery, PassengerCounts } from './types';

const BASE_URL = 'https://test.api.amadeus.com';
const CABIN_MAP: Record<CabinClass, string> = {
  economy: 'ECONOMY',
  premium_economy: 'PREMIUM_ECONOMY',
  business: 'BUSINESS',
  first: 'FIRST',
};

/**
 * Live inventory adapter for the Amadeus Flight Offers Search API (test environment).
 * Activated with FLIGHT_PROVIDER=amadeus plus AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET.
 * Ticket issuance additionally requires a consolidator / IATA agreement, which is outside
 * the scope of this adapter; bookings made through it are held for manual ticketing.
 */
export class AmadeusFlightProvider implements FlightProvider {
  readonly name = 'amadeus';
  readonly isDemo = false;
  private token: { value: string; expiresAt: number } | null = null;
  private offerCache = new Map<string, { offer: FlightOffer; expiresAt: number }>();

  isConfigured() {
    return Boolean(env.AMADEUS_CLIENT_ID && env.AMADEUS_CLIENT_SECRET);
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: env.AMADEUS_CLIENT_ID,
        client_secret: env.AMADEUS_CLIENT_SECRET,
      }),
    });
    if (!res.ok) throw ApiError.unavailable('Flight provider authentication failed');
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
    return this.token.value;
  }

  async search(query: FlightSearchQuery): Promise<FlightOffer[][]> {
    if (!this.isConfigured()) throw ApiError.unavailable('Amadeus credentials are not configured');
    const token = await this.accessToken();
    return Promise.all(
      query.legs.map(async (leg, legIndex) => {
        const params = new URLSearchParams({
          originLocationCode: leg.from,
          destinationLocationCode: leg.to,
          departureDate: leg.date,
          adults: String(query.passengers.adults),
          children: String(query.passengers.children),
          infants: String(query.passengers.infants),
          travelClass: CABIN_MAP[query.cabinClass],
          currencyCode: 'BDT',
          max: '30',
        });
        const res = await fetch(`${BASE_URL}/v2/shopping/flight-offers?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw ApiError.unavailable('Flight provider search failed');
        const json = (await res.json()) as { data: AmadeusOffer[]; dictionaries?: { carriers?: Record<string, string> } };
        return json.data.map((o) => this.map(o, legIndex, query.cabinClass, json.dictionaries?.carriers ?? {}));
      }),
    );
  }

  async priceOffer(offerId: string, _cabin: CabinClass, _pax: PassengerCounts): Promise<FlightOffer> {
    const cached = this.offerCache.get(offerId);
    if (!cached || cached.expiresAt < Date.now()) {
      throw ApiError.badRequest('This flight offer has expired. Please search again.');
    }
    return cached.offer;
  }

  private map(o: AmadeusOffer, legIndex: number, cabinClass: CabinClass, carriers: Record<string, string>): FlightOffer {
    const itinerary = o.itineraries[0];
    const segs = itinerary.segments;
    const first = segs[0];
    const last = segs[segs.length - 1];
    const total = Number(o.price.grandTotal);
    const base = Number(o.price.base);
    const offer: FlightOffer = {
      offerId: `amadeus.${o.id}.${Date.now()}`,
      provider: this.name,
      isDemo: false,
      legIndex,
      airline: { code: first.carrierCode, name: carriers[first.carrierCode] ?? first.carrierCode },
      flightNumber: `${first.carrierCode}${first.number}`,
      from: first.departure.iataCode,
      to: last.arrival.iataCode,
      departureAt: first.departure.at,
      arrivalAt: last.arrival.at,
      durationMinutes: isoDurationToMinutes(itinerary.duration),
      stops: segs.length - 1,
      layovers: segs.slice(0, -1).map((s, i) => ({
        airport: s.arrival.iataCode,
        durationMinutes: Math.round((Date.parse(segs[i + 1].departure.at) - Date.parse(s.arrival.at)) / 60000),
      })),
      cabinClass,
      baggage: { cabin: '7 kg', checked: 'As per fare rules' },
      refundable: false,
      seatsLeft: o.numberOfBookableSeats ?? 9,
      fare: {
        currency: o.price.currency,
        perAdult: total,
        baseTotal: base,
        taxesTotal: total - base,
        total,
        breakdown: [{ label: 'Total fare', amount: total }],
      },
    };
    this.offerCache.set(offer.offerId, { offer, expiresAt: Date.now() + 20 * 60_000 });
    return offer;
  }
}

interface AmadeusOffer {
  id: string;
  numberOfBookableSeats?: number;
  itineraries: {
    duration: string;
    segments: { carrierCode: string; number: string; departure: { iataCode: string; at: string }; arrival: { iataCode: string; at: string } }[];
  }[];
  price: { currency: string; base: string; grandTotal: string };
}

function isoDurationToMinutes(iso: string): number {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  return (Number(m?.[1] ?? 0) * 60) + Number(m?.[2] ?? 0);
}

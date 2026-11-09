import { env } from '../../config/env';
import { Airport } from '../../models/Airport';
import { Booking } from '../../models/Booking';
import { Flight, type CabinClass } from '../../models/Flight';
import { ApiError } from '../../utils/ApiError';
import { hmac, parseDateOnly } from '../../utils/helpers';
import type { FlightOffer, FlightProvider, FlightSearchQuery, PassengerCounts } from './types';

interface OfferToken {
  f: string; // flight schedule id
  d: string; // YYYY-MM-DD
  c: CabinClass;
  l: number; // leg index
}

const CHILD_FACTOR = 0.75;
const INFANT_FACTOR = 0.1;

function encodeOffer(token: OfferToken): string {
  const body = Buffer.from(JSON.stringify(token)).toString('base64url');
  return `demo.${body}.${hmac(body, env.JWT_SECRET).slice(0, 16)}`;
}

function decodeOffer(offerId: string): OfferToken {
  const [prefix, body, sig] = offerId.split('.');
  if (prefix !== 'demo' || !body || sig !== hmac(body, env.JWT_SECRET).slice(0, 16)) {
    throw ApiError.badRequest('This flight offer is invalid or has expired. Please search again.');
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString());
}

/** Deterministic day-to-day fare movement (0.9x – 1.3x) so prices look dynamic but stay stable. */
function demandFactor(flightId: string, date: string): number {
  let h = 0;
  for (const ch of flightId + date) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 0.9 + (h % 40) / 100;
}

function formatLocal(utcMs: number, offsetMinutes: number): string {
  const local = new Date(utcMs + offsetMinutes * 60_000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const off = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
  return `${local.toISOString().slice(0, 19)}${off}`;
}

/**
 * DEMO inventory provider: serves Tripnaro's seeded sample schedules from MongoDB.
 * It does not represent real airline availability. Every offer is flagged `isDemo: true`
 * and the UI labels results accordingly.
 */
export class DemoFlightProvider implements FlightProvider {
  readonly name = 'tripnaro-demo';
  readonly isDemo = true;

  isConfigured() {
    return true;
  }

  async search(query: FlightSearchQuery): Promise<FlightOffer[][]> {
    return Promise.all(query.legs.map((leg, legIndex) => this.searchLeg(leg.from, leg.to, leg.date, legIndex, query)));
  }

  private async searchLeg(from: string, to: string, date: string, legIndex: number, query: FlightSearchQuery) {
    const day = parseDateOnly(date).getUTCDay();
    const flights = await Flight.find({ from, to, active: true, daysOfWeek: day, 'cabins.cabinClass': query.cabinClass });
    if (!flights.length) return [];

    const airports = await this.airportMap([from, to, ...flights.flatMap((f) => f.layovers.map((l) => l.airport ?? ''))]);
    const booked = await this.bookedSeats(flights.map((f) => f.id), date, query.cabinClass);
    const now = Date.now();

    return flights
      .map((flight) => this.toOffer(flight, date, legIndex, query.cabinClass, query.passengers, airports, booked[flight.id] ?? 0))
      .filter((o): o is FlightOffer => !!o && Date.parse(o.departureAt) > now + 2 * 3600_000 && o.seatsLeft > 0);
  }

  async priceOffer(offerId: string, cabinClass: CabinClass, passengers: PassengerCounts): Promise<FlightOffer> {
    const token = decodeOffer(offerId);
    if (token.c !== cabinClass) throw ApiError.badRequest('Cabin class does not match the selected offer');
    const flight = await Flight.findById(token.f);
    if (!flight || !flight.active) throw ApiError.notFound('Flight');
    const airports = await this.airportMap([flight.from, flight.to]);
    const booked = await this.bookedSeats([flight.id], token.d, cabinClass);
    const offer = this.toOffer(flight, token.d, token.l, cabinClass, passengers, airports, booked[flight.id] ?? 0);
    if (!offer) throw ApiError.badRequest('This cabin is no longer available');
    const seatsNeeded = passengers.adults + passengers.children;
    if (offer.seatsLeft < seatsNeeded) throw ApiError.conflict('Not enough seats left on this flight');
    return offer;
  }

  private toOffer(
    flight: InstanceType<typeof Flight>,
    date: string,
    legIndex: number,
    cabinClass: CabinClass,
    pax: PassengerCounts,
    airports: Map<string, { city: string; utcOffset: number }>,
    bookedSeats: number,
  ): FlightOffer | null {
    const cabin = flight.cabins.find((c) => c.cabinClass === cabinClass);
    if (!cabin) return null;

    const origin = airports.get(flight.from);
    const dest = airports.get(flight.to);
    const originOffset = origin?.utcOffset ?? 360;
    const destOffset = dest?.utcOffset ?? 360;

    const [hh, mm] = flight.departureTime.split(':').map(Number);
    const depUtc = parseDateOnly(date).getTime() + (hh * 60 + mm - originOffset) * 60_000;
    const arrUtc = depUtc + flight.durationMinutes * 60_000;

    const factor = demandFactor(flight.id, date);
    const adultBase = Math.round(cabin.baseFare * factor);
    const adultTax = cabin.taxes ?? 0;
    const childBase = Math.round(adultBase * CHILD_FACTOR);
    const infantBase = Math.round(adultBase * INFANT_FACTOR);

    const breakdown = [
      { label: `Adult × ${pax.adults}`, amount: (adultBase + adultTax) * pax.adults },
      ...(pax.children ? [{ label: `Child × ${pax.children}`, amount: (childBase + adultTax) * pax.children }] : []),
      ...(pax.infants ? [{ label: `Infant × ${pax.infants}`, amount: infantBase * pax.infants }] : []),
    ];
    const baseTotal = adultBase * pax.adults + childBase * pax.children + infantBase * pax.infants;
    const taxesTotal = adultTax * (pax.adults + pax.children);

    return {
      offerId: encodeOffer({ f: flight.id, d: date, c: cabinClass, l: legIndex }),
      scheduleId: flight.id,
      provider: this.name,
      isDemo: true,
      legIndex,
      airline: { code: flight.airline?.code ?? '', name: flight.airline?.name ?? '', logo: flight.airline?.logo ?? undefined },
      flightNumber: flight.flightNumber,
      aircraft: flight.aircraft ?? undefined,
      from: flight.from,
      to: flight.to,
      fromCity: origin?.city,
      toCity: dest?.city,
      departureAt: formatLocal(depUtc, originOffset),
      arrivalAt: formatLocal(arrUtc, destOffset),
      durationMinutes: flight.durationMinutes,
      stops: flight.stops,
      layovers: flight.layovers.map((l) => ({
        airport: l.airport ?? '',
        city: l.city ?? airports.get(l.airport ?? '')?.city,
        durationMinutes: l.durationMinutes ?? 0,
      })),
      cabinClass,
      baggage: { cabin: flight.baggage?.cabin ?? '7 kg', checked: flight.baggage?.checked ?? '20 kg' },
      refundable: flight.refundable,
      seatsLeft: Math.max(0, cabin.seats - bookedSeats),
      fare: { currency: 'BDT', perAdult: adultBase + adultTax, baseTotal, taxesTotal, total: baseTotal + taxesTotal, breakdown },
    };
  }

  private async airportMap(codes: string[]) {
    const airports = await Airport.find({ code: { $in: [...new Set(codes.filter(Boolean))] } }).lean();
    return new Map(airports.map((a) => [a.code, { city: a.city, utcOffset: utcOffsetFor(a.timezone) }]));
  }

  /** Seats already taken on a schedule for a date (confirmed or still on hold). */
  private async bookedSeats(flightIds: string[], date: string, cabinClass: CabinClass) {
    const rows = await Booking.aggregate<{ _id: string; seats: number }>([
      {
        $match: {
          type: 'flight',
          status: { $in: ['pending', 'confirmed'] },
          $or: [{ status: 'confirmed' }, { holdExpiresAt: { $gt: new Date() } }],
          'details.legs': { $elemMatch: { flightId: { $in: flightIds }, date, cabinClass } },
        },
      },
      { $unwind: '$details.legs' },
      { $match: { 'details.legs.flightId': { $in: flightIds }, 'details.legs.date': date } },
      { $group: { _id: '$details.legs.flightId', seats: { $sum: '$details.seatCount' } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.seats]));
  }
}

const OFFSETS: Record<string, number> = {
  'Asia/Dhaka': 360,
  'Asia/Dubai': 240,
  'Asia/Kolkata': 330,
  'Asia/Kathmandu': 345,
  'Asia/Bangkok': 420,
  'Asia/Singapore': 480,
  'Asia/Kuala_Lumpur': 480,
  'Asia/Riyadh': 180,
  'Asia/Qatar': 180,
  'Indian/Maldives': 300,
  'Europe/London': 0,
  'Asia/Istanbul': 180,
};

function utcOffsetFor(tz?: string | null): number {
  return OFFSETS[tz ?? 'Asia/Dhaka'] ?? 360;
}

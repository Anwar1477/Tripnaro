import type { Request, Response } from 'express';
import { z } from 'zod';
import { Airport } from '../models/Airport';
import { Bus } from '../models/Bus';
import { CABIN_CLASSES } from '../models/Flight';
import { busSeatSummary, takenBusSeats } from '../services/availability.service';
import { getFlightProvider, getProviderForOffer } from '../services/flights';
import { ApiError } from '../utils/ApiError';
import { escapeRegex, num, str } from '../utils/query';
import { sendSuccess } from '../utils/response';

/* ───────────────────────── Flights ───────────────────────── */

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const airportCode = z.string().trim().toUpperCase().length(3, 'Use a 3-letter airport code');

export const flightSearchSchema = z
  .object({
    tripType: z.enum(['one_way', 'round_trip', 'multi_city']),
    legs: z.array(z.object({ from: airportCode, to: airportCode, date: dateOnly })).min(1).max(5),
    returnDate: dateOnly.optional(),
    cabinClass: z.enum(CABIN_CLASSES).default('economy'),
    passengers: z.object({
      adults: z.coerce.number().int().min(1).max(9),
      children: z.coerce.number().int().min(0).max(8).default(0),
      infants: z.coerce.number().int().min(0).max(4).default(0),
    }),
  })
  .superRefine((v, ctx) => {
    v.legs.forEach((leg, i) => {
      if (leg.from === leg.to) ctx.addIssue({ code: 'custom', path: ['legs', i, 'to'], message: 'Origin and destination must differ' });
    });
    if (v.tripType === 'round_trip' && !v.returnDate) ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return date is required' });
    if (v.tripType === 'round_trip' && v.returnDate && v.returnDate < v.legs[0].date) {
      ctx.addIssue({ code: 'custom', path: ['returnDate'], message: 'Return must be after departure' });
    }
    if (v.passengers.infants > v.passengers.adults) {
      ctx.addIssue({ code: 'custom', path: ['passengers', 'infants'], message: 'Each infant must travel with an adult' });
    }
    if (v.passengers.adults + v.passengers.children > 9) {
      ctx.addIssue({ code: 'custom', path: ['passengers'], message: 'Maximum 9 seated passengers per booking' });
    }
  });

export async function searchAirports(req: Request, res: Response) {
  const q = str(req.query.q);
  const filter = q
    ? { $or: [{ code: new RegExp(`^${escapeRegex(q)}`, 'i') }, { city: new RegExp(escapeRegex(q), 'i') }, { name: new RegExp(escapeRegex(q), 'i') }] }
    : {};
  const airports = await Airport.find(filter).sort({ domestic: -1, city: 1 }).limit(q ? 10 : 30).lean();
  sendSuccess(res, airports);
}

export async function searchFlights(req: Request, res: Response) {
  const query = req.body as z.infer<typeof flightSearchSchema>;
  const legs = query.tripType === 'round_trip'
    ? [query.legs[0], { from: query.legs[0].to, to: query.legs[0].from, date: query.returnDate! }]
    : query.tripType === 'one_way'
      ? [query.legs[0]]
      : query.legs;

  const provider = getFlightProvider();
  const results = await provider.search({ legs, cabinClass: query.cabinClass, passengers: query.passengers });
  sendSuccess(res, {
    provider: provider.name,
    isDemo: provider.isDemo,
    notice: provider.isDemo
      ? 'Demo inventory: these are Tripnaro sample schedules, not live airline availability. Connect a GDS/NDC provider for real fares.'
      : undefined,
    legs: legs.map((leg, i) => ({ ...leg, offers: results[i] ?? [] })),
  });
}

export async function getFlightOffer(req: Request, res: Response) {
  const offerId = String(req.params.offerId);
  const cabin = z.enum(CABIN_CLASSES).parse(str(req.query.cabinClass) ?? 'economy');
  const passengers = {
    adults: Math.max(1, num(req.query.adults) ?? 1),
    children: num(req.query.children) ?? 0,
    infants: num(req.query.infants) ?? 0,
  };
  const offer = await getProviderForOffer(offerId).priceOffer(offerId, cabin, passengers);
  sendSuccess(res, offer);
}

/* ───────────────────────── Buses ───────────────────────── */

export async function busCities(_req: Request, res: Response) {
  const [from, to] = await Promise.all([Bus.distinct('from', { active: true }), Bus.distinct('to', { active: true })]);
  sendSuccess(res, [...new Set([...from, ...to])].sort());
}

export async function searchBuses(req: Request, res: Response) {
  const from = str(req.query.from);
  const to = str(req.query.to);
  const date = str(req.query.date);
  if (!from || !to || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw ApiError.badRequest('from, to and date (YYYY-MM-DD) are required');
  }
  if (from.toLowerCase() === to.toLowerCase()) throw ApiError.badRequest('Departure and destination must differ');

  const filter: Record<string, unknown> = {
    active: true,
    from: new RegExp(`^${escapeRegex(from)}$`, 'i'),
    to: new RegExp(`^${escapeRegex(to)}$`, 'i'),
  };
  const busType = str(req.query.busType);
  if (busType) filter.busType = busType;

  const buses = await Bus.find(filter).sort({ departureTime: 1 }).lean();
  const now = Date.now();
  const results = await Promise.all(
    buses.map(async (bus) => {
      const [hh, mm] = bus.departureTime.split(':').map(Number);
      const departsAt = Date.parse(`${date}T00:00:00Z`) + (hh * 60 + mm - 360) * 60_000;
      const perRow = bus.seatLayout.split('+').reduce((s: number, n: string) => s + Number(n), 0);
      const total = perRow * bus.rows;
      const taken = await takenBusSeats(String(bus._id), date);
      return { ...bus, journeyDate: date, totalSeats: total, availableSeats: total - taken.length, departed: departsAt < now + 30 * 60_000 };
    }),
  );
  sendSuccess(res, results.filter((r) => !r.departed));
}

export async function busSeats(req: Request, res: Response) {
  const date = str(req.query.date);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw ApiError.badRequest('date (YYYY-MM-DD) is required');
  const summary = await busSeatSummary(String(req.params.id), date);
  if (!summary) throw ApiError.notFound('Bus');
  sendSuccess(res, { ...summary, journeyDate: date });
}

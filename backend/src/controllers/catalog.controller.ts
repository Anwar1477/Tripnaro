import type { Request, Response } from 'express';
import type { SortOrder } from 'mongoose';
import { Destination } from '../models/Destination';
import { Review } from '../models/Engagement';
import { Hotel } from '../models/Hotel';
import { Room } from '../models/Room';
import { Tour } from '../models/Tour';
import { roomAvailability } from '../services/availability.service';
import { ApiError } from '../utils/ApiError';
import { nightsBetween, parseDateOnly } from '../utils/helpers';
import { buildMeta, escapeRegex, getPagination, list, num, str } from '../utils/query';
import { sendSuccess } from '../utils/response';

/* ───────────────────────── Destinations ───────────────────────── */

export async function listDestinations(req: Request, res: Response) {
  const filter: Record<string, unknown> = { published: true };
  const scope = str(req.query.scope);
  if (scope) filter.scope = scope;
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.trending === 'true') filter.trending = true;
  const country = str(req.query.country);
  if (country) filter.countrySlug = country;
  const q = str(req.query.q);
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');
  const limit = Math.min(50, num(req.query.limit) ?? 24);
  const items = await Destination.find(filter).sort({ featured: -1, name: 1 }).limit(limit);
  sendSuccess(res, items);
}

/** Resolves /destinations/:slug either to a country (with its destinations) or a single destination. */
export async function resolveDestination(req: Request, res: Response) {
  const slug = String(req.params.slug).toLowerCase();
  const destination = await Destination.findOne({ slug, published: true });
  if (destination) {
    const [tours, hotels] = await Promise.all([
      Tour.find({ destination: destination._id, published: true }).sort({ featured: -1, rating: -1 }).limit(8).populate('destination', 'name slug'),
      Hotel.find({ destination: destination._id, published: true }).sort({ featured: -1, rating: -1 }).limit(8),
    ]);
    return sendSuccess(res, { kind: 'destination', destination, tours, hotels });
  }
  const destinations = await Destination.find({ countrySlug: slug, published: true }).sort({ featured: -1, name: 1 });
  if (!destinations.length) throw ApiError.notFound('Destination');
  const ids = destinations.map((d) => d._id);
  const [tours, hotels] = await Promise.all([
    Tour.find({ destination: { $in: ids }, published: true }).sort({ rating: -1 }).limit(8).populate('destination', 'name slug'),
    Hotel.find({ destination: { $in: ids }, published: true }).sort({ rating: -1 }).limit(8),
  ]);
  sendSuccess(res, { kind: 'country', country: destinations[0].country, countrySlug: slug, destinations, tours, hotels });
}

export async function searchSuggestions(req: Request, res: Response) {
  const q = str(req.query.q);
  if (!q || q.length < 2) return sendSuccess(res, { destinations: [], hotels: [], tours: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [destinations, hotels, tours] = await Promise.all([
    Destination.find({ published: true, $or: [{ name: rx }, { country: rx }] }).select('name slug country image').limit(5),
    Hotel.find({ published: true, $or: [{ name: rx }, { city: rx }, { area: rx }] }).select('name slug city area').limit(5),
    Tour.find({ published: true, title: rx }).select('title slug durationDays').limit(5),
  ]);
  sendSuccess(res, { destinations, hotels, tours });
}

/* ───────────────────────── Hotels ───────────────────────── */

const HOTEL_SORTS: Record<string, Record<string, SortOrder>> = {
  recommended: { featured: -1, rating: -1 },
  price_asc: { priceFrom: 1 },
  price_desc: { priceFrom: -1 },
  rating: { rating: -1, reviewCount: -1 },
  stars: { stars: -1 },
};

export async function listHotels(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 12, 48);
  const filter: Record<string, unknown> = { published: true };

  const destination = str(req.query.destination);
  if (destination) {
    const dest = await Destination.findOne({ $or: [{ slug: destination.toLowerCase() }, { name: new RegExp(`^${escapeRegex(destination)}$`, 'i') }] });
    if (dest) filter.destination = dest._id;
    else {
      const rx = new RegExp(escapeRegex(destination), 'i');
      filter.$or = [{ city: rx }, { name: rx }, { area: rx }];
    }
  }
  const q = str(req.query.q);
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');

  const price: Record<string, number> = {};
  const minPrice = num(req.query.minPrice);
  const maxPrice = num(req.query.maxPrice);
  if (minPrice !== undefined) price.$gte = minPrice;
  if (maxPrice !== undefined) price.$lte = maxPrice;
  if (Object.keys(price).length) filter.priceFrom = price;

  const stars = list(req.query.stars).map(Number).filter(Boolean);
  if (stars.length) filter.stars = { $in: stars };
  const types = list(req.query.propertyType);
  if (types.length) filter.propertyType = { $in: types };
  const amenities = list(req.query.amenities);
  if (amenities.length) filter.amenities = { $all: amenities };
  const minRating = num(req.query.minRating);
  if (minRating) filter.rating = { $gte: minRating };
  const purpose = str(req.query.purpose);
  if (purpose) filter.tripPurposes = purpose;

  const sort = HOTEL_SORTS[str(req.query.sort) ?? 'recommended'] ?? HOTEL_SORTS.recommended;
  const [items, total, facets] = await Promise.all([
    Hotel.find(filter).sort(sort).skip(skip).limit(limit).populate('destination', 'name slug'),
    Hotel.countDocuments(filter),
    Hotel.aggregate([
      { $match: { published: true, ...(filter.destination ? { destination: filter.destination } : {}) } },
      { $group: { _id: null, min: { $min: '$priceFrom' }, max: { $max: '$priceFrom' }, amenities: { $addToSet: '$amenities' } } },
    ]),
  ]);
  const facet = facets[0];
  const allAmenities = facet ? [...new Set((facet.amenities as string[][]).flat())].sort() : [];
  sendSuccess(res, items, {
    meta: { ...buildMeta(page, limit, total), priceRange: { min: facet?.min ?? 0, max: facet?.max ?? 0 }, amenities: allAmenities },
  });
}

export async function getHotel(req: Request, res: Response) {
  const hotel = await Hotel.findOne({ slug: req.params.slug, published: true }).populate('destination', 'name slug country countrySlug');
  if (!hotel) throw ApiError.notFound('Hotel');

  const rooms = await Room.find({ hotel: hotel._id, active: true }).sort({ price: 1 });
  const checkIn = str(req.query.checkIn);
  const checkOut = str(req.query.checkOut);
  let availability: Map<string, number> | null = null;
  let nights = 1;
  if (checkIn && checkOut) {
    const ci = parseDateOnly(checkIn);
    const co = parseDateOnly(checkOut);
    nights = Math.max(1, nightsBetween(ci, co));
    if (co > ci) availability = await roomAvailability(hotel.id, ci, co);
  }

  const [reviews, ratingBreakdown, similar] = await Promise.all([
    Review.find({ target: hotel._id, status: 'approved' }).sort({ createdAt: -1 }).limit(10).populate('user', 'name avatar'),
    Review.aggregate([{ $match: { target: hotel._id, status: 'approved' } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
    Hotel.find({ destination: hotel.destination, _id: { $ne: hotel._id }, published: true }).sort({ rating: -1 }).limit(4),
  ]);

  sendSuccess(res, {
    hotel,
    nights,
    rooms: rooms.map((r) => ({
      ...r.toObject(),
      available: availability ? (availability.get(r.id) ?? 0) : r.totalRooms,
    })),
    reviews,
    ratingBreakdown: Object.fromEntries(ratingBreakdown.map((r) => [r._id, r.count])),
    similar,
  });
}

/* ───────────────────────── Tours ───────────────────────── */

const TOUR_SORTS: Record<string, Record<string, SortOrder>> = {
  recommended: { featured: -1, rating: -1 },
  price_asc: { priceAdult: 1 },
  price_desc: { priceAdult: -1 },
  duration: { durationDays: 1 },
  rating: { rating: -1 },
  newest: { createdAt: -1 },
};

export async function listTours(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 12, 48);
  const filter: Record<string, unknown> = { published: true };

  const destination = str(req.query.destination);
  if (destination) {
    const dest = await Destination.findOne({ slug: destination.toLowerCase() });
    if (dest) filter.destination = dest._id;
    else filter.title = new RegExp(escapeRegex(destination), 'i');
  }
  const q = str(req.query.q);
  if (q) filter.$or = [{ title: new RegExp(escapeRegex(q), 'i') }, { startLocation: new RegExp(escapeRegex(q), 'i') }];
  const scope = str(req.query.scope);
  if (scope) filter.scope = scope;
  const categories = list(req.query.category);
  if (categories.length) filter.categories = { $in: categories };
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.customizable === 'true') filter.customizable = true;

  const price: Record<string, number> = {};
  const minPrice = num(req.query.minPrice);
  const maxPrice = num(req.query.maxPrice);
  if (minPrice !== undefined) price.$gte = minPrice;
  if (maxPrice !== undefined) price.$lte = maxPrice;
  if (Object.keys(price).length) filter.priceAdult = price;

  const minDays = num(req.query.minDays);
  const maxDays = num(req.query.maxDays);
  if (minDays || maxDays) filter.durationDays = { ...(minDays ? { $gte: minDays } : {}), ...(maxDays ? { $lte: maxDays } : {}) };

  const month = str(req.query.month); // YYYY-MM
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const start = parseDateOnly(`${month}-01`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    filter.departures = { $elemMatch: { date: { $gte: start, $lt: end } } };
  }

  const sort = TOUR_SORTS[str(req.query.sort) ?? 'recommended'] ?? TOUR_SORTS.recommended;
  const [items, total] = await Promise.all([
    Tour.find(filter).sort(sort).skip(skip).limit(limit).populate('destination', 'name slug country'),
    Tour.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

export async function getTour(req: Request, res: Response) {
  const tour = await Tour.findOne({ slug: req.params.slug, published: true }).populate('destination', 'name slug country countrySlug');
  if (!tour) throw ApiError.notFound('Tour');
  const now = new Date();
  const departures = tour.departures
    .filter((d) => d.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d) => ({
      _id: d._id,
      date: d.date,
      seatsLeft: Math.max(0, d.totalSeats - d.bookedSeats),
      totalSeats: d.totalSeats,
      priceAdult: d.priceAdult ?? tour.priceAdult,
      priceChild: d.priceChild ?? tour.priceChild,
    }));

  const [reviews, similar] = await Promise.all([
    Review.find({ target: tour._id, status: 'approved' }).sort({ createdAt: -1 }).limit(10).populate('user', 'name avatar'),
    Tour.find({
      _id: { $ne: tour._id },
      published: true,
      $or: [{ destination: tour.destination }, { categories: { $in: tour.categories } }],
    })
      .sort({ rating: -1 })
      .limit(4)
      .populate('destination', 'name slug'),
  ]);
  sendSuccess(res, { tour: { ...tour.toObject(), departures }, reviews, similar });
}

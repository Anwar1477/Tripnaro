import type { z } from 'zod';
import { env } from '../config/env';
import { Booking, type BookingDocument } from '../models/Booking';
import { Bus, seatMap } from '../models/Bus';
import { Coupon, Setting } from '../models/Engagement';
import { Hotel } from '../models/Hotel';
import { Room } from '../models/Room';
import { Tour } from '../models/Tour';
import { ApiError } from '../utils/ApiError';
import { generateReference, nightsBetween, parseDateOnly } from '../utils/helpers';
import type {
  busBookingSchema,
  createBookingSchema,
  flightBookingSchema,
  hotelBookingSchema,
  tourBookingSchema,
} from '../validators/booking.validator';
import { roomAvailability, takenBusSeats } from './availability.service';
import {
  claimCouponSlot,
  CouponError,
  couponsEnabled,
  countUserCouponUses,
  evaluateCoupon,
  markCouponUsed,
  releaseCouponSlot,
  type CouponResult,
} from './coupon.service';
import { emailTemplates } from './email.service';
import { getProviderForOffer } from './flights';
import { notifyUser } from './notification.service';

type CreateBookingInput = z.infer<typeof createBookingSchema>;
const HOLD_MINUTES = 30;

interface BookingDraft {
  type: 'hotel' | 'tour' | 'bus' | 'flight';
  item?: string;
  itemModel?: 'Hotel' | 'Tour' | 'Bus' | 'Flight';
  room?: string;
  departureId?: string;
  title: string;
  image?: string;
  startDate: Date;
  endDate?: Date;
  details: Record<string, unknown>;
  base: number;
  taxes: number;
  breakdown: { label: string; amount: number }[];
  /** Reserve inventory atomically; returns false when it is no longer available. */
  reserve?: () => Promise<boolean>;
}

/* ──────────────────────────── Draft builders (one per vertical) ──────────────────────────── */

async function draftHotel(input: z.infer<typeof hotelBookingSchema>): Promise<BookingDraft> {
  const checkIn = parseDateOnly(input.checkIn);
  const checkOut = parseDateOnly(input.checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) throw ApiError.badRequest('Check-out must be after check-in');
  if (nights > 30) throw ApiError.badRequest('Stays longer than 30 nights require a custom quote');
  if (checkIn < parseDateOnly(new Date().toISOString().slice(0, 10))) throw ApiError.badRequest('Check-in date is in the past');

  const [hotel, room] = await Promise.all([
    Hotel.findOne({ _id: input.hotelId, published: true }),
    Room.findOne({ _id: input.roomId, hotel: input.hotelId, active: true }),
  ]);
  if (!hotel) throw ApiError.notFound('Hotel');
  if (!room) throw ApiError.notFound('Room');

  if (input.adults > room.maxAdults * input.rooms) {
    throw ApiError.badRequest(`${room.name} allows up to ${room.maxAdults} adults per room. Add more rooms.`);
  }
  const free = (await roomAvailability(hotel.id, checkIn, checkOut)).get(room.id) ?? 0;
  if (free < input.rooms) throw ApiError.conflict(`Only ${free} room(s) of this type are left for your dates`);

  const base = room.price * nights * input.rooms;
  const taxes = Math.round(base * 0.1);
  return {
    type: 'hotel',
    item: hotel.id,
    itemModel: 'Hotel',
    room: room.id,
    title: `${hotel.name} · ${room.name}`,
    image: hotel.images[0],
    startDate: checkIn,
    endDate: checkOut,
    details: {
      hotelName: hotel.name,
      hotelSlug: hotel.slug,
      city: hotel.city,
      roomName: room.name,
      bedType: room.bedType,
      nights,
      rooms: input.rooms,
      adults: input.adults,
      children: input.children,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      pricePerNight: room.price,
      breakfastIncluded: room.breakfastIncluded,
      refundable: room.refundable,
      checkInTime: hotel.policies?.checkIn,
      checkOutTime: hotel.policies?.checkOut,
    },
    base,
    taxes,
    breakdown: [
      { label: `${input.rooms} room × ${nights} night${nights > 1 ? 's' : ''}`, amount: base },
      { label: 'Taxes & fees (10%)', amount: taxes },
    ],
  };
}

async function draftTour(input: z.infer<typeof tourBookingSchema>): Promise<BookingDraft> {
  const tour = await Tour.findOne({ _id: input.tourId, published: true });
  if (!tour) throw ApiError.notFound('Tour');
  const departure = tour.departures.id(input.departureId);
  if (!departure) throw ApiError.notFound('Departure date');
  if (departure.date < new Date()) throw ApiError.badRequest('This departure has already left');

  const seats = input.adults + input.children;
  const free = departure.totalSeats - departure.bookedSeats;
  if (free < seats) throw ApiError.conflict(`Only ${free} seat(s) left on this departure`);

  const adultPrice = departure.priceAdult ?? tour.priceAdult;
  const childPrice = departure.priceChild ?? tour.priceChild;
  const base = adultPrice * input.adults + childPrice * input.children;
  const endDate = new Date(departure.date.getTime() + (tour.durationDays - 1) * 86_400_000);

  return {
    type: 'tour',
    item: tour.id,
    itemModel: 'Tour',
    departureId: String(departure._id),
    title: tour.title,
    image: tour.images[0],
    startDate: departure.date,
    endDate,
    details: {
      tourTitle: tour.title,
      tourSlug: tour.slug,
      durationDays: tour.durationDays,
      durationNights: tour.durationNights,
      startLocation: tour.startLocation,
      adults: input.adults,
      children: input.children,
      seats,
      adultPrice,
      childPrice,
      seatsReserved: false,
    },
    base,
    taxes: 0,
    breakdown: [
      { label: `Adult × ${input.adults}`, amount: adultPrice * input.adults },
      ...(input.children ? [{ label: `Child × ${input.children}`, amount: childPrice * input.children }] : []),
    ],
    // Conditional atomic increment prevents overselling under concurrent bookings.
    reserve: async () => {
      const res = await Tour.updateOne(
        { _id: tour.id, departures: { $elemMatch: { _id: departure._id, bookedSeats: { $lte: departure.totalSeats - seats } } } },
        { $inc: { 'departures.$.bookedSeats': seats } },
      );
      return res.modifiedCount === 1;
    },
  };
}

async function draftBus(input: z.infer<typeof busBookingSchema>): Promise<BookingDraft> {
  const bus = await Bus.findOne({ _id: input.busId, active: true });
  if (!bus) throw ApiError.notFound('Bus');
  const journey = parseDateOnly(input.journeyDate);
  if (!bus.departureTime) throw ApiError.badRequest('Invalid schedule');
  const [hh, mm] = bus.departureTime.split(':').map(Number);
  const departsAt = new Date(journey.getTime() + (hh * 60 + mm - 360) * 60_000); // Asia/Dhaka
  if (departsAt.getTime() < Date.now() + 30 * 60_000) throw ApiError.badRequest('This departure is no longer bookable');

  const validSeats = new Set(seatMap(bus.seatLayout, bus.rows).flat());
  const unique = [...new Set(input.seats)];
  if (unique.length !== input.seats.length) throw ApiError.badRequest('Duplicate seats selected');
  const invalid = unique.filter((s) => !validSeats.has(s));
  if (invalid.length) throw ApiError.badRequest(`Invalid seat(s): ${invalid.join(', ')}`);
  if (input.travelers && input.travelers.length !== unique.length) throw ApiError.badRequest('Add one passenger per selected seat');

  const taken = new Set(await takenBusSeats(bus.id, input.journeyDate));
  const clash = unique.filter((s) => taken.has(s));
  if (clash.length) throw ApiError.conflict(`Seat(s) ${clash.join(', ')} were just booked. Please choose others.`);

  const base = bus.fare * unique.length;
  return {
    type: 'bus',
    item: bus.id,
    itemModel: 'Bus',
    title: `${bus.from} → ${bus.to} · ${bus.operator?.name ?? ""}`,
    startDate: departsAt,
    details: {
      operator: bus.operator?.name,
      coachNumber: bus.coachNumber,
      busType: bus.busType,
      from: bus.from,
      to: bus.to,
      journeyDate: input.journeyDate,
      departureTime: bus.departureTime,
      durationMinutes: bus.durationMinutes,
      seats: unique,
      boardingPoint: input.boardingPoint,
      droppingPoint: input.droppingPoint,
      farePerSeat: bus.fare,
    },
    base,
    taxes: 0,
    breakdown: [{ label: `Seat × ${unique.length} (${unique.join(', ')})`, amount: base }],
  };
}

async function draftFlight(input: z.infer<typeof flightBookingSchema>): Promise<BookingDraft> {
  const pax = input.passengers;
  if (pax.infants > pax.adults) throw ApiError.badRequest('Each infant must travel with an adult');
  const expectedTravelers = pax.adults + pax.children + pax.infants;
  // Quotes are priced before passenger details exist; bookings must name every passenger.
  if (input.travelers && input.travelers.length !== expectedTravelers) {
    throw ApiError.badRequest(`Enter details for all ${expectedTravelers} passengers`);
  }
  const counts = { adult: 0, child: 0, infant: 0 };
  (input.travelers ?? []).forEach((t) => counts[t.type ?? "adult"]++);
  if (input.travelers && (counts.adult !== pax.adults || counts.child !== pax.children || counts.infant !== pax.infants)) {
    throw ApiError.badRequest('Passenger types do not match your search');
  }

  // Re-price every leg on the server. The browser only sends offer ids.
  const offers = await Promise.all(input.offerIds.map((id) => getProviderForOffer(id).priceOffer(id, input.cabinClass, pax)));
  const base = offers.reduce((s, o) => s + o.fare.baseTotal, 0);
  const taxes = offers.reduce((s, o) => s + o.fare.taxesTotal, 0);
  const first = offers[0];
  const last = offers[offers.length - 1];
  const tripType = offers.length === 1 ? 'one_way' : offers.length === 2 && last.to === first.from ? 'round_trip' : 'multi_city';

  return {
    type: 'flight',
    item: first.scheduleId,
    itemModel: first.scheduleId ? 'Flight' : undefined,
    title: offers.map((o) => `${o.from} → ${o.to}`).join(' · '),
    startDate: new Date(first.departureAt),
    endDate: new Date(last.arrivalAt),
    details: {
      tripType,
      cabinClass: input.cabinClass,
      passengers: pax,
      seatCount: pax.adults + pax.children,
      isDemoInventory: offers.some((o) => o.isDemo),
      provider: first.provider,
      legs: offers.map((o) => ({
        flightId: o.scheduleId,
        date: o.departureAt.slice(0, 10),
        cabinClass: input.cabinClass,
        airline: o.airline,
        flightNumber: o.flightNumber,
        from: o.from,
        to: o.to,
        fromCity: o.fromCity,
        toCity: o.toCity,
        departureAt: o.departureAt,
        arrivalAt: o.arrivalAt,
        durationMinutes: o.durationMinutes,
        stops: o.stops,
        layovers: o.layovers,
        baggage: o.baggage,
        refundable: o.refundable,
        fare: o.fare.total,
      })),
    },
    base,
    taxes,
    breakdown: offers.map((o) => ({ label: `${o.from} → ${o.to} (${o.flightNumber})`, amount: o.fare.total })),
  };
}

const builders = {
  hotel: draftHotel,
  tour: draftTour,
  bus: draftBus,
  flight: draftFlight,
} as const;

/* ──────────────────────────── Public API ──────────────────────────── */

async function serviceFeePercent(): Promise<number> {
  const settings = await Setting.findOne({ key: 'site' }).select('serviceFeePercent').lean();
  return settings?.serviceFeePercent ?? 2;
}

interface QuoteOptions {
  userId?: string;
  /**
   * Quote mode: a rejected coupon does not fail the quote. The plain price is returned with
   * `couponError`, so the customer keeps seeing a correct total next to the error message.
   */
  soft?: boolean;
}

/** Builds a price quote without creating a booking (used by checkout summaries). */
export async function quoteBooking(input: CreateBookingInput, opts: QuoteOptions = {}) {
  const draft = await (builders[input.type] as (i: CreateBookingInput) => Promise<BookingDraft>)(input);
  return priceDraft(draft, input.couponCode || undefined, opts);
}

const COUPON_LINE = 'Coupon ';

/** Price lines and total for a subtotal (fare + taxes). Coupons discount the subtotal, never the service fee. */
function buildPricing(base: number, taxes: number, lines: { label: string; amount: number }[], serviceFee: number, coupon: CouponResult | null) {
  const discount = coupon?.discount ?? 0;
  const total = Math.round(Math.max(0, base + taxes + serviceFee - discount));
  const breakdown = [
    ...lines.filter((l) => !l.label.startsWith(COUPON_LINE) && l.label !== 'Service fee'),
    { label: 'Service fee', amount: serviceFee },
    ...(coupon ? [{ label: `${COUPON_LINE}${coupon.code}`, amount: -discount }] : []),
  ];
  return { currency: 'BDT', base, taxes, serviceFee, discount, total, breakdown };
}

async function priceDraft(draft: BookingDraft, couponCode: string | undefined, opts: QuoteOptions = {}) {
  const subtotal = draft.base + draft.taxes;
  const serviceFee = Math.round((subtotal * (await serviceFeePercent())) / 100);
  let coupon: CouponResult | null = null;
  let couponError: { code: string; message: string } | null = null;
  if (couponCode) {
    try {
      coupon = await evaluateCoupon(couponCode, draft.type, subtotal, { userId: opts.userId });
    } catch (err) {
      if (!(opts.soft && err instanceof CouponError)) throw err;
      couponError = { code: err.code, message: err.message };
    }
  }
  // couponsEnabled lets the booking form show or hide the coupon box without a separate settings call.
  return { draft, coupon, couponError, couponsEnabled: await couponsEnabled(), pricing: buildPricing(draft.base, draft.taxes, draft.breakdown, serviceFee, coupon) };
}

const couponSnapshot = (c: CouponResult, claimed: boolean) => ({ code: c.code, title: c.title, discountType: c.discountType, value: c.value, discount: c.discount, claimed });

/** Rolls back a booking that failed a post-insert check: frees seats, the coupon slot and the record. */
async function discardNewBooking(booking: BookingDocument) {
  await releaseInventory(booking);
  if (booking.coupon?.claimed && booking.coupon.code) await releaseCouponSlot(booking.coupon.code);
  await Booking.deleteOne({ _id: booking._id });
}

export async function createBooking(userId: string, input: CreateBookingInput): Promise<BookingDocument> {
  const { draft, coupon, pricing } = await quoteBooking(input, { userId });

  if (draft.reserve) {
    const ok = await draft.reserve();
    if (!ok) throw ApiError.conflict('Sorry, the last seats were just taken. Please choose another option.');
    draft.details.seatsReserved = true;
  }

  // Reserve a coupon usage slot atomically (closes the race between concurrent bookings).
  if (coupon) {
    try {
      await claimCouponSlot(coupon.code);
    } catch (err) {
      await releaseDraftInventory(draft);
      throw err;
    }
  }

  let booking: BookingDocument;
  try {
    booking = await Booking.create({
    reference: generateReference(draft.type),
    user: userId,
    type: draft.type,
    item: draft.item,
    itemModel: draft.itemModel,
    room: draft.room,
    departureId: draft.departureId,
    title: draft.title,
    image: draft.image,
    startDate: draft.startDate,
    endDate: draft.endDate,
    details: draft.details,
    travelers: input.travelers,
    contact: input.contact,
    specialRequests: input.specialRequests,
    pricing,
    coupon: coupon ? couponSnapshot(coupon, true) : undefined,
    holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
    statusHistory: [{ status: 'pending', note: 'Booking created, awaiting payment' }],
    });
  } catch (err) {
    if (coupon) await releaseCouponSlot(coupon.code);
    await releaseDraftInventory(draft);
    throw err;
  }

  // Per-user limit, re-checked after insert: if the same customer raced two bookings, the extra one is rolled back.
  if (coupon) {
    const limit = (await Coupon.findOne({ code: coupon.code }).select('perUserLimit').lean())?.perUserLimit ?? 0;
    if (limit > 0 && (await countUserCouponUses(userId, coupon.code)) > limit) {
      await discardNewBooking(booking);
      throw new CouponError('USER_LIMIT', limit === 1 ? 'You have already used this coupon' : `You have already used this coupon ${limit} times`);
    }
  }

  // Post-insert guard for bus seats: if a concurrent booking grabbed the same seat, the later one loses.
  if (draft.type === 'bus') {
    const seats = (draft.details.seats as string[]) ?? [];
    const rivals = await Booking.find({
      _id: { $ne: booking._id },
      type: 'bus',
      item: draft.item,
      'details.journeyDate': draft.details.journeyDate,
      'details.seats': { $in: seats },
      createdAt: { $lte: booking.get('createdAt') },
      $or: [{ status: 'confirmed' }, { status: 'pending', holdExpiresAt: { $gt: new Date() } }],
    }).countDocuments();
    if (rivals > 0) {
      await discardNewBooking(booking);
      throw ApiError.conflict('One of your seats was just booked by someone else. Please choose again.');
    }
  }

  await notifyUser(userId, {
    title: 'Booking created',
    message: `${booking.reference} · ${booking.title} is reserved for ${HOLD_MINUTES} minutes. Complete payment to confirm.`,
    type: 'booking',
    link: `/my-account/bookings/${booking.id}`,
  });
  return booking;
}

/** Called only after the payment provider has been verified server-side. */
export async function confirmBookingPayment(bookingId: string): Promise<void> {
  const booking = await Booking.findById(bookingId).populate<{ user: { _id: string; name: string } }>('user', 'name');
  if (!booking || booking.paymentStatus === 'paid') return;

  booking.paymentStatus = 'paid';
  booking.status = 'confirmed';
  booking.holdExpiresAt = undefined;
  booking.statusHistory.push({ status: 'confirmed', note: 'Payment verified', at: new Date() });
  await booking.save();
  // Claimed bookings already hold their slot; only legacy (pre-claim) bookings count usage here.
  if (booking.coupon?.code && !booking.coupon.claimed) await markCouponUsed(booking.coupon.code);

  const userId = String(booking.user._id);
  const tpl = emailTemplates.bookingConfirmed(
    booking.user.name,
    booking.reference,
    booking.title,
    `BDT ${booking.pricing!.total.toLocaleString('en-US')}`,
    `${env.FRONTEND_URL}/my-account/bookings/${booking.id}`,
  );
  await notifyUser(userId, {
    title: 'Booking confirmed 🎉',
    message: `${booking.reference} · ${booking.title} is confirmed.`,
    type: 'booking',
    link: `/my-account/bookings/${booking.id}`,
    email: tpl,
  });
}

export async function markBookingPaymentFailed(bookingId: string): Promise<void> {
  await Booking.updateOne({ _id: bookingId, paymentStatus: { $ne: 'paid' } }, { paymentStatus: 'failed' });
}

/** Returns reserved tour seats to inventory (idempotent). */
async function releaseInventory(booking: BookingDocument): Promise<void> {
  const details = booking.details as Record<string, unknown>;
  if (booking.type === 'tour' && details.seatsReserved && booking.departureId) {
    await Tour.updateOne(
      { _id: booking.item, 'departures._id': booking.departureId },
      { $inc: { 'departures.$.bookedSeats': -Number(details.seats ?? 0) } },
    );
    booking.details = { ...details, seatsReserved: false };
    booking.markModified('details');
  }
}

/** Undo a tour seat reservation made by a draft that never became a booking. */
async function releaseDraftInventory(draft: BookingDraft): Promise<void> {
  if (draft.type === 'tour' && draft.details.seatsReserved && draft.departureId) {
    await Tour.updateOne({ _id: draft.item, 'departures._id': draft.departureId }, { $inc: { 'departures.$.bookedSeats': -Number(draft.details.seats ?? 0) } });
    draft.details.seatsReserved = false;
  }
}

/** Gives the booking's coupon usage slot back (idempotent). The caller saves the booking. */
async function releaseBookingCoupon(booking: BookingDocument): Promise<void> {
  if (booking.coupon?.code && booking.coupon.claimed) {
    await releaseCouponSlot(booking.coupon.code);
    booking.coupon.claimed = false;
  }
}

/** Re-prices a stored booking with a different coupon result (or none). */
function repriceBooking(booking: BookingDocument, coupon: CouponResult | null) {
  const p = booking.pricing!;
  const lines = (p.breakdown ?? []).map((l) => ({ label: l.label ?? '', amount: l.amount ?? 0 }));
  booking.pricing = buildPricing(p.base, p.taxes ?? 0, lines, p.serviceFee ?? 0, coupon) as typeof booking.pricing;
  if (coupon) booking.coupon = { ...couponSnapshot(coupon, !!booking.coupon?.claimed) };
  else booking.coupon = undefined;
  booking.markModified('pricing');
  booking.markModified('coupon');
}

const payable = (booking: BookingDocument) => booking.status === 'pending' && booking.paymentStatus !== 'paid';

/**
 * Called when payment starts. The coupon is re-checked against the *current* admin settings
 * (global switch, status, dates, limits, payment channel) and the discount recalculated. If
 * anything changed, the booking is re-priced and saved and a 409 is thrown, so the customer sees
 * the new total before paying. Payment-channel mismatches leave the booking untouched.
 */
export async function revalidateBookingCoupon(booking: BookingDocument, provider: string): Promise<void> {
  const code = booking.coupon?.code;
  if (!code || !payable(booking)) return;
  const p = booking.pricing!;
  const subtotal = p.base + (p.taxes ?? 0);
  try {
    const fresh = await evaluateCoupon(code, booking.type, subtotal, {
      userId: String(booking.user),
      provider,
      excludeBookingId: booking.id,
      holdsSlot: !!booking.coupon?.claimed,
    });
    if (fresh.discount === (booking.coupon?.discount ?? 0) && fresh.value === booking.coupon?.value) return;
    repriceBooking(booking, fresh);
    booking.statusHistory.push({ status: booking.status, note: `Coupon ${code} re-applied with current terms`, at: new Date() });
    await booking.save();
    throw new ApiError(409, `The ${code} discount has changed. Your new total is BDT ${booking.pricing!.total.toLocaleString('en-US')}. Please review and pay again.`, 'COUPON_UPDATED');
  } catch (err) {
    if (!(err instanceof CouponError)) throw err;
    if (err.reason === 'PAYMENT_CHANNEL') throw err;
    await releaseBookingCoupon(booking);
    repriceBooking(booking, null);
    booking.statusHistory.push({ status: booking.status, note: `Coupon ${code} removed: ${err.message}`, at: new Date() });
    await booking.save();
    throw new ApiError(409, `${err.message}, so coupon ${code} was removed. Your new total is BDT ${booking.pricing!.total.toLocaleString('en-US')}. Please review and pay again.`, 'COUPON_REMOVED');
  }
}

/** Customer action at checkout: drop the coupon from an unpaid booking and restore the full price. */
export async function removeBookingCoupon(booking: BookingDocument): Promise<BookingDocument> {
  if (!payable(booking)) throw ApiError.badRequest('The coupon can only be removed before payment');
  if (!booking.coupon?.code) return booking;
  const code = booking.coupon.code;
  await releaseBookingCoupon(booking);
  repriceBooking(booking, null);
  booking.statusHistory.push({ status: booking.status, note: `Coupon ${code} removed by customer`, at: new Date() });
  await booking.save();
  return booking;
}

export async function cancelBooking(booking: BookingDocument, note: string, actor: 'user' | 'admin' | 'system') {
  if (booking.status === 'cancelled') return booking;
  await releaseInventory(booking);
  await releaseBookingCoupon(booking);
  booking.status = 'cancelled';
  booking.holdExpiresAt = undefined;
  if (booking.paymentStatus === 'paid') {
    booking.paymentStatus = 'refund_pending';
    booking.refund = { ...booking.refund, status: 'requested', requestedAt: new Date(), amount: booking.pricing?.total, reason: note };
  }
  booking.cancellation = { ...booking.cancellation, status: 'approved', processedAt: new Date(), reason: booking.cancellation?.reason ?? note };
  booking.statusHistory.push({ status: 'cancelled', note: `${actor}: ${note}`, at: new Date() });
  await booking.save();
  await notifyUser(String(booking.user), {
    title: 'Booking cancelled',
    message: `${booking.reference} has been cancelled.${booking.paymentStatus === 'refund_pending' ? ' Your refund is being processed.' : ''}`,
    type: 'booking',
    link: `/my-account/bookings/${booking.id}`,
  });
  return booking;
}

/** Background job: cancel unpaid bookings whose hold expired and free their inventory. */
export async function expireStaleHolds(): Promise<number> {
  const stale = await Booking.find({ status: 'pending', paymentStatus: { $ne: 'paid' }, holdExpiresAt: { $lt: new Date() } }).limit(200);
  for (const booking of stale) await cancelBooking(booking, 'Payment window expired', 'system');
  return stale.length;
}

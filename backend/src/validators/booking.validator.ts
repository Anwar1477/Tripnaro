import { z } from 'zod';
import { CABIN_CLASSES } from '../models/Flight';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Contact name is required').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number'),
});

export const bookingTravelerSchema = z.object({
  type: z.enum(['adult', 'child', 'infant']).default('adult'),
  title: z.string().max(10).optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  gender: z.string().max(10).optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().max(60).optional(),
  passportNumber: z.string().max(20).optional(),
  passportExpiry: z.coerce.date().optional(),
  seat: z.string().max(5).optional(),
});

const common = {
  contact: contactSchema,
  specialRequests: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().toUpperCase().max(30).optional().or(z.literal('')),
};

export const hotelBookingSchema = z.object({
  type: z.literal('hotel'),
  hotelId: objectId,
  roomId: objectId,
  checkIn: dateOnly,
  checkOut: dateOnly,
  rooms: z.coerce.number().int().min(1).max(8),
  adults: z.coerce.number().int().min(1).max(32),
  children: z.coerce.number().int().min(0).max(16).default(0),
  travelers: z.array(bookingTravelerSchema).min(1, 'Add the lead guest'),
  ...common,
});

export const tourBookingSchema = z.object({
  type: z.literal('tour'),
  tourId: objectId,
  departureId: objectId,
  adults: z.coerce.number().int().min(1).max(30),
  children: z.coerce.number().int().min(0).max(20).default(0),
  travelers: z.array(bookingTravelerSchema).min(1, 'Add at least one traveller'),
  ...common,
});

export const busBookingSchema = z.object({
  type: z.literal('bus'),
  busId: objectId,
  journeyDate: dateOnly,
  seats: z.array(z.string().regex(/^[A-Z]\d{1,2}$/)).min(1, 'Select at least one seat').max(6),
  boardingPoint: z.string().max(100).optional(),
  droppingPoint: z.string().max(100).optional(),
  travelers: z.array(bookingTravelerSchema).min(1),
  ...common,
});

export const flightBookingSchema = z.object({
  type: z.literal('flight'),
  /** Offer ids returned by the flight search, one per leg (outbound, return, multi-city legs). */
  offerIds: z.array(z.string().min(10)).min(1).max(5),
  cabinClass: z.enum(CABIN_CLASSES),
  passengers: z.object({
    adults: z.coerce.number().int().min(1).max(9),
    children: z.coerce.number().int().min(0).max(8).default(0),
    infants: z.coerce.number().int().min(0).max(4).default(0),
  }),
  travelers: z.array(bookingTravelerSchema).min(1),
  ...common,
});

export const createBookingSchema = z.discriminatedUnion('type', [
  hotelBookingSchema,
  tourBookingSchema,
  busBookingSchema,
  flightBookingSchema,
]);

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(5, 'Tell us briefly why you are cancelling').max(500),
});

export const refundRequestSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const couponValidateSchema = z.object({
  code: z.string().trim().toUpperCase().min(2),
  type: z.enum(['flight', 'hotel', 'tour', 'bus']),
  amount: z.coerce.number().min(0),
});

export const initiatePaymentSchema = z
  .object({
    bookingId: objectId.optional(),
    visaApplicationId: objectId.optional(),
    provider: z.enum(['demo', 'sslcommerz', 'bkash', 'nagad', 'stripe']),
  })
  .refine((v) => v.bookingId || v.visaApplicationId, { message: 'bookingId or visaApplicationId is required' });

export const reviewSchema = z.object({
  targetType: z.enum(['hotel', 'tour']),
  targetId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(10, 'Please write at least 10 characters').max(2000),
  tripType: z.string().max(30).optional(),
});

export const visaApplicationSchema = z.object({
  countryId: objectId,
  visaType: z.string().min(2).max(60),
  travelDate: dateOnly,
  returnDate: dateOnly.optional().or(z.literal('')),
  purpose: z.string().max(300).optional(),
  applicant: z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    email: z.string().trim().toLowerCase().email(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number'),
    dateOfBirth: z.coerce.date().optional(),
    nationality: z.string().max(60).optional(),
    passportNumber: z.string().trim().min(5, 'Passport number is required').max(20),
    passportExpiry: z.coerce.date().optional(),
    occupation: z.string().max(80).optional(),
    address: z.string().max(250).optional(),
  }),
});

export const tourRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number'),
  destination: z.string().trim().min(2).max(100),
  travelDate: z.coerce.date().optional(),
  durationDays: z.coerce.number().int().min(1).max(60).optional(),
  travelers: z.coerce.number().int().min(1).max(100).optional(),
  budget: z.coerce.number().min(0).optional(),
  message: z.string().max(1500).optional(),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

/** Quote = same shape as a booking but contact / travelers are not required yet. */
const quoteRelax = { contact: contactSchema.partial().optional(), travelers: z.array(bookingTravelerSchema.partial()).optional() };
export const quoteBookingSchema = z.discriminatedUnion('type', [
  hotelBookingSchema.extend(quoteRelax),
  tourBookingSchema.extend(quoteRelax),
  busBookingSchema.extend(quoteRelax),
  flightBookingSchema.extend(quoteRelax),
]);

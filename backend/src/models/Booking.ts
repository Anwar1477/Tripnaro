import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const BOOKING_TYPES = ['flight', 'hotel', 'tour', 'bus'] as const;
export type BookingKind = (typeof BOOKING_TYPES)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'failed', 'refund_pending', 'refunded'] as const;

const travelerSchema = new Schema(
  {
    type: { type: String, enum: ['adult', 'child', 'infant'], default: 'adult' },
    title: String,
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    gender: String,
    dateOfBirth: Date,
    nationality: String,
    passportNumber: String,
    passportExpiry: Date,
    seat: String,
  },
  { _id: false },
);

const bookingSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: BOOKING_TYPES, required: true, index: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid', index: true },

    // Polymorphic reference to the booked inventory item (hotel, tour, bus or flight schedule)
    item: { type: Schema.Types.ObjectId, refPath: 'itemModel' },
    itemModel: { type: String, enum: ['Hotel', 'Tour', 'Bus', 'Flight'] },
    room: { type: Schema.Types.ObjectId, ref: 'Room' },
    departureId: { type: Schema.Types.ObjectId }, // tour departure sub-document

    title: { type: String, required: true }, // human readable summary, e.g. "DAC → CXB"
    image: String,
    startDate: { type: Date, required: true, index: true },
    endDate: Date,

    /** Snapshot of what was booked (schedule, room details, seats …) so history stays accurate. */
    details: { type: Schema.Types.Mixed, default: {} },

    travelers: { type: [travelerSchema], default: [] },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
    },
    specialRequests: { type: String, maxlength: 1000 },

    pricing: {
      currency: { type: String, default: 'BDT' },
      base: { type: Number, required: true },
      taxes: { type: Number, default: 0 },
      serviceFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      breakdown: { type: [{ label: String, amount: Number }], default: [] },
    },
    coupon: { code: String, discount: Number },

    holdExpiresAt: Date, // unpaid bookings release inventory after this time
    cancellation: {
      requestedAt: Date,
      reason: String,
      status: { type: String, enum: ['none', 'requested', 'approved', 'rejected'], default: 'none' },
      processedAt: Date,
    },
    refund: {
      requestedAt: Date,
      amount: Number,
      reason: String,
      status: { type: String, enum: ['none', 'requested', 'approved', 'rejected', 'processed'], default: 'none' },
      processedAt: Date,
    },
    adminNotes: String,
    statusHistory: {
      type: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ type: 1, item: 1, startDate: 1, status: 1 });

export type BookingType = InferSchemaType<typeof bookingSchema>;
export type BookingDocument = HydratedDocument<BookingType>;
export const Booking = model('Booking', bookingSchema);

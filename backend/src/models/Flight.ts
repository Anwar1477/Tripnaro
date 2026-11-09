import { Schema, model, type InferSchemaType } from 'mongoose';

export const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];

/**
 * A recurring flight schedule used by the demo inventory provider.
 * Real availability must come from a connected provider (see services/flights).
 */
const flightSchema = new Schema(
  {
    airline: {
      code: { type: String, required: true, uppercase: true },
      name: { type: String, required: true },
      logo: String,
    },
    flightNumber: { type: String, required: true, uppercase: true },
    from: { type: String, required: true, uppercase: true, index: true },
    to: { type: String, required: true, uppercase: true, index: true },
    departureTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, // HH:mm local
    durationMinutes: { type: Number, required: true, min: 20 },
    stops: { type: Number, default: 0, min: 0, max: 3 },
    layovers: { type: [{ airport: String, city: String, durationMinutes: Number }], default: [] },
    daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0 = Sunday
    aircraft: String,
    cabins: {
      type: [
        {
          cabinClass: { type: String, enum: CABIN_CLASSES, required: true },
          baseFare: { type: Number, required: true, min: 0 },
          taxes: { type: Number, default: 0 },
          seats: { type: Number, default: 9 },
        },
      ],
      default: [],
    },
    baggage: {
      cabin: { type: String, default: '7 kg' },
      checked: { type: String, default: '20 kg' },
    },
    refundable: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

flightSchema.index({ from: 1, to: 1, active: 1 });

export type FlightType = InferSchemaType<typeof flightSchema>;
export const Flight = model('Flight', flightSchema);

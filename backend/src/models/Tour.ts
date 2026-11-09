import { Schema, model, type InferSchemaType } from 'mongoose';

export const TOUR_CATEGORIES = [
  'adventure',
  'family',
  'honeymoon',
  'group',
  'private',
  'day-trip',
  'cultural',
  'beach',
] as const;

const departureSchema = new Schema({
  date: { type: Date, required: true },
  totalSeats: { type: Number, required: true, min: 0 },
  bookedSeats: { type: Number, default: 0, min: 0 },
  priceAdult: Number, // optional per-departure override
  priceChild: Number,
});

const tourSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    scope: { type: String, enum: ['domestic', 'international'], default: 'domestic', index: true },
    categories: { type: [String], enum: TOUR_CATEGORIES, default: [], index: true },
    durationDays: { type: Number, required: true, min: 1 },
    durationNights: { type: Number, default: 0, min: 0 },
    startLocation: String,
    groupSize: { type: String, default: 'Up to 15 travellers' },
    shortDescription: { type: String, trim: true, maxlength: 260 },
    overview: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    images: { type: [String], default: [] },
    itinerary: {
      type: [{ day: Number, title: String, description: String, meals: [String], stay: String }],
      default: [],
    },
    included: { type: [String], default: [] },
    excluded: { type: [String], default: [] },
    departures: { type: [departureSchema], default: [] },
    priceAdult: { type: Number, required: true, min: 0, index: true },
    priceChild: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    customizable: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

tourSchema.index({ title: 'text', shortDescription: 'text', startLocation: 'text' });

export type TourType = InferSchemaType<typeof tourSchema>;
export const Tour = model('Tour', tourSchema);

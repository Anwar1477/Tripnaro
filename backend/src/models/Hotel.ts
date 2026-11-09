import { Schema, model, type InferSchemaType } from 'mongoose';

export const PROPERTY_TYPES = ['hotel', 'resort', 'apartment', 'guest-house', 'villa', 'boutique'] as const;

const hotelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    destination: { type: Schema.Types.ObjectId, ref: 'Destination', required: true, index: true },
    city: { type: String, required: true, trim: true, index: true },
    area: { type: String, trim: true },
    address: { type: String, trim: true },
    location: { lat: Number, lng: Number },
    stars: { type: Number, min: 1, max: 5, default: 3, index: true },
    propertyType: { type: String, enum: PROPERTY_TYPES, default: 'hotel', index: true },
    shortDescription: { type: String, trim: true, maxlength: 240 },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    tripPurposes: { type: [String], default: [] }, // business, couples, families, friends, solo
    badges: { type: [String], default: [] }, // Popular, Top Selling, Trending
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
    priceFrom: { type: Number, required: true, min: 0, index: true },
    originalPriceFrom: { type: Number, min: 0 },
    policies: {
      checkIn: { type: String, default: '2:00 PM' },
      checkOut: { type: String, default: '12:00 PM' },
      cancellation: { type: String, default: 'Free cancellation up to 48 hours before check-in.' },
      children: { type: String, default: 'Children of all ages are welcome.' },
    },
    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

hotelSchema.index({ name: 'text', city: 'text', area: 'text' });

export type HotelType = InferSchemaType<typeof hotelSchema>;
export const Hotel = model('Hotel', hotelSchema);

import { Schema, model, type InferSchemaType } from 'mongoose';

const destinationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    country: { type: String, required: true, trim: true },
    countrySlug: { type: String, required: true, lowercase: true, index: true },
    region: { type: String, trim: true },
    scope: { type: String, enum: ['domestic', 'international'], default: 'domestic', index: true },
    tagline: { type: String, trim: true },
    description: { type: String, default: '' },
    image: { type: String, required: true },
    gallery: { type: [String], default: [] },
    bestTimeToVisit: String,
    tags: { type: [String], default: [] },
    startingPrice: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    trending: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    location: { lat: Number, lng: Number },
  },
  { timestamps: true },
);

destinationSchema.index({ name: 'text', country: 'text', tags: 'text' });

export type DestinationType = InferSchemaType<typeof destinationSchema>;
export const Destination = model('Destination', destinationSchema);

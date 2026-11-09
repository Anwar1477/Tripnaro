import { Schema, model, type InferSchemaType } from 'mongoose';

const roomSchema = new Schema(
  {
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true, trim: true },
    bedType: { type: String, default: '1 King Bed' },
    sizeSqm: Number,
    view: String,
    maxAdults: { type: Number, default: 2, min: 1 },
    maxChildren: { type: Number, default: 1, min: 0 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    totalRooms: { type: Number, required: true, min: 0, default: 5 },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    breakfastIncluded: { type: Boolean, default: false },
    refundable: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type RoomType = InferSchemaType<typeof roomSchema>;
export const Room = model('Room', roomSchema);

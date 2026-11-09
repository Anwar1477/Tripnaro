import { Schema, model } from 'mongoose';

const airportSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  domestic: { type: Boolean, default: false },
  timezone: { type: String, default: 'Asia/Dhaka' },
});

airportSchema.index({ city: 1 });
airportSchema.index({ name: 'text', city: 'text', code: 'text' });

export const Airport = model('Airport', airportSchema);

import { Schema, model, type InferSchemaType } from 'mongoose';

/** A recurring coach service between two cities. Seat availability is computed per journey date. */
const busSchema = new Schema(
  {
    operator: {
      name: { type: String, required: true },
      logo: String,
      rating: { type: Number, default: 4 },
    },
    coachNumber: { type: String, required: true },
    busType: { type: String, enum: ['AC', 'Non-AC', 'AC Sleeper', 'Business Class'], default: 'AC' },
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    departureTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    durationMinutes: { type: Number, required: true },
    fare: { type: Number, required: true, min: 0 },
    seatLayout: { type: String, enum: ['2+2', '2+1', '1+1'], default: '2+2' },
    rows: { type: Number, default: 10, min: 1 },
    boardingPoints: { type: [{ name: String, time: String }], default: [] },
    droppingPoints: { type: [{ name: String, time: String }], default: [] },
    amenities: { type: [String], default: [] },
    cancellationPolicy: { type: String, default: 'Cancellation allowed up to 12 hours before departure.' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

busSchema.index({ from: 1, to: 1, active: 1 });

export type BusType = InferSchemaType<typeof busSchema>;
export const Bus = model('Bus', busSchema);

/** Generates seat labels A1, A2 … for a layout. Row letters, column numbers. */
export function seatMap(layout: string, rows: number): string[][] {
  const perRow = layout.split('+').reduce((sum, n) => sum + Number(n), 0);
  const map: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const letter = String.fromCharCode(65 + r);
    map.push(Array.from({ length: perRow }, (_, c) => `${letter}${c + 1}`));
  }
  return map;
}

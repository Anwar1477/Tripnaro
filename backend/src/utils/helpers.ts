import crypto from 'crypto';
import slugifyLib from 'slugify';
import { customAlphabet } from 'nanoid';

const refAlphabet = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export const BOOKING_PREFIX: Record<string, string> = {
  flight: 'TNF',
  hotel: 'TNH',
  tour: 'TNT',
  bus: 'TNB',
  visa: 'TNV',
};

/** Human-friendly, non-sequential reference, e.g. TNH-7KQ2MX4P */
export function generateReference(type: keyof typeof BOOKING_PREFIX | string): string {
  return `${BOOKING_PREFIX[type] ?? 'TRN'}-${refAlphabet()}`;
}

export function slugify(value: string): string {
  return slugifyLib(value, { lower: true, strict: true, trim: true });
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hmac(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime();
  return Math.round(ms / 86_400_000);
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function parseDateOnly(value: string): Date {
  // Treat YYYY-MM-DD as a UTC calendar date so results do not shift across timezones.
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

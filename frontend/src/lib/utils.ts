import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const bdt = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 });

export function formatPrice(amount: number | undefined | null, currency = "BDT"): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "—";
  const sign = amount < 0 ? "−" : "";
  return `${sign}${currency === "BDT" ? "৳" : `${currency} `}${bdt.format(Math.abs(Math.round(amount)))}`;
}

export function formatDate(value: string | Date | undefined, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka", ...opts });
}

export function formatDateTime(value: string | Date | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
}

/** Flight times are returned in the airport's local offset (e.g. 2026-11-19T10:15:00+06:00). */
export function localTime(iso: string): string {
  return iso.slice(11, 16);
}

export function localDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export function toDateInput(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addDays(base: Date | string, days: number): Date {
  const d = typeof base === "string" ? new Date(`${base}T00:00:00`) : new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function todayInput(offsetDays = 0): string {
  return toDateInput(addDays(new Date(), offsetDays));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(`${checkOut}T00:00:00Z`).getTime() - new Date(`${checkIn}T00:00:00Z`).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ratingLabel(rating: number): string {
  if (rating >= 4.7) return "Exceptional";
  if (rating >= 4.4) return "Excellent";
  if (rating >= 4) return "Very good";
  if (rating >= 3.5) return "Good";
  return "Pleasant";
}

export function discountPercent(price: number, original?: number): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export const CABIN_LABELS: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

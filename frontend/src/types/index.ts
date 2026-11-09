export type ID = string;

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta & Record<string, unknown>;
  error?: { code: string; details?: { field: string; message: string }[] };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta & Record<string, unknown>;
}

export type Role = "user" | "admin";

export interface SavedTraveler {
  _id: ID;
  title?: string;
  firstName: string;
  lastName: string;
  type: "adult" | "child" | "infant";
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
}

export interface User {
  _id: ID;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  nationality?: string;
  address?: string;
  savedTravelers: SavedTraveler[];
  notificationPrefs: { email: boolean; sms: boolean; promotions: boolean; bookingUpdates: boolean };
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Destination {
  _id: ID;
  name: string;
  slug: string;
  country: string;
  countrySlug: string;
  region?: string;
  scope: "domestic" | "international";
  tagline?: string;
  description: string;
  image: string;
  gallery: string[];
  bestTimeToVisit?: string;
  tags: string[];
  startingPrice: number;
  featured: boolean;
  trending: boolean;
  published: boolean;
}

export interface Hotel {
  _id: ID;
  name: string;
  slug: string;
  destination: Pick<Destination, "_id" | "name" | "slug"> & Partial<Destination>;
  city: string;
  area?: string;
  address?: string;
  location?: { lat: number; lng: number };
  stars: number;
  propertyType: string;
  shortDescription?: string;
  description: string;
  images: string[];
  amenities: string[];
  highlights: string[];
  tripPurposes: string[];
  badges: string[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  originalPriceFrom?: number;
  policies?: { checkIn: string; checkOut: string; cancellation: string; children: string };
  featured: boolean;
  published: boolean;
}

export interface Room {
  _id: ID;
  hotel: ID;
  name: string;
  bedType: string;
  sizeSqm?: number;
  view?: string;
  maxAdults: number;
  maxChildren: number;
  price: number;
  originalPrice?: number;
  totalRooms: number;
  available: number;
  amenities: string[];
  images: string[];
  breakfastIncluded: boolean;
  refundable: boolean;
}

export interface Review {
  _id: ID;
  user: { _id: ID; name: string; avatar?: string };
  rating: number;
  title?: string;
  comment: string;
  tripType?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  target?: { name?: string; title?: string; slug: string };
  targetType: "hotel" | "tour";
}

export interface TourDeparture {
  _id: ID;
  date: string;
  seatsLeft: number;
  totalSeats: number;
  priceAdult: number;
  priceChild: number;
}

export interface Tour {
  _id: ID;
  title: string;
  slug: string;
  destination: Pick<Destination, "_id" | "name" | "slug"> & Partial<Destination>;
  scope: "domestic" | "international";
  categories: string[];
  durationDays: number;
  durationNights: number;
  startLocation?: string;
  groupSize?: string;
  shortDescription?: string;
  overview: string;
  highlights: string[];
  images: string[];
  itinerary: { day: number; title: string; description: string; meals?: string[]; stay?: string }[];
  included: string[];
  excluded: string[];
  departures: TourDeparture[];
  priceAdult: number;
  priceChild: number;
  originalPrice?: number;
  customizable: boolean;
  rating: number;
  reviewCount: number;
  featured: boolean;
  published: boolean;
}

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export interface Airport {
  _id: ID;
  code: string;
  name: string;
  city: string;
  country: string;
  domestic: boolean;
}

export interface FlightOffer {
  offerId: string;
  provider: string;
  isDemo: boolean;
  legIndex: number;
  airline: { code: string; name: string; logo?: string };
  flightNumber: string;
  aircraft?: string;
  from: string;
  to: string;
  fromCity?: string;
  toCity?: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  stops: number;
  layovers: { airport: string; city?: string; durationMinutes: number }[];
  cabinClass: CabinClass;
  baggage: { cabin: string; checked: string };
  refundable: boolean;
  seatsLeft: number;
  fare: {
    currency: string;
    perAdult: number;
    baseTotal: number;
    taxesTotal: number;
    total: number;
    breakdown: { label: string; amount: number }[];
  };
}

export interface FlightSearchResult {
  provider: string;
  isDemo: boolean;
  notice?: string;
  legs: { from: string; to: string; date: string; offers: FlightOffer[] }[];
}

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

export interface Bus {
  _id: ID;
  operator: { name: string; logo?: string; rating: number };
  coachNumber: string;
  busType: string;
  from: string;
  to: string;
  departureTime: string;
  durationMinutes: number;
  fare: number;
  seatLayout: "2+2" | "2+1" | "1+1";
  rows: number;
  boardingPoints: { name: string; time?: string }[];
  droppingPoints: { name: string; time?: string }[];
  amenities: string[];
  cancellationPolicy?: string;
  journeyDate?: string;
  totalSeats?: number;
  availableSeats?: number;
}

export interface BusSeatSummary {
  bus: Bus;
  map: string[][];
  taken: string[];
  total: number;
  available: number;
  journeyDate: string;
}

export interface VisaType {
  _id: ID;
  name: string;
  entry: string;
  validityDays?: number;
  maxStayDays?: number;
  processingDays: string;
  fee: number;
  serviceFee: number;
}

export interface VisaCountry {
  _id: ID;
  country: string;
  slug: string;
  flag?: string;
  image?: string;
  region?: string;
  description: string;
  visaTypes: VisaType[];
  requirements: string[];
  documents: string[];
  notes: string[];
  popular: boolean;
  published: boolean;
}

export type VisaStatus = "submitted" | "under_review" | "documents_required" | "processing" | "approved" | "rejected";

export interface VisaApplication {
  _id: ID;
  reference: string;
  country: ID | Pick<VisaCountry, "_id" | "country" | "slug" | "flag">;
  countryName: string;
  visaType: string;
  fee: number;
  applicant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    passportNumber: string;
    nationality?: string;
    dateOfBirth?: string;
    occupation?: string;
  };
  travelDate: string;
  returnDate?: string;
  purpose?: string;
  documents: { _id: ID; label: string; originalName: string; mimeType: string; size: number; uploadedAt: string }[];
  status: VisaStatus;
  paymentStatus: "unpaid" | "paid" | "failed" | "refunded";
  statusHistory: { status: string; note?: string; at: string }[];
  adminNotes?: string;
  createdAt: string;
  user?: { _id: ID; name: string; email: string };
}

export type BookingType = "flight" | "hotel" | "tour" | "bus";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refund_pending" | "refunded";

export interface BookingTraveler {
  type: "adult" | "child" | "infant";
  title?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
  seat?: string;
}

export interface Pricing {
  currency: string;
  base: number;
  taxes: number;
  serviceFee: number;
  discount: number;
  total: number;
  breakdown: { label: string; amount: number }[];
}

export interface Booking {
  _id: ID;
  reference: string;
  user: ID | { _id: ID; name: string; email: string };
  type: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  title: string;
  image?: string;
  startDate: string;
  endDate?: string;
  details: Record<string, unknown>;
  travelers: BookingTraveler[];
  contact: { name: string; email: string; phone: string };
  specialRequests?: string;
  pricing: Pricing;
  coupon?: { code: string; discount: number };
  holdExpiresAt?: string;
  cancellation?: { status: string; reason?: string; requestedAt?: string };
  refund?: { status: string; amount?: number; reason?: string };
  statusHistory: { status: string; note?: string; at: string }[];
  createdAt: string;
}

export interface PaymentMethod {
  provider: "demo" | "sslcommerz" | "bkash" | "nagad" | "stripe";
  label: string;
  isDemo: boolean;
  available: boolean;
}

export interface Payment {
  _id: ID;
  transactionId: string;
  provider: PaymentMethod["provider"];
  method: string;
  amount: number;
  currency: string;
  status: "initiated" | "success" | "failed" | "cancelled" | "refunded";
  isDemo: boolean;
  failureReason?: string;
  createdAt: string;
  verifiedAt?: string;
  booking?: Pick<Booking, "_id" | "reference" | "title" | "type" | "status" | "paymentStatus" | "pricing">;
  visaApplication?: Pick<VisaApplication, "_id" | "reference" | "countryName" | "visaType" | "status" | "paymentStatus" | "fee">;
  user?: { _id: ID; name: string; email: string };
}

export interface Coupon {
  _id: ID;
  code: string;
  title: string;
  description?: string;
  discountType: "percent" | "flat";
  value: number;
  maxDiscount?: number;
  minAmount: number;
  appliesTo: string[];
  paymentChannel?: string;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  showOnHome: boolean;
  active: boolean;
}

export interface Banner {
  _id: ID;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  ctaLabel: string;
  placement: string;
  order: number;
  active: boolean;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  serviceFeePercent: number;
  noticeBar?: { text?: string; link?: string; active: boolean };
  social?: Record<string, string>;
  features?: Record<string, boolean>;
}

export interface Notification {
  _id: ID;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface WishlistItem {
  _id: ID;
  itemType: "hotel" | "tour";
  item: (Partial<Hotel> & Partial<Tour>) & { _id: ID; slug: string; images: string[] };
}

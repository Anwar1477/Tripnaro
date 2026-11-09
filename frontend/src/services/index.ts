import { get, getPaginated, send } from "@/lib/api";
import type {
  Airport,
  Booking,
  BookingType,
  Bus,
  BusSeatSummary,
  CabinClass,
  Coupon,
  Destination,
  FlightOffer,
  FlightSearchResult,
  Hotel,
  Notification,
  Passengers,
  Payment,
  PaymentMethod,
  Pricing,
  Review,
  Room,
  SavedTraveler,
  Tour,
  User,
  VisaApplication,
  VisaCountry,
  WishlistItem,
} from "@/types";

/* ───────── Auth ───────── */
export const authService = {
  me: () => get<{ user: User }>("/auth/me"),
  login: (body: { email: string; password: string }) => send<{ user: User }>("post", "/auth/login", body),
  register: (body: { name: string; email: string; phone?: string; password: string }) =>
    send<{ user: User }>("post", "/auth/register", body),
  logout: () => send<null>("post", "/auth/logout"),
  forgotPassword: (email: string) => send<{ devResetUrl?: string } | null>("post", "/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) => send<{ user: User }>("post", "/auth/reset-password", { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<null>("post", "/auth/change-password", { currentPassword, newPassword }),
};

/* ───────── Catalog ───────── */
export const catalogService = {
  destinations: (params?: Record<string, unknown>) => get<Destination[]>("/destinations", params),
  suggestions: (q: string) =>
    get<{ destinations: Destination[]; hotels: Pick<Hotel, "_id" | "name" | "slug" | "city" | "area">[]; tours: Pick<Tour, "_id" | "title" | "slug" | "durationDays">[] }>(
      "/search/suggestions",
      { q },
    ),
  hotels: (params: Record<string, unknown>) => getPaginated<Hotel>("/hotels", params),
  hotel: (slug: string, params?: Record<string, unknown>) =>
    get<{ hotel: Hotel; nights: number; rooms: Room[]; reviews: Review[]; ratingBreakdown: Record<string, number>; similar: Hotel[] }>(
      `/hotels/${slug}`,
      params,
    ),
  tours: (params: Record<string, unknown>) => getPaginated<Tour>("/tours", params),
  tour: (slug: string) => get<{ tour: Tour; reviews: Review[]; similar: Tour[] }>(`/tours/${slug}`),
  tourRequest: (body: Record<string, unknown>) => send<unknown>("post", "/tours/requests", body),
  reviews: (targetId: string, page = 1) => getPaginated<Review>("/reviews", { targetId, page }),
  createReview: (body: Record<string, unknown>) => send<Review>("post", "/reviews", body),
  subscribe: (email: string) => send<null>("post", "/newsletter", { email }),
};

/* ───────── Flights & buses ───────── */
export interface FlightSearchBody {
  tripType: "one_way" | "round_trip" | "multi_city";
  legs: { from: string; to: string; date: string }[];
  returnDate?: string;
  cabinClass: CabinClass;
  passengers: Passengers;
}

export const flightService = {
  airports: (q?: string) => get<Airport[]>("/flights/airports", { q }),
  search: (body: FlightSearchBody) => send<FlightSearchResult>("post", "/flights/search", body).then((r) => r.data),
  offer: (offerId: string, params: Record<string, unknown>) => get<FlightOffer>(`/flights/offers/${encodeURIComponent(offerId)}`, params),
};

export const busService = {
  cities: () => get<string[]>("/buses/cities"),
  search: (params: { from: string; to: string; date: string; busType?: string }) => get<Bus[]>("/buses/search", params),
  seats: (busId: string, date: string) => get<BusSeatSummary>(`/buses/${busId}/seats`, { date }),
};

/* ───────── Visa ───────── */
export const visaService = {
  countries: (q?: string) => get<VisaCountry[]>("/visa/countries", { q }),
  country: (slug: string) => get<VisaCountry>(`/visa/countries/${slug}`),
  apply: async (form: FormData) => {
    // multipart: let the browser set the boundary
    const { api, toApiError } = await import("@/lib/api");
    try {
      const { data } = await api.post("/visa/applications", form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 60_000 });
      return data.data as VisaApplication;
    } catch (err) {
      throw toApiError(err);
    }
  },
  mine: (page = 1) => getPaginated<VisaApplication>("/visa/applications", { page }),
  application: (id: string) => get<VisaApplication>(`/visa/applications/${id}`),
  track: (reference: string, passport: string) => get<VisaApplication>("/visa/track", { reference, passport }),
  documentUrl: (appId: string, docId: string) => `/api/v1/visa/applications/${appId}/documents/${docId}`,
};

/* ───────── Bookings & payments ───────── */
export type CreateBookingBody = Record<string, unknown> & { type: BookingType };

export const bookingService = {
  quote: (body: CreateBookingBody) => send<{ pricing: Pricing; coupon: { code: string; discount: number } | null }>("post", "/bookings/quote", body).then((r) => r.data),
  create: (body: CreateBookingBody) => send<Booking>("post", "/bookings", body).then((r) => r.data),
  mine: (params: Record<string, unknown>) => getPaginated<Booking>("/bookings", params),
  get: (id: string) => get<Booking>(`/bookings/${id}`),
  cancel: (id: string, reason: string) => send<Booking>("post", `/bookings/${id}/cancel`, { reason }),
  refund: (id: string, reason: string) => send<Booking>("post", `/bookings/${id}/refund`, { reason }),
  validateCoupon: (code: string, type: BookingType, amount: number) =>
    send<{ code: string; title: string; discount: number }>("post", "/coupons/validate", { code, type, amount }),
};

export const paymentService = {
  methods: () => get<PaymentMethod[]>("/payments/methods"),
  initiate: (body: { bookingId?: string; visaApplicationId?: string; provider: PaymentMethod["provider"] }) =>
    send<{ transactionId: string; redirectUrl: string; isDemo: boolean }>("post", "/payments/initiate", body).then((r) => r.data),
  status: (tx: string) => get<Payment>(`/payments/${tx}`),
  demoInfo: (tx: string) => get<{ transactionId: string; amount: number; currency: string; status: string; booking?: { reference: string; title: string }; visaApplication?: { reference: string; countryName: string; visaType: string } }>(`/payments/demo-gateway/${tx}`),
  demoDecide: (tx: string, outcome: "success" | "failed" | "cancelled") =>
    send<{ callbackUrl: string }>("post", `/payments/demo-gateway/${tx}/decide`, { outcome }).then((r) => r.data),
};

/* ───────── Account ───────── */
export const accountService = {
  overview: () =>
    get<{ counts: Record<string, number>; totalBookings: number; totalSpent: number; upcoming: Booking[] }>("/users/me/overview"),
  updateProfile: (body: Record<string, unknown>) => send<{ user: User }>("patch", "/users/me", body),
  updatePrefs: (body: User["notificationPrefs"]) => send<unknown>("put", "/users/me/notification-preferences", body),
  travelers: () => get<SavedTraveler[]>("/users/me/travelers"),
  addTraveler: (body: Partial<SavedTraveler>) => send<SavedTraveler[]>("post", "/users/me/travelers", body),
  updateTraveler: (id: string, body: Partial<SavedTraveler>) => send<SavedTraveler[]>("put", `/users/me/travelers/${id}`, body),
  deleteTraveler: (id: string) => send<SavedTraveler[]>("delete", `/users/me/travelers/${id}`),
  wishlist: () => get<WishlistItem[]>("/users/me/wishlist"),
  wishlistIds: () => get<string[]>("/users/me/wishlist/ids"),
  toggleWishlist: (itemType: "hotel" | "tour", itemId: string) =>
    send<{ saved: boolean }>("post", "/users/me/wishlist", { itemType, itemId }),
  notifications: (page = 1) => getPaginated<Notification>("/users/me/notifications", { page }),
  readNotification: (id: string) => send<null>("patch", `/users/me/notifications/${id}/read`),
  readAllNotifications: () => send<null>("patch", "/users/me/notifications/read-all"),
  payments: (page = 1) => getPaginated<Payment>("/users/me/payments", { page }),
};

export const contentService = {
  home: () => get<{ coupons: Coupon[] }>("/content/home"),
};

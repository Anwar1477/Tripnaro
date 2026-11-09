/** Declarative admin CRUD config. Each resource maps to `/api/v1/admin/<path>`. */
export type FieldKind = "text" | "textarea" | "number" | "boolean" | "select" | "date" | "list" | "images" | "image" | "ref" | "json";

export interface FieldDef {
  name: string; // dot paths allowed (e.g. "policies.checkIn")
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: { value: string; label: string }[];
  ref?: { resource: string; labelKey: string };
  hint?: string;
  full?: boolean;
  multiple?: boolean; // select with multiple values
}

export interface ColumnDef {
  key: string;
  label: string;
  format?: "price" | "bool" | "date" | "ref" | "count" | "stars";
}

export interface ResourceDef {
  path: string;
  title: string;
  singular: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  publicUrl?: (item: Record<string, unknown>) => string | null;
  defaults?: Record<string, unknown>;
}

const opt = (...v: string[]) => v.map((x) => ({ value: x, label: x.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));
const pubFilter = { key: "published", label: "Published", options: [{ value: "true", label: "Published" }, { value: "false", label: "Hidden" }] };
const activeFilter = { key: "active", label: "Active", options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] };
const CATEGORIES = opt("adventure", "family", "honeymoon", "group", "private", "day-trip", "cultural", "beach");

export const RESOURCES: Record<string, ResourceDef> = {
  destinations: {
    path: "destinations",
    title: "Destinations",
    singular: "destination",
    columns: [{ key: "name", label: "Name" }, { key: "country", label: "Country" }, { key: "scope", label: "Scope" }, { key: "startingPrice", label: "From", format: "price" }, { key: "featured", label: "Featured", format: "bool" }, { key: "published", label: "Published", format: "bool" }],
    filters: [{ key: "scope", label: "Scope", options: opt("domestic", "international") }, pubFilter],
    publicUrl: (i) => `/destinations/${i.slug}`,
    defaults: { scope: "domestic", country: "Bangladesh", countrySlug: "bangladesh", published: true, gallery: [], tags: [] },
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", hint: "Leave empty to generate from the name" },
      { name: "country", label: "Country", kind: "text", required: true },
      { name: "countrySlug", label: "Country slug", kind: "text", required: true },
      { name: "region", label: "Region", kind: "text" },
      { name: "scope", label: "Scope", kind: "select", options: opt("domestic", "international") },
      { name: "tagline", label: "Tagline", kind: "text", full: true },
      { name: "description", label: "Description", kind: "textarea", required: true, full: true },
      { name: "image", label: "Cover image", kind: "image", required: true, full: true },
      { name: "gallery", label: "Gallery", kind: "images", full: true },
      { name: "bestTimeToVisit", label: "Best time to visit", kind: "text" },
      { name: "startingPrice", label: "Starting price (BDT)", kind: "number" },
      { name: "tags", label: "Tags (one per line)", kind: "list" },
      { name: "featured", label: "Featured on home", kind: "boolean" },
      { name: "trending", label: "Trending", kind: "boolean" },
      { name: "published", label: "Published", kind: "boolean" },
    ],
  },
  hotels: {
    path: "hotels",
    title: "Hotels",
    singular: "hotel",
    columns: [{ key: "name", label: "Name" }, { key: "city", label: "City" }, { key: "stars", label: "Stars", format: "stars" }, { key: "priceFrom", label: "From", format: "price" }, { key: "rating", label: "Rating" }, { key: "published", label: "Published", format: "bool" }],
    filters: [{ key: "propertyType", label: "Type", options: opt("hotel", "resort", "apartment", "guest-house", "villa", "boutique") }, pubFilter],
    publicUrl: (i) => `/hotels/${i.slug}`,
    defaults: { stars: 3, propertyType: "hotel", published: true, images: [], amenities: [], highlights: [], badges: [], tripPurposes: [], policies: { checkIn: "14:00", checkOut: "12:00" } },
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", hint: "Auto-generated when empty" },
      { name: "destination", label: "Destination", kind: "ref", ref: { resource: "destinations", labelKey: "name" }, required: true },
      { name: "city", label: "City", kind: "text", required: true },
      { name: "area", label: "Area", kind: "text" },
      { name: "address", label: "Address", kind: "text", required: true },
      { name: "location.lat", label: "Latitude", kind: "number" },
      { name: "location.lng", label: "Longitude", kind: "number" },
      { name: "stars", label: "Stars", kind: "number", required: true },
      { name: "propertyType", label: "Property type", kind: "select", options: opt("hotel", "resort", "apartment", "guest-house", "villa", "boutique") },
      { name: "priceFrom", label: "Price from (BDT)", kind: "number", required: true },
      { name: "originalPriceFrom", label: "Original price (strike-through)", kind: "number" },
      { name: "shortDescription", label: "Short description", kind: "text", full: true },
      { name: "description", label: "Description", kind: "textarea", required: true, full: true },
      { name: "images", label: "Images", kind: "images", full: true },
      { name: "amenities", label: "Amenities (one per line)", kind: "list" },
      { name: "highlights", label: "Highlights (one per line)", kind: "list" },
      { name: "badges", label: "Badges (one per line)", kind: "list" },
      { name: "tripPurposes", label: "Trip purposes", kind: "list" },
      { name: "policies.checkIn", label: "Check-in time", kind: "text" },
      { name: "policies.checkOut", label: "Check-out time", kind: "text" },
      { name: "policies.cancellation", label: "Cancellation policy", kind: "textarea", full: true },
      { name: "policies.children", label: "Children policy", kind: "text", full: true },
      { name: "featured", label: "Featured", kind: "boolean" },
      { name: "published", label: "Published", kind: "boolean" },
    ],
  },
  rooms: {
    path: "rooms",
    title: "Rooms",
    singular: "room",
    columns: [{ key: "name", label: "Room" }, { key: "hotel", label: "Hotel", format: "ref" }, { key: "price", label: "Price", format: "price" }, { key: "totalRooms", label: "Inventory" }, { key: "active", label: "Active", format: "bool" }],
    filters: [activeFilter],
    defaults: { maxAdults: 2, maxChildren: 1, totalRooms: 5, active: true, amenities: [], images: [], refundable: true, breakfastIncluded: false },
    fields: [
      { name: "hotel", label: "Hotel", kind: "ref", ref: { resource: "hotels", labelKey: "name" }, required: true },
      { name: "name", label: "Room name", kind: "text", required: true },
      { name: "bedType", label: "Bed type", kind: "text", required: true },
      { name: "sizeSqm", label: "Size (m²)", kind: "number" },
      { name: "view", label: "View", kind: "text" },
      { name: "maxAdults", label: "Max adults", kind: "number", required: true },
      { name: "maxChildren", label: "Max children", kind: "number" },
      { name: "price", label: "Price per night (BDT)", kind: "number", required: true },
      { name: "originalPrice", label: "Original price", kind: "number" },
      { name: "totalRooms", label: "Rooms in inventory", kind: "number", required: true },
      { name: "amenities", label: "Amenities (one per line)", kind: "list" },
      { name: "images", label: "Images", kind: "images", full: true },
      { name: "breakfastIncluded", label: "Breakfast included", kind: "boolean" },
      { name: "refundable", label: "Refundable", kind: "boolean" },
      { name: "active", label: "Active", kind: "boolean" },
    ],
  },
  tours: {
    path: "tours",
    title: "Tours",
    singular: "tour",
    columns: [{ key: "title", label: "Title" }, { key: "destination", label: "Destination", format: "ref" }, { key: "durationDays", label: "Days" }, { key: "priceAdult", label: "Adult", format: "price" }, { key: "departures", label: "Departures", format: "count" }, { key: "published", label: "Published", format: "bool" }],
    filters: [{ key: "scope", label: "Scope", options: opt("domestic", "international") }, pubFilter],
    publicUrl: (i) => `/tours/${i.slug}`,
    defaults: { scope: "domestic", durationDays: 3, durationNights: 2, published: true, categories: [], images: [], highlights: [], included: [], excluded: [], itinerary: [], departures: [], customizable: true },
    fields: [
      { name: "title", label: "Title", kind: "text", required: true, full: true },
      { name: "slug", label: "Slug", kind: "text", hint: "Auto-generated when empty" },
      { name: "destination", label: "Destination", kind: "ref", ref: { resource: "destinations", labelKey: "name" }, required: true },
      { name: "scope", label: "Scope", kind: "select", options: opt("domestic", "international") },
      { name: "categories", label: "Categories", kind: "select", options: CATEGORIES, multiple: true },
      { name: "durationDays", label: "Days", kind: "number", required: true },
      { name: "durationNights", label: "Nights", kind: "number" },
      { name: "startLocation", label: "Start location", kind: "text" },
      { name: "groupSize", label: "Group size", kind: "text" },
      { name: "priceAdult", label: "Price per adult (BDT)", kind: "number", required: true },
      { name: "priceChild", label: "Price per child (BDT)", kind: "number" },
      { name: "originalPrice", label: "Original price", kind: "number" },
      { name: "shortDescription", label: "Short description", kind: "text", full: true },
      { name: "overview", label: "Overview", kind: "textarea", required: true, full: true },
      { name: "images", label: "Images", kind: "images", full: true },
      { name: "highlights", label: "Highlights (one per line)", kind: "list" },
      { name: "included", label: "Included (one per line)", kind: "list" },
      { name: "excluded", label: "Excluded (one per line)", kind: "list" },
      { name: "itinerary", label: "Itinerary (JSON)", kind: "json", full: true, hint: '[{"day":1,"title":"Arrival","description":"…","meals":["Dinner"],"stay":"Hotel"}]' },
      { name: "departures", label: "Departures (JSON)", kind: "json", full: true, hint: '[{"date":"2026-12-20","totalSeats":20,"bookedSeats":0}] (optional priceAdult / priceChild override)' },
      { name: "customizable", label: "Customisable", kind: "boolean" },
      { name: "featured", label: "Featured", kind: "boolean" },
      { name: "published", label: "Published", kind: "boolean" },
    ],
  },
  flights: {
    path: "flights",
    title: "Flight schedules",
    singular: "flight schedule",
    columns: [{ key: "flightNumber", label: "Flight" }, { key: "airline.name", label: "Airline" }, { key: "from", label: "From" }, { key: "to", label: "To" }, { key: "departureTime", label: "Departs" }, { key: "active", label: "Active", format: "bool" }],
    filters: [activeFilter],
    defaults: { stops: 0, layovers: [], daysOfWeek: [0, 1, 2, 3, 4, 5, 6], cabins: [{ cabinClass: "economy", baseFare: 4000, taxes: 900, seats: 9 }], baggage: { cabin: "7 kg", checked: "20 kg" }, active: true },
    fields: [
      { name: "airline.code", label: "Airline code", kind: "text", required: true },
      { name: "airline.name", label: "Airline name", kind: "text", required: true },
      { name: "flightNumber", label: "Flight number", kind: "text", required: true },
      { name: "aircraft", label: "Aircraft", kind: "text" },
      { name: "from", label: "From (IATA)", kind: "text", required: true },
      { name: "to", label: "To (IATA)", kind: "text", required: true },
      { name: "departureTime", label: "Departure time (HH:mm local)", kind: "text", required: true },
      { name: "durationMinutes", label: "Duration (minutes)", kind: "number", required: true },
      { name: "stops", label: "Stops", kind: "number" },
      { name: "baggage.cabin", label: "Cabin baggage", kind: "text" },
      { name: "baggage.checked", label: "Checked baggage", kind: "text" },
      { name: "daysOfWeek", label: "Days of week (JSON, 0 = Sunday)", kind: "json" },
      { name: "cabins", label: "Cabins & fares (JSON)", kind: "json", full: true },
      { name: "layovers", label: "Layovers (JSON)", kind: "json", full: true },
      { name: "refundable", label: "Refundable", kind: "boolean" },
      { name: "active", label: "Active", kind: "boolean" },
    ],
  },
  airports: {
    path: "airports",
    title: "Airports",
    singular: "airport",
    columns: [{ key: "code", label: "Code" }, { key: "name", label: "Name" }, { key: "city", label: "City" }, { key: "country", label: "Country" }, { key: "domestic", label: "Domestic", format: "bool" }],
    defaults: { country: "Bangladesh", domestic: true, timezone: "Asia/Dhaka" },
    fields: [
      { name: "code", label: "IATA code", kind: "text", required: true },
      { name: "name", label: "Airport name", kind: "text", required: true },
      { name: "city", label: "City", kind: "text", required: true },
      { name: "country", label: "Country", kind: "text", required: true },
      { name: "timezone", label: "Timezone (IANA)", kind: "text" },
      { name: "domestic", label: "Domestic (Bangladesh)", kind: "boolean" },
    ],
  },
  buses: {
    path: "buses",
    title: "Buses",
    singular: "bus",
    columns: [{ key: "operator.name", label: "Operator" }, { key: "coachNumber", label: "Coach" }, { key: "from", label: "From" }, { key: "to", label: "To" }, { key: "departureTime", label: "Departs" }, { key: "fare", label: "Fare", format: "price" }, { key: "active", label: "Active", format: "bool" }],
    filters: [activeFilter],
    defaults: { busType: "AC", seatLayout: "2+2", rows: 10, boardingPoints: [], droppingPoints: [], amenities: [], active: true, operator: { rating: 4 } },
    fields: [
      { name: "operator.name", label: "Operator", kind: "text", required: true },
      { name: "operator.rating", label: "Operator rating", kind: "number" },
      { name: "coachNumber", label: "Coach number", kind: "text", required: true },
      { name: "busType", label: "Bus type", kind: "select", options: opt("AC", "Non-AC", "AC Sleeper", "Business Class") },
      { name: "from", label: "From city", kind: "text", required: true },
      { name: "to", label: "To city", kind: "text", required: true },
      { name: "departureTime", label: "Departure (HH:mm)", kind: "text", required: true },
      { name: "durationMinutes", label: "Duration (minutes)", kind: "number", required: true },
      { name: "fare", label: "Fare per seat (BDT)", kind: "number", required: true },
      { name: "seatLayout", label: "Seat layout", kind: "select", options: [{ value: "2+2", label: "2+2" }, { value: "2+1", label: "2+1" }, { value: "1+1", label: "1+1" }] },
      { name: "rows", label: "Rows", kind: "number", required: true },
      { name: "amenities", label: "Amenities (one per line)", kind: "list" },
      { name: "boardingPoints", label: "Boarding points (JSON)", kind: "json", full: true, hint: '[{"name":"Kalabagan","time":"21:30"}]' },
      { name: "droppingPoints", label: "Dropping points (JSON)", kind: "json", full: true },
      { name: "cancellationPolicy", label: "Cancellation policy", kind: "textarea", full: true },
      { name: "active", label: "Active", kind: "boolean" },
    ],
  },
  "visa-countries": {
    path: "visa-countries",
    title: "Visa services",
    singular: "visa service",
    columns: [{ key: "country", label: "Country" }, { key: "region", label: "Region" }, { key: "visaTypes", label: "Visa types", format: "count" }, { key: "popular", label: "Popular", format: "bool" }, { key: "published", label: "Published", format: "bool" }],
    filters: [pubFilter],
    publicUrl: (i) => `/visa/${i.slug}`,
    defaults: { published: true, visaTypes: [], requirements: [], documents: ["Passport copy"], notes: [] },
    fields: [
      { name: "country", label: "Country", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", hint: "Auto-generated when empty" },
      { name: "flag", label: "Flag emoji", kind: "text" },
      { name: "region", label: "Region", kind: "text" },
      { name: "image", label: "Image", kind: "image", full: true },
      { name: "description", label: "Description", kind: "textarea", required: true, full: true },
      { name: "visaTypes", label: "Visa types (JSON)", kind: "json", full: true, hint: '[{"name":"Tourist","entry":"Single","validityDays":90,"maxStayDays":30,"processingDays":"5-7","fee":4500,"serviceFee":1500}]' },
      { name: "documents", label: "Required documents (one per line)", kind: "list" },
      { name: "requirements", label: "Requirements (one per line)", kind: "list" },
      { name: "notes", label: "Notes (one per line)", kind: "list" },
      { name: "popular", label: "Popular", kind: "boolean" },
      { name: "published", label: "Published", kind: "boolean" },
    ],
  },
  coupons: {
    path: "coupons",
    title: "Coupons",
    singular: "coupon",
    columns: [{ key: "code", label: "Code" }, { key: "title", label: "Title" }, { key: "value", label: "Value" }, { key: "usedCount", label: "Used" }, { key: "validTo", label: "Valid to", format: "date" }, { key: "active", label: "Active", format: "bool" }],
    filters: [activeFilter],
    defaults: { discountType: "percent", value: 10, minAmount: 0, appliesTo: ["flight", "hotel", "tour", "bus"], usageLimit: 0, showOnHome: true, active: true },
    fields: [
      { name: "code", label: "Code", kind: "text", required: true },
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "description", label: "Description", kind: "textarea", full: true },
      { name: "discountType", label: "Discount type", kind: "select", options: opt("percent", "flat") },
      { name: "value", label: "Value", kind: "number", required: true },
      { name: "maxDiscount", label: "Max discount (BDT)", kind: "number" },
      { name: "minAmount", label: "Min. order (BDT)", kind: "number" },
      { name: "appliesTo", label: "Applies to", kind: "select", options: opt("flight", "hotel", "tour", "bus"), multiple: true },
      { name: "paymentChannel", label: "Payment channel only", kind: "select", options: opt("bkash", "nagad", "sslcommerz", "stripe") },
      { name: "validFrom", label: "Valid from", kind: "date" },
      { name: "validTo", label: "Valid to", kind: "date", required: true },
      { name: "usageLimit", label: "Usage limit (0 = unlimited)", kind: "number" },
      { name: "showOnHome", label: "Show on home page", kind: "boolean" },
      { name: "active", label: "Active", kind: "boolean" },
    ],
  },
  banners: {
    path: "banners",
    title: "Banners",
    singular: "banner",
    columns: [{ key: "title", label: "Title" }, { key: "placement", label: "Placement" }, { key: "order", label: "Order" }, { key: "active", label: "Active", format: "bool" }],
    filters: [{ key: "placement", label: "Placement", options: opt("home-hero", "home-promo", "home-strip") }, activeFilter],
    defaults: { placement: "home-promo", order: 0, link: "/", ctaLabel: "Explore", active: true },
    fields: [
      { name: "title", label: "Title", kind: "text", required: true },
      { name: "subtitle", label: "Subtitle", kind: "text" },
      { name: "image", label: "Image", kind: "image", required: true, full: true },
      { name: "link", label: "Link", kind: "text" },
      { name: "ctaLabel", label: "Button label", kind: "text" },
      { name: "placement", label: "Placement", kind: "select", options: opt("home-hero", "home-promo", "home-strip") },
      { name: "order", label: "Order", kind: "number" },
      { name: "active", label: "Active", kind: "boolean" },
    ],
  },
  "tour-requests": {
    path: "tour-requests",
    title: "Custom tour requests",
    singular: "tour request",
    columns: [{ key: "name", label: "Name" }, { key: "destination", label: "Destination" }, { key: "travelers", label: "Pax" }, { key: "budget", label: "Budget", format: "price" }, { key: "status", label: "Status" }, { key: "createdAt", label: "Received", format: "date" }],
    filters: [{ key: "status", label: "Status", options: opt("new", "contacted", "closed") }],
    fields: [
      { name: "status", label: "Status", kind: "select", options: opt("new", "contacted", "closed") },
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "email", label: "Email", kind: "text", required: true },
      { name: "phone", label: "Phone", kind: "text", required: true },
      { name: "destination", label: "Destination", kind: "text", required: true },
      { name: "travelDate", label: "Travel date", kind: "date" },
      { name: "durationDays", label: "Days", kind: "number" },
      { name: "travelers", label: "Travellers", kind: "number" },
      { name: "budget", label: "Budget (BDT)", kind: "number" },
      { name: "message", label: "Message", kind: "textarea", full: true },
    ],
  },
};

export function getPath(obj: Record<string, unknown> | undefined, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let cur = obj;
  keys.slice(0, -1).forEach((k) => {
    if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  });
  cur[keys[keys.length - 1]] = value;
}

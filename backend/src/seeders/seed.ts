import mongoose from 'mongoose';
import { connectDatabase } from '../config/db';
import { env } from '../config/env';
import {
  Airport,
  Banner,
  Booking,
  Bus,
  Coupon,
  Destination,
  Flight,
  Hotel,
  Newsletter,
  Notification,
  Payment,
  Review,
  Room,
  Setting,
  Tour,
  TourRequest,
  User,
  VisaApplication,
  VisaCountry,
  Wishlist,
  TOUR_CATEGORIES,
} from '../models';
import { generateReference, slugify } from '../utils/helpers';
import { IMG, airlines, airports, destinations, img } from './data';

const DAY = 86_400_000;
const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const daysFromNow = (n: number) => new Date(today.getTime() + n * DAY);
const pick = <T,>(arr: readonly T[], i: number) => arr[i % arr.length];

/* ─────────────── Hotels ─────────────── */

const AMENITIES = ['Free Wi-Fi', 'Swimming pool', 'Restaurant', 'Airport shuttle', 'Spa', 'Fitness centre', 'Parking', 'Room service', 'Beach access', 'Bar', 'Kids club', '24-hour front desk', 'Air conditioning', 'Laundry', 'Sea view'];

interface HotelSpec {
  name: string;
  dest: string;
  area: string;
  stars: number;
  type: 'hotel' | 'resort' | 'apartment' | 'guest-house' | 'villa' | 'boutique';
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  amenities: number[];
  badges?: string[];
  purposes?: string[];
  featured?: boolean;
}

const hotelSpecs: HotelSpec[] = [
  { name: 'Seagull Crest Resort & Spa', dest: 'coxs-bazar', area: 'Kolatoli', stars: 5, type: 'resort', price: 14500, rating: 4.7, reviews: 1284, images: [IMG.hotelPool, IMG.room1, IMG.resort, IMG.suite], amenities: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14], badges: ['Top Selling'], purposes: ['families', 'couples'], featured: true },
  { name: 'Marine Drive Bay Hotel', dest: 'coxs-bazar', area: 'Marine Drive', stars: 4, type: 'hotel', price: 8200, rating: 4.4, reviews: 642, images: [IMG.hotelFacade, IMG.room2, IMG.terrace], amenities: [0, 2, 6, 7, 11, 12, 14], badges: ['Popular'], purposes: ['families', 'friends'], featured: true },
  { name: 'Inani Sands Boutique Stay', dest: 'coxs-bazar', area: 'Inani Beach', stars: 4, type: 'boutique', price: 9900, rating: 4.6, reviews: 318, images: [IMG.beachPalm, IMG.room5, IMG.infinityPool], amenities: [0, 1, 2, 8, 12, 14], purposes: ['couples', 'solo'], badges: ['Trending'] },
  { name: 'Laboni Point Guest House', dest: 'coxs-bazar', area: 'Laboni Point', stars: 2, type: 'guest-house', price: 2800, rating: 4.0, reviews: 205, images: [IMG.apartment, IMG.room3], amenities: [0, 11, 12], purposes: ['friends', 'solo'] },
  { name: 'Cloud Nine Hill Cottage', dest: 'sajek-valley', area: 'Ruilui Para', stars: 3, type: 'guest-house', price: 5200, rating: 4.5, reviews: 412, images: [IMG.hills, IMG.room6, IMG.nature], amenities: [0, 2, 12], badges: ['Popular'], purposes: ['couples', 'friends'], featured: true },
  { name: 'Konglak Ridge Eco Lodge', dest: 'sajek-valley', area: 'Konglak', stars: 3, type: 'villa', price: 6400, rating: 4.3, reviews: 188, images: [IMG.mountains, IMG.room4], amenities: [0, 2, 6], purposes: ['friends', 'solo'] },
  { name: 'Tea Valley Retreat', dest: 'sreemangal', area: 'Radhanagar', stars: 4, type: 'resort', price: 9800, rating: 4.6, reviews: 534, images: [IMG.forest, IMG.room1, IMG.tropicalPool], amenities: [0, 1, 2, 4, 5, 6, 10], badges: ['Top Selling'], purposes: ['families', 'couples'], featured: true },
  { name: 'Lawachara Woods Inn', dest: 'sreemangal', area: 'Lawachara', stars: 3, type: 'hotel', price: 4500, rating: 4.2, reviews: 221, images: [IMG.nature, IMG.room3], amenities: [0, 2, 6, 11], purposes: ['solo', 'business'] },
  { name: 'Surma Riverside Hotel', dest: 'sylhet', area: 'Zindabazar', stars: 4, type: 'hotel', price: 7200, rating: 4.3, reviews: 476, images: [IMG.hotelLobby, IMG.room2, IMG.terrace], amenities: [0, 2, 3, 5, 6, 7, 11], purposes: ['business', 'families'] },
  { name: 'Jaflong Stone River Resort', dest: 'sylhet', area: 'Jaflong', stars: 4, type: 'resort', price: 8800, rating: 4.5, reviews: 290, images: [IMG.waterfall, IMG.room5, IMG.hotelPool], amenities: [0, 1, 2, 4, 6, 10], badges: ['Trending'], purposes: ['families', 'couples'] },
  { name: 'Nilgiri Peak Resort', dest: 'bandarban', area: 'Thanchi Road', stars: 4, type: 'resort', price: 9200, rating: 4.6, reviews: 388, images: [IMG.mountains, IMG.room6, IMG.resort], amenities: [0, 2, 6, 7, 12], badges: ['Popular'], purposes: ['couples', 'friends'] },
  { name: 'Coral Bay Island Resort', dest: 'saint-martins-island', area: 'West Beach', stars: 3, type: 'resort', price: 7600, rating: 4.4, reviews: 352, images: [IMG.island, IMG.room4, IMG.beachPalm], amenities: [0, 2, 8, 12, 14], purposes: ['friends', 'couples'] },
  { name: 'Mangrove Edge Eco Resort', dest: 'sundarbans', area: 'Mongla', stars: 3, type: 'resort', price: 6900, rating: 4.3, reviews: 147, images: [IMG.lakeTree, IMG.room3], amenities: [0, 2, 6, 3], purposes: ['families', 'friends'] },
  { name: 'Kaptai Lakeview Hotel', dest: 'rangamati', area: 'Reserve Bazar', stars: 3, type: 'hotel', price: 4200, rating: 4.1, reviews: 163, images: [IMG.boatLake, IMG.room2], amenities: [0, 2, 6, 12], purposes: ['families'] },
  { name: 'Sunrise Shore Kuakata', dest: 'kuakata', area: 'Zero Point', stars: 3, type: 'hotel', price: 3900, rating: 4.0, reviews: 129, images: [IMG.waves, IMG.room1], amenities: [0, 2, 8, 12], purposes: ['friends', 'families'] },
  { name: 'Ubud Rice Terrace Villas', dest: 'bali', area: 'Ubud', stars: 5, type: 'villa', price: 21500, rating: 4.8, reviews: 2140, images: [IMG.bali, IMG.tropicalPool, IMG.suite], amenities: [0, 1, 2, 4, 7, 9, 12], badges: ['Top Selling'], purposes: ['couples'], featured: true },
  { name: 'Seminyak Coastline Hotel', dest: 'bali', area: 'Seminyak', stars: 4, type: 'hotel', price: 12800, rating: 4.5, reviews: 980, images: [IMG.beachPalm, IMG.room5, IMG.hotelPool], amenities: [0, 1, 2, 5, 8, 9], purposes: ['friends', 'couples'] },
  { name: 'Patong Cliffside Resort', dest: 'phuket', area: 'Patong', stars: 4, type: 'resort', price: 11200, rating: 4.4, reviews: 1320, images: [IMG.phuket, IMG.infinityPool, IMG.room1], amenities: [0, 1, 2, 4, 5, 8, 9], badges: ['Popular'], purposes: ['friends', 'couples'] },
  { name: 'Riverside Sukhumvit Hotel', dest: 'bangkok', area: 'Sukhumvit', stars: 4, type: 'hotel', price: 8900, rating: 4.3, reviews: 1755, images: [IMG.hotelFacade, IMG.room6, IMG.terrace], amenities: [0, 1, 2, 5, 7, 9, 11], purposes: ['business', 'solo'] },
  { name: 'Azure Lagoon Water Villas', dest: 'maldives', area: 'South Malé Atoll', stars: 5, type: 'resort', price: 48500, rating: 4.9, reviews: 860, images: [IMG.maldives, IMG.infinityPool, IMG.suite], amenities: [0, 1, 2, 3, 4, 7, 8, 9, 14], badges: ['Top Selling', 'Trending'], purposes: ['couples'], featured: true },
  { name: 'Marina Skyline Suites', dest: 'dubai', area: 'Dubai Marina', stars: 5, type: 'apartment', price: 19800, rating: 4.6, reviews: 1410, images: [IMG.dubai, IMG.apartment, IMG.terrace], amenities: [0, 1, 2, 5, 6, 7, 11], badges: ['Popular'], purposes: ['families', 'business'], featured: true },
  { name: 'Orchard Garden Hotel', dest: 'singapore', area: 'Orchard Road', stars: 4, type: 'hotel', price: 17600, rating: 4.5, reviews: 2033, images: [IMG.singapore, IMG.room2, IMG.hotelLobby], amenities: [0, 1, 2, 5, 7, 11], purposes: ['families', 'business'] },
  { name: 'Bukit Bintang Central', dest: 'kuala-lumpur', area: 'Bukit Bintang', stars: 4, type: 'hotel', price: 7800, rating: 4.3, reviews: 1188, images: [IMG.kualaLumpur, IMG.room4, IMG.hotelPool], amenities: [0, 1, 2, 5, 11], purposes: ['solo', 'business'] },
  { name: 'Thamel Heritage Boutique', dest: 'kathmandu', area: 'Thamel', stars: 3, type: 'boutique', price: 5400, rating: 4.4, reviews: 692, images: [IMG.nepal, IMG.room3], amenities: [0, 2, 11, 13], purposes: ['solo', 'friends'] },
];

const ROOM_TEMPLATES = [
  { name: 'Deluxe Room', bedType: '1 Queen Bed', sizeSqm: 28, maxAdults: 2, maxChildren: 1, factor: 1, totalRooms: 8, breakfastIncluded: false, refundable: true, view: 'City / garden view' },
  { name: 'Premier King', bedType: '1 King Bed', sizeSqm: 34, maxAdults: 2, maxChildren: 1, factor: 1.3, totalRooms: 6, breakfastIncluded: true, refundable: true, view: 'Partial sea / hill view' },
  { name: 'Family Suite', bedType: '1 King + 1 Twin', sizeSqm: 52, maxAdults: 4, maxChildren: 2, factor: 1.9, totalRooms: 3, breakfastIncluded: true, refundable: false, view: 'Panoramic view' },
];

/* ─────────────── Tours ─────────────── */

interface TourSpec {
  title: string;
  dest: string;
  categories: string[];
  days: number;
  price: number;
  start: string;
  images: string[];
  featured?: boolean;
  customizable?: boolean;
  highlights: string[];
  rating: number;
  reviews: number;
}

const tourSpecs: TourSpec[] = [
  { title: "Cox's Bazar Beach Escape", dest: 'coxs-bazar', categories: ['beach', 'family'], days: 3, price: 12500, start: 'Dhaka', images: [IMG.beach, IMG.waves, IMG.hotelPool, IMG.beachCalm], featured: true, customizable: true, highlights: ['Sunset at Laboni Beach', 'Marine Drive to Inani', 'Himchari waterfall', 'Fresh seafood dinner'], rating: 4.7, reviews: 486 },
  { title: 'Sajek Valley Cloud Trail', dest: 'sajek-valley', categories: ['adventure', 'group'], days: 3, price: 9800, start: 'Dhaka', images: [IMG.hills, IMG.mountains, IMG.nature], featured: true, highlights: ['Sunrise at Konglak Hill', 'Jeep ride through the hills', 'Ruilui Para village walk', 'Bonfire night'], rating: 4.8, reviews: 612 },
  { title: 'Sylhet Tea & Waterfalls', dest: 'sylhet', categories: ['family', 'cultural'], days: 3, price: 11200, start: 'Dhaka', images: [IMG.waterfall, IMG.forest, IMG.lakeTree], featured: true, highlights: ['Ratargul swamp forest boat ride', 'Jaflong stone river', 'Bisnakandi', 'Malnicherra tea estate'], rating: 4.6, reviews: 344 },
  { title: 'Sreemangal Tea Garden Weekend', dest: 'sreemangal', categories: ['family', 'cultural'], days: 2, price: 7600, start: 'Dhaka', images: [IMG.forest, IMG.nature], highlights: ['Lawachara rainforest trek', 'Seven-layer tea tasting', 'Madhabpur lake'], rating: 4.5, reviews: 205 },
  { title: 'Bandarban Peaks Trek', dest: 'bandarban', categories: ['adventure', 'group'], days: 4, price: 13900, start: 'Dhaka', images: [IMG.mountains, IMG.waterfall, IMG.hills], highlights: ['Nilgiri sunrise', 'Boga Lake trek', 'Sangu river boat ride', 'Tribal cuisine'], rating: 4.7, reviews: 266 },
  { title: "Saint Martin's Island Getaway", dest: 'saint-martins-island', categories: ['beach', 'honeymoon'], days: 3, price: 14800, start: 'Dhaka', images: [IMG.island, IMG.beachPalm, IMG.diving], featured: true, highlights: ['Ship cruise from Teknaf', 'Chera Dwip coral walk', 'Snorkelling', 'Beach barbecue'], rating: 4.6, reviews: 391 },
  { title: 'Sundarbans Mangrove Cruise', dest: 'sundarbans', categories: ['adventure', 'family', 'group'], days: 3, price: 18500, start: 'Khulna', images: [IMG.lakeTree, IMG.boatLake, IMG.forest], featured: true, highlights: ['3-day launch cruise', 'Kotka & Kochikhali wildlife trails', 'Tiger-point watchtower', 'Canal canoeing'], rating: 4.8, reviews: 228 },
  { title: 'Rangamati Lake Day Trip', dest: 'rangamati', categories: ['day-trip', 'family'], days: 1, price: 3500, start: 'Chattogram', images: [IMG.boatLake, IMG.lakeMountain], highlights: ['Kaptai lake boat ride', 'Hanging bridge', 'Shuvolong waterfall'], rating: 4.3, reviews: 118 },
  { title: 'Kuakata Sunrise & Sunset Tour', dest: 'kuakata', categories: ['beach', 'private'], days: 2, price: 6900, start: 'Dhaka', images: [IMG.waves, IMG.beachCalm], customizable: true, highlights: ['Sunrise at Gangamati', 'Fatrar forest', 'Rakhine village'], rating: 4.2, reviews: 96 },
  { title: 'Bali Honeymoon Bliss', dest: 'bali', categories: ['honeymoon', 'private'], days: 6, price: 89500, start: 'Denpasar', images: [IMG.bali, IMG.tropicalPool, IMG.beachPalm, IMG.suite], featured: true, customizable: true, highlights: ['Private pool villa in Ubud', 'Uluwatu temple sunset', 'Floating breakfast', 'Couples spa'], rating: 4.9, reviews: 312 },
  { title: 'Phuket & Phi Phi Island Hopping', dest: 'phuket', categories: ['beach', 'group', 'adventure'], days: 5, price: 64900, start: 'Phuket', images: [IMG.phuket, IMG.thailand, IMG.beach], featured: true, highlights: ['Phi Phi speedboat tour', 'James Bond Island', 'Old Phuket Town', 'Big Buddha'], rating: 4.7, reviews: 540 },
  { title: 'Bangkok City Explorer', dest: 'bangkok', categories: ['cultural', 'family'], days: 4, price: 46500, start: 'Bangkok', images: [IMG.thailand, IMG.hotelFacade], highlights: ['Grand Palace & Wat Pho', 'Chao Phraya dinner cruise', 'Floating market', 'Safari World'], rating: 4.5, reviews: 422 },
  { title: 'Maldives Overwater Retreat', dest: 'maldives', categories: ['honeymoon', 'beach', 'private'], days: 4, price: 129000, start: 'Malé', images: [IMG.maldives, IMG.infinityPool, IMG.diving], featured: true, customizable: true, highlights: ['Overwater villa', 'Speedboat transfers', 'Sunset dolphin cruise', 'All meals included'], rating: 4.9, reviews: 274 },
  { title: 'Dubai Family Fun Package', dest: 'dubai', categories: ['family', 'group'], days: 5, price: 84500, start: 'Dubai', images: [IMG.dubai, IMG.terrace, IMG.hotelPool], featured: true, highlights: ['Desert safari with BBQ', 'Burj Khalifa At the Top', 'Dhow cruise', 'Dubai Mall & Aquarium'], rating: 4.6, reviews: 388 },
  { title: 'Singapore Highlights', dest: 'singapore', categories: ['family', 'cultural'], days: 4, price: 78900, start: 'Singapore', images: [IMG.singapore, IMG.hotelLobby], highlights: ['Gardens by the Bay', 'Sentosa & Universal Studios', 'Night Safari', 'Marina Bay light show'], rating: 4.7, reviews: 301 },
  { title: 'Kuala Lumpur & Genting', dest: 'kuala-lumpur', categories: ['family', 'group'], days: 4, price: 52900, start: 'Kuala Lumpur', images: [IMG.kualaLumpur, IMG.hotelPool], highlights: ['Petronas Twin Towers', 'Batu Caves', 'Genting Highlands cable car', 'Putrajaya'], rating: 4.4, reviews: 214 },
  { title: 'Kathmandu & Pokhara Discovery', dest: 'kathmandu', categories: ['adventure', 'cultural', 'group'], days: 6, price: 48500, start: 'Kathmandu', images: [IMG.nepal, IMG.mountains, IMG.backpacker], featured: true, highlights: ['Swayambhunath stupa', 'Sarangkot sunrise', 'Phewa lake boating', 'Paragliding (optional)'], rating: 4.8, reviews: 356 },
  { title: 'Golden Triangle: Delhi–Agra–Jaipur', dest: 'agra-delhi', categories: ['cultural', 'family', 'private'], days: 5, price: 39900, start: 'New Delhi', images: [IMG.india, IMG.map], customizable: true, highlights: ['Taj Mahal at sunrise', 'Agra Fort', 'Amber Fort, Jaipur', 'Old Delhi food walk'], rating: 4.6, reviews: 248 },
];

function buildItinerary(spec: TourSpec) {
  const items = [];
  for (let d = 1; d <= spec.days; d++) {
    const highlight = spec.highlights[(d - 1) % spec.highlights.length];
    items.push({
      day: d,
      title: d === 1 ? `Arrival & ${highlight}` : d === spec.days ? `${highlight} & departure` : highlight,
      description:
        d === 1
          ? `Meet your Tripnaro host in ${spec.start}, transfer to the hotel and check in. Afternoon: ${highlight.toLowerCase()}. Welcome dinner with the group.`
          : d === spec.days
            ? `After breakfast enjoy ${highlight.toLowerCase()} before checking out. Transfer back to ${spec.start} with memories to keep.`
            : `A full day dedicated to ${highlight.toLowerCase()}, with a local guide, lunch on the way and free time in the evening.`,
      meals: d === 1 ? ['Dinner'] : d === spec.days ? ['Breakfast'] : ['Breakfast', 'Lunch'],
      stay: d === spec.days ? undefined : 'Handpicked 3–4★ hotel',
    });
  }
  return items;
}

/* ─────────────── Flights ─────────────── */

type Route = [string, string, number, number, (typeof airlines)[keyof typeof airlines][], number?]; // from, to, minutes, economy fare, carriers, stops

const routes: Route[] = [
  ['DAC', 'CXB', 65, 5200, [airlines.meghna, airlines.padma, airlines.bay]],
  ['DAC', 'CGP', 55, 4300, [airlines.meghna, airlines.padma, airlines.bay]],
  ['DAC', 'ZYL', 45, 3900, [airlines.meghna, airlines.padma]],
  ['DAC', 'JSR', 40, 3700, [airlines.padma, airlines.bay]],
  ['DAC', 'RJH', 45, 3800, [airlines.meghna, airlines.bay]],
  ['DAC', 'SPD', 55, 4000, [airlines.padma, airlines.bay]],
  ['DAC', 'BZL', 35, 3500, [airlines.meghna]],
  ['CGP', 'CXB', 35, 3200, [airlines.bay]],
  ['DAC', 'CCU', 60, 9800, [airlines.meghna, airlines.padma]],
  ['DAC', 'DEL', 160, 21500, [airlines.meghna, airlines.himalaya]],
  ['DAC', 'KTM', 80, 17800, [airlines.himalaya, airlines.meghna]],
  ['DAC', 'BKK', 165, 24500, [airlines.siam, airlines.padma, airlines.meghna]],
  ['DAC', 'SIN', 245, 33500, [airlines.lion, airlines.meghna]],
  ['DAC', 'KUL', 235, 27900, [airlines.padma, airlines.lion]],
  ['DAC', 'MLE', 230, 31200, [airlines.meghna, airlines.padma]],
  ['DAC', 'DXB', 330, 38500, [airlines.gulf, airlines.meghna]],
  ['DAC', 'DOH', 360, 39900, [airlines.gulf]],
  ['DAC', 'JED', 420, 52500, [airlines.gulf, airlines.meghna]],
  ['DAC', 'IST', 600, 68500, [airlines.gulf], 1],
  ['DAC', 'LHR', 780, 92500, [airlines.gulf], 1],
];

const DEPARTURE_SLOTS = ['06:45', '08:30', '10:15', '13:05', '15:40', '18:20', '20:55'];
const AIRCRAFT = ['ATR 72-600', 'Dash 8-Q400', 'Boeing 737-800', 'Airbus A320neo', 'Boeing 787-9', 'Airbus A330-300'];

function buildFlights() {
  const flights: Record<string, unknown>[] = [];
  let counter = 100;
  for (const [from, to, minutes, fare, carriers, stops = 0] of routes) {
    const international = minutes > 70 || !['DAC', 'CGP', 'CXB', 'ZYL', 'JSR', 'RJH', 'SPD', 'BZL'].includes(to);
    for (const [direction, a, b] of [['out', from, to], ['in', to, from]] as const) {
      carriers.forEach((carrier, ci) => {
        const perCarrier = international ? 1 : 2;
        for (let k = 0; k < perCarrier; k++) {
          counter += 7;
          const slot = pick(DEPARTURE_SLOTS, counter);
          const layoverMinutes = stops ? 95 + (counter % 4) * 25 : 0;
          const duration = minutes + layoverMinutes + (direction === 'in' ? 10 : 0);
          const baseFare = Math.round((fare * (1 + ci * 0.06 + k * 0.08)) / 10) * 10;
          flights.push({
            airline: { ...carrier },
            flightNumber: `${carrier.code}${counter}`,
            from: a,
            to: b,
            departureTime: slot,
            durationMinutes: duration,
            stops,
            layovers: stops ? [{ airport: 'DXB', city: 'Dubai', durationMinutes: layoverMinutes }] : [],
            daysOfWeek: international && carrier !== carriers[0] ? [1, 3, 5, 6] : [0, 1, 2, 3, 4, 5, 6],
            aircraft: international ? pick(AIRCRAFT.slice(2), counter) : pick(AIRCRAFT.slice(0, 4), counter),
            cabins: [
              { cabinClass: 'economy', baseFare, taxes: international ? 6500 : 650, seats: 30 + (counter % 20) },
              ...(international ? [{ cabinClass: 'premium_economy', baseFare: Math.round(baseFare * 1.6), taxes: 7200, seats: 12 }] : []),
              { cabinClass: 'business', baseFare: Math.round(baseFare * (international ? 2.9 : 2.1)), taxes: international ? 9500 : 900, seats: 8 },
              ...(minutes > 300 ? [{ cabinClass: 'first', baseFare: Math.round(baseFare * 4.8), taxes: 12500, seats: 4 }] : []),
            ],
            baggage: { cabin: '7 kg', checked: international ? '30 kg' : '20 kg' },
            refundable: k % 2 === 0,
          });
        }
      });
    }
  }
  return flights;
}

/* ─────────────── Buses ─────────────── */

const operators = [
  { name: 'Nilgiri Travels', rating: 4.6 },
  { name: 'Padma Express', rating: 4.3 },
  { name: 'Coastal Liner', rating: 4.5 },
  { name: 'Meghdoot Paribahan', rating: 4.1 },
  { name: 'Riverline Coach', rating: 4.4 },
];

const busRoutes: [string, string, number, number][] = [
  ['Dhaka', "Cox's Bazar", 600, 1800],
  ['Dhaka', 'Chattogram', 330, 1100],
  ['Dhaka', 'Sylhet', 300, 950],
  ['Dhaka', 'Rajshahi', 330, 900],
  ['Dhaka', 'Khulna', 300, 1000],
  ['Dhaka', 'Bandarban', 540, 1400],
  ['Chattogram', "Cox's Bazar", 240, 650],
  ['Dhaka', 'Sreemangal', 240, 750],
];

function buildBuses() {
  const buses: Record<string, unknown>[] = [];
  let n = 0;
  for (const [from, to, minutes, fare] of busRoutes) {
    for (const [a, b] of [[from, to], [to, from]]) {
      for (let i = 0; i < 4; i++) {
        n++;
        const op = pick(operators, n);
        const type = pick(['AC', 'Non-AC', 'AC Sleeper', 'Business Class'] as const, n + i);
        const multiplier = { AC: 1.35, 'Non-AC': 1, 'AC Sleeper': 2.1, 'Business Class': 2.6 }[type];
        const layout = type === 'Business Class' || type === 'AC Sleeper' ? '2+1' : '2+2';
        const hour = [7, 10, 14, 22][i];
        buses.push({
          operator: op,
          coachNumber: `${op.name.split(' ')[0].slice(0, 3).toUpperCase()}-${100 + n}`,
          busType: type,
          from: a,
          to: b,
          departureTime: `${String(hour).padStart(2, '0')}:${pick(['00', '15', '30', '45'], n)}`,
          durationMinutes: minutes + (type === 'Non-AC' ? 30 : 0),
          fare: Math.round((fare * multiplier) / 10) * 10,
          seatLayout: layout,
          rows: layout === '2+1' ? 9 : 10,
          boardingPoints: [
            { name: `${a} Central Terminal`, time: '' },
            { name: `${a} Bypass Counter`, time: '+20m' },
          ],
          droppingPoints: [
            { name: `${b} City Counter`, time: '' },
            { name: `${b} Bus Terminal`, time: '+15m' },
          ],
          amenities: type === 'Non-AC' ? ['Water bottle', 'Reading light'] : ['Air conditioning', 'Water bottle', 'Charging port', 'Blanket', 'Wi-Fi'].slice(0, type === 'AC' ? 3 : 5),
        });
      }
    }
  }
  return buses;
}

/* ─────────────── Visa ─────────────── */

const commonDocs = ['Original passport valid for at least 6 months', 'Two recent passport-size photos (white background)', 'Bank statement for the last 6 months', 'Bank solvency certificate', 'NOC / trade licence / student ID', 'Return air ticket booking', 'Hotel reservation'];

const visaCountries = [
  { country: 'Thailand', flag: '🇹🇭', image: IMG.thailand, region: 'Asia', popular: true, types: [['Tourist', 'Single', 90, 60, '10-12 working days', 4500, 1500]] },
  { country: 'Malaysia', flag: '🇲🇾', image: IMG.kualaLumpur, region: 'Asia', popular: true, types: [['eVisa (Tourist)', 'Single', 90, 30, '5-7 working days', 3800, 1200]] },
  { country: 'Singapore', flag: '🇸🇬', image: IMG.singapore, region: 'Asia', popular: true, types: [['Tourist', 'Multiple', 63, 30, '7-9 working days', 4200, 1800]] },
  { country: 'United Arab Emirates', flag: '🇦🇪', image: IMG.dubai, region: 'Middle East', popular: true, types: [['30-day Tourist', 'Single', 60, 30, '4-6 working days', 11500, 2000], ['60-day Tourist', 'Single', 60, 60, '4-6 working days', 19500, 2500]] },
  { country: 'India', flag: '🇮🇳', image: IMG.india, region: 'Asia', popular: true, types: [['Tourist', 'Double', 180, 90, '7-10 working days', 1000, 1000], ['Medical', 'Triple', 365, 180, '5-7 working days', 1000, 1500]] },
  { country: 'Indonesia', flag: '🇮🇩', image: IMG.bali, region: 'Asia', types: [['Visa on Arrival support', 'Single', 30, 30, '3-5 working days', 4500, 800]] },
  { country: 'Nepal', flag: '🇳🇵', image: IMG.nepal, region: 'Asia', types: [['Tourist (on arrival guidance)', 'Multiple', 30, 30, '1-2 working days', 0, 800]] },
  { country: 'Türkiye', flag: '🇹🇷', image: IMG.venice, region: 'Europe', types: [['Tourist', 'Single', 90, 30, '15-20 working days', 9800, 3000]] },
  { country: 'United Kingdom', flag: '🇬🇧', image: IMG.paris, region: 'Europe', types: [['Standard Visitor (6 months)', 'Multiple', 180, 180, '15-21 working days', 18500, 4500]] },
  { country: 'Japan', flag: '🇯🇵', image: IMG.tokyo, region: 'Asia', types: [['Tourist', 'Single', 90, 15, '7-10 working days', 0, 3500]] },
] as const;

/* ─────────────── Runner ─────────────── */

async function seed() {
  await connectDatabase();
  console.log('🌱 Clearing collections…');
  await Promise.all(
    [Airport, Banner, Booking, Bus, Coupon, Destination, Flight, Hotel, Newsletter, Notification, Payment, Review, Room, Setting, Tour, TourRequest, User, VisaApplication, VisaCountry, Wishlist].map(
      (m) => (m as unknown as typeof User).deleteMany({}),
    ),
  );
  await Promise.all([User, Booking, Hotel, Tour, Destination, Flight, Review, Wishlist].map((m) => (m as unknown as typeof User).syncIndexes()));

  console.log('👤 Users');
  const admin = await User.create({ name: 'Tripnaro Admin', email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD, role: 'admin', phone: '+8801700000000' });
  const demoUser = await User.create({
    name: 'Nusrat Jahan',
    email: 'user@tripnaro.com',
    password: 'User@12345',
    phone: '+8801811223344',
    nationality: 'Bangladeshi',
    gender: 'female',
    address: 'Dhanmondi, Dhaka',
    savedTravelers: [
      { title: 'Ms', firstName: 'Nusrat', lastName: 'Jahan', type: 'adult', gender: 'female', nationality: 'Bangladeshi', passportNumber: 'A01234567' },
      { title: 'Mr', firstName: 'Tanvir', lastName: 'Ahmed', type: 'adult', gender: 'male', nationality: 'Bangladeshi', passportNumber: 'A07654321' },
    ],
  });
  const reviewers = await User.create(
    ['Rafiq Hasan', 'Sadia Islam', 'Arif Chowdhury', 'Maliha Rahman', 'Imran Kabir'].map((name, i) => ({
      name,
      email: `${slugify(name).replace('-', '.')}@example.com`,
      password: `Reviewer@${1000 + i}`,
    })),
  );

  console.log('📍 Destinations');
  const destDocs = await Destination.insertMany(
    destinations.map((d) => ({
      ...d,
      countrySlug: slugify(d.country),
      image: img(d.image),
      gallery: d.gallery.map((g) => img(g)),
      tags: [...d.tags],
      description: `${d.name} is one of ${d.scope === 'domestic' ? "Bangladesh's" : `${d.country}'s`} most loved destinations. ${d.tagline}. Tripnaro curates stays, tours and transfers here with verified partners, transparent pricing and 24/7 local support. The best time to visit is ${d.bestTimeToVisit}.`,
    })),
  );
  const destBySlug = new Map<string, (typeof destDocs)[number]>(destDocs.map((d) => [d.slug, d]));

  console.log('🏨 Hotels & rooms');
  const hotelDocs: InstanceType<typeof Hotel>[] = [];
  for (const [i, spec] of hotelSpecs.entries()) {
    const dest = destBySlug.get(spec.dest)!;
    const hotel = await Hotel.create({
      name: spec.name,
      slug: slugify(spec.name),
      destination: dest._id,
      city: dest.name,
      area: spec.area,
      address: `${spec.area}, ${dest.name}, ${dest.country}`,
      location: { lat: (dest.location?.lat ?? 0) + (i % 5) * 0.004, lng: (dest.location?.lng ?? 0) + (i % 3) * 0.004 },
      stars: spec.stars,
      propertyType: spec.type,
      shortDescription: `${spec.stars}-star ${spec.type.replace('-', ' ')} in ${spec.area}, ${dest.name}.`,
      description: `Set in ${spec.area}, ${spec.name} pairs warm local hospitality with thoughtful comforts. Guests love the ${spec.amenities.slice(0, 3).map((a) => AMENITIES[a].toLowerCase()).join(', ')}, and the easy access to ${dest.name}'s main sights. Rooms are designed for rest, with blackout curtains, rain showers and fast Wi-Fi.`,
      images: spec.images.map((x) => img(x)),
      amenities: spec.amenities.map((a) => AMENITIES[a]),
      highlights: ['Free cancellation on most rooms', `${(i % 9) + 2} km from ${dest.name} centre`, 'Pay with bKash, Nagad or card'],
      tripPurposes: spec.purposes ?? [],
      badges: spec.badges ?? [],
      rating: spec.rating,
      reviewCount: spec.reviews,
      priceFrom: spec.price,
      originalPriceFrom: Math.round(spec.price * 1.18),
      featured: spec.featured ?? false,
    });
    await Room.insertMany(
      ROOM_TEMPLATES.map((t, r) => ({
        hotel: hotel._id,
        name: t.name,
        bedType: t.bedType,
        sizeSqm: t.sizeSqm,
        view: t.view,
        maxAdults: t.maxAdults,
        maxChildren: t.maxChildren,
        price: Math.round((spec.price * t.factor) / 50) * 50,
        originalPrice: Math.round((spec.price * t.factor * 1.18) / 50) * 50,
        totalRooms: t.totalRooms,
        amenities: ['Air conditioning', 'Free Wi-Fi', 'Flat-screen TV', 'Minibar', 'Rain shower'].slice(0, 3 + r),
        images: [img(pick([IMG.room1, IMG.room2, IMG.room3, IMG.room4, IMG.room5, IMG.room6, IMG.suite], i + r), 900)],
        breakfastIncluded: t.breakfastIncluded,
        refundable: t.refundable,
      })),
    );
    hotelDocs.push(hotel);
  }

  console.log('🧭 Tours');
  const tourDocs: InstanceType<typeof Tour>[] = [];
  for (const [i, spec] of tourSpecs.entries()) {
    const dest = destBySlug.get(spec.dest)!;
    const departures = Array.from({ length: 10 }, (_, k) => ({
      date: daysFromNow(5 + k * 7 + (i % 4)),
      totalSeats: spec.categories.includes('private') ? 8 : 20,
      bookedSeats: (i * 3 + k * 5) % 12,
    }));
    const tour = await Tour.create({
      title: spec.title,
      slug: slugify(spec.title),
      destination: dest._id,
      scope: dest.scope,
      categories: [...new Set(spec.categories)] as (typeof TOUR_CATEGORIES)[number][],
      durationDays: spec.days,
      durationNights: Math.max(0, spec.days - 1),
      startLocation: spec.start,
      groupSize: spec.categories.includes('private') ? 'Private: 2–8 travellers' : 'Small group: up to 20',
      shortDescription: `${spec.days} day${spec.days > 1 ? 's' : ''} in ${dest.name}: ${spec.highlights.slice(0, 2).join(', ').toLowerCase()} and more.`,
      overview: `${spec.title} is a carefully paced journey through ${dest.name}. ${dest.tagline}. Expect ${spec.highlights.map((h) => h.toLowerCase()).join(', ')}, with a Tripnaro host looking after every transfer, ticket and meal so you can simply enjoy the trip.`,
      highlights: spec.highlights,
      images: spec.images.map((x) => img(x)),
      itinerary: buildItinerary(spec),
      included: ['Accommodation as per itinerary', 'Daily breakfast', 'All transfers in private AC vehicle', 'Entry tickets listed in itinerary', 'English / Bangla speaking guide', dest.scope === 'international' ? 'Travel insurance' : 'Bottled water'],
      excluded: [dest.scope === 'international' ? 'International air fare & visa fee' : 'Air / bus fare to the start point', 'Personal expenses', 'Tips for guides and drivers', 'Anything not listed under inclusions'],
      departures,
      priceAdult: spec.price,
      priceChild: Math.round(spec.price * 0.7),
      originalPrice: Math.round(spec.price * 1.15),
      customizable: spec.customizable ?? false,
      rating: spec.rating,
      reviewCount: spec.reviews,
      featured: spec.featured ?? false,
    });
    tourDocs.push(tour);
  }

  console.log('✈️  Airports & flights');
  await Airport.insertMany(airports);
  const flights = await Flight.insertMany(buildFlights());
  console.log(`   ${flights.length} flight schedules`);

  console.log('🚌 Buses');
  const buses = await Bus.insertMany(buildBuses());
  console.log(`   ${buses.length} coach services`);

  console.log('🛂 Visa services');
  await VisaCountry.insertMany(
    visaCountries.map((v) => ({
      country: v.country,
      slug: slugify(v.country),
      flag: v.flag,
      image: img(v.image),
      region: v.region,
      popular: 'popular' in v ? v.popular : false,
      description: `Tripnaro's visa desk prepares, reviews and submits your ${v.country} application, books your appointment where required and keeps you updated at every step. Fees shown include the embassy fee and Tripnaro's service charge and are indicative; embassies may change requirements at short notice.`,
      visaTypes: v.types.map(([name, entry, validityDays, maxStayDays, processingDays, fee, serviceFee]) => ({ name, entry, validityDays, maxStayDays, processingDays, fee, serviceFee })),
      requirements: ['Applicant must be physically present in Bangladesh during processing', 'Passport must have at least 2 blank pages', 'Previous visas (if any) improve approval chances'],
      documents: commonDocs,
      notes: ['Processing times are estimates and are set by the embassy.', 'Visa approval is at the sole discretion of the embassy.'],
    })),
  );

  console.log('🏷️  Coupons, banners, settings');
  await Coupon.insertMany([
    { code: 'TRIPNARO10', title: '10% off your first booking', description: 'Up to BDT 2,000 off on any hotel or tour.', discountType: 'percent', value: 10, maxDiscount: 2000, minAmount: 3000, appliesTo: ['hotel', 'tour'], validTo: daysFromNow(120) },
    { code: 'FLYDOMESTIC', title: 'BDT 500 off domestic flights', description: 'Flat discount on any domestic route.', discountType: 'flat', value: 500, minAmount: 4000, appliesTo: ['flight'], validTo: daysFromNow(60) },
    { code: 'BKASH15', title: '15% instant discount with bKash', description: 'Pay with bKash and save up to BDT 1,500.', discountType: 'percent', value: 15, maxDiscount: 1500, minAmount: 5000, appliesTo: ['hotel', 'tour', 'flight'], paymentChannel: 'bkash', validTo: daysFromNow(45) },
    { code: 'BUSGO', title: 'BDT 150 off bus tickets', description: 'Valid on all AC coaches.', discountType: 'flat', value: 150, minAmount: 1000, appliesTo: ['bus'], validTo: daysFromNow(90) },
    { code: 'HONEYMOON', title: '8% off honeymoon packages', description: 'Bali, Maldives and more.', discountType: 'percent', value: 8, maxDiscount: 10000, minAmount: 50000, appliesTo: ['tour'], validTo: daysFromNow(150) },
    { code: 'WEEKEND20', title: '20% off weekend stays', description: 'Selected domestic hotels, up to BDT 3,000.', discountType: 'percent', value: 20, maxDiscount: 3000, minAmount: 6000, appliesTo: ['hotel'], validTo: daysFromNow(30) },
  ]);
  await Banner.insertMany([
    { title: 'Winter by the sea', subtitle: "Cox's Bazar resorts from BDT 2,800/night", image: img(IMG.beach), link: '/hotels/coxs-bazar', ctaLabel: 'Find a stay', placement: 'home-promo', order: 1 },
    { title: 'Honeymoon in the Maldives', subtitle: 'Overwater villas with 8% off · code HONEYMOON', image: img(IMG.maldives), link: '/tours/maldives', ctaLabel: 'See packages', placement: 'home-promo', order: 2 },
    { title: 'Visa made simple', subtitle: 'Thailand, Malaysia, Dubai and more — handled end to end', image: img(IMG.passport), link: '/visa', ctaLabel: 'Start application', placement: 'home-promo', order: 3 },
  ]);
  await Setting.create({ key: 'site', noticeBar: { text: 'Winter sale: up to 20% off domestic stays — use code WEEKEND20', link: '/hotels', active: true }, social: { facebook: 'https://facebook.com', instagram: 'https://instagram.com', youtube: 'https://youtube.com', linkedin: 'https://linkedin.com' } });
  await Newsletter.insertMany(['traveller1@example.com', 'traveller2@example.com', 'wanderlust@example.com'].map((email) => ({ email })));

  console.log('⭐ Reviews');
  const comments = [
    ['Exceeded expectations', 'Spotless rooms, super friendly staff and the view at sunrise was unreal. Would book again through Tripnaro.'],
    ['Great value', 'Everything was exactly as described. Check-in was quick and the location made exploring easy.'],
    ['Perfect family trip', 'Our kids loved it. The guide was patient and the itinerary was well paced, never rushed.'],
    ['Smooth from start to finish', 'Booking took two minutes, confirmation came instantly and support answered at midnight.'],
    ['Would recommend', 'Food was delicious and the team went out of their way to arrange an early breakfast for our trek.'],
  ];
  const reviewDocs = [];
  for (const [i, hotel] of hotelDocs.slice(0, 10).entries()) {
    for (let r = 0; r < 3; r++) {
      const [title, comment] = pick(comments, i + r);
      reviewDocs.push({ user: reviewers[(i + r) % reviewers.length]._id, targetType: 'hotel', target: hotel._id, targetModel: 'Hotel', rating: 4 + ((i + r) % 2), title, comment, tripType: pick(['Couples', 'Families', 'Friends', 'Solo', 'Business'], i + r), status: 'approved' });
    }
  }
  for (const [i, tour] of tourDocs.slice(0, 10).entries()) {
    for (let r = 0; r < 2; r++) {
      const [title, comment] = pick(comments, i + r + 2);
      reviewDocs.push({ user: reviewers[(i + r + 1) % reviewers.length]._id, targetType: 'tour', target: tour._id, targetModel: 'Tour', rating: 5 - ((i + r) % 2), title, comment, tripType: pick(['Families', 'Couples', 'Friends'], i), status: 'approved' });
    }
  }
  reviewDocs.push({ user: demoUser._id, targetType: 'hotel', target: hotelDocs[1]._id, targetModel: 'Hotel', rating: 4, title: 'Lovely stay', comment: 'Helpful staff and a great breakfast spread. The sea view room is worth it.', status: 'pending' });
  await Review.insertMany(reviewDocs);

  console.log('🧾 Sample bookings for the demo user');
  const room = await Room.findOne({ hotel: hotelDocs[0]._id }).sort({ price: 1 });
  const checkIn = daysFromNow(20);
  const checkOut = daysFromNow(23);
  const hotelTotal = room!.price * 3;
  const hotelBooking = await Booking.create({
    reference: generateReference('hotel'),
    user: demoUser._id,
    type: 'hotel',
    status: 'confirmed',
    paymentStatus: 'paid',
    item: hotelDocs[0]._id,
    itemModel: 'Hotel',
    room: room!._id,
    title: `${hotelDocs[0].name} · ${room!.name}`,
    image: hotelDocs[0].images[0],
    startDate: checkIn,
    endDate: checkOut,
    details: { hotelName: hotelDocs[0].name, hotelSlug: hotelDocs[0].slug, city: hotelDocs[0].city, roomName: room!.name, nights: 3, rooms: 1, adults: 2, children: 0, checkIn: checkIn.toISOString().slice(0, 10), checkOut: checkOut.toISOString().slice(0, 10), pricePerNight: room!.price },
    travelers: [{ type: 'adult', title: 'Ms', firstName: 'Nusrat', lastName: 'Jahan' }],
    contact: { name: demoUser.name, email: demoUser.email, phone: demoUser.phone! },
    pricing: { base: hotelTotal, taxes: hotelTotal * 0.1, serviceFee: Math.round(hotelTotal * 1.1 * 0.02), discount: 0, total: Math.round(hotelTotal * 1.1 * 1.02), breakdown: [] },
    statusHistory: [{ status: 'pending', note: 'Booking created' }, { status: 'confirmed', note: 'Payment verified' }],
  });
  await Payment.create({ booking: hotelBooking._id, user: demoUser._id, provider: 'demo', method: 'demo', amount: hotelBooking.pricing!.total, status: 'success', transactionId: `TXSEED${Date.now()}`, providerReference: 'DEMO-SEED', isDemo: true, verifiedAt: new Date() });

  const tour = tourDocs[1];
  const dep = tour.departures[0];
  await Tour.updateOne({ _id: tour._id, 'departures._id': dep._id }, { $inc: { 'departures.$.bookedSeats': 2 } });
  await Booking.create({
    reference: generateReference('tour'),
    user: demoUser._id,
    type: 'tour',
    status: 'completed',
    paymentStatus: 'paid',
    item: tour._id,
    itemModel: 'Tour',
    departureId: dep._id,
    title: tour.title,
    image: tour.images[0],
    startDate: daysFromNow(-40),
    endDate: daysFromNow(-38),
    details: { tourTitle: tour.title, tourSlug: tour.slug, durationDays: tour.durationDays, adults: 2, children: 0, seats: 2, seatsReserved: true, adultPrice: tour.priceAdult },
    travelers: [{ type: 'adult', firstName: 'Nusrat', lastName: 'Jahan' }, { type: 'adult', firstName: 'Tanvir', lastName: 'Ahmed' }],
    contact: { name: demoUser.name, email: demoUser.email, phone: demoUser.phone! },
    pricing: { base: tour.priceAdult * 2, taxes: 0, serviceFee: Math.round(tour.priceAdult * 2 * 0.02), discount: 0, total: Math.round(tour.priceAdult * 2 * 1.02), breakdown: [] },
    statusHistory: [{ status: 'confirmed', note: 'Payment verified' }, { status: 'completed', note: 'Trip completed' }],
  });

  await Wishlist.insertMany([
    { user: demoUser._id, itemType: 'hotel', item: hotelDocs[15]._id, itemModel: 'Hotel' },
    { user: demoUser._id, itemType: 'tour', item: tourDocs[12]._id, itemModel: 'Tour' },
  ]);
  await Notification.insertMany([
    { user: demoUser._id, title: 'Booking confirmed 🎉', message: `${hotelBooking.reference} · ${hotelBooking.title} is confirmed.`, type: 'booking', link: `/my-account/bookings/${hotelBooking.id}` },
    { user: demoUser._id, title: 'Winter sale is live', message: 'Save up to 20% on weekend stays with code WEEKEND20.', type: 'promo', link: '/hotels', read: true },
  ]);

  console.log('\n✅ Seed complete');
  console.log(`   Admin:     ${admin.email} / ${env.SEED_ADMIN_PASSWORD}`);
  console.log('   Demo user: user@tripnaro.com / User@12345');
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});

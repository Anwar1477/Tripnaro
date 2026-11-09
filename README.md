<div align="center">

# Tripnaro

**A full-stack travel booking platform for flights, hotels, tour packages, bus tickets and visa services.**

Built with Next.js, React, TypeScript, Node.js, Express and MongoDB.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.11+-5FA04E?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![Playwright](https://img.shields.io/badge/Tested_with-Playwright-2EAD33?logo=playwright&logoColor=white)

[Features](#features) · [Screenshots](#screenshots) · [Tech stack](#tech-stack) · [Architecture](#architecture) · [Getting started](#getting-started) · [API](#7-api-overview) · [Testing](#8-testing) · [Roadmap](#roadmap)

</div>

---

## Overview

Tripnaro is a full-stack travel marketplace for Bangladesh and beyond. It covers flights, hotels, tour packages, intercity buses and visa processing, with customer accounts, a back office and payments that are verified on the server.

> [!NOTE]
> **This project ships in demo mode.** Payments run through a clearly labelled demo gateway, and no money moves. Flight results come from seeded **demo inventory**, not live airline availability. Real gateways (SSLCommerz, bKash, Nagad, Stripe) and live flight content (Amadeus) switch on once their credentials are set. See [Payment providers](#payment-providers) and [Flight inventory](#flight-inventory).

## Features

### Travel products

| Product | What's included |
| --- | --- |
| ✈️ **Flights** | One-way, round-trip and multi-city search. Filters for price, stops, departure time, airline and refundability, plus sorting. Leg-by-leg selection, passenger forms. A pluggable provider (demo or Amadeus). |
| 🏨 **Hotels** | Destination search with filters and facets. Detail page with gallery, map (OpenStreetMap), amenities and reviews. Room availability for the chosen dates. |
| 🗺️ **Tour packages** | Filterable listing. Detail page with day-by-day itinerary, departures and live seat counts. Booking, and a custom tour request form. |
| 🚌 **Bus tickets** | City-to-city search, interactive seat map, boarding and dropping points. Conflict-checked seat reservation. |
| 🛂 **Visa services** | Country listings and requirements. Online application with document upload, fee payment, public status tracking and an admin status workflow. |

### Platform

- **Customer accounts:** register, login, forgot and reset password, change password. The dashboard covers bookings (with cancellation and refund requests), visa applications, wishlist, saved travellers, payments, notifications, profile and notification preferences.
- **Checkout:** prices are always quoted on the server. Coupon codes, 30-minute inventory holds and a server-verified payment flow.
- **Admin panel:** a dashboard that reports live and demo revenue separately, booking operations, users, visa files, payments, review moderation, newsletter CSV export, site settings, and CRUD with image upload for 11 catalogue resources.
- **SEO:** per-page metadata, canonical URLs, Open Graph and Twitter cards. JSON-LD for `Hotel`, `TouristTrip`, `TouristDestination`, `FAQPage`, `BreadcrumbList` and `Organization`. A generated `sitemap.xml` and `robots.txt`.
- **Responsive UI:** mobile-first layouts tested from 320 px to 1440 px.

## Highlights

- 🔒 **Payments verified on the server.** A booking is marked paid only after the API confirms the transaction with the provider. The redirect URL is never trusted. See [How booking and payment integrity works](#how-booking-and-payment-integrity-works).
- 🧮 **Server-side pricing.** The browser sends only identifiers, and the API calculates every total.
- ⏱️ **Inventory holds.** Rooms, tour seats and bus seats are held for 30 minutes and released by a background sweeper.
- 🍪 **First-party session cookie.** JWT in an HTTP-only cookie. Next.js proxies `/api/v1/*`, so the browser only ever talks to one origin.
- 🛡️ **Hardened API.** Helmet, rate limiting on auth routes, Zod validation on every input, role-based access control on `/admin/*`, and private storage for visa documents.
- 🔌 **Adapters for providers.** Payment gateways and flight sources sit behind interfaces, so going live needs credentials, not a rewrite.
- 🧪 **End-to-end tests.** 42 Playwright tests cover every booking flow, payment forgery, RBAC, SEO tags and responsive layout.

## Screenshots

> These are real captures of the app running locally with seeded sample data.

| Home | Flight results (demo inventory) |
| --- | --- |
| ![Tripnaro home page with the multi-product search widget](docs/screenshots/home.png) | ![Round-trip flight results with filters and the demo inventory notice](docs/screenshots/flight-results.png) |
| **Hotel search** | **Tour detail** |
| ![Hotel search results with filters](docs/screenshots/hotel-search.png) | ![Tour package detail page with itinerary and departures](docs/screenshots/tour-detail.png) |
| **Visa service** | **Admin dashboard** |
| ![Visa country page with requirements and application](docs/screenshots/visa.png) | ![Admin dashboard with live and demo revenue reported separately](docs/screenshots/admin-dashboard.png) |
| **Admin catalogue (tours)** | **Mobile** |
| ![Admin tours management table](docs/screenshots/admin-tours.png) | <img src="docs/screenshots/mobile-home.png" alt="Tripnaro home page on a mobile screen" width="260"> |

## Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4, React Hook Form + Zod, Zustand, Axios, lucide-react |
| **Backend** | Node.js, Express 5, TypeScript, Mongoose 9, Zod, JSON Web Tokens, bcrypt, Helmet, express-rate-limit, Multer, Nodemailer |
| **Database** | MongoDB 6+ (local or Atlas) |
| **Payments** | Demo gateway (HMAC-signed), plus adapters for SSLCommerz, bKash, Nagad and Stripe |
| **Flight content** | Demo provider (seeded schedules), plus an Amadeus Self-Service adapter |
| **Testing & tooling** | Playwright, ESLint, Prettier, tsx |

## Architecture

```
E:\Tripnaro
├── backend/    Express 5 + TypeScript REST API (MongoDB / Mongoose)
└── frontend/   Next.js 16 (App Router) + React 19 + Tailwind CSS v4
```

The two apps are completely separate. The browser talks only to the Next.js origin, and Next rewrites `/api/v1/*` and `/uploads/*` to the API. That keeps the HTTP-only session cookie first-party.

```
Browser ──► Next.js (SSR / ISR pages, rewrites) ──► Express API /api/v1 ──► MongoDB
                                                     │
                                                     ├── Payment adapters (demo · SSLCommerz · bKash · Nagad · Stripe)
                                                     └── Flight providers (demo · Amadeus)
```

### Folder structure

```
backend/src
├── app.ts, server.ts          Express app setup, startup and the hold-expiry sweeper
├── config/                    Environment parsing and the MongoDB connection
├── controllers/               Auth, account, catalog, transport, visa, booking, payment, admin, content
│   └── crud.factory.ts        Generic admin CRUD
├── middlewares/               Auth/RBAC, Zod validation, uploads, error handler
├── models/                    User, Destination, Hotel, Room, Tour, Flight, Airport, Bus, Visa, Booking, Payment, …
├── routes/                    Public and admin routers
├── services/
│   ├── booking / availability / coupon / email / notification services
│   ├── payments/              demo, sslcommerz, bkash, nagad and stripe adapters
│   └── flights/               demo and amadeus providers
├── seeders/                   Sample data and the seed script
├── utils/, validators/, types/

frontend/src
├── app/
│   ├── (site)/                flights, hotels, tours, bus, visa, destinations, checkout, payment,
│   │                          my-account, login, register, forgot/reset password, info pages
│   ├── admin/                 dashboard, bookings, payments, users, visa applications, reviews,
│   │                          newsletter, settings, content (catalogue CRUD)
│   ├── sitemap.ts, robots.ts  SEO routes
├── components/                Feature folders (flights, hotels, tours, bus, visa, booking, admin, …)
├── services/, lib/, hooks/, store/, types/, utils/
└── proxy.ts                   Route protection for account and admin pages

frontend/e2e                   Playwright specs (site.spec.ts, flows.spec.ts)
```

---

## Getting started

## 1. Requirements

| Tool | Version |
| --- | --- |
| Node.js | 20.11+ (tested on 22/24) |
| MongoDB | 6.0+ (local `mongod` or MongoDB Atlas) |
| npm | 10+ |

## 2. MongoDB

**Local:** install MongoDB Community Server (or unzip the portable build) and start it:

```bash
mongod --dbpath <some-data-folder> --bind_ip 127.0.0.1 --port 27017
```

**Atlas:** create a free cluster, add a database user and your IP to the access list, then set `MONGODB_URI=mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/tripnaro`.

You don't need to create anything by hand. Mongoose creates the collections and indexes, and the seeder fills them.

## 3. Environment variables

```bash
cd backend  && cp .env.example .env         # then edit JWT_SECRET at minimum
cd frontend && cp .env.example .env.local
```

**Backend (`backend/.env`)**

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `FRONTEND_URL` | Web origin, used for CORS and payment redirect targets |
| `API_PUBLIC_URL` | Public API URL that payment providers call back |
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | **Required.** At least 32 random characters. Also signs demo payment outcomes |
| `JWT_EXPIRES_IN`, `COOKIE_NAME` | Session lifetime and cookie name |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Admin account created by the seeder |
| `SMTP_*`, `EMAIL_FROM` | Outgoing mail. Leave `SMTP_HOST` empty to print emails to the API console |
| `PAYMENT_DEMO_ENABLED` | Enables the clearly labelled demo gateway (no money moves) |
| `SSLCOMMERZ_*`, `BKASH_*`, `NAGAD_*`, `STRIPE_SECRET_KEY` | Live or sandbox gateway credentials. A method stays disabled until its credentials are set |
| `FLIGHT_PROVIDER` | `demo` (seeded schedules, labelled as demo) or `amadeus` |
| `AMADEUS_CLIENT_ID/SECRET` | Needed when `FLIGHT_PROVIDER=amadeus` |
| `AUTH_RATE_LIMIT` | Optional. Max auth requests per IP per window (default `30`) |

**Frontend (`frontend/.env.local`)**

| Variable | Purpose |
| --- | --- |
| `BACKEND_URL` | API base URL for server rendering and rewrites (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata, sitemap and Open Graph |
| `AUTH_COOKIE_NAME` | Optional. Must match the backend `COOKIE_NAME` if you change it |

The frontend never contains secrets. Every key lives in the backend `.env`, which is git-ignored. Never commit real credentials.

## 4. Install, seed and run

```bash
# API
cd backend
npm install
npm run seed        # wipes and fills the database with sample content
npm run dev         # http://localhost:5000  (health: /health)

# Web (second terminal)
cd frontend
npm install
npm run dev         # http://localhost:3000
```

### Seeded accounts

These are **demo-only sample accounts** for local development.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tripnaro.com` | `Admin@12345` |
| Customer | `user@tripnaro.com` | `User@12345` |

Change these through `SEED_ADMIN_*` before seeding any shared environment.

The seed includes 18 destinations, 24 hotels with 72 room types, 18 tours with 10 departures each, 20 airports, 108 flight schedules, 64 bus services, 10 visa countries, 6 coupons (`TRIPNARO10`, `FLYDOMESTIC`, `BKASH15`, `BUSGO`, `HONEYMOON`, `WEEKEND20`), banners, reviews and sample bookings. Airline, hotel and bus-operator names in the seed are fictional.

## 5. Commands

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run dev` | Start the API with reload (tsx watch) |
| backend | `npm run build` / `npm start` | Compile to `dist/` / run the compiled API |
| backend | `npm run seed` | Reset and seed the database |
| backend | `npm run lint` / `npm run typecheck` / `npm run format` | Run ESLint, the TypeScript compiler and Prettier |
| frontend | `npm run dev` | Next dev server (Turbopack) |
| frontend | `npm run build` / `npm start` | Production build / serve it |
| frontend | `npm run lint` / `npm run typecheck` / `npm run format` | Run ESLint, the TypeScript compiler and Prettier |
| frontend | `npm run test:e2e` | Playwright end-to-end suite (needs both servers running and a fresh seed) |

## 6. Admin panel

Sign in as the admin and open **`/admin`**. Access is role-based: the API checks `role=admin` on every `/api/v1/admin/*` request, and non-admins get `403`. From the panel you can:

- See the dashboard: live revenue reported separately from demo revenue, a 6-month chart and queues.
- Manage bookings: confirm, cancel, approve or reject cancellations, process refunds, mark offline payments, and complete trips.
- Change visa application status and view the uploaded documents, which are stored privately and never served statically.
- Review payments, users (role and active state), review moderation, newsletter subscribers (with CSV export) and site settings (notice bar, service fee, contact, social links).
- Run full CRUD on destinations, hotels, rooms, tours (itinerary and departures), flight schedules, airports, buses, visa services, coupons, banners and custom tour requests, including image upload.

## 7. API overview

Base URL: `/api/v1`. Every response uses the same shape: `{ success, message, data, meta? }`. Errors look like `{ success:false, message, error:{ code, details } }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`; `GET /auth/me` |
| Account | `GET /users/me/overview`, `PATCH /users/me`, `PUT /users/me/notification-preferences`, `/users/me/travelers` (CRUD), `/users/me/wishlist`, `/users/me/notifications`, `/users/me/payments` |
| Catalog | `GET /destinations`, `/destinations/:slug` (destination or country), `/search/suggestions`, `/hotels`, `/hotels/:slug?checkIn&checkOut`, `/tours`, `/tours/:slug`, `POST /tours/requests`, `GET/POST /reviews` |
| Flights | `GET /flights/airports`, `POST /flights/search`, `GET /flights/offers/:offerId` |
| Bus | `GET /buses/cities`, `/buses/search`, `/buses/:id/seats?date` |
| Visa | `GET /visa/countries`, `/visa/countries/:slug`, `/visa/track`; `POST /visa/applications` (multipart); `GET /visa/applications[/:id]`, `/visa/applications/:id/documents/:docId` |
| Bookings | `POST /bookings/quote`, `POST /bookings`, `GET /bookings[/:id]`, `POST /bookings/:id/cancel`, `/bookings/:id/refund`, `POST /coupons/validate` |
| Payments | `GET /payments/methods`, `POST /payments/initiate`, `GET\|POST /payments/callback/:provider`, `GET /payments/:tx` |
| Content | `GET /content/home`, `/content/settings`, `POST /newsletter` |
| Admin | `/admin/stats`, `/admin/{bookings,users,visa-applications,payments,reviews,newsletter,settings,uploads}` plus CRUD for `/admin/{destinations,hotels,rooms,tours,flights,airports,buses,visa-countries,coupons,banners,tour-requests}` |

### How booking and payment integrity works

1. The browser sends only identifiers (room id, departure id, seat numbers, signed flight offer ids). **Prices are always calculated on the server.**
2. Creating a booking reserves inventory and holds it for 30 minutes. A background sweeper releases expired holds every 5 minutes. Tour seats are taken with an atomic conditional update, and bus seats are checked for conflicts.
3. `POST /payments/initiate` creates a `Payment` record and returns the provider's hosted-page URL.
4. The provider calls `/payments/callback/:provider`. The API **verifies the transaction with the provider**: the SSLCommerz validation API, bKash execute/query, Nagad verify, a Stripe session lookup, or the HMAC signature for the demo gateway. Only then does it mark the booking paid and confirmed.
5. `/payment/result` shows the status read from the API. Query-string flags are ignored.

### Payment providers

| Provider | Status without credentials |
| --- | --- |
| Demo gateway | Available and labelled **"Demo payment (no real charge)"** everywhere |
| SSLCommerz, bKash, Nagad, Stripe | Shown as *Not configured on this server* and disabled. The API returns `503` if one is called anyway |

### Flight inventory

There is no airline content provider connected by default. `FLIGHT_PROVIDER=demo` serves schedules seeded in MongoDB, and the UI and bookings flag them as **demo inventory** that does not issue real tickets. Set `FLIGHT_PROVIDER=amadeus` with Amadeus Self-Service credentials to use the `AmadeusFlightProvider` adapter.

## 8. Testing

```bash
cd backend && npm run seed && npm run dev      # terminal 1
cd frontend && npm run dev                     # terminal 2
cd frontend && npx playwright install chromium && npm run test:e2e
# After re-seeding, restart the web server (or wait 60 s): cached pages reference the old record ids.
# The suite signs in many times; set AUTH_RATE_LIMIT=300 in backend/.env for test runs.
```

The suite (`frontend/e2e`) covers:

- Every public page, checking SEO tags, JSON-LD, sitemap/robots, the 404 page and image loading.
- Responsive overflow checks at 320, 375, 768, 1024 and 1440 px, plus the mobile menu.
- Register, login and logout; validation; forgot and reset password.
- Hotel, tour, flight and bus booking, with coupons and failed-then-retried payments.
- Customer cancellation, and a visa application with document upload, payment and tracking.
- Payment-forgery and RBAC checks.
- Admin CRUD and the management pages.

The HTML report is written to `frontend/playwright-report/`.

## 9. Production build

```bash
cd backend  && npm ci && npm run build && NODE_ENV=production npm start
cd frontend && npm ci && npm run build && npm start
```

Production checklist:

- Use a long random `JWT_SECRET` and a managed MongoDB.
- Set `FRONTEND_URL`, `API_PUBLIC_URL` and `NEXT_PUBLIC_SITE_URL` to their HTTPS domains. Cookies become `Secure` automatically in production.
- Set `PAYMENT_DEMO_ENABLED=false` once a real gateway is configured.
- Configure SMTP.
- Point `BACKEND_URL` at the internal API address.
- Persist `backend/uploads/`. Public images are in `uploads/public`; private visa documents are in `uploads/private`, which is never served statically.
- Run the API behind a reverse proxy (nginx or a PaaS) with `trust proxy` (already enabled) so the rate limiting sees real client IPs.

---

## Roadmap

These items are **planned and not yet implemented**:

- [ ] Sandbox certification and go-live for SSLCommerz, bKash and Nagad
- [ ] Live flight content via Amadeus (or another GDS/NDC provider) with ticket issuance
- [ ] Continuous integration (lint, typecheck and Playwright on every push)
- [ ] Docker Compose setup for one-command local start
- [ ] Bangla (বাংলা) localisation
- [ ] Public deployment and a live demo URL

## Author

Built by **Anwar Hosen** ([@Anwar1477](https://github.com/Anwar1477)).

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

**[Live site: tripnaro.vercel.app](https://tripnaro.vercel.app)**

[Features](#features) · [Screenshots](#screenshots) · [Tech stack](#tech-stack) · [Architecture](#architecture) · [Getting started](#getting-started) · [API](#7-api-overview) · [Testing](#8-testing) · [Deployment](#9-production-deployment-vercel) · [Roadmap](#roadmap)

</div>

---

## Overview

Tripnaro is a full-stack travel marketplace for Bangladesh and beyond. It covers flights, hotels, tour packages, intercity buses and visa processing, with customer accounts, a back office and payments that are verified on the server.

> [!NOTE]
> **This project ships in demo mode.** Payments run through a clearly labelled demo gateway, and no money moves. Flight results come from seeded **demo inventory**, not live airline availability. Real gateways (SSLCommerz, bKash, Nagad, Stripe) and live flight content (Amadeus) switch on once their credentials are set. See [Payment providers](#payment-providers) and [Flight inventory](#flight-inventory).

## Live website

| | URL |
| --- | --- |
| Website (Next.js) | https://tripnaro.vercel.app |
| API (Express) | https://tripnaro-api.vercel.app (health check: `/health`) |
| Admin panel | https://tripnaro.vercel.app/admin (admin accounts only) |

Both run on Vercel from this repository's `main` branch. See [Production deployment (Vercel)](#9-production-deployment-vercel).

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
- **Coupons and discounts:** admin-managed codes with a global on/off switch, usage limits and statistics. Discounts are calculated and re-checked on the server. See [Coupons and discounts](#coupons-and-discounts).
- **Messenger live chat:** a floating button that opens your Facebook Page conversation through an official m.me link. See [Messenger live chat](#messenger-live-chat).
- **Light and dark theme:** follows the device setting, with a header toggle and a light/dark/system picker on mobile. See [Light and dark theme](#light-and-dark-theme).
- **Responsive UI:** mobile-first layouts tested from 320 px to 1440 px.

## Highlights

- 🔒 **Payments verified on the server.** A booking is marked paid only after the API confirms the transaction with the provider. The redirect URL is never trusted. See [How booking and payment integrity works](#how-booking-and-payment-integrity-works).
- 🧮 **Server-side pricing.** The browser sends only identifiers, and the API calculates every total.
- ⏱️ **Inventory holds.** Rooms, tour seats and bus seats are held for 30 minutes, then released (by a background sweeper on a long-running server, and at most every 5 minutes per instance on Vercel).
- 🍪 **First-party session cookie.** JWT in an HTTP-only cookie. Next.js proxies `/api/v1/*`, so the browser only ever talks to one origin.
- 🛡️ **Hardened API.** Helmet, rate limiting on auth routes, Zod validation on every input, role-based access control on `/admin/*`, and private storage for visa documents.
- 🔌 **Adapters for providers.** Payment gateways and flight sources sit behind interfaces, so going live needs credentials, not a rewrite.
- 🧪 **End-to-end tests.** 63 Playwright tests cover every booking flow, coupons, payment forgery, RBAC, SEO tags, theming and responsive layout.

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

The two apps are completely separate (and deploy as two Vercel projects). The browser talks only to the Next.js origin, and Next rewrites `/api/v1/*` and `/uploads/*` to the API. That keeps the HTTP-only session cookie first-party.

```
Browser ──► Next.js (SSR / ISR pages, rewrites) ──► Express API /api/v1 ──► MongoDB
                                                     │
                                                     ├── File storage (local disk · Vercel Blob)
                                                     ├── Payment adapters (demo · SSLCommerz · bKash · Nagad · Stripe)
                                                     └── Flight providers (demo · Amadeus)
```

### Folder structure

```
backend/api/index.ts           Vercel Function entry (shared DB connection, hold sweep)
backend/vercel.json            Vercel build and routing for the API project
backend/src
├── app.ts, server.ts          Express app setup; long-running server with the hold-expiry sweeper
├── config/                    Environment parsing and the MongoDB connection
├── controllers/               Auth, account, catalog, transport, visa, booking, payment, admin, content
│   └── crud.factory.ts        Generic admin CRUD
├── middlewares/               Auth/RBAC, Zod validation, uploads, error handler
├── models/                    User, Destination, Hotel, Room, Tour, Flight, Airport, Bus, Visa, Booking, Payment, …
├── routes/                    Public and admin routers
├── services/
│   ├── booking / availability / coupon / email / notification / storage services
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

frontend/e2e                   Playwright specs (site, flows, coupons, theme)
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

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port (default `5000`). Ignored on Vercel |
| `FRONTEND_URL` | Yes in production | Web origin, used for CORS and payment redirect targets |
| `API_PUBLIC_URL` | Yes in production | Public API URL that payment providers call back, and the base of uploaded image URLs |
| `MONGODB_URI` | **Yes** | Mongo connection string (include the database name, e.g. `/tripnaro`) |
| `JWT_SECRET` | **Yes** | At least 32 random characters. Also signs demo payment outcomes |
| `JWT_EXPIRES_IN`, `COOKIE_NAME` | No | Session lifetime and cookie name |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Seeding only | Admin account created by the seeder |
| `SMTP_*`, `EMAIL_FROM` | No | Outgoing mail. Leave `SMTP_HOST` empty to print emails to the API console |
| `PAYMENT_DEMO_ENABLED` | No | Enables the clearly labelled demo gateway (no money moves) |
| `SSLCOMMERZ_*`, `BKASH_*`, `NAGAD_*`, `STRIPE_SECRET_KEY` | No | Live or sandbox gateway credentials. A method stays disabled until its credentials are set |
| `FLIGHT_PROVIDER` | No | `demo` (seeded schedules, labelled as demo) or `amadeus` |
| `AMADEUS_CLIENT_ID/SECRET` | If Amadeus | Needed when `FLIGHT_PROVIDER=amadeus` |
| `AUTH_RATE_LIMIT` | No | Optional. Max auth requests per IP per window (default `30`) |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID` | On Vercel | Set automatically when a Vercel Blob store is connected to the API project. Without them, uploads go to `backend/uploads/` (local) or are refused (on Vercel) |

**Frontend (`frontend/.env.local`)**

| Variable | Required | Purpose |
| --- | --- | --- |
| `BACKEND_URL` | **Yes** | API base URL for server rendering and rewrites (server-side only). Read at build time, so redeploy after changing it |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical site URL for metadata, sitemap and Open Graph. Public by design |
| `AUTH_COOKIE_NAME` | No | Must match the backend `COOKIE_NAME` if you change it |
| `MESSENGER_PAGE` | No | Facebook Page username or numeric Page ID for the floating Messenger chat button. Admin → Site settings overrides it. See [Messenger live chat](#messenger-live-chat) |

The frontend never contains secrets. Every key lives in the backend `.env`, which is git-ignored. Never commit real credentials.

## 4. Install, seed and run

```bash
git clone https://github.com/Anwar1477/Tripnaro.git
cd Tripnaro

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

These are **demo-only sample accounts** for local development. The production seed (`npm run seed:production`) does not use these passwords.

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
| backend | `npm run seed` | Reset and seed the database (**wipes every collection**; local development only) |
| backend | `npm run seed:production` | Seed a **new, empty** production database once (see [Database setup](#database-setup-production)) |
| backend | `npm run lint` / `npm run typecheck` / `npm run format` | Run ESLint, the TypeScript compiler (including the Vercel entry) and Prettier |
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

### Messenger live chat

A floating **Chat on Messenger** button sits at the bottom-right of every public page. Its panel hands the visitor to your Facebook Page conversation through an official `https://m.me/<page>` link, which opens the Messenger app on phones and messenger.com in a new tab on desktop.

> Meta shut down the embeddable Messenger *Customer Chat plugin* (the `xfbml.customerchat` SDK) on 9 May 2024, so an in-page Messenger chat window can no longer be loaded from Meta. m.me links are the supported replacement. Tripnaro loads **no Facebook SDK script**: there is nothing to block, no tracking cookies and no duplicate-script risk.

**Setup**

1. Find your Facebook Page username, the part after `facebook.com/` in the Page URL. For a Page without a username, use the numeric Page ID shown under *Page → About → Page transparency*.
2. Set it in either place (admin wins):
   - **Admin → Site settings → Messenger live chat**: toggle, Page username/ID and the greeting shown in the panel.
   - `MESSENGER_PAGE=<username-or-id>` in `frontend/.env.local` (server-side only, needs a web server restart).
3. In Meta Business Suite → Inbox, turn on instant replies or away messages so visitors get a response straight away.

With no Page configured (or the toggle off) the button is not rendered at all. Visitors never see a dead button. The link carries `?ref=web_<page-path>`, so agents can see which page a conversation started from (Business Suite / Messenger webhook `referral`). Only the path is sent, never query strings.

Behaviour: the button sits under the header, menus, filter sheet, gallery and dialogs. Toasts are lifted above it. On phones it steps aside while a form or payment area passes the bottom of the screen and while a form field is focused, so it never covers booking inputs or the keyboard.

### Coupons and discounts

Everything is managed in **Admin → Coupons**. The page has a global **on/off switch**, usage statistics and the coupon table (search, filter by status or type, create, edit, activate/deactivate, delete).

- **Rules per coupon:** code (unique, case-insensitive), percentage or flat amount, optional maximum discount, minimum booking amount, booking types, optional payment channel, start/expiry dates (whole days in Bangladesh time), total usage limit and uses per customer (`0` = unlimited).
- **The server is the only source of truth.** The booking form shows a discount, the "20% OFF" badge and the reduced total only after the API has applied the code. Prices sent by the browser are ignored.
- **Discount base:** fare + taxes. The service fee is never discounted. Amounts are whole BDT, never below zero, and only one coupon applies per booking.
- **Usage:** a slot is claimed atomically when the booking is created, so concurrent bookings cannot overshoot the limit. Cancelling a booking or letting its hold expire returns the slot. A failed payment keeps it while the booking can still be paid.
- **Re-checked at payment:** when payment starts the coupon is validated again. If the admin has deactivated it, changed its value, or turned coupons off, the booking is repriced and the customer sees the new total before paying (HTTP 409 `COUPON_UPDATED` / `COUPON_REMOVED`). Customers can also remove a coupon at checkout.
- Bookings store the code, type, value and discount, so checkout, confirmation, *My bookings* and the admin booking view all show the same figures.

### Light and dark theme

The site and admin follow the device's light/dark setting by default. Visitors can switch with the moon/sun button in the header or choose **Light / Dark / System** in the mobile menu. The choice is kept in `localStorage` (`tripnaro-theme`) and applied by an inline script before first paint, so the page never flashes the wrong theme.

Colours are theme tokens in `src/app/globals.css`: neutral `ink-*` and `sand-*` scales and `bg-surface` (cards, panels, inputs) adapt automatically, and `night` stays dark in both themes (photo overlays, dark bands). Use `bg-surface` rather than `bg-white` for new panels. The `dark:` variant is available for one-off adjustments.

### Flight inventory

There is no airline content provider connected by default. `FLIGHT_PROVIDER=demo` serves schedules seeded in MongoDB, and the UI and bookings flag them as **demo inventory** that does not issue real tickets. Set `FLIGHT_PROVIDER=amadeus` with Amadeus Self-Service credentials to use the `AmadeusFlightProvider` adapter.

## 8. Testing

```bash
cd backend && npm run seed && npm run dev      # terminal 1
cd frontend && npm run dev                     # terminal 2
cd frontend && npx playwright install chromium && npm run test:e2e
# Re-seeding gives every record a new id, and cached pages keep referencing the old ones.
# Dev server: restart it (or wait 60 s). Production build: delete .next/cache/fetch-cache, then rebuild.
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
- Coupons: admin validation, discount maths and caps, every rejection rule, usage limits (including concurrent bookings), re-validation at payment, the global switch and the discount-badge states.
- Light/dark theme: device default, no flash on load, persistence and the mobile switcher.

The HTML report is written to `frontend/playwright-report/`.

## 9. Production deployment (Vercel)

Tripnaro runs on Vercel as **two projects built from this repository**. Every push to `main` deploys both to production. Other branches and pull requests get preview deployments.

| Vercel project | Root directory | Framework preset | Build | Production URL |
| --- | --- | --- | --- | --- |
| `tripnaro` | `frontend` | Next.js | `next build` (defaults) | https://tripnaro.vercel.app |
| `tripnaro-api` | `backend` | Other (configured by `backend/vercel.json`) | `npm ci` → `npm run typecheck` | https://tripnaro-api.vercel.app |

How the API runs on Vercel:

- `backend/vercel.json` rewrites every request to one Vercel Function, `backend/api/index.ts`. That function wraps the same Express app used locally (`src/app.ts`), reuses one MongoDB connection per warm instance, and returns `503 DATABASE_UNAVAILABLE` if the database can't be reached.
- There is no long-running process, so the 30-minute booking holds are released by a sweep that runs at most every 5 minutes per instance, on incoming requests. Locally, `src/server.ts` keeps its timer.
- Function filesystems are read-only and temporary, so uploads go to a **private Vercel Blob store** (`tripnaro-api-blob`). Admin images are still served at `/uploads/<name>` (streamed by the API with immutable caching). Visa documents are only readable through the authenticated download route.
- Vercel limits a function request body to **4.5 MB**. The apps keep within it: visa documents up to 4 MB in total per application, and admin images up to 4 MB each (uploaded one per request).

### Environment variables (production)

Set these in **Vercel → Project → Settings → Environment Variables** (Production). Mark secrets as *Sensitive*. Never commit them. After changing a variable, redeploy the project (Deployments → ⋯ → Redeploy), because values are fixed per deployment.

**`tripnaro-api`**

| Variable | Value / source | Secret |
| --- | --- | --- |
| `MONGODB_URI` | Your MongoDB Atlas connection string, including the database name | **Yes** |
| `JWT_SECRET` | 48+ random bytes, e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` | **Yes** |
| `FRONTEND_URL` | `https://tripnaro.vercel.app` | No |
| `API_PUBLIC_URL` | `https://tripnaro-api.vercel.app` | No |
| `PAYMENT_DEMO_ENABLED` | `true` until a real gateway is configured | No |
| `FLIGHT_PROVIDER` | `demo` | No |
| `JWT_EXPIRES_IN`, `AUTH_RATE_LIMIT` | `7d`, `30` | No |
| `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` | Added automatically by connecting the Blob store (Storage tab, with "Add a read-write token env var") | Managed by Vercel |
| `SMTP_*`, `EMAIL_FROM` | Optional. Without SMTP, emails (e.g. password reset) are only logged, not sent | Yes (`SMTP_PASS`) |
| `SSLCOMMERZ_*`, `BKASH_*`, `NAGAD_*`, `STRIPE_SECRET_KEY` | Optional. Each gateway stays disabled until its credentials are set | Yes |

`NODE_ENV=production` is set by Vercel, which also makes the session cookie `Secure`.

**`tripnaro`** (no secrets: the frontend never holds credentials)

| Variable | Value |
| --- | --- |
| `BACKEND_URL` | `https://tripnaro-api.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://tripnaro.vercel.app` |
| `MESSENGER_PAGE` | Optional. Your Facebook Page username, or set it in Admin → Site settings |

### Database setup (production)

1. Create a MongoDB Atlas cluster and a database user. Under **Network Access**, allow `0.0.0.0/0`: Vercel functions don't have fixed outbound IPs, so access is protected by the database user's credentials.
2. Put the connection string in `MONGODB_URI` on `tripnaro-api` and redeploy it.
3. Mongoose creates collections and indexes on first use. There are no SQL-style migrations to run.
4. **Optional, once, only for a brand-new database:** load the demo catalogue and create the admin account from your own machine. Use your shell, so the connection string never lands in a file:

   ```powershell
   # PowerShell (Windows)
   cd backend
   $env:MONGODB_URI="<your Atlas connection string>"
   $env:SEED_ADMIN_EMAIL="<admin email>"
   $env:SEED_ADMIN_PASSWORD="<a strong password>"
   npm run seed:production
   Remove-Item Env:MONGODB_URI, Env:SEED_ADMIN_PASSWORD
   ```

   ```bash
   # macOS / Linux
   cd backend
   MONGODB_URI='<connection string>' SEED_ADMIN_EMAIL='<admin email>' SEED_ADMIN_PASSWORD='<strong password>' npm run seed:production
   ```

   `seed:production` refuses to run if the database already contains any users, bookings, catalogue or settings, if `MONGODB_URI` points at a local database, or if the admin password is the development default. It gives the demo customer `user@tripnaro.com` a random password and never prints passwords. **Never run `npm run seed` (development) against production: it deletes every collection.**

### Deploying and redeploying

- **Normal deploys:** push to `main`. Vercel builds `tripnaro` and `tripnaro-api` and promotes both to production.
- **Redeploy without code changes** (e.g. after changing environment variables): Vercel → Project → Deployments → latest production deployment → ⋯ → **Redeploy**.
- **Roll back:** Deployments → a previous production deployment → ⋯ → **Promote to Production**.
- **Set up from scratch:** in Vercel, import the GitHub repository twice, once with root `backend` (preset Other, name `tripnaro-api`) and once with root `frontend` (Next.js, name `tripnaro`). Add the variables above, create and connect a private Blob store to `tripnaro-api`, then deploy the API first so its URL exists for `BACKEND_URL`.

### Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| API returns `500 FUNCTION_INVOCATION_FAILED`, and the logs say *Invalid environment configuration* | A required variable (`MONGODB_URI`, `JWT_SECRET`) is missing on `tripnaro-api`. Add it and redeploy. |
| API returns `503 DATABASE_UNAVAILABLE` | Atlas is unreachable: check the connection string, the database user, and that Network Access allows `0.0.0.0/0`. |
| Pages render without hotels or tours right after the database was set up | Pages built while the API had no data are cached for 1–5 minutes. Wait, or redeploy `tripnaro`. |
| Uploads fail with `STORAGE_UNAVAILABLE` | No Blob store is connected to `tripnaro-api`, or it was connected without the read-write token. Reconnect it and redeploy. |
| Upload fails with *larger than 4 MB* / HTTP 413 | Vercel's 4.5 MB request limit. Compress the image or scan. |
| Locally, pages show old data after re-seeding | Delete `frontend/.next/cache/fetch-cache` (production build) or restart `next dev`. |
| Changed `BACKEND_URL` has no effect | Rewrites are compiled at build time: redeploy `tripnaro`. |
| `seed:production` fails locally with `querySrv ECONNREFUSED` | Your network DNS refuses the SRV lookup that `mongodb+srv://` needs (common on Windows). Switch your DNS to a public resolver (e.g. 8.8.8.8 or 1.1.1.1) and retry. Vercel itself is not affected. |
| `bad auth : authentication failed` | Wrong database user password. Reset it in Atlas → Database Access → Edit → Edit Password, then update `MONGODB_URI` in Vercel and redeploy. Passwords with `@ : / ? #` must be URL-encoded. |
| Setting `MONGODB_URI` in a shell drops everything after `&` | Quote the value: `$env:MONGODB_URI="..."` (PowerShell) or `MONGODB_URI='...'` (bash). |

### Self-hosting (without Vercel)

```bash
cd backend  && npm ci && npm run build && NODE_ENV=production npm start   # runs dist/src/server.js
cd frontend && npm ci && npm run build && npm start
```

On a long-running server, uploads are written to `backend/uploads/` (persist that folder, or connect a Blob store via `BLOB_READ_WRITE_TOKEN`). Run the API behind a reverse proxy with `trust proxy` (already enabled) so rate limiting sees real client IPs.

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

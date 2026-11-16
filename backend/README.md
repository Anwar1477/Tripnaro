# Tripnaro API (Express + MongoDB)

See the root [README](../README.md) for setup, environment variables, seeding, the API overview and payment verification.

- `npm run seed`: reset and seed the database (wipes every collection; local development only)
- `npm run seed:production`: seed a new, empty production database once (refuses a non-empty database)
- `npm run dev`: API on http://localhost:5000 (`/health`)
- `npm run build && npm start`: self-hosted production (`dist/src/server.js`)
- Vercel: `api/index.ts` + `vercel.json` (see the root README, "Production deployment (Vercel)")

import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/app';
import { ensureDatabase } from '../src/config/db';
import { expireStaleHolds } from '../src/services/booking.service';

/**
 * Vercel Function entry: every request is rewritten here (see vercel.json). Locally and on a
 * long-running host, src/server.ts is used instead.
 */
const app = createApp();

/** Replaces server.ts's 5-minute timer: release expired holds at most every 5 minutes per instance. */
const SWEEP_EVERY_MS = 5 * 60_000;
let lastSweep = 0;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('MongoDB connection failed:', (err as Error).message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ success: false, message: 'Service temporarily unavailable', error: { code: 'DATABASE_UNAVAILABLE' } }));
    return;
  }
  if (Date.now() - lastSweep > SWEEP_EVERY_MS) {
    lastSweep = Date.now();
    try {
      const n = await expireStaleHolds();
      if (n) console.log(`Released ${n} expired booking hold(s)`);
    } catch (err) {
      console.error('Hold sweep failed:', (err as Error).message);
    }
  }
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}

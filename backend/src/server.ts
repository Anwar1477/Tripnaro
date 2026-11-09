import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';
import { expireStaleHolds } from './services/booking.service';

async function bootstrap() {
  try {
    await connectDatabase();
  } catch (err) {
    console.error(`❌ Could not connect to MongoDB at ${env.MONGODB_URI}\n   ${(err as Error).message}`);
    console.error('   Start MongoDB (see README → MongoDB setup) and try again.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Tripnaro API listening on http://localhost:${env.PORT}/api/v1`);
  });

  // Release inventory held by unpaid bookings whose payment window has expired.
  const sweep = setInterval(() => {
    expireStaleHolds()
      .then((n) => n && console.log(`⏱  Released ${n} expired booking hold(s)`))
      .catch((e) => console.error('Hold sweep failed:', e.message));
  }, 5 * 60_000);

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down…`);
    clearInterval(sweep);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();

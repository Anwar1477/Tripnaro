import { env } from '../../config/env';
import { AmadeusFlightProvider } from './amadeus.provider';
import { DemoFlightProvider } from './demo.provider';
import type { FlightProvider } from './types';

const providers: Record<string, FlightProvider> = {
  demo: new DemoFlightProvider(),
  amadeus: new AmadeusFlightProvider(),
};

/** Returns the configured provider, falling back to demo inventory when credentials are missing. */
export function getFlightProvider(): FlightProvider {
  const selected = providers[env.FLIGHT_PROVIDER];
  if (selected?.isConfigured()) return selected;
  if (env.FLIGHT_PROVIDER !== 'demo') {
    console.warn(`⚠️  Flight provider "${env.FLIGHT_PROVIDER}" is not configured; using demo inventory.`);
  }
  return providers.demo;
}

export function getProviderForOffer(offerId: string): FlightProvider {
  const prefix = offerId.split('.')[0];
  return providers[prefix] ?? providers.demo;
}

export * from './types';

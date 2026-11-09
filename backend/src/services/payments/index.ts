import type { PaymentProviderName } from '../../models/Payment';
import { bkashAdapter } from './bkash.adapter';
import { demoAdapter } from './demo.adapter';
import { nagadAdapter } from './nagad.adapter';
import { sslcommerzAdapter } from './sslcommerz.adapter';
import { stripeAdapter } from './stripe.adapter';
import type { PaymentAdapter } from './types';

export const paymentAdapters: Record<PaymentProviderName, PaymentAdapter> = {
  demo: demoAdapter,
  sslcommerz: sslcommerzAdapter,
  bkash: bkashAdapter,
  nagad: nagadAdapter,
  stripe: stripeAdapter,
};

export function listPaymentMethods() {
  return Object.values(paymentAdapters).map((a) => ({
    provider: a.name,
    label: a.label,
    isDemo: a.isDemo,
    available: a.isConfigured(),
  }));
}

export * from './types';
export { demoSignature } from './demo.adapter';

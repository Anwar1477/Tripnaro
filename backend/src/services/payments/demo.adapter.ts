import { env } from '../../config/env';
import { hmac } from '../../utils/helpers';
import type { PaymentAdapter, PaymentContext } from './types';

/** Signature the demo gateway attaches to its outcome so the callback cannot be forged. */
export function demoSignature(transactionId: string, outcome: string): string {
  return hmac(`demo:${transactionId}:${outcome}`, env.JWT_SECRET);
}

/**
 * DEMO payment adapter. It simulates a hosted payment page so booking flows can be exercised
 * end to end without credentials. NO REAL MONEY IS CHARGED and the UI labels it as a demo.
 */
export const demoAdapter: PaymentAdapter = {
  name: 'demo',
  label: 'Demo payment (no real charge)',
  isDemo: true,
  isConfigured: () => env.PAYMENT_DEMO_ENABLED,

  async initiate(ctx: PaymentContext) {
    const params = new URLSearchParams({ tx: ctx.transactionId });
    return { redirectUrl: `${env.FRONTEND_URL}/payment/demo-gateway?${params}` };
  },

  async verify(payment, params) {
    const outcome = params.outcome;
    const valid = params.signature === demoSignature(payment.transactionId, outcome ?? '');
    if (!valid) return { status: 'failed', reason: 'Invalid demo gateway signature' };
    if (outcome === 'success') return { status: 'success', providerReference: `DEMO-${payment.transactionId}`, amount: payment.amount };
    if (outcome === 'cancelled') return { status: 'cancelled', reason: 'Cancelled on demo gateway' };
    return { status: 'failed', reason: 'Declined on demo gateway' };
  },
};

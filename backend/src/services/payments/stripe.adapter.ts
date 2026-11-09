import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { PaymentAdapter } from './types';

const API = 'https://api.stripe.com/v1';
const auth = () => ({ Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` });

/** Stripe Checkout for international cards (optional provider). */
export const stripeAdapter: PaymentAdapter = {
  name: 'stripe',
  label: 'International card (Stripe)',
  isDemo: false,
  isConfigured: () => Boolean(env.STRIPE_SECRET_KEY),

  async initiate(ctx) {
    const sep = ctx.callbackUrl.includes('?') ? '&' : '?';
    const body = new URLSearchParams({
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': ctx.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(Math.round(ctx.amount * 100)),
      'line_items[0][price_data][product_data][name]': ctx.description.slice(0, 200),
      success_url: `${ctx.callbackUrl}${sep}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: ctx.cancelUrl,
      client_reference_id: ctx.transactionId,
      customer_email: ctx.customer.email,
      'metadata[transactionId]': ctx.transactionId,
    });
    const res = await fetch(`${API}/checkout/sessions`, { method: 'POST', headers: auth(), body });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!json.url) throw ApiError.unavailable(`Stripe could not start the payment: ${json.error?.message ?? 'unknown'}`);
    return { redirectUrl: json.url, providerReference: json.id };
  },

  async verify(payment, params) {
    const sessionId = params.session_id ?? payment.providerReference;
    if (!sessionId) return { status: 'cancelled', reason: 'No checkout session' };
    const res = await fetch(`${API}/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: auth() });
    const json = (await res.json()) as { payment_status?: string; amount_total?: number; client_reference_id?: string; payment_intent?: string };
    const ok =
      json.payment_status === 'paid' &&
      json.client_reference_id === payment.transactionId &&
      json.amount_total === Math.round(payment.amount * 100);
    return ok
      ? { status: 'success', providerReference: json.payment_intent ?? sessionId, amount: payment.amount, raw: json }
      : { status: 'failed', reason: `Stripe payment status ${json.payment_status ?? 'unknown'}`, raw: json };
  },
};

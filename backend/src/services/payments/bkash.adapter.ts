import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { PaymentAdapter } from './types';

const base = () =>
  env.BKASH_SANDBOX
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function grantToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const res = await fetch(`${base()}/token/grant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', username: env.BKASH_USERNAME, password: env.BKASH_PASSWORD },
    body: JSON.stringify({ app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET }),
  });
  const json = (await res.json()) as { id_token?: string; expires_in?: number; statusMessage?: string };
  if (!json.id_token) throw ApiError.unavailable(`bKash authentication failed: ${json.statusMessage ?? 'unknown'}`);
  cachedToken = { value: json.id_token, expiresAt: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000 };
  return json.id_token;
}

function headers(token: string) {
  return { 'Content-Type': 'application/json', Authorization: token, 'X-APP-Key': env.BKASH_APP_KEY };
}

/** bKash Tokenized Checkout (create → customer approves on bKash → execute). */
export const bkashAdapter: PaymentAdapter = {
  name: 'bkash',
  label: 'bKash',
  isDemo: false,
  isConfigured: () => Boolean(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD),

  async initiate(ctx) {
    const token = await grantToken();
    const res = await fetch(`${base()}/create`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        mode: '0011',
        payerReference: ctx.customer.phone,
        callbackURL: ctx.callbackUrl,
        amount: ctx.amount.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: ctx.transactionId,
      }),
    });
    const json = (await res.json()) as { bkashURL?: string; paymentID?: string; statusMessage?: string };
    if (!json.bkashURL) throw ApiError.unavailable(`bKash could not start the payment: ${json.statusMessage ?? 'unknown'}`);
    return { redirectUrl: json.bkashURL, providerReference: json.paymentID, raw: json };
  },

  async verify(payment, params) {
    if (params.status === 'cancel') return { status: 'cancelled', reason: 'Cancelled on bKash' };
    if (params.status !== 'success' || !params.paymentID) return { status: 'failed', reason: 'bKash reported failure' };
    if (payment.providerReference && params.paymentID !== payment.providerReference) {
      return { status: 'failed', reason: 'Payment id mismatch' };
    }
    const token = await grantToken();
    const res = await fetch(`${base()}/execute`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ paymentID: params.paymentID }),
    });
    const json = (await res.json()) as { transactionStatus?: string; amount?: string; trxID?: string; merchantInvoiceNumber?: string };
    const ok =
      json.transactionStatus === 'Completed' &&
      json.merchantInvoiceNumber === payment.transactionId &&
      Math.abs(Number(json.amount) - payment.amount) < 0.01;
    return ok
      ? { status: 'success', providerReference: json.trxID, amount: Number(json.amount), raw: json }
      : { status: 'failed', reason: `bKash execute returned ${json.transactionStatus ?? 'error'}`, raw: json };
  },
};

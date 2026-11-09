import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { PaymentAdapter } from './types';

const base = () => (env.SSLCOMMERZ_SANDBOX ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com');

/** SSLCommerz hosted checkout (cards, mobile banking, internet banking). */
export const sslcommerzAdapter: PaymentAdapter = {
  name: 'sslcommerz',
  label: 'SSLCommerz (cards, mobile & internet banking)',
  isDemo: false,
  isConfigured: () => Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD),

  async initiate(ctx) {
    const body = new URLSearchParams({
      store_id: env.SSLCOMMERZ_STORE_ID,
      store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
      total_amount: ctx.amount.toFixed(2),
      currency: ctx.currency,
      tran_id: ctx.transactionId,
      success_url: ctx.callbackUrl,
      fail_url: ctx.callbackUrl,
      cancel_url: ctx.cancelUrl,
      ipn_url: ctx.callbackUrl,
      cus_name: ctx.customer.name,
      cus_email: ctx.customer.email,
      cus_phone: ctx.customer.phone,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: ctx.description.slice(0, 250),
      product_category: 'travel',
      product_profile: 'travel-vertical',
    });
    const res = await fetch(`${base()}/gwprocess/v4/api.php`, { method: 'POST', body });
    const json = (await res.json()) as { status: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string };
    if (json.status !== 'SUCCESS' || !json.GatewayPageURL) {
      throw ApiError.unavailable(`SSLCommerz could not start the payment: ${json.failedreason ?? 'unknown error'}`);
    }
    return { redirectUrl: json.GatewayPageURL, providerReference: json.sessionkey, raw: json };
  },

  async verify(payment, params) {
    if (!params.val_id) return { status: params.status === 'CANCELLED' ? 'cancelled' : 'failed', reason: 'No validation id returned' };
    const q = new URLSearchParams({
      val_id: params.val_id,
      store_id: env.SSLCOMMERZ_STORE_ID,
      store_passwd: env.SSLCOMMERZ_STORE_PASSWORD,
      format: 'json',
    });
    const res = await fetch(`${base()}/validator/api/validationserverAPI.php?${q}`);
    const json = (await res.json()) as { status: string; tran_id: string; amount: string; currency_type: string; val_id: string };
    const ok =
      (json.status === 'VALID' || json.status === 'VALIDATED') &&
      json.tran_id === payment.transactionId &&
      Math.abs(Number(json.amount) - payment.amount) < 0.01 &&
      json.currency_type === payment.currency;
    return ok
      ? { status: 'success', providerReference: json.val_id, amount: Number(json.amount), raw: json }
      : { status: 'failed', reason: `Validation failed (${json.status})`, raw: json };
  },
};

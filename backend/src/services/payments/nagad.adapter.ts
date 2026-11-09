import crypto from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { PaymentAdapter } from './types';

const base = () =>
  env.NAGAD_SANDBOX
    ? 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0'
    : 'https://api.mynagad.com';

const pem = (key: string, type: 'PUBLIC' | 'PRIVATE') =>
  key.includes('BEGIN') ? key : `-----BEGIN ${type} KEY-----\n${key}\n-----END ${type} KEY-----`;

const encrypt = (data: object) =>
  crypto
    .publicEncrypt({ key: pem(env.NAGAD_PG_PUBLIC_KEY, 'PUBLIC'), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(data)))
    .toString('base64');

const decrypt = (data: string) =>
  JSON.parse(
    crypto
      .privateDecrypt({ key: pem(env.NAGAD_MERCHANT_PRIVATE_KEY, 'PRIVATE'), padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data, 'base64'))
      .toString(),
  );

const sign = (data: object) =>
  crypto.createSign('SHA256').update(JSON.stringify(data)).sign(pem(env.NAGAD_MERCHANT_PRIVATE_KEY, 'PRIVATE'), 'base64');

function timestamp() {
  const d = new Date(Date.now() + 6 * 3600_000); // Asia/Dhaka
  return d.toISOString().replace(/[-:T]/g, '').slice(0, 14);
}

const headers = {
  'Content-Type': 'application/json',
  'X-KM-Api-Version': 'v-0.2.0',
  'X-KM-IP-V4': '127.0.0.1',
  'X-KM-Client-Type': 'PC_WEB',
};

/** Nagad Merchant Checkout (initialize → complete → verify), RSA-signed per Nagad's API. */
export const nagadAdapter: PaymentAdapter = {
  name: 'nagad',
  label: 'Nagad',
  isDemo: false,
  isConfigured: () => Boolean(env.NAGAD_MERCHANT_ID && env.NAGAD_MERCHANT_PRIVATE_KEY && env.NAGAD_PG_PUBLIC_KEY),

  async initiate(ctx) {
    const orderId = ctx.transactionId.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
    const datetime = timestamp();
    const sensitive = { merchantId: env.NAGAD_MERCHANT_ID, datetime, orderId, challenge: crypto.randomBytes(20).toString('hex') };

    const initRes = await fetch(`${base()}/api/dfs/check-out/initialize/${env.NAGAD_MERCHANT_ID}/${orderId}?locale=EN`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ dateTime: datetime, sensitiveData: encrypt(sensitive), signature: sign(sensitive) }),
    });
    const init = (await initRes.json()) as { sensitiveData?: string; message?: string };
    if (!init.sensitiveData) throw ApiError.unavailable(`Nagad initialisation failed: ${init.message ?? 'unknown'}`);
    const { paymentReferenceId, challenge } = decrypt(init.sensitiveData);

    const order = { merchantId: env.NAGAD_MERCHANT_ID, orderId, currencyCode: '050', amount: ctx.amount.toFixed(2), challenge };
    const completeRes = await fetch(`${base()}/api/dfs/check-out/complete/${paymentReferenceId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sensitiveData: encrypt(order), signature: sign(order), merchantCallbackURL: ctx.callbackUrl }),
    });
    const complete = (await completeRes.json()) as { callBackUrl?: string; message?: string };
    if (!complete.callBackUrl) throw ApiError.unavailable(`Nagad checkout failed: ${complete.message ?? 'unknown'}`);
    return { redirectUrl: complete.callBackUrl, providerReference: paymentReferenceId };
  },

  async verify(payment, params) {
    const ref = params.payment_ref_id;
    if (!ref) return { status: 'failed', reason: 'No Nagad payment reference' };
    const res = await fetch(`${base()}/api/dfs/verify/payment/${ref}`, { headers });
    const json = (await res.json()) as { status?: string; amount?: string; orderId?: string; issuerPaymentRefNo?: string };
    const ok = json.status === 'Success' && Math.abs(Number(json.amount) - payment.amount) < 0.01;
    return ok
      ? { status: 'success', providerReference: json.issuerPaymentRefNo ?? ref, amount: Number(json.amount), raw: json }
      : { status: json.status === 'Aborted' ? 'cancelled' : 'failed', reason: `Nagad status ${json.status ?? 'unknown'}`, raw: json };
  },
};

import type { Request, Response } from 'express';
import { env } from '../config/env';
import { Payment, PAYMENT_PROVIDERS, type PaymentProviderName } from '../models/Payment';
import { handlePaymentCallback, initiatePayment } from '../services/payment.service';
import { demoSignature, listPaymentMethods } from '../services/payments';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/response';

export async function methods(_req: Request, res: Response) {
  sendSuccess(res, listPaymentMethods());
}

export async function initiate(req: Request, res: Response) {
  const result = await initiatePayment({ userId: req.user!.id, ...req.body });
  sendSuccess(res, result, { message: 'Payment initiated', status: 201 });
}

/** Provider callbacks arrive as GET redirects or POST form posts depending on the gateway. */
export async function callback(req: Request, res: Response) {
  const provider = String(req.params.provider) as PaymentProviderName;
  if (!PAYMENT_PROVIDERS.includes(provider)) throw ApiError.notFound('Payment provider');
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...(req.query as object), ...(req.body ?? {}) })) {
    if (typeof v === 'string') params[k] = v;
  }
  const redirectTo = await handlePaymentCallback(provider, params);
  res.redirect(303, redirectTo);
}

/** Status for the result page. The browser never decides whether a payment succeeded. */
export async function status(req: Request, res: Response) {
  const payment = await Payment.findOne({ transactionId: req.params.transactionId, user: req.user!.id })
    .populate('booking', 'reference title type status paymentStatus pricing')
    .populate('visaApplication', 'reference countryName visaType status paymentStatus fee');
  if (!payment) throw ApiError.notFound('Payment');
  sendSuccess(res, payment);
}

/* ───────── Demo gateway (simulated hosted payment page) ───────── */

export async function demoGatewayInfo(req: Request, res: Response) {
  const payment = await Payment.findOne({ transactionId: req.params.transactionId, user: req.user!.id, provider: 'demo' })
    .populate('booking', 'reference title')
    .populate('visaApplication', 'reference countryName visaType');
  if (!payment) throw ApiError.notFound('Payment');
  sendSuccess(res, {
    transactionId: payment.transactionId,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    booking: payment.booking,
    visaApplication: payment.visaApplication,
    isDemo: true,
  });
}

/**
 * Acts as the external demo gateway: records the customer's choice, signs it, and returns the
 * provider callback URL. The callback then verifies the signature before updating anything.
 */
export async function demoGatewayDecide(req: Request, res: Response) {
  const outcome = String(req.body?.outcome);
  if (!['success', 'failed', 'cancelled'].includes(outcome)) throw ApiError.badRequest('Invalid outcome');
  const payment = await Payment.findOne({ transactionId: req.params.transactionId, user: req.user!.id, provider: 'demo' });
  if (!payment) throw ApiError.notFound('Payment');
  if (payment.status !== 'initiated') throw ApiError.conflict('This payment has already been processed');

  const params = new URLSearchParams({ tx: payment.transactionId, outcome, signature: demoSignature(payment.transactionId, outcome) });
  sendSuccess(res, { callbackUrl: `${env.API_PUBLIC_URL}/api/v1/payments/callback/demo?${params}` });
}

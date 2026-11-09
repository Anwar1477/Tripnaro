import { env } from '../config/env';
import { Booking } from '../models/Booking';
import { Payment, type PaymentProviderName } from '../models/Payment';
import { VisaApplication } from '../models/Visa';
import { ApiError } from '../utils/ApiError';
import { randomToken } from '../utils/helpers';
import { confirmBookingPayment, markBookingPaymentFailed } from './booking.service';
import { notifyUser } from './notification.service';
import { paymentAdapters } from './payments';

interface InitiateInput {
  userId: string;
  provider: PaymentProviderName;
  bookingId?: string;
  visaApplicationId?: string;
}

export async function initiatePayment({ userId, provider, bookingId, visaApplicationId }: InitiateInput) {
  const adapter = paymentAdapters[provider];
  if (!adapter) throw ApiError.badRequest('Unknown payment provider');
  if (!adapter.isConfigured()) {
    throw ApiError.unavailable(`${adapter.label} is not configured on this server yet. Please choose another method.`);
  }

  let amount: number;
  let description: string;
  let customer: { name: string; email: string; phone: string };

  if (bookingId) {
    const booking = await Booking.findOne({ _id: bookingId, user: userId });
    if (!booking) throw ApiError.notFound('Booking');
    if (booking.paymentStatus === 'paid') throw ApiError.conflict('This booking is already paid');
    if (booking.status !== 'pending') throw ApiError.badRequest(`A ${booking.status} booking cannot be paid`);
    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      throw ApiError.badRequest('The payment window for this booking has expired. Please book again.');
    }
    amount = booking.pricing!.total;
    description = `${booking.reference} · ${booking.title}`;
    customer = { name: booking.contact!.name, email: booking.contact!.email, phone: booking.contact!.phone };
  } else {
    const application = await VisaApplication.findOne({ _id: visaApplicationId, user: userId });
    if (!application) throw ApiError.notFound('Visa application');
    if (application.paymentStatus === 'paid') throw ApiError.conflict('This application is already paid');
    amount = application.fee;
    description = `${application.reference} · ${application.countryName} ${application.visaType} visa`;
    customer = {
      name: `${application.applicant!.firstName} ${application.applicant!.lastName}`,
      email: application.applicant!.email,
      phone: application.applicant!.phone,
    };
  }

  const transactionId = `TX${Date.now().toString(36).toUpperCase()}${randomToken(4).toUpperCase()}`;
  const payment = await Payment.create({
    booking: bookingId,
    visaApplication: visaApplicationId,
    user: userId,
    provider,
    method: provider === 'sslcommerz' || provider === 'stripe' ? 'card' : provider,
    amount,
    currency: 'BDT',
    transactionId,
    isDemo: adapter.isDemo,
  });

  const callbackUrl = `${env.API_PUBLIC_URL}/api/v1/payments/callback/${provider}?tx=${transactionId}`;
  try {
    const result = await adapter.initiate({
      transactionId,
      amount,
      currency: 'BDT',
      description,
      customer,
      callbackUrl,
      cancelUrl: `${callbackUrl}&status=cancel`,
    });
    payment.providerReference = result.providerReference;
    payment.raw = { initiate: result.raw };
    await payment.save();
    return { transactionId, redirectUrl: result.redirectUrl, isDemo: adapter.isDemo };
  } catch (err) {
    payment.status = 'failed';
    payment.failureReason = (err as Error).message;
    await payment.save();
    throw err;
  }
}

/**
 * Handles the provider callback. The outcome is only accepted after the adapter has verified
 * it with the provider (or, for the demo gateway, checked its HMAC signature).
 * Returns the frontend URL to redirect the customer to.
 */
export async function handlePaymentCallback(provider: PaymentProviderName, params: Record<string, string>): Promise<string> {
  const resultUrl = (tx: string) => `${env.FRONTEND_URL}/payment/result?tx=${encodeURIComponent(tx)}`;
  const tx = params.tx ?? params.tran_id ?? '';
  const payment = await Payment.findOne({ transactionId: tx, provider });
  if (!payment) return `${env.FRONTEND_URL}/payment/result?error=not_found`;
  if (payment.status !== 'initiated') return resultUrl(tx); // idempotent: already processed

  const adapter = paymentAdapters[provider];
  let verification;
  try {
    verification = await adapter.verify(
      { transactionId: payment.transactionId, amount: payment.amount, currency: payment.currency, providerReference: payment.providerReference },
      params,
    );
  } catch (err) {
    verification = { status: 'failed' as const, reason: `Verification error: ${(err as Error).message}` };
  }

  payment.status = verification.status;
  payment.verifiedAt = new Date();
  if (verification.providerReference) payment.providerReference = verification.providerReference;
  if (verification.status !== 'success') payment.failureReason = verification.reason;
  payment.raw = { ...(payment.raw ?? {}), verify: verification.raw ?? null };
  await payment.save();

  if (payment.booking) {
    if (verification.status === 'success') await confirmBookingPayment(String(payment.booking));
    else await markBookingPaymentFailed(String(payment.booking));
  }

  if (payment.visaApplication) {
    const app = await VisaApplication.findById(payment.visaApplication);
    if (app && verification.status === 'success') {
      app.paymentStatus = 'paid';
      app.statusHistory.push({ status: app.status, note: 'Visa fee paid', at: new Date() });
      await app.save();
    } else if (app) {
      app.paymentStatus = 'failed';
      await app.save();
    }
  }

  await notifyUser(String(payment.user), {
    title: verification.status === 'success' ? 'Payment successful' : 'Payment not completed',
    message:
      verification.status === 'success'
        ? `We received BDT ${payment.amount.toLocaleString('en-US')}${payment.isDemo ? ' (demo payment — no real charge)' : ''}.`
        : `Your payment could not be completed: ${verification.reason ?? 'unknown reason'}.`,
    type: 'payment',
  });

  return resultUrl(tx);
}

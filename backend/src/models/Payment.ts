import { Schema, model, type InferSchemaType } from 'mongoose';

export const PAYMENT_PROVIDERS = ['demo', 'sslcommerz', 'bkash', 'nagad', 'stripe'] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    visaApplication: { type: Schema.Types.ObjectId, ref: 'VisaApplication', index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: PAYMENT_PROVIDERS, required: true },
    method: { type: String, default: 'card' }, // card, bkash, nagad, …
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT' },
    status: {
      type: String,
      enum: ['initiated', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'initiated',
      index: true,
    },
    transactionId: { type: String, required: true, unique: true }, // our id sent to provider
    providerReference: String, // id returned by provider (val_id, paymentID, session id …)
    isDemo: { type: Boolean, default: false },
    verifiedAt: Date,
    failureReason: String,
    raw: { type: Schema.Types.Mixed, select: false }, // provider payloads for audit
  },
  { timestamps: true },
);

export type PaymentType = InferSchemaType<typeof paymentSchema>;
export const Payment = model('Payment', paymentSchema);

import { Booking } from '../models/Booking';
import { Coupon, Setting } from '../models/Engagement';
import { ApiError } from '../utils/ApiError';

/**
 * Coupon rules live here and only here. The browser never calculates a discount: it sends a code,
 * and every price it shows comes from a server quote or a stored booking.
 *
 * Lifecycle of a coupon on a booking
 *  1. quote     → evaluateCoupon() (read-only)
 *  2. booking   → evaluateCoupon() again, then claimCouponSlot() atomically reserves a usage slot
 *  3. payment   → revalidated with current admin settings (booking.service › revalidateBookingCoupon)
 *  4. cancelled / hold expired → releaseCouponSlot(); a failed payment can be retried, so it keeps the slot
 */

export type CouponFailure =
  | 'DISABLED'
  | 'INVALID'
  | 'INACTIVE'
  | 'NOT_STARTED'
  | 'EXPIRED'
  | 'NOT_APPLICABLE'
  | 'MIN_AMOUNT'
  | 'USAGE_LIMIT'
  | 'USER_LIMIT'
  | 'PAYMENT_CHANNEL';

/** A coupon was rejected for a business reason (as opposed to a server fault). */
export class CouponError extends ApiError {
  constructor(
    public reason: CouponFailure,
    message: string,
  ) {
    super(reason === 'DISABLED' ? 403 : 400, message, `COUPON_${reason}`);
    this.name = 'CouponError';
  }
}

export interface CouponResult {
  code: string;
  title: string;
  discountType: 'percent' | 'flat';
  /** Percentage (e.g. 20) or flat BDT amount, as configured by the admin. */
  value: number;
  /** Discount in whole BDT, after the max-discount cap. */
  discount: number;
  /** True when maxDiscount reduced the discount. */
  capped: boolean;
  maxDiscount?: number;
  paymentChannel?: string;
}

const CHANNEL_LABELS: Record<string, string> = { bkash: 'bKash', nagad: 'Nagad', sslcommerz: 'card / SSLCommerz', stripe: 'international card' };

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase();

const formatBdt = (n: number) => `BDT ${n.toLocaleString('en-US')}`;

/** Whether the global coupon system is switched on (Admin → Coupons). Defaults to on. */
export async function couponsEnabled(): Promise<boolean> {
  const settings = await Setting.findOne({ key: 'site' }).select('features').lean();
  return (settings?.features as { coupons?: boolean } | undefined)?.coupons !== false;
}

/**
 * Pure discount maths in whole BDT. Percent values may carry up to two decimals (e.g. 12.5%);
 * scaling to integers before dividing avoids floating-point drift. The result is never negative
 * and never larger than the eligible amount.
 */
export function calculateDiscount(rule: { discountType: string; value: number; maxDiscount?: number | null }, eligibleAmount: number) {
  const amount = Math.max(0, Math.round(eligibleAmount));
  const raw = rule.discountType === 'percent' ? Math.round((amount * Math.round(rule.value * 100)) / 10_000) : Math.round(rule.value);
  let discount = Math.max(0, Math.min(raw, amount));
  let capped = false;
  if (rule.maxDiscount && rule.maxDiscount > 0 && discount > rule.maxDiscount) {
    discount = Math.round(rule.maxDiscount);
    capped = true;
  }
  return { discount, capped };
}

/** Number of this user's live bookings (paid, or on an unexpired hold) that use the coupon. */
export async function countUserCouponUses(userId: string, code: string, excludeBookingId?: string) {
  return Booking.countDocuments({
    user: userId,
    'coupon.code': code,
    status: { $ne: 'cancelled' },
    $or: [{ paymentStatus: 'paid' }, { holdExpiresAt: { $gt: new Date() } }],
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  });
}

interface EvaluateOptions {
  userId?: string;
  /** Payment provider, when known (payment initiation). Enforces payment-channel-only coupons. */
  provider?: string;
  /** The booking being re-validated: excluded from per-user counts. */
  excludeBookingId?: string;
  /** The booking already holds a usage slot, so the global usage limit is not re-checked. */
  holdsSlot?: boolean;
}

/** Validates a coupon for a product type and eligible amount (fare + taxes) and returns the discount. */
export async function evaluateCoupon(rawCode: string, type: string, eligibleAmount: number, opts: EvaluateOptions = {}): Promise<CouponResult> {
  if (!(await couponsEnabled())) throw new CouponError('DISABLED', 'Coupons are currently unavailable');

  const code = normalizeCouponCode(rawCode);
  const coupon = await Coupon.findOne({ code }).lean();
  const now = new Date();
  if (!coupon) throw new CouponError('INVALID', 'This coupon code is not valid');
  if (!coupon.active) throw new CouponError('INACTIVE', 'This coupon is currently inactive');
  if (coupon.validFrom && coupon.validFrom > now) throw new CouponError('NOT_STARTED', 'This coupon is not available yet');
  if (coupon.validTo < now) throw new CouponError('EXPIRED', 'This coupon has expired');
  if (!coupon.appliesTo.includes(type)) throw new CouponError('NOT_APPLICABLE', `This coupon cannot be used for ${type} bookings`);
  if (eligibleAmount < (coupon.minAmount ?? 0)) {
    throw new CouponError('MIN_AMOUNT', `Minimum booking amount for this coupon is ${formatBdt(coupon.minAmount ?? 0)}`);
  }
  if (!opts.holdsSlot && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new CouponError('USAGE_LIMIT', 'This coupon has reached its usage limit');
  }
  if (coupon.perUserLimit > 0 && opts.userId) {
    const used = await countUserCouponUses(opts.userId, code, opts.excludeBookingId);
    if (used >= coupon.perUserLimit) {
      throw new CouponError('USER_LIMIT', coupon.perUserLimit === 1 ? 'You have already used this coupon' : `You have already used this coupon ${coupon.perUserLimit} times`);
    }
  }
  if (opts.provider && coupon.paymentChannel && opts.provider !== coupon.paymentChannel) {
    throw new CouponError('PAYMENT_CHANNEL', `${code} is valid only when paying with ${CHANNEL_LABELS[coupon.paymentChannel] ?? coupon.paymentChannel}`);
  }

  const { discount, capped } = calculateDiscount(coupon, eligibleAmount);
  return {
    code: coupon.code,
    title: coupon.title,
    discountType: coupon.discountType as 'percent' | 'flat',
    value: coupon.value,
    discount,
    capped,
    maxDiscount: coupon.maxDiscount ?? undefined,
    paymentChannel: coupon.paymentChannel ?? undefined,
  };
}

/**
 * Atomically reserves one usage slot. The filter re-checks the limit inside the update, so two
 * concurrent bookings can never both take the last slot.
 */
export async function claimCouponSlot(code: string): Promise<void> {
  const claimed = await Coupon.findOneAndUpdate(
    { code, $or: [{ usageLimit: { $lte: 0 } }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
    { $inc: { usedCount: 1 } },
  );
  if (!claimed) throw new CouponError('USAGE_LIMIT', 'This coupon has reached its usage limit');
}

/** Returns a usage slot (booking cancelled, hold expired, or coupon removed). Never goes below zero. */
export async function releaseCouponSlot(code: string): Promise<void> {
  await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}

/** Legacy path for bookings created before slots were claimed at booking time. */
export async function markCouponUsed(code: string): Promise<void> {
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } });
}

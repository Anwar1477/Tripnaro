import { Coupon } from '../models/Engagement';
import { ApiError } from '../utils/ApiError';

export interface CouponResult {
  code: string;
  title: string;
  discount: number;
}

/** Validates a coupon against a product type and amount and returns the discount. */
export async function evaluateCoupon(code: string, type: string, amount: number): Promise<CouponResult> {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  const now = new Date();
  if (!coupon) throw ApiError.badRequest('This coupon code is not valid');
  if (coupon.validFrom && coupon.validFrom > now) throw ApiError.badRequest('This coupon is not active yet');
  if (coupon.validTo < now) throw ApiError.badRequest('This coupon has expired');
  if (!coupon.appliesTo.includes(type)) throw ApiError.badRequest(`This coupon cannot be used for ${type} bookings`);
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest('This coupon has reached its usage limit');
  if (amount < (coupon.minAmount ?? 0)) {
    throw ApiError.badRequest(`Minimum booking amount for this coupon is BDT ${coupon.minAmount}`);
  }

  let discount = coupon.discountType === 'percent' ? (amount * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.round(Math.min(discount, amount));

  return { code: coupon.code, title: coupon.title, discount };
}

export async function markCouponUsed(code: string): Promise<void> {
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } });
}

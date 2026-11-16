import { z } from 'zod';
import { Coupon } from '../models/Engagement';
import { ApiError } from '../utils/ApiError';

const BOOKING_TYPES = ['flight', 'hotel', 'tour', 'bus'] as const;
const CHANNELS = ['bkash', 'nagad', 'sslcommerz', 'stripe'] as const;

/**
 * Admin dates arrive as "YYYY-MM-DD" from the date picker. Bangladesh time (UTC+6) is the business
 * timezone, so a start date means 00:00 and an expiry date means 23:59:59.999 of that day in Dhaka:
 * a coupon "valid to 31 Dec" works all of 31 Dec. Full ISO timestamps are kept as given.
 */
function dhakaDate(edge: 'start' | 'end') {
  return z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v instanceof Date) return v;
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}+06:00`);
    return new Date(s);
  }, z.date({ error: 'Enter a valid date' }));
}

/** Empty inputs from the admin form mean "not set". null clears a previously stored value. */
const optionalNumber = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.coerce.number().min(0).nullable());
const limit = z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : v), z.coerce.number().int('Use a whole number').min(0, 'Use 0 for unlimited'));

export const couponAdminSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9_-]{2,29}$/, 'Use 3–30 letters, digits, - or _ (no spaces)'),
    title: z.string().trim().min(2, 'Add a short title').max(120),
    description: z.string().trim().max(500).optional().nullable(),
    discountType: z.enum(['percent', 'flat']),
    value: z.coerce.number().positive('Discount must be greater than 0'),
    maxDiscount: optionalNumber,
    minAmount: z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : v), z.coerce.number().min(0)),
    appliesTo: z.array(z.enum(BOOKING_TYPES)).min(1, 'Choose at least one booking type'),
    paymentChannel: z.preprocess((v) => (v === '' || v === undefined ? null : v), z.enum(CHANNELS).nullable()),
    validFrom: dhakaDate('start').optional(),
    validTo: dhakaDate('end'),
    usageLimit: limit,
    perUserLimit: limit,
    showOnHome: z.coerce.boolean().default(true),
    active: z.coerce.boolean().default(true),
  })
  .superRefine((c, ctx) => {
    if (c.discountType === 'percent' && c.value > 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage discount cannot exceed 100%' });
    if (c.discountType === 'percent' && Math.round(c.value * 100) !== c.value * 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Use at most two decimals' });
    if (c.discountType === 'flat' && !Number.isInteger(c.value)) ctx.addIssue({ code: 'custom', path: ['value'], message: 'Flat discounts are whole BDT amounts' });
    if (c.validFrom && c.validTo <= c.validFrom) ctx.addIssue({ code: 'custom', path: ['validTo'], message: 'Expiry date must be after the start date' });
    if (c.perUserLimit > 0 && c.usageLimit > 0 && c.perUserLimit > c.usageLimit) {
      ctx.addIssue({ code: 'custom', path: ['perUserLimit'], message: 'Per-customer limit cannot exceed the total usage limit' });
    }
  });

/**
 * CRUD-factory hook for /admin/coupons. Validates the merged coupon (stored values + changes),
 * normalises the code and rejects duplicates with a clear message. usedCount is server-managed.
 */
export async function validateCouponAdmin(data: Record<string, unknown>, ctx: { existing?: Record<string, unknown>; id?: string }) {
  const merged = { ...(ctx.existing ?? {}), ...data };
  // Stored documents carry fields the schema does not know (_id, timestamps): pick only schema keys.
  const parsed = couponAdminSchema.parse(Object.fromEntries(Object.keys(couponAdminSchema.shape).map((k) => [k, merged[k]])));
  // A cleared start date means "valid from now" (the field is required in the model).
  if (!parsed.validFrom) parsed.validFrom = ctx.existing && !('validFrom' in data && !data.validFrom) ? (ctx.existing.validFrom as Date) : new Date();
  const clash = await Coupon.exists({ code: parsed.code, ...(ctx.id ? { _id: { $ne: ctx.id } } : {}) });
  if (clash) throw ApiError.conflict(`Coupon code ${parsed.code} already exists`);
  return parsed as Record<string, unknown>;
}

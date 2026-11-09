import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Banner, Coupon, Newsletter, Review, Setting, TourRequest } from '../models/Engagement';
import { Hotel } from '../models/Hotel';
import { Tour } from '../models/Tour';
import { ApiError } from '../utils/ApiError';
import { buildMeta, getPagination, str } from '../utils/query';
import { sendSuccess } from '../utils/response';

/** Server-driven home content: banners, offers and settings arrive as data (see PDF takeaway #3). */
export async function homeContent(_req: Request, res: Response) {
  const now = new Date();
  const [banners, coupons, settings] = await Promise.all([
    Banner.find({ active: true }).sort({ placement: 1, order: 1 }),
    Coupon.find({ active: true, showOnHome: true, validTo: { $gte: now } }).sort({ createdAt: -1 }).limit(12),
    getSettings(),
  ]);
  sendSuccess(res, { banners, coupons, settings });
}

export async function getSettings() {
  return (await Setting.findOne({ key: 'site' })) ?? (await Setting.create({ key: 'site' }));
}

export async function publicSettings(_req: Request, res: Response) {
  sendSuccess(res, await getSettings());
}

export async function subscribe(req: Request, res: Response) {
  const existing = await Newsletter.findOne({ email: req.body.email });
  if (existing?.status === 'subscribed') return sendSuccess(res, null, { message: 'You are already subscribed' });
  await Newsletter.findOneAndUpdate({ email: req.body.email }, { status: 'subscribed' }, { upsert: true });
  sendSuccess(res, null, { message: 'Thanks for subscribing!', status: 201 });
}

export async function createTourRequest(req: Request, res: Response) {
  const request = await TourRequest.create({ ...req.body, user: req.user?.id });
  sendSuccess(res, request, { message: 'Request received. A travel expert will contact you within 24 hours.', status: 201 });
}

/* ───────── Reviews ───────── */

export async function listReviews(req: Request, res: Response) {
  const targetId = str(req.query.targetId);
  if (!targetId || !Types.ObjectId.isValid(targetId)) throw ApiError.badRequest('targetId is required');
  const { page, limit, skip } = getPagination(req, 10);
  const filter: Record<string, unknown> = { target: targetId, status: 'approved' };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name avatar'),
    Review.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

export async function createReview(req: Request, res: Response) {
  const { targetType, targetId, ...rest } = req.body;
  const Model = targetType === 'hotel' ? Hotel : Tour;
  if (!(await (Model as typeof Hotel).exists({ _id: targetId }))) throw ApiError.notFound(targetType);
  if (await Review.exists({ user: req.user!.id, target: targetId })) throw ApiError.conflict('You have already reviewed this');
  const review = await Review.create({
    ...rest,
    user: req.user!.id,
    targetType,
    target: targetId,
    targetModel: targetType === 'hotel' ? 'Hotel' : 'Tour',
  });
  sendSuccess(res, review, { message: 'Thanks! Your review will appear after moderation.', status: 201 });
}

/**
 * Incrementally adjusts the cached rating when a review is approved (+1) or un-approved (-1),
 * so seeded / imported aggregate ratings are preserved.
 */
export async function adjustRating(targetType: string, targetId: string, rating: number, direction: 1 | -1) {
  const Model = (targetType === 'hotel' ? Hotel : Tour) as typeof Hotel;
  const item = await Model.findById(targetId).select('rating reviewCount');
  if (!item) return;
  const count = item.reviewCount ?? 0;
  const nextCount = Math.max(0, count + direction);
  const sum = (item.rating ?? 0) * count + direction * rating;
  item.rating = nextCount ? Math.round((sum / nextCount) * 10) / 10 : 0;
  item.reviewCount = nextCount;
  await item.save();
}

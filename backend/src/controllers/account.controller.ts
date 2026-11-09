import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Booking } from '../models/Booking';
import { Notification, Wishlist } from '../models/Engagement';
import { Hotel } from '../models/Hotel';
import { Payment } from '../models/Payment';
import { Tour } from '../models/Tour';
import { User } from '../models/User';
import { VisaApplication } from '../models/Visa';
import { ApiError } from '../utils/ApiError';
import { buildMeta, getPagination } from '../utils/query';
import { sendSuccess } from '../utils/response';

/* ───────── Profile ───────── */

export async function updateProfile(req: Request, res: Response) {
  const updates = { ...req.body };
  if (updates.phone === '') updates.phone = undefined;
  const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true, runValidators: true });
  sendSuccess(res, { user }, { message: 'Profile updated' });
}

export async function updateNotificationPrefs(req: Request, res: Response) {
  const user = await User.findByIdAndUpdate(req.user!.id, { notificationPrefs: req.body }, { new: true });
  sendSuccess(res, { notificationPrefs: user?.notificationPrefs }, { message: 'Preferences saved' });
}

export async function overview(req: Request, res: Response) {
  const userId = req.user!.id;
  const [byType, upcoming, visaCount, wishlistCount, unread, spent] = await Promise.all([
    Booking.aggregate([{ $match: { user: toId(userId) } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Booking.find({ user: userId, status: 'confirmed', startDate: { $gte: new Date() } }).sort({ startDate: 1 }).limit(3),
    VisaApplication.countDocuments({ user: userId }),
    Wishlist.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
    Payment.aggregate([{ $match: { user: toId(userId), status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  const counts = Object.fromEntries(byType.map((b) => [b._id, b.count]));
  sendSuccess(res, {
    counts: { ...counts, visa: visaCount, wishlist: wishlistCount, unreadNotifications: unread },
    totalBookings: byType.reduce((s, b) => s + b.count, 0),
    totalSpent: spent[0]?.total ?? 0,
    upcoming,
  });
}

/* ───────── Saved travellers ───────── */

export async function listTravelers(req: Request, res: Response) {
  const user = await User.findById(req.user!.id).select('savedTravelers');
  sendSuccess(res, user?.savedTravelers ?? []);
}

export async function addTraveler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized();
  if (user.savedTravelers.length >= 20) throw ApiError.badRequest('You can save up to 20 travellers');
  user.savedTravelers.push(req.body);
  await user.save();
  sendSuccess(res, user.savedTravelers, { message: 'Traveller saved', status: 201 });
}

export async function updateTraveler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  const traveler = user?.savedTravelers.find((t) => String(t._id) === req.params.travelerId);
  if (!user || !traveler) throw ApiError.notFound('Traveller');
  Object.assign(traveler, req.body);
  await user.save();
  sendSuccess(res, user.savedTravelers, { message: 'Traveller updated' });
}

export async function deleteTraveler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized();
  user.savedTravelers = user.savedTravelers.filter((t) => String(t._id) !== req.params.travelerId);
  await user.save();
  sendSuccess(res, user.savedTravelers, { message: 'Traveller removed' });
}

/* ───────── Wishlist ───────── */

export async function listWishlist(req: Request, res: Response) {
  const items = await Wishlist.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .populate({ path: 'item', select: 'name title slug images priceFrom priceAdult rating reviewCount city stars durationDays durationNights' });
  sendSuccess(res, items.filter((i) => i.item));
}

export async function toggleWishlist(req: Request, res: Response) {
  const { itemType, itemId } = req.body as { itemType: 'hotel' | 'tour'; itemId: string };
  if (!['hotel', 'tour'].includes(itemType) || !/^[a-f\d]{24}$/i.test(itemId ?? '')) {
    throw ApiError.badRequest('itemType and itemId are required');
  }
  const Model = itemType === 'hotel' ? Hotel : Tour;
  if (!(await (Model as typeof Hotel).exists({ _id: itemId }))) throw ApiError.notFound('Item');

  const existing = await Wishlist.findOneAndDelete({ user: req.user!.id, item: itemId });
  if (existing) return sendSuccess(res, { saved: false }, { message: 'Removed from wishlist' });
  await Wishlist.create({ user: req.user!.id, itemType, item: itemId, itemModel: itemType === 'hotel' ? 'Hotel' : 'Tour' });
  sendSuccess(res, { saved: true }, { message: 'Saved to wishlist', status: 201 });
}

export async function wishlistIds(req: Request, res: Response) {
  const items = await Wishlist.find({ user: req.user!.id }).select('item').lean();
  sendSuccess(res, items.map((i) => String(i.item)));
}

/* ───────── Notifications ───────── */

export async function listNotifications(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter = { user: req.user!.id };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  sendSuccess(res, items, { meta: { ...buildMeta(page, limit, total), unread } });
}

export async function markNotificationRead(req: Request, res: Response) {
  await Notification.updateOne({ _id: req.params.id, user: req.user!.id }, { read: true });
  sendSuccess(res, null, { message: 'Marked as read' });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
  sendSuccess(res, null, { message: 'All notifications marked as read' });
}

/* ───────── Payments ───────── */

export async function myPayments(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter = { user: req.user!.id };
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('booking', 'reference title type')
      .populate('visaApplication', 'reference countryName visaType'),
    Payment.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

const toId = (id: string) => new Types.ObjectId(id);

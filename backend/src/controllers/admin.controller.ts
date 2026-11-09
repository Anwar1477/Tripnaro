import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { Booking, BOOKING_STATUSES } from '../models/Booking';
import { Newsletter, Review, Setting } from '../models/Engagement';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { VISA_STATUSES, VisaApplication } from '../models/Visa';
import { cancelBooking, confirmBookingPayment } from '../services/booking.service';
import { emailTemplates } from '../services/email.service';
import { notifyUser } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';
import { buildMeta, escapeRegex, getPagination, str } from '../utils/query';
import { sendSuccess } from '../utils/response';
import { adjustRating, getSettings } from './content.controller';

/* ───────── Dashboard ───────── */

export async function stats(_req: Request, res: Response) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [users, bookings, byType, byStatus, revenue, monthly, recent, pendingVisa, pendingReviews, subscribers, cancellations] =
    await Promise.all([
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.aggregate([{ $group: { _id: '$type', count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$pricing.total', 0] } } } }]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: '$isDemo', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.find().sort({ createdAt: -1 }).limit(8).populate('user', 'name email'),
      VisaApplication.countDocuments({ status: { $in: ['submitted', 'under_review', 'documents_required', 'processing'] } }),
      Review.countDocuments({ status: 'pending' }),
      Newsletter.countDocuments({ status: 'subscribed' }),
      Booking.countDocuments({ 'cancellation.status': 'requested' }),
    ]);

  const months: { month: string; total: number; count: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const row = monthly.find((m) => m._id === key);
    months.push({ month: key, total: row?.total ?? 0, count: row?.count ?? 0 });
  }

  const live = revenue.find((r) => r._id === false);
  const demo = revenue.find((r) => r._id === true);
  sendSuccess(res, {
    totals: {
      users,
      bookings,
      revenue: (live?.total ?? 0) + (demo?.total ?? 0),
      liveRevenue: live?.total ?? 0,
      demoRevenue: demo?.total ?? 0,
      pendingVisa,
      pendingReviews,
      subscribers,
      cancellationRequests: cancellations,
    },
    byType,
    byStatus,
    monthly: months,
    recent,
  });
}

/* ───────── Users ───────── */

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  const q = str(req.query.q);
  if (q) filter.$or = [{ name: new RegExp(escapeRegex(q), 'i') }, { email: new RegExp(escapeRegex(q), 'i') }];
  const role = str(req.query.role);
  if (role) filter.role = role;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

const userUpdateSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).optional(),
});

export async function updateUser(req: Request, res: Response) {
  const data = userUpdateSchema.parse(req.body);
  if (req.params.id === req.user!.id && (data.role === 'user' || data.isActive === false)) {
    throw ApiError.badRequest('You cannot demote or disable your own admin account');
  }
  const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User');
  sendSuccess(res, user, { message: 'User updated' });
}

export async function deleteUser(req: Request, res: Response) {
  if (req.params.id === req.user!.id) throw ApiError.badRequest('You cannot delete your own account');
  if (await Booking.exists({ user: req.params.id, paymentStatus: 'paid' })) {
    throw ApiError.conflict('This user has paid bookings. Disable the account instead of deleting it.');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User');
  sendSuccess(res, null, { message: 'User deleted' });
}

/* ───────── Bookings ───────── */

export async function listBookings(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  for (const key of ['type', 'status', 'paymentStatus'] as const) {
    const v = str(req.query[key]);
    if (v) filter[key] = v;
  }
  if (req.query.cancellation === 'requested') filter['cancellation.status'] = 'requested';
  const q = str(req.query.q);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ reference: rx }, { title: rx }, { 'contact.email': rx }, { 'contact.name': rx }];
  }
  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'),
    Booking.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

const bookingActionSchema = z.object({
  action: z.enum(['confirm', 'cancel', 'complete', 'approve_cancellation', 'reject_cancellation', 'process_refund', 'mark_paid']),
  note: z.string().max(500).optional(),
});

export async function updateBooking(req: Request, res: Response) {
  const { action, note } = bookingActionSchema.parse(req.body);
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking');
  const history = (status: string, text: string) => booking.statusHistory.push({ status, note: `admin: ${note || text}`, at: new Date() });

  switch (action) {
    case 'confirm':
      if (booking.status !== 'pending') throw ApiError.badRequest('Only pending bookings can be confirmed');
      booking.status = 'confirmed';
      booking.holdExpiresAt = undefined;
      history('confirmed', 'Confirmed manually');
      break;
    case 'mark_paid':
      // Manual reconciliation (e.g. bank transfer verified by finance).
      await confirmBookingPayment(booking.id);
      return sendSuccess(res, await Booking.findById(booking.id), { message: 'Booking marked as paid' });
    case 'complete':
      if (booking.status !== 'confirmed') throw ApiError.badRequest('Only confirmed bookings can be completed');
      booking.status = 'completed';
      history('completed', 'Trip completed');
      break;
    case 'cancel':
    case 'approve_cancellation':
      await cancelBooking(booking, note || 'Cancelled by operations', 'admin');
      return sendSuccess(res, booking, { message: 'Booking cancelled' });
    case 'reject_cancellation':
      if (booking.cancellation?.status !== 'requested') throw ApiError.badRequest('No pending cancellation request');
      booking.cancellation.status = 'rejected';
      booking.cancellation.processedAt = new Date();
      history(booking.status, 'Cancellation request rejected');
      break;
    case 'process_refund':
      if (booking.paymentStatus !== 'refund_pending') throw ApiError.badRequest('No refund pending for this booking');
      booking.paymentStatus = 'refunded';
      booking.refund = { ...booking.refund, status: 'processed', processedAt: new Date() };
      await Payment.updateMany({ booking: booking._id, status: 'success' }, { status: 'refunded' });
      history(booking.status, 'Refund processed');
      break;
  }
  await booking.save();
  await notifyUser(String(booking.user), {
    title: `Booking ${booking.reference} updated`,
    message: `Status: ${booking.status}, payment: ${booking.paymentStatus.replace('_', ' ')}.`,
    type: 'booking',
    link: `/my-account/bookings/${booking.id}`,
  });
  sendSuccess(res, booking, { message: 'Booking updated' });
}

/* ───────── Visa applications ───────── */

export async function listVisaApplications(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  const status = str(req.query.status);
  if (status) filter.status = status;
  const q = str(req.query.q);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ reference: rx }, { countryName: rx }, { 'applicant.email': rx }, { 'applicant.passportNumber': rx }];
  }
  const [items, total] = await Promise.all([
    VisaApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-documents.storedName').populate('user', 'name email'),
    VisaApplication.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

const visaStatusSchema = z.object({ status: z.enum(VISA_STATUSES), note: z.string().max(500).optional() });

export async function updateVisaApplication(req: Request, res: Response) {
  const { status, note } = visaStatusSchema.parse(req.body);
  const app = await VisaApplication.findById(req.params.id).populate<{ user: { _id: string; name: string } }>('user', 'name');
  if (!app) throw ApiError.notFound('Application');
  app.status = status;
  app.statusHistory.push({ status, note: note || `Status changed to ${status.replace(/_/g, ' ')}`, at: new Date() });
  if (note) app.adminNotes = note;
  await app.save();
  await notifyUser(String(app.user._id), {
    title: 'Visa application update',
    message: `${app.reference} is now ${status.replace(/_/g, ' ')}.${note ? ` Note: ${note}` : ''}`,
    type: 'visa',
    link: `/my-account/visa/${app.id}`,
    email: emailTemplates.visaStatus(app.user.name, app.reference, status),
  });
  sendSuccess(res, app, { message: 'Application updated' });
}

/* ───────── Payments ───────── */

export async function listPayments(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  for (const key of ['status', 'provider'] as const) {
    const v = str(req.query[key]);
    if (v) filter[key] = v;
  }
  const q = str(req.query.q);
  if (q) filter.transactionId = new RegExp(escapeRegex(q), 'i');
  const [items, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('booking', 'reference title')
      .populate('visaApplication', 'reference countryName'),
    Payment.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

/* ───────── Reviews ───────── */

export async function listReviewsAdmin(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  const status = str(req.query.status);
  if (status) filter.status = status;
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email').populate('target', 'name title slug'),
    Review.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

export async function moderateReview(req: Request, res: Response) {
  const { status } = z.object({ status: z.enum(['approved', 'rejected', 'pending']) }).parse(req.body);
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review');
  const wasApproved = review.status === 'approved';
  review.status = status;
  await review.save();
  if (!wasApproved && status === 'approved') await adjustRating(review.targetType, String(review.target), review.rating, 1);
  if (wasApproved && status !== 'approved') await adjustRating(review.targetType, String(review.target), review.rating, -1);
  sendSuccess(res, review, { message: `Review ${status}` });
}

export async function deleteReview(req: Request, res: Response) {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review');
  if (review.status === 'approved') await adjustRating(review.targetType, String(review.target), review.rating, -1);
  sendSuccess(res, null, { message: 'Review deleted' });
}

/* ───────── Newsletter ───────── */

export async function listSubscribers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 50, 500);
  const filter: Record<string, unknown> = {};
  const q = str(req.query.q);
  if (q) filter.email = new RegExp(escapeRegex(q), 'i');
  if (req.query.format === 'csv') {
    const all = await Newsletter.find(filter).sort({ createdAt: -1 }).lean();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tripnaro-subscribers.csv"');
    return res.send(['email,status,subscribed_at', ...all.map((s) => `${s.email},${s.status},${s.createdAt.toISOString()}`)].join('\n'));
  }
  const [items, total] = await Promise.all([
    Newsletter.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Newsletter.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

export async function deleteSubscriber(req: Request, res: Response) {
  await Newsletter.findByIdAndDelete(req.params.id);
  sendSuccess(res, null, { message: 'Subscriber removed' });
}

/* ───────── Settings & uploads ───────── */

export async function getSiteSettings(_req: Request, res: Response) {
  sendSuccess(res, await getSettings());
}

export async function updateSiteSettings(req: Request, res: Response) {
  const data = { ...req.body };
  delete data._id;
  delete data.key;
  const settings = await Setting.findOneAndUpdate({ key: 'site' }, data, { new: true, upsert: true, runValidators: true });
  sendSuccess(res, settings, { message: 'Settings saved' });
}

export async function uploadImages(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[]) ?? [];
  if (!files.length) throw ApiError.badRequest('No images uploaded');
  sendSuccess(res, files.map((f) => ({ url: `${env.API_PUBLIC_URL}/uploads/${f.filename}`, name: f.originalname, size: f.size })), {
    message: 'Uploaded',
    status: 201,
  });
}

export const bookingStatuses = BOOKING_STATUSES;

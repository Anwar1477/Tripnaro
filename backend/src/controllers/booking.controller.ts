import type { Request, Response } from 'express';
import { Booking } from '../models/Booking';
import { cancelBooking, createBooking, quoteBooking } from '../services/booking.service';
import { evaluateCoupon } from '../services/coupon.service';
import { ApiError } from '../utils/ApiError';
import { buildMeta, getPagination, str } from '../utils/query';
import { sendSuccess } from '../utils/response';

export async function quote(req: Request, res: Response) {
  const { pricing, coupon } = await quoteBooking(req.body);
  sendSuccess(res, { pricing, coupon });
}

export async function create(req: Request, res: Response) {
  const booking = await createBooking(req.user!.id, req.body);
  sendSuccess(res, booking, { message: 'Booking created', status: 201 });
}

export async function listMine(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 10, 50);
  const filter: Record<string, unknown> = { user: req.user!.id };
  const type = str(req.query.type);
  if (type) filter.type = type;
  const status = str(req.query.status);
  if (status === 'upcoming') {
    filter.status = 'confirmed';
    filter.startDate = { $gte: new Date() };
  } else if (status) filter.status = status;

  const [items, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

async function findOwned(req: Request) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking');
  if (String(booking.user) !== req.user!.id && req.user!.role !== 'admin') throw ApiError.notFound('Booking');
  return booking;
}

export async function getOne(req: Request, res: Response) {
  sendSuccess(res, await findOwned(req));
}

export async function requestCancellation(req: Request, res: Response) {
  const booking = await findOwned(req);
  if (booking.status === 'cancelled') throw ApiError.badRequest('Booking is already cancelled');
  if (booking.status === 'completed') throw ApiError.badRequest('Completed bookings cannot be cancelled');
  if (booking.startDate < new Date()) throw ApiError.badRequest('This trip has already started');

  // Unpaid holds can be released immediately; paid bookings go to the operations team.
  if (booking.paymentStatus !== 'paid') {
    booking.cancellation = { status: 'requested', requestedAt: new Date(), reason: req.body.reason };
    await cancelBooking(booking, req.body.reason, 'user');
    return sendSuccess(res, booking, { message: 'Booking cancelled' });
  }
  if (booking.cancellation?.status === 'requested') throw ApiError.conflict('A cancellation request is already pending');
  booking.cancellation = { status: 'requested', requestedAt: new Date(), reason: req.body.reason };
  booking.statusHistory.push({ status: booking.status, note: 'Customer requested cancellation', at: new Date() });
  await booking.save();
  sendSuccess(res, booking, { message: 'Cancellation requested. Our team will review it within 24 hours.' });
}

export async function requestRefund(req: Request, res: Response) {
  const booking = await findOwned(req);
  if (booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'refund_pending') {
    throw ApiError.badRequest('Only paid bookings can be refunded');
  }
  if (booking.refund?.status === 'requested' || booking.refund?.status === 'processed') {
    throw ApiError.conflict('A refund is already in progress for this booking');
  }
  booking.refund = { status: 'requested', requestedAt: new Date(), reason: req.body.reason, amount: booking.pricing?.total };
  booking.paymentStatus = 'refund_pending';
  booking.statusHistory.push({ status: booking.status, note: 'Customer requested refund', at: new Date() });
  await booking.save();
  sendSuccess(res, booking, { message: 'Refund requested' });
}

export async function validateCoupon(req: Request, res: Response) {
  const result = await evaluateCoupon(req.body.code, req.body.type, req.body.amount);
  sendSuccess(res, result, { message: `Coupon applied: you save BDT ${result.discount}` });
}

import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { PRIVATE_UPLOADS } from '../middlewares/upload';
import { VisaApplication, VisaCountry } from '../models/Visa';
import { notifyUser } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';
import { generateReference, parseDateOnly } from '../utils/helpers';
import { buildMeta, escapeRegex, getPagination, str } from '../utils/query';
import { sendSuccess } from '../utils/response';
import { visaApplicationSchema } from '../validators/booking.validator';

export async function listCountries(req: Request, res: Response) {
  const filter: Record<string, unknown> = { published: true };
  const q = str(req.query.q);
  if (q) filter.country = new RegExp(escapeRegex(q), 'i');
  const items = await VisaCountry.find(filter).sort({ popular: -1, country: 1 });
  sendSuccess(res, items);
}

export async function getCountry(req: Request, res: Response) {
  const country = await VisaCountry.findOne({ slug: req.params.slug, published: true });
  if (!country) throw ApiError.notFound('Visa service');
  sendSuccess(res, country);
}

function removeFiles(files: Express.Multer.File[]) {
  for (const f of files) fs.promises.unlink(f.path).catch(() => undefined);
}

/** multipart/form-data: field `data` (JSON) + files `documents[]` with labels in `labels` (JSON array). */
export async function apply(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[]) ?? [];
  try {
    let payload: unknown;
    let labels: string[] = [];
    try {
      payload = JSON.parse(String(req.body.data ?? '{}'));
      labels = JSON.parse(String(req.body.labels ?? '[]'));
    } catch {
      throw ApiError.badRequest('Malformed application data');
    }
    const parsed = visaApplicationSchema.safeParse(payload);
    if (!parsed.success) {
      throw ApiError.unprocessable('Validation failed', parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
    }
    const input = parsed.data;
    if (!files.length) throw ApiError.badRequest('Please upload at least your passport copy');

    const country = await VisaCountry.findOne({ _id: input.countryId, published: true });
    if (!country) throw ApiError.notFound('Visa service');
    const visaType = country.visaTypes.find((v) => v.name === input.visaType);
    if (!visaType) throw ApiError.badRequest('Selected visa type is not offered');
    const travelDate = parseDateOnly(input.travelDate);
    if (travelDate < new Date()) throw ApiError.badRequest('Travel date must be in the future');

    const application = await VisaApplication.create({
      reference: generateReference('visa'),
      user: req.user!.id,
      country: country._id,
      countryName: country.country,
      visaType: visaType.name,
      fee: visaType.fee + (visaType.serviceFee ?? 0),
      applicant: input.applicant,
      travelDate,
      returnDate: input.returnDate ? parseDateOnly(input.returnDate) : undefined,
      purpose: input.purpose,
      documents: files.map((f, i) => ({
        label: labels[i] ?? `Document ${i + 1}`,
        originalName: f.originalname.slice(0, 120),
        storedName: f.filename,
        mimeType: f.mimetype,
        size: f.size,
      })),
      statusHistory: [{ status: 'submitted', note: 'Application received' }],
    });

    await notifyUser(req.user!.id, {
      title: 'Visa application received',
      message: `${application.reference} · ${country.country} ${visaType.name} visa has been submitted.`,
      type: 'visa',
      link: `/my-account/visa/${application.id}`,
    });
    sendSuccess(res, application, { message: 'Application submitted', status: 201 });
  } catch (err) {
    removeFiles(files);
    throw err;
  }
}

export async function myApplications(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 10);
  const filter = { user: req.user!.id };
  const [items, total] = await Promise.all([
    VisaApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-documents.storedName'),
    VisaApplication.countDocuments(filter),
  ]);
  sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
}

export async function getApplication(req: Request, res: Response) {
  const app = await VisaApplication.findById(req.params.id).select('-documents.storedName').populate('country', 'country slug flag');
  if (!app || (String(app.user) !== req.user!.id && req.user!.role !== 'admin')) throw ApiError.notFound('Application');
  sendSuccess(res, app);
}

/** Public tracking with reference + passport number (no login needed). */
export async function track(req: Request, res: Response) {
  const reference = str(req.query.reference)?.toUpperCase();
  const passport = str(req.query.passport)?.toUpperCase();
  if (!reference || !passport) throw ApiError.badRequest('Reference and passport number are required');
  const app = await VisaApplication.findOne({ reference, 'applicant.passportNumber': passport }).select(
    'reference countryName visaType status statusHistory travelDate createdAt paymentStatus',
  );
  if (!app) throw ApiError.notFound('Application');
  sendSuccess(res, app);
}

/** Streams a private document to its owner or an admin. Files are never publicly served. */
export async function downloadDocument(req: Request, res: Response) {
  const app = await VisaApplication.findById(req.params.id);
  if (!app || (String(app.user) !== req.user!.id && req.user!.role !== 'admin')) throw ApiError.notFound('Application');
  const doc = app.documents.find((d) => String(d._id) === req.params.docId);
  if (!doc?.storedName) throw ApiError.notFound('Document');
  const filePath = path.join(PRIVATE_UPLOADS, path.basename(doc.storedName));
  if (!fs.existsSync(filePath)) throw ApiError.notFound('Document file');
  res.setHeader('Content-Type', doc.mimeType ?? 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalName ?? 'document')}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  fs.createReadStream(filePath).pipe(res);
}

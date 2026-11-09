import type { Request, Response } from 'express';
import type { Model, PopulateOptions, SortOrder } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/helpers';
import { buildMeta, escapeRegex, getPagination, str } from '../utils/query';
import { sendSuccess } from '../utils/response';

interface CrudOptions {
  name: string;
  searchFields?: string[];
  /** Query-string keys copied directly into the Mongo filter (e.g. ?hotel=…&published=true). */
  filterFields?: string[];
  populate?: PopulateOptions | PopulateOptions[] | string;
  sort?: Record<string, SortOrder>;
  /** Field used to auto-generate `slug` when none is provided. */
  slugFrom?: string;
}

const PROTECTED_FIELDS = ['_id', 'id', '__v', 'createdAt', 'updatedAt'];

function sanitize(body: Record<string, unknown>) {
  const clean = { ...body };
  for (const f of PROTECTED_FIELDS) delete clean[f];
  return clean;
}

function coerce(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/** Generic, reusable admin CRUD handlers for content collections. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function crudFactory(model: Model<any>, options: CrudOptions) {
  const { name, searchFields = [], filterFields = [], populate, sort = { createdAt: -1 }, slugFrom } = options;

  async function ensureSlug(data: Record<string, unknown>, excludeId?: string) {
    if (!slugFrom) return;
    if (!data.slug && typeof data[slugFrom] === 'string') data.slug = slugify(data[slugFrom] as string);
    if (typeof data.slug === 'string') {
      data.slug = slugify(data.slug);
      const clash = await model.exists({ slug: data.slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
      if (clash) data.slug = `${data.slug}-${Date.now().toString(36).slice(-4)}`;
    }
  }

  return {
    list: async (req: Request, res: Response) => {
      const { page, limit, skip } = getPagination(req, 20, 100);
      const filter: Record<string, unknown> = {};
      const q = str(req.query.q);
      if (q && searchFields.length) {
        const rx = new RegExp(escapeRegex(q), 'i');
        filter.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      for (const key of filterFields) {
        const v = str(req.query[key]);
        if (v) filter[key] = coerce(v);
      }
      let query = model.find(filter).sort(sort).skip(skip).limit(limit);
      if (populate) query = query.populate(populate as PopulateOptions);
      const [items, total] = await Promise.all([query, model.countDocuments(filter)]);
      sendSuccess(res, items, { meta: buildMeta(page, limit, total) });
    },

    get: async (req: Request, res: Response) => {
      let query = model.findById(req.params.id);
      if (populate) query = query.populate(populate as PopulateOptions);
      const item = await query;
      if (!item) throw ApiError.notFound(name);
      sendSuccess(res, item);
    },

    create: async (req: Request, res: Response) => {
      const data = sanitize(req.body ?? {});
      await ensureSlug(data);
      const item = await model.create(data);
      sendSuccess(res, item, { message: `${name} created`, status: 201 });
    },

    update: async (req: Request, res: Response) => {
      const data = sanitize(req.body ?? {});
      await ensureSlug(data, String(req.params.id));
      const item = await model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
      if (!item) throw ApiError.notFound(name);
      sendSuccess(res, item, { message: `${name} updated` });
    },

    remove: async (req: Request, res: Response) => {
      const item = await model.findByIdAndDelete(req.params.id);
      if (!item) throw ApiError.notFound(name);
      sendSuccess(res, null, { message: `${name} deleted` });
    },
  };
}

import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Centralised success envelope: { success, message, data, meta? } */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { message?: string; status?: number; meta?: PaginationMeta | Record<string, unknown> } = {},
) {
  const { message = 'OK', status = 200, meta } = options;
  return res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
}

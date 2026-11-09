import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { isProd } from '../config/env';
import { ApiError } from '../utils/ApiError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    error = ApiError.unprocessable('Validation failed', details);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = ApiError.unprocessable('Validation failed', details);
  } else if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid value for ${err.path}`);
  } else if (typeof err === 'object' && err && (err as { code?: number }).code === 11000) {
    const keys = Object.keys((err as { keyValue?: object }).keyValue ?? {}).join(', ');
    error = ApiError.conflict(`A record with this ${keys || 'value'} already exists`);
  } else if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message);
  } else if (err instanceof SyntaxError && 'body' in (err as object)) {
    error = ApiError.badRequest('Malformed JSON body');
  } else {
    console.error('Unhandled error:', err);
    error = new ApiError(500, 'Something went wrong on our side', 'INTERNAL_ERROR');
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: {
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
      ...(!isProd && error.statusCode === 500 && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
}

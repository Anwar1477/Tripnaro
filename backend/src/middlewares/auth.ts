import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';

interface TokenPayload {
  sub: string;
  role: UserRole;
  iat: number;
}

function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.[env.COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

async function resolveUser(req: Request): Promise<void> {
  const token = extractToken(req);
  if (!token) return;

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub).select('name email role isActive passwordChangedAt');
  if (!user || !user.isActive) throw ApiError.unauthorized('Account not found or disabled');

  // Invalidate tokens issued before the last password change.
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    throw ApiError.unauthorized('Password was changed. Please sign in again.');
  }

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
}

/** Requires a valid session. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    await resolveUser(req);
    if (!req.user) throw ApiError.unauthorized();
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches the user when a valid session exists, but never blocks the request. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    await resolveUser(req);
  } catch {
    /* anonymous */
  }
  next();
}

/** Role-based access control. Use after `authenticate`. */
export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

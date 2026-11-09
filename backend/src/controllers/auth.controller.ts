import type { CookieOptions, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env, isProd } from '../config/env';
import { User, type UserDocument } from '../models/User';
import { emailService, emailTemplates } from '../services/email.service';
import { ApiError } from '../utils/ApiError';
import { randomToken, sha256 } from '../utils/helpers';
import { sendSuccess } from '../utils/response';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

function issueSession(res: Response, user: UserDocument) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
  return token;
}

export async function register(req: Request, res: Response) {
  const { name, email, phone, password } = req.body;
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const user = await User.create({ name, email, phone: phone || undefined, password });
  issueSession(res, user);
  void emailService.send({ to: user.email, ...emailTemplates.welcome(user.name) });
  sendSuccess(res, { user }, { message: 'Account created', status: 201 });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password to avoid account enumeration.
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Incorrect email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled. Contact support.');
  user.lastLoginAt = new Date();
  await user.save();
  issueSession(res, user);
  sendSuccess(res, { user }, { message: 'Signed in' });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  sendSuccess(res, null, { message: 'Signed out' });
}

export async function me(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthorized();
  sendSuccess(res, { user });
}

export async function forgotPassword(req: Request, res: Response) {
  const user = await User.findOne({ email: req.body.email, isActive: true });
  let devResetUrl: string | undefined;
  if (user) {
    const token = randomToken(32);
    user.passwordResetToken = sha256(token); // store only the hash
    user.passwordResetExpires = new Date(Date.now() + 30 * 60_000);
    await user.save({ validateBeforeSave: false });
    const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.send({ to: user.email, ...emailTemplates.passwordReset(user.name, url) });
    // Local development without SMTP: expose the link so the flow can be completed.
    if (!isProd && emailService.mode === 'console') devResetUrl = url;
  }
  // Always respond the same way so the endpoint cannot be used to discover accounts.
  sendSuccess(res, devResetUrl ? { devResetUrl } : null, {
    message: 'If an account exists for this email, a reset link has been sent.',
  });
}

export async function resetPassword(req: Request, res: Response) {
  const user = await User.findOne({
    passwordResetToken: sha256(req.body.token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired');
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  issueSession(res, user);
  sendSuccess(res, { user }, { message: 'Password updated' });
}

export async function changePassword(req: Request, res: Response) {
  const user = await User.findById(req.user!.id).select('+password');
  if (!user || !(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  issueSession(res, user); // re-issue so the current session survives the token invalidation
  sendSuccess(res, null, { message: 'Password changed' });
}

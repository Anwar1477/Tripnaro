import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { PUBLIC_UPLOADS } from './middlewares/upload';
import apiRoutes from './routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' })); // payment gateway form posts
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));

  app.use('/api', rateLimit({ windowMs: 60_000, limit: isProd ? 300 : 3000, standardHeaders: true, legacyHeaders: false }));

  // Only admin-uploaded public images are served statically. Visa documents live in uploads/private.
  app.use('/uploads', express.static(PUBLIC_UPLOADS, { maxAge: '7d', index: false }));

  app.get('/health', (_req, res) => {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] ?? 'unknown';
    res.status(dbState === 'connected' ? 200 : 503).json({ status: 'ok', db: dbState, uptime: process.uptime() });
  });

  app.use('/api/v1', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

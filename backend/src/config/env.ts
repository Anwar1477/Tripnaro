import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true } as dotenv.DotenvConfigOptions);

const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : v === 'true'));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:5000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('tripnaro_token'),
  /** Max sign-in / register / reset attempts per IP per 15 minutes. */
  AUTH_RATE_LIMIT: z.coerce.number().int().min(1).default(30),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@tripnaro.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().default('Tripnaro <no-reply@tripnaro.com>'),
  PAYMENT_DEMO_ENABLED: bool(true),
  SSLCOMMERZ_STORE_ID: z.string().optional().default(''),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional().default(''),
  SSLCOMMERZ_SANDBOX: bool(true),
  BKASH_APP_KEY: z.string().optional().default(''),
  BKASH_APP_SECRET: z.string().optional().default(''),
  BKASH_USERNAME: z.string().optional().default(''),
  BKASH_PASSWORD: z.string().optional().default(''),
  BKASH_SANDBOX: bool(true),
  NAGAD_MERCHANT_ID: z.string().optional().default(''),
  NAGAD_MERCHANT_PRIVATE_KEY: z.string().optional().default(''),
  NAGAD_PG_PUBLIC_KEY: z.string().optional().default(''),
  NAGAD_SANDBOX: bool(true),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  FLIGHT_PROVIDER: z.enum(['demo', 'amadeus']).default('demo'),
  AMADEUS_CLIENT_ID: z.string().optional().default(''),
  AMADEUS_CLIENT_SECRET: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

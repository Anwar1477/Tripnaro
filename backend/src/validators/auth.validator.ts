import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,16}$/, 'Enter a valid phone number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: phone.optional().or(z.literal('')),
  password,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional().or(z.literal('')),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  nationality: z.string().trim().max(60).optional(),
  address: z.string().trim().max(250).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const notificationPrefsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  promotions: z.boolean(),
  bookingUpdates: z.boolean(),
});

export const travelerSchema = z.object({
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Mstr', 'Miss']).optional(),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  type: z.enum(['adult', 'child', 'infant']).default('adult'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().trim().max(60).optional(),
  passportNumber: z.string().trim().max(20).optional(),
  passportExpiry: z.coerce.date().optional(),
});

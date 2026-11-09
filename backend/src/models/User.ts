import bcrypt from 'bcryptjs';
import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface ISavedTraveler {
  _id?: unknown;
  title?: 'Mr' | 'Ms' | 'Mrs' | 'Mstr' | 'Miss';
  firstName: string;
  lastName: string;
  type: 'adult' | 'child' | 'infant';
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: Date;
}

export interface IUser {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  address?: string;
  savedTravelers: ISavedTraveler[];
  notificationPrefs: { email: boolean; sms: boolean; promotions: boolean; bookingUpdates: boolean };
  isActive: boolean;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
}

interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

const savedTravelerSchema = new Schema<ISavedTraveler>({
  title: { type: String, enum: ['Mr', 'Ms', 'Mrs', 'Mstr', 'Miss'] },
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  type: { type: String, enum: ['adult', 'child', 'infant'], default: 'adult' },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,
  nationality: { type: String, trim: true },
  passportNumber: { type: String, trim: true, uppercase: true },
  passportExpiry: Date,
});

const userSchema = new Schema<IUser, Model<IUser, object, IUserMethods>, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    avatar: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    nationality: { type: String, trim: true },
    address: { type: String, trim: true, maxlength: 250 },
    savedTravelers: { type: [savedTravelerSchema], default: [] },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      promotions: { type: Boolean, default: true },
      bookingUpdates: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ name: 'text', email: 'text' });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser, Model<IUser, object, IUserMethods>>('User', userSchema);

import { Schema, model } from 'mongoose';

/* ─────────────── Review ─────────────── */
const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { type: String, enum: ['hotel', 'tour'], required: true },
    target: { type: Schema.Types.ObjectId, required: true, refPath: 'targetModel' },
    targetModel: { type: String, enum: ['Hotel', 'Tour'], required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    tripType: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true },
);
reviewSchema.index({ target: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, target: 1 }, { unique: true });
export const Review = model('Review', reviewSchema);

/* ─────────────── Wishlist ─────────────── */
const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    itemType: { type: String, enum: ['hotel', 'tour'], required: true },
    item: { type: Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
    itemModel: { type: String, enum: ['Hotel', 'Tour'], required: true },
  },
  { timestamps: true },
);
wishlistSchema.index({ user: 1, item: 1 }, { unique: true });
export const Wishlist = model('Wishlist', wishlistSchema);

/* ─────────────── Coupon ─────────────── */
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    description: String,
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: Number,
    minAmount: { type: Number, default: 0 },
    appliesTo: { type: [String], default: ['flight', 'hotel', 'tour', 'bus'] },
    paymentChannel: String, // optional, e.g. bkash
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    showOnHome: { type: Boolean, default: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
export const Coupon = model('Coupon', couponSchema);

/* ─────────────── Notification ─────────────── */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['booking', 'payment', 'visa', 'promo', 'system'], default: 'system' },
    link: String,
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);
export const Notification = model('Notification', notificationSchema);

/* ─────────────── Newsletter ─────────────── */
const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
    source: { type: String, default: 'website' },
  },
  { timestamps: true },
);
export const Newsletter = model('Newsletter', newsletterSchema);

/* ─────────────── Promotional banner ─────────────── */
const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: String,
    image: { type: String, required: true },
    link: { type: String, default: '/' },
    ctaLabel: { type: String, default: 'Explore' },
    placement: { type: String, enum: ['home-hero', 'home-promo', 'home-strip'], default: 'home-promo' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Banner = model('Banner', bannerSchema);

/* ─────────────── Site settings (single document) ─────────────── */
const settingSchema = new Schema(
  {
    key: { type: String, default: 'site', unique: true },
    siteName: { type: String, default: 'Tripnaro' },
    tagline: { type: String, default: 'Travel, beautifully planned.' },
    supportEmail: { type: String, default: 'support@tripnaro.com' },
    supportPhone: { type: String, default: '+880 9612-345678' },
    address: { type: String, default: 'House 42, Road 11, Banani, Dhaka 1213, Bangladesh' },
    currency: { type: String, default: 'BDT' },
    serviceFeePercent: { type: Number, default: 2 },
    noticeBar: { text: String, link: String, active: { type: Boolean, default: false } },
    social: { facebook: String, instagram: String, youtube: String, linkedin: String },
    features: {
      flights: { type: Boolean, default: true },
      hotels: { type: Boolean, default: true },
      tours: { type: Boolean, default: true },
      buses: { type: Boolean, default: true },
      visa: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);
export const Setting = model('Setting', settingSchema);

/* ─────────────── Custom tour request ─────────────── */
const tourRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    destination: { type: String, required: true },
    travelDate: Date,
    durationDays: Number,
    travelers: Number,
    budget: Number,
    message: String,
    status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' },
  },
  { timestamps: true },
);
export const TourRequest = model('TourRequest', tourRequestSchema);

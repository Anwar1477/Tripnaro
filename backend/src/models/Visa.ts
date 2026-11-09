import { Schema, model, type InferSchemaType } from 'mongoose';

/** Visa service offered for a destination country. */
const visaCountrySchema = new Schema(
  {
    country: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    flag: String, // emoji or image url
    image: String,
    region: String,
    description: { type: String, default: '' },
    visaTypes: {
      type: [
        {
          name: { type: String, required: true }, // Tourist, Business, Transit…
          entry: { type: String, default: 'Single' },
          validityDays: Number,
          maxStayDays: Number,
          processingDays: { type: String, default: '7-10 working days' },
          fee: { type: Number, required: true }, // government + service fee
          serviceFee: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    requirements: { type: [String], default: [] },
    documents: { type: [String], default: [] },
    notes: { type: [String], default: [] },
    published: { type: Boolean, default: true, index: true },
    popular: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const VISA_STATUSES = [
  'submitted',
  'under_review',
  'documents_required',
  'processing',
  'approved',
  'rejected',
] as const;

const visaApplicationSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    country: { type: Schema.Types.ObjectId, ref: 'VisaCountry', required: true },
    countryName: String,
    visaType: { type: String, required: true },
    fee: { type: Number, required: true },
    applicant: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      dateOfBirth: Date,
      nationality: String,
      passportNumber: { type: String, required: true, uppercase: true },
      passportExpiry: Date,
      occupation: String,
      address: String,
    },
    travelDate: { type: Date, required: true },
    returnDate: Date,
    purpose: String,
    documents: {
      type: [
        {
          label: String,
          originalName: String,
          storedName: String, // private storage, never exposed directly
          mimeType: String,
          size: Number,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    status: { type: String, enum: VISA_STATUSES, default: 'submitted', index: true },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
    statusHistory: {
      type: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
    adminNotes: String,
  },
  { timestamps: true },
);

export type VisaCountryType = InferSchemaType<typeof visaCountrySchema>;
export const VisaCountry = model('VisaCountry', visaCountrySchema);
export const VisaApplication = model('VisaApplication', visaApplicationSchema);

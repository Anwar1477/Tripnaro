import multer from 'multer';
import { ApiError } from '../utils/ApiError';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf'];

/**
 * Files are parsed into memory and then written by services/storage.service.ts (local disk in
 * development, Vercel Blob in production). Vercel caps a function request body at 4.5 MB, so the
 * client keeps each request's total below that on Vercel; the per-file limit below still applies.
 */
function createUploader(allowed: string[], maxFiles: number) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (allowed.includes(file.mimetype)) return cb(null, true);
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    },
  });
}

/** Public images (admin-managed content: hotels, tours, banners). */
export const imageUpload = createUploader(IMAGE_TYPES, 10);

/** Private documents (visa passports, photos). Served only through authorised routes. */
export const documentUpload = createUploader(DOCUMENT_TYPES, 8);

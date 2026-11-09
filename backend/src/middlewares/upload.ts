import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomToken } from '../utils/helpers';
import { ApiError } from '../utils/ApiError';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
export const PUBLIC_UPLOADS = path.join(UPLOAD_ROOT, 'public');
export const PRIVATE_UPLOADS = path.join(UPLOAD_ROOT, 'private');
for (const dir of [PUBLIC_UPLOADS, PRIVATE_UPLOADS]) fs.mkdirSync(dir, { recursive: true });

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const DOCUMENT_TYPES: Record<string, string> = { ...IMAGE_TYPES, 'application/pdf': '.pdf' };

function createUploader(destination: string, allowed: Record<string, string>, maxFiles: number) {
  return multer({
    storage: multer.diskStorage({
      destination,
      // Never trust the client filename: generate a random name with an extension derived from MIME.
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomToken(12)}${allowed[file.mimetype]}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (_req, file, cb) => {
      if (allowed[file.mimetype]) return cb(null, true);
      cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    },
  });
}

/** Public images (admin-managed content: hotels, tours, banners). */
export const imageUpload = createUploader(PUBLIC_UPLOADS, IMAGE_TYPES, 10);

/** Private documents (visa passports, photos). Served only through authorised routes. */
export const documentUpload = createUploader(PRIVATE_UPLOADS, DOCUMENT_TYPES, 8);

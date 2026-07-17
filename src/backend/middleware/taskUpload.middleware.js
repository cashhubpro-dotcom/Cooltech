/**
 * uploadMiddleware.js
 * Place at: src/backend/middleware/uploadMiddleware.js
 *
 * Local-disk file storage for task attachments using multer.
 * Files are saved to: src/backend/uploads/tasks/
 * Served publicly at: /uploads/tasks/<filename>  (make sure server.js has
 * `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`
 * — see the note at the bottom of this file if you don't have that yet.
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);

// uploads/tasks lives at src/backend/uploads/tasks
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'tasks');

// Ensure the folder exists on boot
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ── Storage engine ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // collision-proof name on disk, original name is preserved separately
    // in the attachment document (fileName field) for display purposes
    const ext        = path.extname(file.originalname);
    const storedName = `${randomUUID()}${ext}`;
    cb(null, storedName);
  },
});

// ── Allowed types — images, videos, common documents ───────────────────────────
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
};

export const taskUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
});

// ── Helper: classify mimetype into 'image' | 'video' | 'document' ──────────────
export const classifyKind = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
};
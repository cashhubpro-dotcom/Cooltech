import express   from 'express';
import multer    from 'multer';
import path      from 'path';
import fs        from 'fs';
import { protect } from '../middleware/auth.js';
 
const router  = express.Router();
 
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
 
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
 
const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    // FIX: added application/pdf so expense receipts (which allow PDF on the
    // frontend) don't get silently rejected by this shared upload endpoint.
    const ok = /image\/(jpeg|png|gif|webp)|video\/mp4|application\/pdf/.test(file.mimetype);
    cb(ok ? null : new Error('Only images, MP4 videos, or PDFs are allowed'), ok);
  },
});
 
// POST /api/upload
router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  // Return a public URL — adjust base URL for production
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});
 
export default router;
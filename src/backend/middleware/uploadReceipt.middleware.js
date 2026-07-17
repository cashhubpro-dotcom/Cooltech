// middleware/uploadReceipt.middleware.js
// Handles expense receipt uploads — saves to public/uploads/receipts/
// Same pattern as upload.middleware.js (avatars), but also allows PDF
// since receipts are often scanned/photographed bills or PDF invoices.
import multer from 'multer';
import path   from 'path';
import fs     from 'fs';

const RECEIPT_DIR = path.join(process.cwd(), 'public', 'uploads', 'receipts');

if (!fs.existsSync(RECEIPT_DIR)) fs.mkdirSync(RECEIPT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RECEIPT_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // req.technician is set by the technicianOnly middleware, which must
    // run BEFORE this one in the route's middleware chain.
    const techId = req.technician?._id || 'unknown';
    cb(null, `receipt-${techId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (ALLOWED.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and PDF files are allowed.'), false);
};

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
}).single('receipt');

export const handleReceiptUpload = (req, res, next) => {
  uploadReceipt(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};
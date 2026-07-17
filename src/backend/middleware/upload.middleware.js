// middleware/upload.middleware.js
// Handles avatar image uploads — saves to public/uploads/avatars/
import multer   from 'multer';
import path     from 'path';
import fs       from 'fs';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

// Create directory if it doesn't exist
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `avatar-${req.user._id}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (ALLOWED.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG, and WEBP images are allowed.'), false);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
}).single('avatar');

// Wrapper to handle multer errors cleanly
export const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};
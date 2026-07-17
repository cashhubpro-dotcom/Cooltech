import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import Announcement from '../models/Announcement.js';

const router = express.Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Admin: list all announcements (including inactive) ─────────────────────
// GET /api/announcements
router.get('/', protect, adminOnly, wrap(async (req, res) => {
  const items = await Announcement.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  res.json({ success: true, data: items });
}));

// ── Admin: create ────────────────────────────────────────────────────────────
// POST /api/announcements
router.post('/', protect, adminOnly, wrap(async (req, res) => {
  const { title, message, icon, audience, isActive } = req.body;
  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Title and message are required' });
  }
  const item = await Announcement.create({
    title: title.trim(),
    message: message.trim(),
    icon: icon || undefined,
    audience: audience || undefined,
    isActive: isActive ?? true,
    postedBy: req.user._id,
  });
  res.status(201).json({ success: true, data: item });
}));

// ── Admin: update (e.g. toggle isActive, edit text) ─────────────────────────
// PATCH /api/announcements/:id
router.patch('/:id', protect, adminOnly, wrap(async (req, res) => {
  const { title, message, icon, audience, isActive } = req.body;
  const item = await Announcement.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    { $set: {
      ...(title !== undefined && { title: title.trim() }),
      ...(message !== undefined && { message: message.trim() }),
      ...(icon !== undefined && { icon }),
      ...(audience !== undefined && { audience }),
      ...(isActive !== undefined && { isActive }),
    } },
    { new: true }
  );
  if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
  res.json({ success: true, data: item });
}));

// ── Admin: soft delete ───────────────────────────────────────────────────────
// DELETE /api/announcements/:id
router.delete('/:id', protect, adminOnly, wrap(async (req, res) => {
  const item = await Announcement.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { isDeleted: true, deletedAt: new Date(), isActive: false } },
    { new: true }
  );
  if (!item) return res.status(404).json({ success: false, message: 'Announcement not found' });
  res.json({ success: true, data: item });
}));

export default router;

// ── Mounting instructions ────────────────────────────────────────────────────
// In your main server file (e.g. server.js / app.js), alongside your other
// route mounts:
//
//   import announcementRoutes from './routes/announcementRoutes.js';
//   app.use('/api/announcements', announcementRoutes);
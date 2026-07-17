// controllers/profile.controller.js
import User from '../models/User.js';
import Job  from '../models/Job.js';
import fs   from 'fs';
import path from 'path';

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // ── Quick stats: live from Job collection ────────────────────────────────
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [todayJobs, completedJobs] = await Promise.all([
      Job.countDocuments({ isDeleted: false, scheduledDate: { $gte: todayStart, $lte: todayEnd } }),
      Job.countDocuments({ isDeleted: false, status: 'completed' }),
    ]);

    res.json({
      ...user.toJSON(),
      stats: { todayJobs, completedJobs },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const EDITABLE = ['name', 'email', 'phone', 'location', 'bio'];
    EDITABLE.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    await user.save();
    await user.logActivity('Updated profile information', '#8B5CF6');

    res.json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email already in use.' });
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────
// Accepts: multipart/form-data with field "avatar" (image file)
// OR:      application/json with { avatar: "data:image/jpeg;base64,..." }
export const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // ── Option A: file uploaded via multer (req.file) ────────────────────────
    if (req.file) {
      // Delete old avatar file if it exists and is a local path
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldPath = path.join(process.cwd(), 'public', user.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      // Store the public URL path
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    // ── Option B: base64 string sent in JSON body ────────────────────────────
    else if (req.body.avatar && req.body.avatar.startsWith('data:image')) {
      user.avatar = req.body.avatar; // store as base64 data URL
    } else {
      return res.status(400).json({ message: 'No image provided.' });
    }

    await user.save();
    await user.logActivity('Updated profile photo', '#3B82F6');

    res.json({ message: 'Avatar updated.', avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/profile/activity ────────────────────────────────────────────────
export const getActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('recentActivity');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.recentActivity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/profile/activity ───────────────────────────────────────────────
export const addActivity = async (req, res) => {
  try {
    const { action, dot } = req.body;
    if (!action) return res.status(400).json({ message: 'action is required.' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await user.logActivity(action, dot || '#EA580C');
    res.status(201).json({ message: 'Activity logged.', recentActivity: user.recentActivity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── Utility: call this from other controllers ────────────────────────────────
export const logActivityForUser = async (userId, action, dot = '#EA580C') => {
  try {
    const user = await User.findById(userId);
    if (user) await user.logActivity(action, dot);
  } catch (err) {
    console.error('logActivityForUser error:', err);
  }
};

// ─── DELETE /api/profile/avatar ───────────────────────────────────────────────
// Removes avatar → frontend falls back to initials
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Delete the file from disk if it's a local upload
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const filePath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    user.avatar = '';
    await user.save();
    await user.logActivity('Removed profile photo', '#94a3b8');

    res.json({ message: 'Avatar removed.', avatar: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};
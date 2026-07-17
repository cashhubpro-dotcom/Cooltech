// routes/profile.routes.js
import express from 'express';
import { protect } from '../middleware/auth.js';               // your existing middleware
import { handleAvatarUpload } from '../middleware/upload.middleware.js';
import {
  getProfile, updateProfile,
  uploadAvatar, removeAvatar,
  getActivity, addActivity,
} from '../controllers/profile.controller.js';

const router = express.Router();
router.use(protect);

router.get('/',            getProfile);                        // GET  /api/profile
router.put('/',            updateProfile);                     // PUT  /api/profile
router.post('/avatar',     handleAvatarUpload, uploadAvatar);  // POST /api/profile/avatar
router.delete('/avatar',   removeAvatar);                      // DELETE /api/profile/avatar  ← NEW
router.get('/activity',    getActivity);                       // GET  /api/profile/activity
router.post('/activity',   addActivity);                       // POST /api/profile/activity

export default router;
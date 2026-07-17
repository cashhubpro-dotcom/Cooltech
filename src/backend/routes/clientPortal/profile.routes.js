import express from 'express';
import { protect, clientOnly } from '../../middleware/auth.js';
import {
  getProfile, getProfileSummary, updateProfile,
  changePassword, getNotificationPrefs, updateNotificationPrefs,
} from '../../controllers/clientPortal/profile.controller.js';

const router = express.Router();

router.use(protect, clientOnly);

router.get('/', getProfile);
router.get('/summary', getProfileSummary);
router.patch('/', updateProfile);
router.patch('/password', changePassword);
router.get('/notification-prefs', getNotificationPrefs);
router.patch('/notification-prefs', updateNotificationPrefs);

export default router;
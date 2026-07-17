// routes/accountSettings.routes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  changePassword,
  getNotifications, updateNotifications,
  getPreferences,   updatePreferences,
  getSecurityInfo,  toggle2FA,
  revokeSession,    revokeAllSessions,
  deleteAccount,
} from '../controllers/accountSettings.controller.js';

const router = express.Router();
router.use(protect); // all routes require login

// ── Password tab ─────────────────────────────────────────────────────────────
router.put('/password', changePassword);

// ── Notifications tab ─────────────────────────────────────────────────────────
router.get('/notifications', getNotifications);
router.put('/notifications', updateNotifications);

// ── Appearance tab ────────────────────────────────────────────────────────────
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// ── Security tab ──────────────────────────────────────────────────────────────
router.get('/security',                      getSecurityInfo);
router.put('/security/2fa',                  toggle2FA);
router.delete('/security/sessions/:sessionId', revokeSession);
router.delete('/security/sessions',            revokeAllSessions);

// ── Danger zone ───────────────────────────────────────────────────────────────
router.delete('/account', deleteAccount);

export default router;
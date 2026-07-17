import express from 'express';
import { protect, technicianOnly } from '../middleware/auth.js'; // same middleware your jobs router uses — technicianOnly already resolves req.technician
import {
  clockIn, breakStart, breakEnd, clockOut,
  getMyActiveSession, getMySessions, getMyReports, getMyMonthSummary,
  requestCorrection, getMyCorrectionRequests, getMySettings,
} from '../controllers/technicianAttendanceController.js';

// Mounted in server.js as:
//   app.use('/api/technician-portal/me/attendance', technicianAttendanceRoutes);
// — the same '/api/technician-portal/me' base your jobs/inventory/schedule
// routes already use (per the comments in technicianPortal.routes.js), just
// one level deeper under '/attendance'. Paths below are relative to that
// mount, so no '/me' prefix here — the mount point already supplies it.

const router = express.Router();

// Applies to every route below. protect verifies the JWT → req.user;
// technicianOnly checks role === 'technician' and attaches req.technician
// (the linked Technician doc) — identical guarantee the jobs router relies
// on for `req.technician._id` everywhere.
router.use('/', protect, technicianOnly);

// ─── Clock actions ────────────────────────────────────────────────────────────
// POST /api/technician-portal/me/attendance/clock-in
router.post('/clock-in',    clockIn);
router.post('/break-start', breakStart);
router.post('/break-end',   breakEnd);
router.post('/clock-out',   clockOut);

// ─── Read-only views ───────────────────────────────────────────────────────────
// GET /api/technician-portal/me/attendance/session
router.get('/session',  getMyActiveSession);
router.get('/sessions', getMySessions);
router.get('/reports',  getMyReports);
router.get('/summary',  getMyMonthSummary);
router.get('/settings', getMySettings);

// ─── Correction requests ──────────────────────────────────────────────────────
router.post('/corrections', requestCorrection);
router.get('/corrections',  getMyCorrectionRequests);

// ─── Error handler — must be LAST, same pattern as technicianPortal.routes.js ─
router.use((err, req, res, _next) => {
  console.error('[Technician Attendance Route Error]', err);
  res.status(500).json({ error: err.message || 'Server error' });
});

export default router;
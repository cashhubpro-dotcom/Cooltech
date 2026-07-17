import express from 'express';
const router = express.Router();

import { protect, adminOnly } from '../middleware/auth.js';

import {
  clockIn, breakStart, breakEnd, clockOut,
  getSessions, getActiveSession, getSessionById,
  updateSession, deleteSession,
  getDeletedSessions, restoreSession, hardDeleteSession,
  getTeamStatus, getReports,
} from '../controllers/attendanceController.js';

import {
  getSettings, updateSettings, addIP, removeIP,
} from '../controllers/clockSettingsController.js';

import {
  listCorrections, reviewCorrection,
} from '../controllers/correctionController.js'; // «NEW»

// ─── Everything below is admin-only ──────────────────────────────────────────
router.use(protect, adminOnly); // «NEW» — was completely unauthenticated before

// ─── Clock Actions ────────────────────────────────────────────────────────────
router.post('/clock-in',    clockIn);
router.post('/break-start', breakStart);
router.post('/break-end',   breakEnd);
router.post('/clock-out',   clockOut);

// ─── Static session routes FIRST (before any /:id wildcards) ─────────────────
router.get('/sessions/deleted',  getDeletedSessions);
router.get('/sessions/active',   getActiveSession);
router.get('/sessions',          getSessions);

// ─── Session :id routes — restore & hard-delete BEFORE generic /:id ──────────
router.put('/sessions/:id/restore',    restoreSession);
router.delete('/sessions/:id/hard',    hardDeleteSession);

// ─── Generic session CRUD ─────────────────────────────────────────────────────
router.get('/sessions/:id',     getSessionById);
router.put('/sessions/:id',     updateSession);
router.delete('/sessions/:id',  deleteSession);

// ─── Team & Reports ───────────────────────────────────────────────────────────
router.get('/team-status', getTeamStatus);
router.get('/reports',     getReports);

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings',              getSettings);
router.put('/settings',              updateSettings);
router.post('/settings/add-ip',      addIP);
router.delete('/settings/remove-ip', removeIP);

// ─── Correction requests raised by technicians — «NEW» ───────────────────────
router.get('/corrections',       listCorrections);   // GET   /api/attendance/corrections?status=pending
router.patch('/corrections/:id', reviewCorrection);   // PATCH /api/attendance/corrections/:id  { decision, reviewNote }

export default router;
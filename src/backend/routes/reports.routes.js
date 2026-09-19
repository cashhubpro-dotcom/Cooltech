import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getSummary, getReportData } from '../controllers/reportController.js';

const router = express.Router();

// Two-segment paths on purpose: a bare `/:type` would swallow the existing
// /reports/overview and /reports/monthly routes in extendedRoutes.js.
// Guards are per-route so unmatched paths fall through untouched.
router.get('/summary',    protect, adminOnly, getSummary);
router.get('/data/:type', protect, adminOnly, getReportData);

export default router;
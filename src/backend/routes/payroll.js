// routes/payroll.js
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  previewPayroll,
  generatePayroll,
  downloadPayslips,
  listPayrollRuns,
  markPayrollRunPaid,
  downloadSingleRun, // ← NEW
} from '../controllers/payrollController.js';

const router = express.Router();

// NOTE: these three were already unauthenticated (commented-out `protect`)
// before I touched this file — leaving them as-is rather than silently
// changing auth on routes that might already be in use unauthenticated by
// something I can't see. Worth revisiting, but not bundling into this change.
router.post('/preview', /* protect, */ previewPayroll);
router.post('/generate', /* protect, */ generatePayroll);
router.post('/payslips', /* protect, */ downloadPayslips);

// ── NEW — admin Salary page ─────────────────────────────────────────────────
// These ARE protected: unlike the above, they're brand new and mutate/expose
// payroll data directly by period across every technician, so there's no
// existing behavior to preserve by leaving them open.
router.get('/runs', protect, adminOnly, listPayrollRuns);
router.patch('/runs/:id/pay', protect, adminOnly, markPayrollRunPaid);
router.get('/runs/:id/download', protect, adminOnly, downloadSingleRun);

export default router;
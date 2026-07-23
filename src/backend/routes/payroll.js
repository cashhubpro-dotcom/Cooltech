// routes/payroll.js
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  previewPayroll,
  generatePayroll,
  downloadPayslips,
  downloadPayslipsExcel, // ← NEW
  listPayrollRuns,
  markPayrollRunPaid,
  downloadSingleRun,
} from '../controllers/payrollController.js';

const router = express.Router();

router.post('/preview', /* protect, */ previewPayroll);
router.post('/generate', /* protect, */ generatePayroll);
router.post('/payslips', /* protect, */ downloadPayslips);
router.post('/payslips/excel', /* protect, */ downloadPayslipsExcel); // ← NEW

router.get('/runs', protect, adminOnly, listPayrollRuns);
router.patch('/runs/:id/pay', protect, adminOnly, markPayrollRunPaid);
router.get('/runs/:id/download', protect, adminOnly, downloadSingleRun);

export default router;
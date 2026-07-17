import express from 'express';
import { protect, clientOnly } from '../middleware/auth.js';
import { listMyReports, getMyReport, downloadMyReport } from '../controllers/clientReportController.js';

const router = express.Router();

// Read-only from the client side — clients never generate or delete
// reports, only view/download ones the office or a technician produced.
router.get('/', protect, clientOnly, listMyReports);
router.get('/:id/download', protect, clientOnly, downloadMyReport);
router.get('/:id', protect, clientOnly, getMyReport);

export default router;
// routes/technicianLeaveRoutes.js
import express from 'express';
import { protect, technicianOnly } from '../middleware/auth.js';
import { wrap } from '../utils/wrap.js';
import {
  getMyLeaveBalance,
  getMyLeaves,
  getMyLeaveById,
  applyLeave,
  updateMyLeave,
  withdrawMyLeave,
} from '../controllers/technicianLeaveController.js';

const router = express.Router();

router.use('/', protect, technicianOnly); // sets req.user + req.technician

// Balance (must come before /:id so it isn't matched as an id)
router.get('/balance', wrap(getMyLeaveBalance));

// CRUD — all scoped to req.technician._id inside the controller
router.get('/', wrap(getMyLeaves));
router.get('/:id', wrap(getMyLeaveById));
router.post('/', wrap(applyLeave));
router.put('/:id', wrap(updateMyLeave));
router.delete('/:id', wrap(withdrawMyLeave));

// ── Error handler — must be LAST so it can catch anything thrown above ──────
router.use((err, req, res, _next) => {
  console.error('[Technician Leave Route Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

export default router;
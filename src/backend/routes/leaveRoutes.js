import express from 'express';
import {
  getLeaves,
  getLeaveStats,
  getLeaveById,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController.js';

const router = express.Router();

// Stats (must be before /:id so it's not caught as an id)
router.get('/stats', getLeaveStats);

// CRUD
router.get('/', getLeaves);
router.get('/:id', getLeaveById);
router.post('/', createLeave);
router.put('/:id', updateLeave);
router.delete('/:id', deleteLeave);

// Approve / Reject
router.patch('/:id/approve', approveLeave);
router.patch('/:id/reject', rejectLeave);

export default router;
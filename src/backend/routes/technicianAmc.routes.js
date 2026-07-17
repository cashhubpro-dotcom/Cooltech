import express from 'express';
import { protect, technicianOnly } from '../middleware/auth.js';
import {
  listMyAmc,
  summary,
  getMyAmcById,
  updateChecklist,
  completeVisit,
} from '../controllers/technicianAmc.controller.js';

const router = express.Router();

// Every route below only ever touches contracts where
// assignedTechnician === req.user._id — enforced inside the controller,
// not just at the route-guard level.
router.use(protect, technicianOnly);

router.get('/summary', summary);
router.get('/', listMyAmc);
router.get('/:id', getMyAmcById);
router.patch('/:id/checklist', updateChecklist);
router.patch('/:id/complete-visit', completeVisit);

export default router;
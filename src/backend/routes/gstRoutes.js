// routes/gstRoutes.js
import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deactivateCategory,
} from '../controllers/gstCategoryController.js';
import { getHistory, calculate, getTaxCollected } from '../controllers/gstHistoryController.js';
import { getReviewStatus, markReviewed } from '../controllers/gstReviewController.js';

const router = express.Router();

// Everyone hitting this router must be logged in
router.use(protect);

// Reads — any authenticated role can view current rates / audit trail
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.get('/history', getHistory);
router.post('/calculate', calculate);
router.get('/tax-collected', getTaxCollected);
router.get('/review', getReviewStatus);

// Writes — rate changes and marking the annual review are admin-only
router.post('/categories', adminOnly, createCategory);
router.patch('/categories/:id', adminOnly, updateCategory);
router.delete('/categories/:id', adminOnly, deactivateCategory);
router.post('/review', adminOnly, markReviewed);

export default router;
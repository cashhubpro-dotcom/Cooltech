import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  listSalesOrders,
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  restoreSalesOrder,
} from '../controllers/salesOrder.controller.js';

const router = express.Router();
router.use(protect);

router.get('/', listSalesOrders);
router.post('/', createSalesOrder);
router.get('/:id', getSalesOrder);
router.put('/:id', updateSalesOrder);
router.delete('/:id', deleteSalesOrder);
router.put('/:id/restore', restoreSalesOrder);

export default router;
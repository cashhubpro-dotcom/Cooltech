import express from 'express';
import { protect, clientOnly } from '../middleware/auth.js'; // confirmed path, matching clientPaymentRoutes.js
import { list, summary, get, pay, downloadPdf } from '../controllers/clientInvoiceController.js';

const router = express.Router();

// Mount at /api/client-portal/me/invoices — BEFORE app.use('/api', apiRoutes)
// and BEFORE app.use('/api/invoices', invoiceRoutes), same reasoning as the
// comment already in your server.js above the other client-portal mounts.
router.use(protect, clientOnly);

router.get('/', list);
router.get('/summary', summary);
router.get('/:id/download', downloadPdf);
router.get('/:id', get);
router.post('/:id/pay', pay);

export default router;
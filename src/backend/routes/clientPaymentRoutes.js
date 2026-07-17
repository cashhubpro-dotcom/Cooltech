import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, clientOnly } from '../middleware/auth.js'; // adjust path/filename to wherever this actually lives
import { list, summary, createOrder, verify } from '../controllers/clientPaymentController.js';

const router = express.Router();

// Mount this at /api/client-portal/me/payments in server.js/app.js, alongside
// wherever /client-portal/me/jobs and /client-portal/me/tickets are mounted.
// clientOnly already enforces req.user.role === 'client' AND req.user.customer
// being set — the controller trusts that and never re-checks it.
router.use(protect, clientOnly);

// A client hammering "create-order" is either a bug in a retry loop or
// someone probing — cap it.
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

router.get('/', list);
router.get('/summary', summary);
router.post('/:id/create-order', orderLimiter, createOrder);
router.post('/verify', verify);

export default router;
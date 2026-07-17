import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.model.js';

/**
 * POST /api/webhooks/razorpay
 *
 * WHY THIS MATTERS: controllers/clientPaymentController.js's verify() only
 * runs if the customer's browser makes it back to your app after paying.
 * If they close the tab, lose signal, or the app crashes mid-flow, that
 * endpoint never fires and the invoice stays stuck on "pending" forever.
 * The webhook fires from Razorpay's servers regardless of what the
 * customer's browser does, so it's the one path you can actually trust
 * for reconciliation. Keep verify() for instant UI feedback, but treat
 * this handler as the real source of truth.
 *
 * SETUP NOTES:
 * 1. Register this URL in Razorpay Dashboard → Settings → Webhooks,
 *    subscribed to at least: payment.captured, payment_link.paid.
 * 2. This route needs the RAW request body to check the signature, so
 *    mount it BEFORE your global express.json() body parser, e.g.:
 *
 *      app.post('/api/webhooks/razorpay', express.raw({ type: '*​/*' }), razorpayWebhook);
 *      app.use(express.json()); // everything else
 *
 * 3. RAZORPAY_WEBHOOK_SECRET is set separately from RAZORPAY_KEY_SECRET
 *    in the Razorpay dashboard when you create the webhook.
 */
export default async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw Buffer — must match exactly what Razorpay signed
    .digest('hex');

  if (signature !== expected) {
    return res.status(400).json({ message: 'Invalid webhook signature.' });
  }

  const event = JSON.parse(req.body.toString('utf8'));

  try {
    if (event.event === 'payment.captured') {
      const p = event.payload.payment.entity;
      await reconcileByOrderId(p.order_id, { paymentId: p.id, method: mapRzpMethod(p.method) });
    }

    if (event.event === 'payment_link.paid') {
      const pl = event.payload.payment_link.entity;
      const paymentEntity = event.payload.payment?.entity;
      await reconcileByPayLinkId(pl.id, { paymentId: paymentEntity?.id || pl.id, method: mapRzpMethod(paymentEntity?.method) });
    }
  } catch (err) {
    console.error('[razorpay webhook] reconciliation failed:', err);
    // Still 200 — Razorpay retries on non-2xx, but a bug in our handler
    // shouldn't cause it to hammer us. Log it and fix forward instead.
  }

  res.status(200).json({ received: true });
}

async function reconcileByOrderId(orderId, { paymentId, method }) {
  const payment = await Payment.findOne({ razorpayOrderId: orderId, isDeleted: false });
  if (!payment || payment.status === 'received') return; // idempotent — already handled by verify() or a prior webhook delivery

  payment.status = 'received';
  payment.gateway = 'Razorpay';
  payment.method = method || payment.method;
  payment.paidAt = new Date();
  payment.ref = paymentId;
  payment.razorpayPaymentId = paymentId;
  await payment.save();

  if (payment.invoiceRef) {
    await Invoice.findByIdAndUpdate(payment.invoiceRef, { paid: true, status: 'paid' });
  }
}

async function reconcileByPayLinkId(payLinkId, { paymentId, method }) {
  const payment = await Payment.findOne({ razorpayPaymentLinkId: payLinkId, isDeleted: false });
  if (!payment || payment.status === 'received') return;

  payment.status = 'received';
  payment.gateway = 'Razorpay';
  payment.method = method || payment.method;
  payment.paidAt = new Date();
  payment.ref = paymentId;
  payment.razorpayPaymentId = paymentId;
  await payment.save();

  if (payment.invoiceRef) {
    await Invoice.findByIdAndUpdate(payment.invoiceRef, { paid: true, status: 'paid' });
  }
}

function mapRzpMethod(rzpMethod) {
  const map = { upi: 'UPI', card: 'Credit Card', netbanking: 'Bank Transfer', wallet: 'UPI', emi: 'Credit Card' };
  return map[rzpMethod] || 'Razorpay';
}
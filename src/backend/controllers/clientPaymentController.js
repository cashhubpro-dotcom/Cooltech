import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.model.js';
import razorpay from '../services/razorpay.js';

/**
 * These are DELIBERATELY separate from controllers/paymentController.js's
 * createOrder/verifyPayment (used by the admin's create-order, verify,
 * payment-link routes). Those admin versions have no ownership check,
 * which is correct for admin (allowed to touch any payment) but would let
 * one client pay or verify another client's invoice if reused as-is here.
 * Don't import from paymentController.js for anything in this file.
 */

/**
 * GET /api/client-portal/me/payments
 * query: page, limit, status, method, q
 *
 * Scoped by req.user.customer — NOT req.user._id. A Customer (e.g.
 * "Sunrise Hotel") can have multiple User logins; payments belong to
 * the Customer, not to whichever staff member happens to be signed in.
 * clientOnly middleware already guarantees req.user.customer exists.
 */
export async function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const { status, method, q } = req.query;

  const filter = { client: req.user.customer, isDeleted: false };
  if (status) filter.status = status;
  if (method) filter.method = method;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape regex special chars
    filter.$or = [{ paymentId: rx }, { invoice: rx }, { ref: rx }];
  }

  const [rows, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);

  res.json({ data: rows, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
}

/**
 * GET /api/client-portal/me/payments/summary
 * Aggregated server-side so the client never has to fetch every row
 * just to compute KPI totals — this also stays correct once a client
 * has hundreds of payments and pagination kicks in on /payments.
 */
export async function summary(req, res) {
  const customerId = req.user.customer;

  const byStatus = await Payment.aggregate([
    { $match: { client: customerId, isDeleted: false } },
    { $group: { _id: '$status', total: { $sum: '$amount' } } },
  ]);

  const byMethod = await Payment.aggregate([
    { $match: { client: customerId, isDeleted: false, status: 'received' } },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);

  const totals = { received: 0, pending: 0, overdue: 0 };
  byStatus.forEach((r) => { totals[r._id] = r.total; });

  res.json({
    totals: { ...totals, total: totals.received + totals.pending + totals.overdue },
    byMethod: byMethod.map((m) => ({ method: m._id, total: m.total, count: m.count })),
  });
}

/**
 * POST /api/client-portal/me/payments/:id/create-order
 * Creates a Razorpay order for an EXISTING pending/overdue payment row
 * that belongs to this client's Customer record. The ownership check
 * (client: req.user.customer) is what stops one customer from paying
 * — or even probing the existence of — another customer's invoice by
 * guessing an id.
 */
export async function createOrder(req, res) {
  const payment = await Payment.findOne({ _id: req.params.id, client: req.user.customer, isDeleted: false });
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  if (payment.status === 'received') return res.status(409).json({ message: 'This invoice is already paid.' });

  const order = await razorpay.orders.create({
    amount: Math.round(payment.amount * 100), // paise
    currency: 'INR',
    receipt: payment.invoice,
    notes: { paymentDocId: payment._id.toString(), invoice: payment.invoice, customerId: req.user.customer.toString() },
  });

  payment.razorpayOrderId = order.id;
  await payment.save();

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentDocId: payment._id,
  });
}

/**
 * POST /api/client-portal/me/payments/verify
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDocId }
 *
 * This gives INSTANT UI feedback after checkout closes. It is NOT the
 * only source of truth — see webhooks/razorpayWebhook.js, which is what
 * actually reconciles the payment if the browser is closed mid-flow,
 * the network drops, or someone tries to call this endpoint with a
 * forged payload. Both paths converge on the same idempotent update.
 */
export async function verify(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDocId } = req.body;

  const payment = await Payment.findOne({ _id: paymentDocId, client: req.user.customer });
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment signature verification failed.' });
  }

  if (payment.status !== 'received') {
    payment.status = 'received';
    payment.method = payment.method === '—' ? 'Razorpay' : payment.method;
    payment.gateway = 'Razorpay';
    payment.paidAt = new Date();
    payment.ref = razorpay_payment_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    // Sync the linked Invoice, if this Payment was created against one
    // (via the client invoice page's "pay" endpoint, or an admin linking
    // a manual Payment to an invoice). Payments with no invoiceRef —
    // e.g. an ad-hoc payment not tied to a specific invoice — skip this.
    if (payment.invoiceRef) {
      await Invoice.findByIdAndUpdate(payment.invoiceRef, { paid: true, status: 'paid' });
    }
  }

  res.json({ ok: true, payment });
}
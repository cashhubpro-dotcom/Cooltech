import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateRef = (method) => {
  if (method === 'Cash') return 'CASH';
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const prefix = {
    UPI: 'UPI',
    'Bank Transfer': 'NEFT',
    Cheque: 'CHQ',
    'Credit Card': 'CC',
    Razorpay: 'pay_',
  }[method] || 'TXN';
  return `${prefix}${rand}`;
};

/**
 * POST /api/payments/create-order
 * Creates a Razorpay Order for direct checkout (Checkout.js widget on the frontend).
 * body: { amount, invoice, customer, paymentDocId? }
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, invoice, customer, paymentDocId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay works in paise
      currency: 'INR',
      receipt: (invoice || `receipt_${Date.now()}`).slice(0, 40),
      notes: { customer: customer || '', invoice: invoice || '' },
    });

    let doc = null;
    if (paymentDocId) {
      doc = await Payment.findByIdAndUpdate(
        paymentDocId,
        { razorpayOrderId: order.id, gateway: 'Razorpay' },
        { new: true }
      );
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentDocId: doc?._id || paymentDocId || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/payments/verify
 * Verifies the Razorpay signature after Checkout.js completes, then marks the
 * linked Payment doc as received.
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDocId? }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentDocId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay verification fields.' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Signature verification failed.' });
    }

    let doc = null;
    if (paymentDocId) {
      doc = await Payment.findByIdAndUpdate(
        paymentDocId,
        {
          status: 'received',
          method: 'Razorpay',
          gateway: 'Razorpay',
          ref: razorpay_payment_id,
          paidAt: new Date(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true }
      );
    }

    res.json({ success: true, message: 'Payment verified.', doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/payments/payment-link
 * Creates a real shareable Razorpay Payment Link (rzp.io/l/...).
 * body: { paymentDocId?, invoice, customer, amount, contact?, email? }
 */
export const createPaymentLink = async (req, res) => {
  try {
    const { paymentDocId, invoice, customer, amount, contact, email } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'A valid amount is required.' });
    }

    const link = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      accept_partial: false,
      description: `CoolTech AC Services — ${invoice || 'Payment'}`,
      customer: {
        name: customer || 'Customer',
        contact: contact || undefined,
        email: email || undefined,
      },
      notify: { sms: !!contact, email: !!email },
      reminder_enable: true,
      reference_id: invoice || undefined,
      notes: { customer: customer || '', invoice: invoice || '' },
    });

    let doc = null;
    if (paymentDocId) {
      doc = await Payment.findByIdAndUpdate(
        paymentDocId,
        {
          payLink: link.short_url,
          razorpayPaymentLinkId: link.id,
          gateway: 'Razorpay',
        },
        { new: true }
      );
    }

    res.json({ success: true, link: link.short_url, paymentLinkId: link.id, doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/payments/:id/mark-paid
 * Manual "Mark Paid" action (cash, cheque, bank transfer, etc.)
 * body: { method, ref, date, gateway }
 */
export const markPaid = async (req, res) => {
  try {
    const { method, ref, date, gateway } = req.body;
    const existing = await Payment.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Payment not found.' });

    const finalMethod = method || (existing.method && existing.method !== '—' ? existing.method : 'Cash');

    existing.status  = 'received';
    existing.method  = finalMethod;
    existing.ref     = (ref && ref.trim()) ? ref.trim() : (existing.ref !== '—' ? existing.ref : generateRef(finalMethod));
    existing.paidAt  = date ? new Date(date) : new Date();
    if (gateway !== undefined) existing.gateway = gateway;

    await existing.save();
    res.json({ success: true, doc: existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/payments/stats/summary
 * Totals grouped by status, for the KPI cards.
 */
export const getStats = async (req, res) => {
  try {
    const rows = await Payment.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const summary = { received: 0, pending: 0, overdue: 0 };
    rows.forEach((r) => { if (summary[r._id] !== undefined) summary[r._id] = r.total; });

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
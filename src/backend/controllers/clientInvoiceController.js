import Invoice from '../models/Invoice.model.js';
import Payment from '../models/Payment.js';
import razorpay from '../services/razorpay.js';
import { buildInvoicePDF } from '../utils/invoicePdf.js';

/**
 * Your Invoice.status enum has no "overdue" value — the admin's own
 * GET /api/invoices computes it dynamically (paid: false, dueDate < today).
 * These two helpers replicate that exact rule so the client portal shows
 * the same status a given invoice would show in the admin panel.
 */
function isOverdue(doc) {
  if (doc.paid || doc.status === 'paid' || doc.status === 'draft') return false;
  if (!doc.dueDate) return false;
  return doc.dueDate < new Date().toISOString().slice(0, 10); // both "YYYY-MM-DD", safe to string-compare
}

function computedStatus(doc) {
  if (doc.paid || doc.status === 'paid') return 'paid';
  if (isOverdue(doc)) return 'overdue';
  return 'pending';
}

// Drafts are unsent, admin-side working copies — a client should never see them.
const baseFilter = (req) => ({ client: req.user.customer, isDeleted: false, status: { $ne: 'draft' } });

/**
 * GET /api/client-portal/me/invoices
 * query: page, limit, status ('paid' | 'pending' | 'overdue'), q
 */
export async function list(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const { status, q } = req.query;

  const filter = baseFilter(req);
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ invoiceNo: rx }, { subject: rx }];
  }

  let docs = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

  // status has to be filtered AFTER computing it, since "paid"/"overdue"
  // aren't reliably queryable straight from the stored fields (see above).
  if (status) docs = docs.filter((d) => computedStatus(d) === status);

  const total = docs.length;
  const start = (page - 1) * limit;
  const data = docs.slice(start, start + limit).map((d) => ({ ...d, computedStatus: computedStatus(d) }));

  res.json({ success: true, total, page, totalPages: Math.max(1, Math.ceil(total / limit)), data });
}

/**
 * GET /api/client-portal/me/invoices/summary
 * KPI totals, computed server-side — mirrors the admin's stats/summary
 * shape but scoped to this client and using the same computed-status logic.
 */
export async function summary(req, res) {
  const docs = await Invoice.find(baseFilter(req)).lean();

  const totals = { total: 0, paid: 0, pending: 0, overdue: 0, gst: 0 };
  for (const d of docs) {
    totals.total += d.total || 0;
    totals.gst += d.gstAmount || 0;
    const s = computedStatus(d);
    if (s === 'paid') totals.paid += d.total || 0;
    else if (s === 'overdue') totals.overdue += d.total || 0;
    else totals.pending += d.total || 0;
  }

  res.json({ success: true, data: totals });
}

/**
 * GET /api/client-portal/me/invoices/:id
 */
export async function get(req, res) {
  const doc = await Invoice.findOne({ _id: req.params.id, client: req.user.customer, isDeleted: false }).lean();
  if (!doc) return res.status(404).json({ message: 'Invoice not found.' });
  res.json({ success: true, data: { ...doc, computedStatus: computedStatus(doc) } });
}

/**
 * GET /api/client-portal/me/invoices/:id/download — PDF copy of the invoice
 */
export async function downloadPdf(req, res) {
  try {
    const doc = await Invoice.findOne({ _id: req.params.id, client: req.user.customer, isDeleted: false }).lean();
    if (!doc) return res.status(404).json({ message: 'Invoice not found.' });

    const pdfBuffer = await buildInvoicePDF({ ...doc, computedStatus: computedStatus(doc) });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${doc.invoiceNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
}

/**
 * POST /api/client-portal/me/invoices/:id/pay
 *
 * Deliberately does NOT duplicate the Razorpay integration. It finds (or
 * creates) a Payment row linked to this invoice via invoiceRef, then
 * creates the order exactly the way clientPaymentController.createOrder
 * does. The frontend gets the same { orderId, keyId, paymentDocId, ... }
 * shape either way, opens the same Razorpay checkout, and calls the same
 * POST /client-portal/me/payments/verify afterward — one Razorpay
 * integration serving both pages, not two to keep in sync.
 */
export async function pay(req, res) {
  const invoice = await Invoice.findOne({ _id: req.params.id, client: req.user.customer, isDeleted: false });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  if (invoice.paid || invoice.status === 'paid') return res.status(409).json({ message: 'This invoice is already paid.' });

  let payment = await Payment.findOne({
    invoiceRef: invoice._id,
    client: req.user.customer,
    status: { $ne: 'received' },
    isDeleted: false,
  });

  if (!payment) {
    payment = await Payment.create({
      client: req.user.customer,
      invoiceRef: invoice._id,
      invoice: invoice.invoiceNo,
      customer: invoice.customer,
      amount: invoice.total,
      status: 'pending',
    });
  }

  const order = await razorpay.orders.create({
    amount: Math.round(payment.amount * 100), // paise
    currency: 'INR',
    receipt: payment.invoice,
    notes: {
      paymentDocId: payment._id.toString(),
      invoiceId: invoice._id.toString(),
      customerId: req.user.customer.toString(),
    },
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
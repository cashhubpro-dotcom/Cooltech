import express  from "express";
import mongoose from "mongoose";

import { protect, adminOnly, clientOnly } from '../middleware/auth.js';

import Customer          from "../models/Customer.js";
import Job                from "../models/Job.js";
import Invoice           from "../models/Invoice.model.js";
import { Ticket }        from "../models/index.js";
import { Contract, Reminder }      from "../models/hrModels.js";
import AMC               from "../models/AMC.js";
import Quotation from '../models/Quotation.js';
import Payment            from "../models/Payment.js";
import Announcement        from "../models/Announcement.js";
import { buildQuotationPDF } from '../utils/quotationPdf.js';

const router = express.Router();
const wrap   = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT SELF-SERVICE ROUTES ("/me/...")
   ═══════════════════════════════════════════════════════════════════════════
   MOVED TO THE TOP OF THE FILE — this is the actual fix for the bug above.
   Express matches routes in registration order; `/:customerId/tickets`
   below would otherwise intercept every `/me/tickets` request (both are
   POST, both match "anything/tickets"), treating "me" as a customerId and
   throwing a CastError. Registering every `/me/*` route before any
   `/:customerId`-shaped route guarantees this can never happen, no matter
   what other param routes get added here later.
   ═══════════════════════════════════════════════════════════════════════ */

router.use('/me', protect, clientOnly); // everything under /me requires a logged-in client

// ── Jobs (unchanged from your existing code — just relocated) ──────────────
router.get('/me/jobs', wrap(async (req, res) => {
  const jobs = await Job.find({ customer: req.user.customer, isDeleted: { $ne: true } })
    .populate('technician', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: jobs });
}));

router.get('/me/jobs/:jobId', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
}));

router.post('/me/jobs', wrap(async (req, res) => {
  const { type, ac, issue, scheduledDate, scheduledTime, address } = req.body;
  if (!ac?.trim() || !issue?.trim() || !scheduledDate) {
    return res.status(400).json({ success: false, message: 'AC unit, issue, and date are required' });
  }
  const customer = await Customer.findById(req.user.customer);
  const job = await Job.create({
    customer: req.user.customer,
    customerName: customer?.name,
    type: type || 'Service',
    ac: ac.trim(),
    issue: issue.trim(),
    scheduledDate,
    scheduledTime,
    address: address?.trim() || customer?.address,
    status: 'new',
  });
  res.status(201).json({ success: true, data: job });
}));

router.patch('/me/jobs/:jobId', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (job.status !== 'new') {
    return res.status(403).json({ success: false, message: 'This request can no longer be edited' });
  }
  const { type, ac, issue, scheduledDate, scheduledTime, address } = req.body;
  Object.assign(job, {
    ...(type && { type }), ...(ac && { ac }), ...(issue && { issue }),
    ...(scheduledDate && { scheduledDate }), ...(scheduledTime && { scheduledTime }),
    ...(address && { address }),
  });
  await job.save();
  res.json({ success: true, data: job });
}));

router.patch('/me/jobs/:jobId/reschedule', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (['invoiced', 'completed', 'cancelled'].includes(job.status)) {
    return res.status(403).json({ success: false, message: 'Cannot reschedule this job' });
  }
  const { requestedDate, requestedTime, reason } = req.body;
  if (!requestedDate) return res.status(400).json({ success: false, message: 'A new date is required' });
  job.rescheduleRequest = { requestedDate, requestedTime, reason, status: 'pending' };
  await job.save();
  res.json({ success: true, data: job });
}));

router.patch('/me/jobs/:jobId/cancel', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (['invoiced', 'completed', 'cancelled'].includes(job.status)) {
    return res.status(403).json({ success: false, message: 'Cannot cancel this job' });
  }
  job.status = 'cancelled';
  job.cancelledBy = 'client';
  await job.save();
  res.json({ success: true, data: job });
}));

router.patch('/me/jobs/:jobId/rating', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (!['completed', 'invoiced'].includes(job.status)) {
    return res.status(403).json({ success: false, message: 'Can only rate a completed job' });
  }
  const { rating, ratingComment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }
  job.rating = rating;
  job.ratingComment = ratingComment;
  await job.save();
  res.json({ success: true, data: job });
}));

router.get('/me/jobs/:jobId/invoice', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, customer: req.user.customer }).populate('invoice');
  if (!job || job.status !== 'invoiced' || !job.invoice) {
    return res.status(404).json({ success: false, message: 'Invoice not available' });
  }
  res.json({ success: true, data: job.invoice });
}));

// ── Tickets ──────────────────────────────────────────────────────────────────

/** POST /api/client-portal/me/tickets — unchanged from your existing code. */
router.post('/me/tickets', wrap(async (req, res) => {
  const { subject, description, priority = 'medium', category = 'query', job: jobId } = req.body;
  if (!subject?.trim()) return res.status(400).json({ success: false, message: 'Subject is required' });

  const customer = await Customer.findById(req.user.customer);
  const count = await Ticket.countDocuments();
  const ticketId = `TKT-${String(30 + count + 1).padStart(3, '0')}`;

  const ticket = await Ticket.create({
    ticketId, subject: subject.trim(), category, priority, status: 'open',
    customer: req.user.customer, customerName: customer?.name,
    contact: customer?.email || '', phone: customer?.phone || '', email: customer?.email || '',
    job: jobId || undefined,
    messages: description?.trim() ? [{ from: customer?.name, msg: description.trim(), isClient: true }] : [],
  });

  res.status(201).json({ success: true, data: ticket });
}));

/** GET /api/client-portal/me/tickets?status=open&page=1&limit=20 — NEW. */
router.get('/me/tickets', wrap(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.user.customer, isDeleted: { $ne: true } };
  if (status && status !== 'all') filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('job', 'jobId')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Ticket.countDocuments(filter),
  ]);

  res.json({ success: true, data: tickets, pagination: { page: Number(page), limit: Number(limit), total } });
}));

/** GET /api/client-portal/me/tickets/stats — NEW. Powers the KPI cards. */
router.get('/me/tickets/stats', wrap(async (req, res) => {
  const rows = await Ticket.aggregate([
    { $match: { customer: req.user.customer, isDeleted: { $ne: true } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  rows.forEach(r => { counts[r._id] = r.count; });
  res.json({ success: true, data: counts });
}));

/** GET /api/client-portal/me/tickets/:id — NEW. Ownership enforced by the query filter itself. */
router.get('/me/tickets/:id', wrap(async (req, res) => {
  const ticket = await Ticket.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  }).populate('job', 'jobId');

  // 404, not 403 — don't confirm a ticket exists to a client who doesn't own it.
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  res.json({ success: true, data: ticket });
}));

/**
 * POST /api/client-portal/me/tickets/:id/messages — NEW.
 * Mirrors your admin route's `$push` shape, but never trusts `from`/
 * `isClient` from the request body — both are set server-side so a client
 * can't post a message that looks like it came from support.
 */
router.post('/me/tickets/:id/messages', wrap(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty' });

  const ticket = await Ticket.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  if (ticket.status === 'closed') {
    return res.status(409).json({ success: false, message: 'This ticket is closed. Please raise a new ticket for further help.' });
  }

  const customer = await Customer.findById(req.user.customer);
  const updated = await Ticket.findByIdAndUpdate(
    ticket._id,
    {
      $push: { messages: { from: customer?.name, msg: text.trim(), isClient: true, time: new Date() } },
      updatedAt: new Date(),
    },
    { new: true }
  );

  res.status(201).json({ success: true, data: updated });
}));

// ── Quotations ───────────────────────────────────────────────────────────────

/** GET /api/client-portal/me/quotations?status=sent — list, drafts always hidden from clients */
router.get('/me/quotations', wrap(async (req, res) => {
  const { status } = req.query;
  const filter = { customer: req.user.customer, isDeleted: { $ne: true }, status: { $ne: 'draft' } };
  if (status && status !== 'all') filter.status = status;
  const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: quotations });
}));

/**
 * GET /api/client-portal/me/quotations/summary — KPI counts, computed server-side.
 * MUST be registered before '/me/quotations/:id' — same ordering gotcha as
 * the /me vs /:customerId issue noted at the top of this file: Express
 * would otherwise try to cast "summary" as an :id.
 */
router.get('/me/quotations/summary', wrap(async (req, res) => {
  const rows = await Quotation.aggregate([
    { $match: { customer: req.user.customer, isDeleted: { $ne: true }, status: { $ne: 'draft' } } },
    { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } },
  ]);
  const counts = { sent: 0, approved: 0, rejected: 0, expired: 0 };
  let approvedValue = 0;
  rows.forEach(r => { counts[r._id] = r.count; if (r._id === 'approved') approvedValue = r.value; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  res.json({ success: true, data: { total, ...counts, approvedValue } });
}));

/** GET /api/client-portal/me/quotations/:id/download — PDF copy of the quotation */
router.get('/me/quotations/:id/download', wrap(async (req, res) => {
  const quot = await Quotation.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  });
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });

  const pdfBuffer = await buildQuotationPDF(quot);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="quotation-${quot.quotId}.pdf"`);
  res.send(pdfBuffer);
}));

/** GET /api/client-portal/me/quotations/:id — 404 (not 403) if it's not theirs, same as tickets */
router.get('/me/quotations/:id', wrap(async (req, res) => {
  const quot = await Quotation.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  });
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quot });
}));


/** GET /api/client-portal/me/quotations/:id — 404 (not 403) if it's not theirs, same as tickets */
router.get('/me/quotations/:id', wrap(async (req, res) => {
  const quot = await Quotation.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  });
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: quot });
}));

/**
 * PATCH /api/client-portal/me/quotations/:id/status
 * Clients may ONLY move sent → approved/rejected. Everything else (draft,
 * expired, re-approving, reverting) is rejected server-side regardless of
 * what the request body claims — the whitelist lives here, not on the client.
 */
router.patch('/me/quotations/:id/status', wrap(async (req, res) => {
  const { status, reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Clients can only approve or reject a quotation' });
  }
  const quot = await Quotation.findOne({
    _id: req.params.id, customer: req.user.customer, isDeleted: { $ne: true },
  });
  if (!quot) return res.status(404).json({ success: false, message: 'Quotation not found' });
  if (quot.status !== 'sent') {
    return res.status(409).json({ success: false, message: `This quotation is already ${quot.status} and can no longer be actioned.` });
  }
  quot.status = status;
  if (status === 'rejected' && reason) quot.statusNote = reason;
  await quot.save();
  res.json({ success: true, data: quot });
}));

// ── Reminders ──────────────────────────────────────────────────────────────────

// ── Urgency is computed from dueDate, never trusted from storage ──────────────
const computeUrgency = (dueDate) => {
  const diffDays = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 14) return 'due_soon';
  return 'upcoming';
};

// GET /api/client-portal/me/reminders
router.get('/me/reminders', protect, clientOnly, wrap(async (req, res) => {
  const reminders = await Reminder.find({ customer: req.user.customer })
    .sort({ dueDate: 1 });

  const withUrgency = reminders.map(r => ({
    ...r.toObject(),
    urgency: r.status === 'done' ? null : computeUrgency(r.dueDate),
  }));

  res.json({ success: true, data: withUrgency });
}));

// PATCH /api/client-portal/me/reminders/:id/snooze
router.patch('/me/reminders/:id/snooze', protect, clientOnly, wrap(async (req, res) => {
  const { days } = req.body;
  if (!days || days <= 0) return res.status(400).json({ success: false, message: 'Invalid snooze duration' });

  const reminder = await Reminder.findOne({ _id: req.params.id, customer: req.user.customer });
  if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
  if (reminder.status === 'done') {
    return res.status(403).json({ success: false, message: 'Cannot snooze a completed reminder' });
  }

  const base = reminder.dueDate > new Date() ? reminder.dueDate : new Date();
  reminder.dueDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  reminder.status = 'snoozed';
  await reminder.save();

  res.json({ success: true, data: { ...reminder.toObject(), urgency: computeUrgency(reminder.dueDate) } });
}));

// PATCH /api/client-portal/me/reminders/:id/request-service
router.patch('/me/reminders/:id/request-service', protect, clientOnly, wrap(async (req, res) => {
  const reminder = await Reminder.findOne({ _id: req.params.id, customer: req.user.customer });
  if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
  if (reminder.status === 'done') {
    return res.status(403).json({ success: false, message: 'This reminder has already been actioned' });
  }

  const customer = await Customer.findById(req.user.customer);
  const TYPE_TO_JOB_TYPE = {
    amc_renewal: 'AMC Visit', visit: 'AMC Visit',
    follow_up: 'Service', payment: 'Service', custom: 'Service',
  };

  const job = await Job.create({
    customer: req.user.customer,
    customerName: customer?.name,
    type: TYPE_TO_JOB_TYPE[reminder.type] || 'Service',
    issue: reminder.description || reminder.title,
    address: req.body.address || customer?.address,
    scheduledDate: req.body.preferredDate || undefined,
    status: 'new',
    // sourceReminder: reminder._id,   // ← uncomment if you add the optional field above
  });

  reminder.status = 'done';
  await reminder.save();

  res.status(201).json({ success: true, data: job });
}));

// ── Dashboard Summary ────────────────────────────────────────────────────────
// GET /api/client-portal/me/dashboard-summary
// One aggregated call powering the client Dashboard — avoids many separate
// round trips on page load. Same "live aggregation, not cached" principle
// used in profile.controller.js's getProfileSummary.

const JOB_STATUS_BUCKET = {
  new: 'pending',
  assigned: 'pending',
  in_progress: 'inProgress',
  completed: 'completed',
  invoiced: 'completed',
  cancelled: 'cancelled',
};

const TREND_PERIODS = ['this_month', 'last_month', 'this_year'];

// Shared by both /me/dashboard-summary (initial load, always "this_month")
// and /me/dashboard-trend (dropdown-driven refetch for the other periods).
// Day-granularity periods return a running cumulative total per day;
// this_year returns a per-month total (not cumulative) since a running
// total across 12 months isn't a useful "trend" shape.
async function computeRequestsTrend(customerId, period) {
  const now = new Date();
  const emptyBucket = () => ({ pending: 0, inProgress: 0, completed: 0, cancelled: 0 });

  if (period === 'this_year') {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const jobs = await Job.find({
      customer: customerId, isDeleted: { $ne: true }, createdAt: { $gte: yearStart },
    }).select('status createdAt');

    const perMonth = {};
    jobs.forEach((j) => {
      const m = new Date(j.createdAt).getMonth();
      const bucket = JOB_STATUS_BUCKET[j.status];
      if (!bucket) return;
      perMonth[m] = perMonth[m] || emptyBucket();
      perMonth[m][bucket] += 1;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const series = { pending: [], inProgress: [], completed: [], cancelled: [] };
    for (let m = 0; m <= now.getMonth(); m++) {
      labels.push(monthNames[m]);
      const mc = perMonth[m] || emptyBucket();
      Object.keys(series).forEach((k) => series[k].push(mc[k]));
    }
    return { days: labels, series };
  }

  // this_month / last_month — daily buckets, cumulative running total
  const rangeStart = period === 'last_month'
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const rangeEnd = period === 'last_month'
    ? new Date(now.getFullYear(), now.getMonth(), 0) // last day of previous month
    : now;
  const totalDays = rangeEnd.getDate();

  const jobs = await Job.find({
    customer: customerId, isDeleted: { $ne: true }, createdAt: { $gte: rangeStart, $lte: rangeEnd },
  }).select('status createdAt');

  const perDay = {};
  jobs.forEach((j) => {
    const day = new Date(j.createdAt).getDate();
    const bucket = JOB_STATUS_BUCKET[j.status];
    if (!bucket) return;
    perDay[day] = perDay[day] || emptyBucket();
    perDay[day][bucket] += 1;
  });

  const labels = [];
  const series = { pending: [], inProgress: [], completed: [], cancelled: [] };
  const running = emptyBucket();
  for (let d = 1; d <= totalDays; d++) {
    labels.push(d);
    const dc = perDay[d];
    if (dc) Object.keys(running).forEach((k) => { running[k] += dc[k]; });
    Object.keys(running).forEach((k) => series[k].push(running[k]));
  }
  return { days: labels, series };
}

// ── Trend chart period switcher ──────────────────────────────────────────────
// GET /api/client-portal/me/dashboard-trend?period=this_month|last_month|this_year
// Kept separate from dashboard-summary so flipping the dropdown doesn't
// re-fetch the entire dashboard (invoices, AMC, announcements, etc.) —
// just the one chart's data.
router.get('/me/dashboard-trend', wrap(async (req, res) => {
  const period = TREND_PERIODS.includes(req.query.period) ? req.query.period : 'this_month';
  const trend = await computeRequestsTrend(req.user.customer, period);
  res.json({ success: true, data: trend });
}));

router.get('/me/dashboard-summary', wrap(async (req, res) => {
  const customerId = req.user.customer;

  const customer = await Customer.findById(customerId)
    .select('name email phone address type units amc createdAt customerId status');
  if (!customer) return res.status(404).json({ success: false, message: 'Customer record not found' });

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    openRequestsCount, recentRequests,
    invoiceAgg, invoicesDue, recentInvoices,
    openTicketsCount,
    activeAmc, activeAmcCount,
    reminders,
    allJobsForOverview,
    ratingAgg,
    paymentsThisYearAgg,
    announcements,
  ] = await Promise.all([
    Job.countDocuments({
      customer: customerId, isDeleted: { $ne: true },
      status: { $nin: ['completed', 'cancelled'] },
    }),
    // "Recent Service Requests" panel — most recently created, any status
    Job.find({ customer: customerId, isDeleted: { $ne: true } })
      .select('jobId type status issue ac createdAt updatedAt techName')
      .sort({ createdAt: -1 })
      .limit(3),

    Invoice.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          status: { $in: ['pending', 'overdue'] },
          $or: [{ customerId }, { customer: customer.name }],
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.find({
      isDeleted: { $ne: true },
      status: { $in: ['pending', 'overdue'] },
      $or: [{ customerId }, { customer: customer.name }],
    }).select('invoiceNo subject dueDate total status')
      .sort({ status: 1, dueDate: 1 })
      .limit(5),
    // "Recent Invoices" panel — most recent regardless of status
    Invoice.find({
      isDeleted: { $ne: true },
      $or: [{ customerId }, { customer: customer.name }],
    }).select('invoiceNo subject total status createdAt date')
      .sort({ createdAt: -1 })
      .limit(3),

    Ticket.countDocuments({ customer: customerId, isDeleted: { $ne: true }, status: { $ne: 'closed' } }),

    AMC.findOne({ customer: customerId, isDeleted: { $ne: true }, status: { $in: ['active', 'expiring'] } })
      .select('amcId plan units start end value visits done nextVisit status')
      .populate('assignedTechnician', 'name'),
    AMC.countDocuments({ customer: customerId, isDeleted: { $ne: true }, status: { $in: ['active', 'expiring'] } }),

    Reminder.find({ customer: customerId, status: { $ne: 'done' } })
      .select('reminderId title description dueDate type')
      .sort({ dueDate: 1 })
      .limit(3),

    // All-time job statuses → powers the "Service Requests Overview" donut
    Job.find({ customer: customerId, isDeleted: { $ne: true } }).select('status'),

    // Service rating — average + count of jobs this client has rated
    Job.aggregate([
      { $match: { customer: customerId, isDeleted: { $ne: true }, rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),

    // Total payments received this calendar year
    Payment.aggregate([
      { $match: { client: customerId, isDeleted: { $ne: true }, status: 'received', paidAt: { $gte: yearStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),

    Announcement.find({ isActive: true, isDeleted: { $ne: true }, audience: { $in: ['all', 'clients'] } })
      .sort({ createdAt: -1 })
      .limit(3),
  ]);

  // ── Donut: bucket all-time jobs into pending/inProgress/completed/cancelled ─
  const requestsOverview = { total: allJobsForOverview.length, pending: 0, inProgress: 0, completed: 0, cancelled: 0 };
  allJobsForOverview.forEach((j) => {
    const bucket = JOB_STATUS_BUCKET[j.status];
    if (bucket) requestsOverview[bucket] += 1;
  });

  // ── Trend: this month, cumulative bucket counts per day ─────────────────────
  const trend = await computeRequestsTrend(customerId, 'this_month');

  res.json({
    success: true,
    data: {
      client: {
        name: customer.name,
        contact: req.user.name,
        address: customer.address,
        units: customer.units,
        amc: customer.amc,
        memberSince: customer.createdAt,
        customerDisplayId: customer.customerId || `CUS-${customer._id.toString().slice(-4).toUpperCase()}`,
        accountStatus: customer.status || 'active',
      },
      kpis: {
        openRequests: openRequestsCount,
        pendingInvoiceTotal: invoiceAgg[0]?.total || 0,
        activeAmcCount,
        totalPaymentsThisYear: paymentsThisYearAgg[0]?.total || 0,
        serviceRating: {
          avg: ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : 0,
          count: ratingAgg[0]?.count || 0,
        },
      },
      requestsOverview,
      trend,
      recentRequests,
      invoicesDue,
      recentInvoices,
      openTickets: openTicketsCount,
      activeAmc,
      reminders,
      announcements,
    },
  });
}));

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN-FACING ROUTES ("/:customerId", ...) — now with protect + adminOnly
   ═══════════════════════════════════════════════════════════════════════ */

router.use(protect, adminOnly); // everything below requires staff/admin auth

router.get("/customers", wrap(async (req, res) => {
  const customers = await Customer.find({ isDeleted: { $ne: true } })
    .select("_id name email phone type totalJobs totalSpent units amc lastService createdAt")
    .sort({ name: 1 });
  res.json({ success: true, data: customers });
}));

router.get("/:customerId", wrap(async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.isValidObjectId(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const customerName = customer.name;
  const custObjId    = new mongoose.Types.ObjectId(customerId);

  const [jobs, invoices, tickets, contracts, amcs] = await Promise.all([
    Job.find({
      $or: [{ customer: custObjId }, { customerId: custObjId }],
      isDeleted: { $ne: true },
    }).select("jobId type ac status date tech technician scheduledDate completedDate description")
      .sort({ createdAt: -1 }).limit(20),

    Invoice.find({
      $or: [{ customer: customerName }, { customerId: custObjId }],
      isDeleted: { $ne: true },
    }).select("invoiceNo customer date dueDate total status paid subject")
      .sort({ createdAt: -1 }).limit(20),

    Ticket.find({
      $or: [{ customer: custObjId }, { customerName: customerName }],
      isDeleted: { $ne: true },
    }).select("ticketId subject status priority category createdAt updatedAt")
      .sort({ createdAt: -1 }).limit(20),

    Contract.find({
      $or: [{ customer: custObjId }, { customerName: customerName }],
      isDeleted: { $ne: true },
    }).select("contractId title type value status signed signedDate startDate endDate autoRenew")
      .sort({ createdAt: -1 }),

    AMC.find({
      $or: [{ customer: custObjId }, { customerName: customerName }],
      isDeleted: { $ne: true },
    }).select("amcId planName status amount startDate endDate units frequency nextService")
      .sort({ createdAt: -1 }),
  ]);

  const totalSpentFromInvoices = invoices
    .filter(i => i.paid || i.status === "paid")
    .reduce((sum, i) => sum + (i.total || 0), 0);

  const activeAmc = amcs.some(a => a.status === "active") ||
                    contracts.some(c => c.type === "AMC" && c.status === "active");

  const acUnits = customer.units ?? amcs.reduce((s, a) => s + (a.units || 0), 0) ?? 0;

  res.json({
    success: true,
    data: {
      customer: {
        _id:           customer._id,
        name:          customer.name,
        email:         customer.email,
        phone:         customer.phone,
        address:       customer.address,
        type:          customer.type,
        contact:       customer.name, // Customer has no separate contactPerson field
        totalJobs:     customer.totalJobs   ?? jobs.length,
        totalSpent:    customer.totalSpent  ?? totalSpentFromInvoices,
        units:         acUnits,
        amc:           customer.amc         ?? activeAmc,
        lastService:   customer.lastService ?? (jobs[0]?.date || jobs[0]?.scheduledDate || null),
        customerSince: customer.createdAt,
      },
      jobs, invoices, tickets, contracts, amcs,
      summary: {
        totalJobs:       jobs.length,
        openTickets:     tickets.filter(t => !["resolved","closed"].includes(t.status)).length,
        pendingAmount:   invoices.filter(i => !i.paid && i.status !== "paid")
                                 .reduce((s, i) => s + (i.total || 0), 0),
        activeContracts: contracts.filter(c => c.status === "active").length,
        activeAmcs:      amcs.filter(a => a.status === "active").length,
      },
    },
  });
}));

router.post("/:customerId/tickets", wrap(async (req, res) => {
  const { customerId } = req.params;
  const { subject, description, priority = "medium" } = req.body;

  if (!subject?.trim()) {
    return res.status(400).json({ success: false, message: "Subject is required" });
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found" });
  }

  const count    = await Ticket.countDocuments();
  const ticketId = `TKT-${String(30 + count + 1).padStart(3, "0")}`;

  const ticket = await Ticket.create({
    ticketId,
    subject:      subject.trim(),
    category:     "query",
    priority,
    status:       "open",
    customer:     customer._id,
    customerName: customer.name,
    contact:      customer.email || "",
    phone:        customer.phone || "",
    email:        customer.email || "",
    messages:     description?.trim()
      ? [{ from: customer.name, msg: description.trim(), isClient: true }]
      : [],
  });

  res.status(201).json({ success: true, data: ticket });
}));

router.put("/:customerId/contracts/:contractId/sign", wrap(async (req, res) => {
  const contract = await Contract.findByIdAndUpdate(
    req.params.contractId,
    { $set: { signed: true, signedDate: new Date(), status: "active" } },
    { new: true }
  );
  if (!contract) {
    return res.status(404).json({ success: false, message: "Contract not found" });
  }
  res.json({ success: true, data: contract });
}));

// Error handler moved to the very end — this is what makes it actually
// catch errors from every route above, including /me/*.
router.use((err, _req, res, _next) => {
  console.error("[ClientPortal Error]", err);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

export default router;
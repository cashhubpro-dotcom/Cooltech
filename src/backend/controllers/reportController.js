// controllers/reportController.js
import Invoice from '../models/Invoice.model.js';
import Job from '../models/Job.js';
import Customer from '../models/Customer.js';
import AMC from '../models/AMC.js';
import Quotation from '../models/Quotation.js';
import PayrollRun from '../models/Payroll.js';
import { Expense, Complaint } from '../models/index.js';
import { Attendance } from '../models/hrModels.js';

const TZ = 'Asia/Kolkata';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DONE   = ['completed', 'invoiced'];
const BILLED = ['saved', 'paid', 'pending'];      // excludes draft + credited
const live   = { isDeleted: { $ne: true } };

const monthStart = (d, offset = 0) => new Date(d.getFullYear(), d.getMonth() + offset, 1);
const round1 = (n) => Math.round(n * 10) / 10;
const pct = (cur, prev) => (prev ? round1(((cur - prev) / prev) * 100) : null);
const endOfDay = (d) => new Date(d.setHours(23, 59, 59, 999));
const ymd = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');
const count = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

// ── Summary (chart + stat cards) ─────────────────────────────────────────────
const buildRevenueTrend = async (from, months) => {
  const rows = await Invoice.aggregate([
    // -1 day buffer: server tz may differ from IST; buckets outside the window are ignored below
    { $match: { ...live, status: 'paid', createdAt: { $gte: new Date(from.getTime() - 864e5) } } },
    { $group: {
        _id: { y: { $year: { date: '$createdAt', timezone: TZ } },
               m: { $month: { date: '$createdAt', timezone: TZ } } },
        revenue: { $sum: '$total' } } },
  ]);
  const byKey = new Map(rows.map(r => [`${r._id.y}-${r._id.m}`, r.revenue]));
  return Array.from({ length: months }, (_, i) => {
    const d = monthStart(from, i);
    return { m: MONTHS[d.getMonth()], revenue: byKey.get(`${d.getFullYear()}-${d.getMonth() + 1}`) || 0 };
  });
};

const periodTotals = async (from, to) => {
  const range = { $gte: from, $lt: to };
  const [inv, jobs] = await Promise.all([
    Invoice.aggregate([
      { $match: { ...live, status: { $in: BILLED }, createdAt: range } },
      { $group: { _id: null,
          billed:    { $sum: '$total' },
          collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } } } },
    ]),
    Job.aggregate([
      { $match: { ...live, status: { $in: DONE } } },
      { $addFields: { doneAt: { $ifNull: ['$completedAt', '$updatedAt'] } } },
      { $match: { doneAt: range } },
      { $group: { _id: null, count: { $sum: 1 }, rating: { $avg: '$rating' } } },
    ]),
  ]);
  const i = inv[0] || {}, j = jobs[0] || {};
  return {
    revenue:    i.collected || 0,
    collection: i.billed ? round1((i.collected / i.billed) * 100) : 0,
    jobs:       j.count || 0,
    rating:     j.rating ? round1(j.rating) : 0,
  };
};

// GET /api/reports/summary?months=6
export const getSummary = async (req, res) => {
  try {
    const months   = Math.min(Math.max(parseInt(req.query.months, 10) || 6, 1), 24);
    const now      = new Date();
    const from     = monthStart(now, -(months - 1));
    const prevFrom = monthStart(from, -months);

    const [revenueTrend, cur, prev] = await Promise.all([
      buildRevenueTrend(from, months),
      periodTotals(from, now),
      periodTotals(prevFrom, from),
    ]);

    const top  = revenueTrend.reduce((a, b) => (!a || b.revenue > a.revenue ? b : a), null);
    const peak = top && top.revenue > 0 ? top : null;

    res.json({
      months,
      revenueTrend,
      peak,
      stats: [
        { key: 'revenue',    label: 'Total Revenue',         unit: 'currency', value: cur.revenue,    change: pct(cur.revenue, prev.revenue) },
        { key: 'jobs',       label: 'Jobs Completed',        unit: 'count',    value: cur.jobs,       change: pct(cur.jobs, prev.jobs) },
        { key: 'collection', label: 'Invoice Collection',    unit: 'percent',  value: cur.collection, change: round1(cur.collection - prev.collection) },
        { key: 'rating',     label: 'Customer Satisfaction', unit: 'rating',   value: cur.rating,     change: round1(cur.rating - prev.rating) },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load report summary.' });
  }
};

// ── Downloadable reports → { headers, rows } ─────────────────────────────────
const REPORTS = {
  revenue: async ({ from, to }) => {
    const agg = await Invoice.aggregate([
      { $match: { ...live, status: { $in: BILLED }, createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: { y: { $year: { date: '$createdAt', timezone: TZ } }, m: { $month: { date: '$createdAt', timezone: TZ } } },
          invoices: { $sum: 1 },
          invoiced:  { $sum: '$total' },
          collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } } } },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);
    return {
      headers: ['Month', 'Invoices', 'Invoiced (₹)', 'Collected (₹)', 'Outstanding (₹)'],
      rows: agg.map(r => [`${MONTHS[r._id.m - 1]} ${r._id.y}`, r.invoices, r.invoiced, r.collected, r.invoiced - r.collected]),
    };
  },

  'job-summary': async ({ from, to }) => {
    const agg = await Job.aggregate([
      { $match: { ...live, createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: '$type',
          total:     { $sum: 1 },
          completed: count({ $in: ['$status', DONE] }),
          cancelled: count({ $eq: ['$status', 'cancelled'] }),
          revenue:   { $sum: { $cond: [{ $in: ['$status', DONE] }, '$amount', 0] } } } },
      { $sort: { total: -1 } },
    ]);
    return {
      headers: ['Job Type', 'Total', 'Completed', 'Cancelled', 'Open', 'Completion %', 'Job Value (₹)'],
      rows: agg.map(r => [r._id || '-', r.total, r.completed, r.cancelled,
        r.total - r.completed - r.cancelled, round1((r.completed / r.total) * 100), r.revenue]),
    };
  },

  'technician-performance': async ({ from, to }) => {
    const agg = await Job.aggregate([
      { $match: { ...live, status: { $in: DONE }, technician: { $ne: null } } },
      { $addFields: { doneAt: { $ifNull: ['$completedAt', '$updatedAt'] } } },
      { $match: { doneAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$technician', jobs: { $sum: 1 }, rating: { $avg: '$rating' }, revenue: { $sum: '$amount' } } },
      { $lookup: { from: 'technicians', localField: '_id', foreignField: '_id', as: 't' } },
      { $unwind: '$t' },
      { $sort: { jobs: -1 } },
    ]);
    return {
      headers: ['Tech ID', 'Name', 'Jobs Completed', 'Avg Rating', 'Job Value (₹)'],
      rows: agg.map(r => [r.t.techId, r.t.name, r.jobs,
        r.rating != null ? round1(r.rating) : (r.t.rating ?? '-'), r.revenue]),
    };
  },

  customers: async () => {
    const list = await Customer.find(live).sort({ totalSpent: -1 }).lean();
    return {
      headers: ['Customer ID', 'Name', 'Phone', 'City', 'Type', 'Jobs', 'AMC', 'Lifetime Spent (₹)'],
      rows: list.map(c => [c.customerId, c.name, c.phone, c.city ?? '-', c.type, c.totalJobs ?? 0,
        c.amc ? 'Yes' : 'No', c.totalSpent ?? 0]),
    };
  },

  // point-in-time report — ignores from/to
  'invoice-aging': async () => {
    const list = await Invoice.find({ ...live, status: { $in: ['saved', 'pending'] }, paid: { $ne: true } })
      .select('invoiceNo customer date dueDate total').lean();
    const today = Date.now();
    const bucket = (d) => d == null ? 'No due date' : d <= 0 ? 'Current' : d <= 30 ? '1-30' : d <= 60 ? '31-60' : d <= 90 ? '61-90' : '90+';
    const rows = list.map(i => {
      const days = i.dueDate ? Math.floor((today - new Date(i.dueDate).getTime()) / 864e5) : null;
      return { i, days };
    }).sort((a, b) => (b.days ?? -Infinity) - (a.days ?? -Infinity));
    return {
      headers: ['Invoice No', 'Customer', 'Date', 'Due Date', 'Total (₹)', 'Days Overdue', 'Bucket'],
      rows: rows.map(({ i, days }) => [i.invoiceNo, i.customer, i.date || '-', i.dueDate || '-',
        i.total, days == null ? '-' : Math.max(days, 0), bucket(days)]),
    };
  },

  // point-in-time — all non-deleted contracts, grouped by plan
  'amc-analytics': async () => {
    const notCancelled = { $ne: ['$status', 'cancelled'] };
    const agg = await AMC.aggregate([
      { $match: live },
      { $group: {
          _id: '$plan',
          contracts:  { $sum: 1 },
          active:     count({ $eq: ['$status', 'active'] }),
          expiring:   count({ $eq: ['$status', 'expiring'] }),
          expired:    count({ $eq: ['$status', 'expired'] }),
          cancelled:  count({ $eq: ['$status', 'cancelled'] }),
          value:      { $sum: { $cond: [notCancelled, '$value', 0] } },
          visitsDue:  { $sum: { $cond: [notCancelled, '$visits', 0] } },
          visitsDone: { $sum: { $cond: [notCancelled, '$done', 0] } } } },
      { $sort: { contracts: -1 } },
    ]);
    return {
      headers: ['Plan', 'Contracts', 'Active', 'Expiring', 'Expired', 'Cancelled',
        'Contract Value (₹)', 'Visits Due', 'Visits Done', 'Visit Completion %'],
      rows: agg.map(r => [r._id || '-', r.contracts, r.active, r.expiring, r.expired, r.cancelled,
        r.value, r.visitsDue, r.visitsDone, r.visitsDue ? round1((r.visitsDone / r.visitsDue) * 100) : 0]),
    };
  },

  // parts consumed on completed jobs in range, joined to current stock
  'inventory-usage': async ({ from, to }) => {
    const agg = await Job.aggregate([
      { $match: { ...live, status: { $in: DONE } } },
      { $addFields: { doneAt: { $ifNull: ['$completedAt', '$updatedAt'] } } },
      { $match: { doneAt: { $gte: from, $lte: to } } },
      { $unwind: '$parts' },
      { $group: {
          _id:     { $ifNull: ['$parts.inventoryItem', '$parts.name'] },
          name:    { $first: '$parts.name' },
          item:    { $first: '$parts.inventoryItem' },
          qtyUsed: { $sum: '$parts.qty' },
          cost:    { $sum: { $multiply: ['$parts.qty', '$parts.cost'] } },   // assumes parts.cost = unit cost
          jobs:    { $addToSet: '$_id' } } },
      { $lookup: { from: 'inventories', localField: 'item', foreignField: '_id', as: 'inv' } },
      { $sort: { cost: -1 } },
    ]);
    return {
      headers: ['Part', 'Item ID', 'Category', 'Qty Used', 'Jobs', 'Total Cost (₹)',
        'Avg Cost / Job (₹)', 'In Stock', 'Reorder Level', 'Low Stock'],
      rows: agg.map(r => {
        const inv = r.inv[0];
        const n = r.jobs.length || 1;
        return [r.name, inv?.itemId ?? 'Non-stock', inv?.category ?? '-', r.qtyUsed, r.jobs.length,
          r.cost, Math.round(r.cost / n), inv ? inv.qty : '-', inv ? inv.reorderLevel : '-',
          inv ? (inv.qty <= inv.reorderLevel ? 'Yes' : 'No') : '-'];
      }),
    };
  },

  // runs generated in range (by createdAt)
  'salary-payroll': async ({ from, to }) => {
    const list = await PayrollRun.find({ ...live, createdAt: { $gte: from, $lte: to } })
      .sort({ period: -1, techName: 1 }).lean();
    return {
      headers: ['Run ID', 'Technician', 'Period', 'Cycle', 'Basic (₹)', 'HRA (₹)', 'Travel (₹)',
        'Incentive (₹)', 'Overtime (₹)', 'Gross (₹)', 'PF (₹)', 'TDS (₹)', 'LOP (₹)',
        'Advance (₹)', 'Net Pay (₹)', 'Status'],
      rows: list.map(r => [r.runId, r.techName ?? '-', r.period, r.cycle, r.basic, r.hra, r.travel,
        r.incentive, r.overtime, r.gross, r.pf, r.tds, r.lop, r.advance, r.net, r.status]),
    };
  },

  // per-technician summary from the admin Attendance collection
  attendance: async ({ from, to }) => {
    const agg = await Attendance.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: {
          _id: '$technician',
          present: count({ $eq: ['$status', 'present'] }),
          half:    count({ $eq: ['$status', 'half_day'] }),
          absent:  count({ $eq: ['$status', 'absent'] }),
          leave:   count({ $eq: ['$status', 'on_leave'] }),
          holiday: count({ $eq: ['$status', 'holiday'] }),
          hours:   { $sum: '$hoursWorked' } } },
      { $lookup: { from: 'technicians', localField: '_id', foreignField: '_id', as: 't' } },
      { $unwind: '$t' },
      { $sort: { 't.name': 1 } },
    ]);
    return {
      headers: ['Tech ID', 'Name', 'Present', 'Half Day', 'Absent', 'On Leave', 'Holidays', 'Hours Worked', 'Attendance %'],
      rows: agg.map(r => {
        const working = r.present + r.half + r.absent;   // approved leave + holidays don't count against %
        return [r.t.techId, r.t.name, r.present, r.half, r.absent, r.leave, r.holiday,
          round1(r.hours), working ? round1(((r.present + r.half * 0.5) / working) * 100) : 0];
      }),
    };
  },

  // expense line items in range
  expenses: async ({ from, to }) => {
    const list = await Expense.find({ ...live, date: { $gte: from, $lte: to } }).sort({ date: -1 }).lean();
    return {
      headers: ['Expense ID', 'Date', 'Technician', 'Category', 'Description', 'Amount (₹)', 'Status', 'Receipt'],
      rows: list.map(e => [e.expenseId, ymd(e.date), e.techName ?? '-', e.category, e.description,
        e.amount, e.status, e.receipt ? 'Yes' : 'No']),
    };
  },

  complaints: async ({ from, to }) => {
    const agg = await Complaint.aggregate([
      { $match: { ...live, createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: '$category',
          total:    { $sum: 1 },
          open:     count({ $in: ['$status', ['open', 'in_progress']] }),
          resolved: count({ $in: ['$status', ['resolved', 'closed']] }),
          high:     count({ $eq: ['$severity', 'high'] }),
          avgMs:    { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } } } },   // null when unresolved → ignored by $avg
      { $sort: { total: -1 } },
    ]);
    return {
      headers: ['Category', 'Total', 'Open / In Progress', 'Resolved / Closed', 'High Severity', 'Avg Resolution (days)'],
      rows: agg.map(r => [r._id || '-', r.total, r.open, r.resolved, r.high,
        r.avgMs != null ? round1(r.avgMs / 864e5) : '-']),
    };
  },

  // approved == converted to job (see POST /quotations/:id/convert)
  quotations: async ({ from, to }) => {
    const agg = await Quotation.aggregate([
      { $match: { ...live, createdAt: { $gte: from, $lte: to } } },
      { $group: {
          _id: '$type',
          total:    { $sum: 1 },
          draft:    count({ $eq: ['$status', 'draft'] }),
          sent:     count({ $eq: ['$status', 'sent'] }),
          approved: count({ $eq: ['$status', 'approved'] }),
          rejected: count({ $eq: ['$status', 'rejected'] }),
          expired:  count({ $eq: ['$status', 'expired'] }),
          approvedValue: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$total', 0] } },
          pendingValue:  { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, '$total', 0] } } } },
      { $sort: { total: -1 } },
    ]);
    return {
      headers: ['Type', 'Total', 'Draft', 'Sent (Follow-up)', 'Approved', 'Rejected', 'Expired',
        'Approval Rate %', 'Approved Value (₹)', 'Pending Value (₹)'],
      rows: agg.map(r => {
        const issued = r.total - r.draft;   // approval rate ignores drafts
        return [r._id || '-', r.total, r.draft, r.sent, r.approved, r.rejected, r.expired,
          issued ? round1((r.approved / issued) * 100) : 0, r.approvedValue, r.pendingValue];
      }),
    };
  },
};

// GET /api/reports/data/:type?from=YYYY-MM-DD&to=YYYY-MM-DD   (default: last 6 months)
export const getReportData = async (req, res) => {
  try {
    const { type } = req.params;
    if (!Object.hasOwn(REPORTS, type))
      return res.status(404).json({ message: 'This report is not available yet.' });

    const now  = new Date();
    const from = req.query.from ? new Date(req.query.from) : monthStart(now, -5);
    const to   = req.query.to   ? endOfDay(new Date(req.query.to)) : now;
    if (isNaN(from) || isNaN(to))
      return res.status(400).json({ message: 'Invalid date range.' });

    res.json(await REPORTS[type]({ from, to }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to build report.' });
  }
};
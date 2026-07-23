import express from 'express';
import Job from '../models/Job.js';
import { Expense } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, adminOnly);

const asyncWrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ── Period → date range helper ──────────────────────────────────────────────
function rangeFor(period) {
  const now = new Date();
  let start, end;
  if (period === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'this_year') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear() + 1, 0, 1);
  } else { // this_month (default)
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  return { start, end };
}

// ── Shared aggregation building blocks ──────────────────────────────────────
// Income: revenue from jobs billed (status invoiced/completed) in range.
async function getIncomeTotal(start, end) {
  const [r] = await Job.aggregate([
    { $match: { status: { $in: ['invoiced', 'completed'] }, isDeleted: { $ne: true },
                completedAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return r?.total || 0;
}

// Job.parts[] is the source of truth for job-linked parts cost.
async function getJobPartsCostTotal(start, end) {
  const [r] = await Job.aggregate([
    { $match: { isDeleted: { $ne: true }, completedAt: { $gte: start, $lt: end } } },
    { $unwind: { path: '$parts', preserveNullAndEmptyArrays: true } },
    { $group: { _id: null, total: { $sum: { $multiply: ['$parts.cost', { $ifNull: ['$parts.qty', 1] }] } } } },
  ]);
  return r?.total || 0;
}

// Expense.category:'Parts' entries WITHOUT a job link are genuine (e.g. bulk
// stock purchases) and count here. Ones WITH a job link are already counted
// via Job.parts above, so they're excluded to avoid double-counting.
async function getOtherExpenseTotal(start, end) {
  const [r] = await Expense.aggregate([
    { $match: {
        isDeleted: { $ne: true }, status: { $ne: 'rejected' }, date: { $gte: start, $lt: end },
        $or: [{ category: { $ne: 'Parts' } }, { job: null }],
      } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return r?.total || 0;
}

// ── GET /api/finance/summary?period= ────────────────────────────────────────
router.get('/summary', asyncWrap(async (req, res) => {
  const { start, end } = rangeFor(req.query.period);
  const [income, partsCost, otherExpense] = await Promise.all([
    getIncomeTotal(start, end),
    getJobPartsCostTotal(start, end),
    getOtherExpenseTotal(start, end),
  ]);
  const totalExpense = partsCost + otherExpense;
  const netProfit = income - totalExpense;
  const marginPct = income ? Math.round((netProfit / income) * 100) : 0;
  res.json({ success: true, data: { totalIncome: income, totalExpense, partsCost, otherExpense, netProfit, marginPct } });
}));

// ── GET /api/finance/trend?period=this_year ─────────────────────────────────
// Monthly buckets — always spans the selected year regardless of `period`,
// since a trend needs multiple points; this_month/last_month periods just
// scope the summary cards, not this chart.
router.get('/trend', asyncWrap(async (req, res) => {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const data = await Promise.all(months.map(async (m) => {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 1);
    if (start > new Date()) return null; // skip future months
    const [income, partsCost, otherExpense] = await Promise.all([
      getIncomeTotal(start, end),
      getJobPartsCostTotal(start, end),
      getOtherExpenseTotal(start, end),
    ]);
    const expense = partsCost + otherExpense;
    return { label: start.toLocaleString('en-IN', { month: 'short' }), income, expense, profit: income - expense };
  }));
  res.json({ success: true, data: data.filter(Boolean) });
}));

// ── GET /api/finance/breakdown?type=income|expense&period= ─────────────────
router.get('/breakdown', asyncWrap(async (req, res) => {
  const { start, end } = rangeFor(req.query.period);
  if (req.query.type === 'income') {
    const rows = await Job.aggregate([
      { $match: { status: { $in: ['invoiced', 'completed'] }, isDeleted: { $ne: true },
                  completedAt: { $gte: start, $lt: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);
    return res.json({ success: true, data: rows.map(r => ({ key: r._id, label: r._id, value: r.total })) });
  }

  const jobLinkedPartsCost = await getJobPartsCostTotal(start, end);
  const otherRows = await Expense.aggregate([
    { $match: {
        isDeleted: { $ne: true }, status: { $ne: 'rejected' }, date: { $gte: start, $lt: end },
        $or: [{ category: { $ne: 'Parts' } }, { job: null }],
      } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
  ]);

  // Fold the two Parts sources (job-linked + standalone) into one bucket.
  const standaloneParts = otherRows.find(r => r._id === 'Parts')?.total || 0;
  const nonPartsRows = otherRows.filter(r => r._id !== 'Parts');
  const data = [
    { key: 'Parts', label: 'Parts', value: jobLinkedPartsCost + standaloneParts },
    ...nonPartsRows.map(r => ({ key: r._id, label: r._id, value: r.total })),
  ];
  res.json({ success: true, data });
}));

// ── GET /api/finance/jobs?period= — per-job profitability ──────────────────
router.get('/jobs', asyncWrap(async (req, res) => {
  const { start, end } = rangeFor(req.query.period);
  const jobs = await Job.find({
    status: { $in: ['invoiced', 'completed'] }, isDeleted: { $ne: true },
    completedAt: { $gte: start, $lt: end },
  }).select('jobId customerName amount parts completedAt').sort({ completedAt: -1 }).limit(50);

  const data = jobs.map(j => {
    const partsCost = (j.parts || []).reduce((s, p) => s + p.cost * (p.qty || 1), 0);
    const profit = j.amount - partsCost;
    const margin = j.amount ? Math.round((profit / j.amount) * 100) : 0;
    return { jobId: j.jobId, client: j.customerName, date: j.completedAt, revenue: j.amount, partsCost, profit, margin };
  });
  res.json({ success: true, data });
}));

export default router;
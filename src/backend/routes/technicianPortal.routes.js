// routes/technicianPortal.routes.js

import express from 'express';
import mongoose from 'mongoose';

import { protect, technicianOnly } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Technician from '../models/Technician.js';
import { Inventory, Expense } from '../models/index.js';
import PayrollRun from '../models/Payroll.js';
import { AdvanceIncentive } from '../models/extendedModels.js';
import AttendanceSession from '../models/AttendanceSession.js';
import { buildPayslipPDF } from '../utils/payslipPdf.js';
import AMC from '../models/AMC.js';
import { Leave } from '../models/hrModels.js';

const router = express.Router();
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Billing constants ───────────────────────────────────────────────────────
// TODO: your admin JobsPage.jsx flags these exact numbers as hardcoded when
// they should come from Settings → GST tab. Once you share the Settings
// model I'll swap this for a real lookup so all three panels read from one
// place instead of each hardcoding their own copy.
const LABOUR_CHARGE  = 1200;
const SERVICE_CHARGE = 500;

router.use('/', protect, technicianOnly); // everything below requires a logged-in technician

// Every schedule query starts from this — technician + not-deleted, plus
// whatever the route needs on top. Same scoping guarantee as the jobs routes
// above, just expressed as a filter object since the schedule routes below
// use plain try/catch instead of wrap().
const scoped = (req, extra = {}) => ({
  technician: req.technician._id,
  isDeleted: false,
  ...extra,
});

// ── Dashboard ────────────────────────────────────────────────────────────────
// Assumption pending confirmation: no annual leave-allocation field exists
// on Technician/Leave yet, so "leave balance" below is computed as
// (this constant − approved casual days already taken this year). Swap this
// for a real per-technician allocation field whenever one exists.
const ANNUAL_CASUAL_LEAVE_DAYS = 12;

// Job.type → the friendlier labels the dashboard groups by. Falls back to
// the raw type for anything not listed here.
const JOB_CATEGORY_LABELS = {
  Repair: 'AC Repair',
  Service: 'AC Service',
  'AMC Visit': 'AMC Visit',
  Installation: 'Installation',
  Inspection: 'Inspection',
};

// GET /api/technician-portal/me/dashboard
// Single aggregation powering every card/chart on the technician dashboard.
router.get('/dashboard', wrap(async (req, res) => {
  const tech = req.technician;
  const now = new Date();

  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday   = new Date(now); endOfToday.setHours(23, 59, 59, 999);

  // The "This Month" dropdowns (Job Completion, Job Status by Category,
  // Recent Performance, Monthly Earnings) can be pointed at any past month
  // via ?month=0-11&year=YYYY. Today's Jobs / Timeline always reflect the
  // real "today" regardless of this — only the analytics cards below move.
  const viewYear  = req.query.year  ? parseInt(req.query.year, 10)  : now.getFullYear();
  const viewMonth = req.query.month !== undefined && req.query.month !== ''
    ? parseInt(req.query.month, 10)
    : now.getMonth();

  // PayrollRun is one record per period, keyed by a "Mon YYYY" string — this
  // builds that same label for any (year, month) pair, normalising rollover
  // (e.g. month -1 correctly resolves to December of the prior year).
  const periodLabel = (year, month) => {
    const d = new Date(year, month, 1);
    return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
  };

  const startOfMonth = new Date(viewYear, viewMonth, 1);
  const endOfMonth   = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59, 999);

  const startOfLastMonth = new Date(viewYear, viewMonth - 1, 1);
  const endOfLastMonth   = new Date(viewYear, viewMonth, 0, 23, 59, 59, 999);

  const startOfYear = new Date(viewYear, 0, 1);

  const baseFilter = { technician: tech._id, isDeleted: { $ne: true } };

  const [
    todaysJobsRaw,
    monthJobs,
    lastMonthJobs,
    upcomingCount,
    nextAmc,
    pendingExpenseCount,
    casualLeaveAgg,
    payrollRuns,
    earningsByDay,
  ] = await Promise.all([
    Job.find({ ...baseFilter, scheduledDate: { $gte: startOfToday, $lte: endOfToday } })
      .populate('customer', 'name phone address')
      .sort({ scheduledTime: 1 }),

    Job.find({ ...baseFilter, scheduledDate: { $gte: startOfMonth, $lte: endOfMonth } })
      .select('status type rating completedAt scheduledDate'),

    Job.find({ ...baseFilter, scheduledDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } })
      .select('status rating'),

    Job.countDocuments({ ...baseFilter, status: { $in: ['assigned', 'new'] }, scheduledDate: { $gte: now } }),

    AMC.findOne({
      assignedTechnician: req.user._id,
      status: { $in: ['active', 'expiring'] },
      isDeleted: { $ne: true },
      nextVisit: { $gte: startOfToday },
    }).populate('customer', 'name address').sort({ nextVisit: 1 }),

    Expense.countDocuments({ technician: tech._id, status: 'pending', isDeleted: { $ne: true } }),

    Leave.aggregate([
      { $match: { technician: tech._id, type: 'casual', status: 'approved', startDate: { $gte: startOfYear } } },
      { $group: { _id: null, days: { $sum: '$days' } } },
    ]),

    // Payroll for the viewed month + the one immediately before it, matched
    // by period label since PayrollRun is one record per period (not
    // necessarily the two most recently created — a technician could be
    // looking at an old month while a more recent run also exists).
    Promise.all([
      PayrollRun.findOne({ technician: tech._id, isDeleted: { $ne: true }, period: periodLabel(viewYear, viewMonth) }),
      PayrollRun.findOne({ technician: tech._id, isDeleted: { $ne: true }, period: periodLabel(viewYear, viewMonth - 1) }),
    ]),

    // Daily revenue from jobs this technician completed this month — real,
    // day-level data (unlike PayrollRun, which is one record per month) so
    // it's what drives the "Monthly Earnings Overview" line chart.
    Job.aggregate([
      {
        $match: {
          technician: tech._id,
          isDeleted: { $ne: true },
          status: { $in: ['completed', 'invoiced'] },
          completedAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // ── Today's jobs + timeline ─────────────────────────────────────────────
  const todaysJobs = todaysJobsRaw.map(j => ({
    id: j._id,
    jobId: j.jobId,
    type: j.type,
    priority: j.priority,
    status: j.status,
    customerName: j.customerName || j.customer?.name,
    address: j.address || j.customer?.address,
    scheduledTime: j.scheduledTime,
  }));

  const timeline = todaysJobs.map(j => ({
    time: j.scheduledTime || '—',
    title: j.customerName,
    subtitle: j.address,
    type: j.type,
    kind: 'job',
  }));

  // Placeholder — no AttendanceSession fields were available to pull a real
  // break time from, so this is a fixed UI convention, not tracked data.
  timeline.push({ time: '01:00 PM', title: 'Lunch Break', subtitle: null, type: 'Break', kind: 'break' });

  if (nextAmc?.nextVisit && nextAmc.nextVisit >= startOfToday && nextAmc.nextVisit <= endOfToday) {
    timeline.push({
      time: nextAmc.nextVisit.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      title: nextAmc.customerName || nextAmc.customer?.name,
      subtitle: nextAmc.customer?.address,
      type: 'AMC Visit',
      kind: 'amc',
    });
  }

  timeline.sort((a, b) => (a.time > b.time ? 1 : -1));

  // ── Job Completion Overview (donut) ─────────────────────────────────────
  const completedCount  = monthJobs.filter(j => ['completed', 'invoiced'].includes(j.status)).length;
  const inProgressCount = monthJobs.filter(j => j.status === 'in_progress').length;
  const pendingCount    = monthJobs.filter(j => ['new', 'assigned'].includes(j.status)).length;
  const cancelledCount  = monthJobs.filter(j => j.status === 'cancelled').length;
  const totalMonthJobs  = monthJobs.length;
  const pct = (n) => (totalMonthJobs ? Math.round((n / totalMonthJobs) * 100) : 0);

  const jobCompletionOverview = {
    total: totalMonthJobs,
    completed: { count: completedCount, pct: pct(completedCount) },
    inProgress: { count: inProgressCount, pct: pct(inProgressCount) },
    pending: { count: pendingCount, pct: pct(pendingCount) },
    cancelled: { count: cancelledCount, pct: pct(cancelledCount) },
  };

  // ── Job Status by Category ──────────────────────────────────────────────
  const categoryCounts = {};
  monthJobs.forEach(j => {
    const label = JOB_CATEGORY_LABELS[j.type] || j.type;
    categoryCounts[label] = (categoryCounts[label] || 0) + 1;
  });
  const jobStatusByCategory = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count, pct: pct(count) }))
    .sort((a, b) => b.count - a.count);

  // ── Monthly Earnings Overview (line chart) ──────────────────────────────
  let cumulative = 0;
  const monthlyEarningsSeries = earningsByDay.map(d => {
    cumulative += d.total;
    return { date: d._id, dayLabel: d._id.slice(-2), amount: d.total, cumulative };
  });

  // ── Recent Performance ───────────────────────────────────────────────────
  const lastMonthCompleted = lastMonthJobs.filter(j => ['completed', 'invoiced'].includes(j.status)).length;
  const jobsCompletedChangePct = lastMonthCompleted
    ? Math.round(((completedCount - lastMonthCompleted) / lastMonthCompleted) * 100)
    : null;

  const ratedThisMonth = monthJobs.filter(j => typeof j.rating === 'number');
  const ratedLastMonth = lastMonthJobs.filter(j => typeof j.rating === 'number');
  const avgRatingThisMonth = ratedThisMonth.length
    ? Number((ratedThisMonth.reduce((s, j) => s + j.rating, 0) / ratedThisMonth.length).toFixed(1))
    : tech.rating || null;
  const avgRatingLastMonth = ratedLastMonth.length
    ? Number((ratedLastMonth.reduce((s, j) => s + j.rating, 0) / ratedLastMonth.length).toFixed(1))
    : null;

  const firstTimeFixRate = ratedThisMonth.length
    ? Math.round((ratedThisMonth.filter(j => j.rating >= 4).length / ratedThisMonth.length) * 100)
    : null;

  const recentPerformance = {
    // Not trackable yet — Job has no `startedAt` timestamp, only
    // scheduledDate/completedAt, so a real response-time can't be derived
    // honestly. Add a startedAt field on job "start" to enable this.
    avgResponseTimeMin: null,
    firstTimeFixRate, // approximated as % of rated jobs this month rated 4★+
    jobsCompleted: completedCount,
    jobsCompletedChangePct,
    customerRating: avgRatingThisMonth,
    customerRatingChangePct: avgRatingLastMonth
      ? Number((avgRatingThisMonth - avgRatingLastMonth).toFixed(1))
      : null,
  };

  // ── Earnings + This Month Summary ───────────────────────────────────────
  const [currentRun, prevRun] = payrollRuns;
  const earningsChangePct = currentRun && prevRun && prevRun.net
    ? Math.round(((currentRun.net - prevRun.net) / prevRun.net) * 100)
    : null;

  const casualDaysUsed = casualLeaveAgg[0]?.days || 0;
  const leaveBalance = Math.max(0, ANNUAL_CASUAL_LEAVE_DAYS - casualDaysUsed);

  res.json({
    success: true,
    data: {
      viewedPeriod: { month: viewMonth, year: viewYear, label: periodLabel(viewYear, viewMonth) },
      technician: {
        name: tech.name,
        role: tech.role,
        area: tech.area,
        rating: tech.rating,
        skills: tech.skills || [],
        status: tech.status,
      },
      todaysJobs,
      timeline,
      stats: {
        todaysJobsCount: todaysJobs.length,
        jobsDoneThisMonth: completedCount,
        upcomingCount,
        rating: tech.rating,
        totalJobsAllTime: tech.completed ?? null,
        earnings: {
          amount: currentRun?.net ?? null,
          period: currentRun?.period ?? null,
          changePct: earningsChangePct,
        },
      },
      jobCompletionOverview,
      jobStatusByCategory,
      monthlyEarningsSeries,
      recentPerformance,
      upcomingAmcVisit: nextAmc ? {
        id: nextAmc._id,
        customerName: nextAmc.customerName || nextAmc.customer?.name,
        address: nextAmc.customer?.address,
        units: nextAmc.units,
        plan: nextAmc.plan,
        nextVisit: nextAmc.nextVisit,
        status: nextAmc.status,
        notes: nextAmc.notes,
      } : null,
      monthSummary: {
        jobsCompleted: completedCount,
        totalEarnings: currentRun?.net ?? null,
        earningsPeriod: currentRun?.period ?? null,
        pendingClaims: pendingExpenseCount,
        leaveBalance,
      },
    },
  });
}));

// ── Jobs ─────────────────────────────────────────────────────────────────────

// GET /api/technician-portal/me/jobs?status=in_progress
router.get('/jobs', wrap(async (req, res) => {
  const filter = { technician: req.technician._id, isDeleted: { $ne: true } };
  if (req.query.status) filter.status = req.query.status;

  const jobs = await Job.find(filter)
    .populate('customer', 'name phone address')
    .sort({ scheduledDate: 1, scheduledTime: 1 });

  res.json({ success: true, data: jobs });
}));

// GET /api/technician-portal/me/jobs/:jobId
router.get('/jobs/:jobId', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id })
    .populate('customer', 'name phone address');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
}));

// PATCH /api/technician-portal/me/jobs/:jobId/start  — assigned → in_progress
router.patch('/jobs/:jobId/start', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (job.status !== 'assigned') {
    return res.status(403).json({ success: false, message: `Cannot start a job that is "${job.status}"` });
  }
  job.status = 'in_progress';
  await job.save();
  await Technician.findByIdAndUpdate(req.technician._id, { status: 'busy' });
  res.json({ success: true, data: job });
}));

// PATCH /api/technician-portal/me/jobs/:jobId/remark  — { remarks }
router.patch('/jobs/:jobId/remark', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const { remarks } = req.body;
  if (typeof remarks !== 'string' || !remarks.trim()) {
    return res.status(400).json({ success: false, message: 'Remark cannot be empty' });
  }
  job.remarks = remarks.trim();
  await job.save();
  res.json({ success: true, data: job });
}));

// PATCH /api/technician-portal/me/jobs/:jobId/complete — in_progress → completed
router.patch('/jobs/:jobId/complete', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  if (job.status !== 'in_progress') {
    return res.status(403).json({ success: false, message: `Cannot complete a job that is "${job.status}"` });
  }

  const incomplete = job.checklist.filter(c => !c.done);
  if (incomplete.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Finish all checklist items before completing this job',
      data: { incompleteItems: incomplete.map(c => c.item) },
    });
  }

  const parts = Array.isArray(req.body.parts) ? req.body.parts : [];

  const inventoryWarnings = [];
  for (const p of parts) {
    if (!p.inventoryItem) continue;
    const invItem = await Inventory.findById(p.inventoryItem);
    if (!invItem) {
      inventoryWarnings.push(`Inventory item for "${p.name}" no longer exists — stock not adjusted.`);
      continue;
    }
    const remaining = invItem.qty - Number(p.qty || 0);
    invItem.qty = Math.max(0, remaining);
    await invItem.save();
    if (remaining < 0) {
      inventoryWarnings.push(`"${invItem.name}" went ${Math.abs(remaining)} below stock — restock needed.`);
    }
  }

  const partsTotal = parts.reduce((sum, p) => sum + (Number(p.qty) * Number(p.cost)), 0);
  job.parts       = parts;
  job.amount      = partsTotal + LABOUR_CHARGE + SERVICE_CHARGE;
  job.status      = 'completed';
  job.completedAt = new Date();
  await job.save();

  await Technician.findByIdAndUpdate(req.technician._id, {
    status: 'available',
    $inc: { jobs: -1, completed: 1 },
  });

  res.json({ success: true, data: job, inventoryWarnings });
}));

// ── Checklist ────────────────────────────────────────────────────────────────

router.patch('/jobs/:jobId/checklist/:itemId', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const item = job.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });

  item.done = !!req.body.done;
  await job.save();
  res.json({ success: true, data: job });
}));

router.post('/jobs/:jobId/checklist', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const { item } = req.body;
  if (!item?.trim()) return res.status(400).json({ success: false, message: 'Checklist item text is required' });

  job.checklist.push({ item: item.trim(), done: false, addedBy: 'technician' });
  await job.save();
  res.status(201).json({ success: true, data: job });
}));

router.delete('/jobs/:jobId/checklist/:itemId', wrap(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, technician: req.technician._id });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

  const item = job.checklist.id(req.params.itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });
  if (item.addedBy !== 'technician') {
    return res.status(403).json({ success: false, message: 'Only items you added yourself can be removed' });
  }

  item.deleteOne();
  await job.save();
  res.json({ success: true, data: job });
}));

// ── Inventory (read-only picker for "Parts Used") ─────────────────────────────
router.get('/inventory', wrap(async (req, res) => {
  const filter = { isDeleted: { $ne: true } };
  if (req.query.search) {
    filter.name = new RegExp(req.query.search, 'i');
  }
  const items = await Inventory.find(filter).sort({ name: 1 }).limit(100);
  res.json({ success: true, data: items });
}));

// ── Schedule ─────────────────────────────────────────────────────────────────

router.get('/schedule', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = scoped(req);
    if (from || to) {
      filter.scheduledDate = {};
      if (from) filter.scheduledDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to)   filter.scheduledDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    const jobs = await Job.find(filter)
      .populate('customer', 'name phone address')
      .sort({ scheduledDate: 1, scheduledTime: 1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/schedule/month', async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year  = parseInt(req.query.year, 10);
    if (Number.isNaN(month) || Number.isNaN(year)) {
      return res.status(400).json({ message: 'month and year query params are required.' });
    }

    const start = new Date(Date.UTC(year, month, 1));
    const end   = new Date(Date.UTC(year, month + 1, 1));

    const rows = await Job.aggregate([
      { $match: { technician: req.technician._id, isDeleted: false, scheduledDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
          count: { $sum: 1 },
          statuses: { $push: '$status' },
        },
      },
    ]);

    const byDate = {};
    rows.forEach(r => { byDate[r._id] = { count: r.count, statuses: r.statuses }; });
    res.json(byDate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/schedule/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const endOfToday   = new Date(now); endOfToday.setHours(23, 59, 59, 999);

    const dow = (now.getDay() + 6) % 7; // 0 = Monday
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - dow);
    const endOfWeek   = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);

    const [todayJobs, weekJobs] = await Promise.all([
      Job.countDocuments(scoped(req, { scheduledDate: { $gte: startOfToday, $lte: endOfToday } })),
      Job.find(scoped(req, { scheduledDate: { $gte: startOfWeek, $lte: endOfWeek } })).select('status'),
    ]);

    const completed = weekJobs.filter(j => j.status === 'completed').length;
    const pending    = weekJobs.filter(j => ['assigned', 'new'].includes(j.status)).length;

    res.json({ todayJobs, weekJobs: weekJobs.length, completed, pending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/jobs/:id/reschedule-request', async (req, res) => {
  try {
    const { requestedDate, requestedTime, reason } = req.body;
    if (!requestedDate || !requestedTime) {
      return res.status(400).json({ message: 'requestedDate and requestedTime are required.' });
    }

    const job = await Job.findOneAndUpdate(
      scoped(req, { _id: req.params.id }),
      {
        rescheduleRequest: {
          requestedDate: new Date(requestedDate),
          requestedTime,
          reason: reason || '',
          status: 'pending',
        },
      },
      { new: true }
    ).populate('customer', 'name phone address');

    if (!job) return res.status(404).json({ message: 'Job not found.' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Salary ───────────────────────────────────────────────────────────────────
// NOTE: this router is mounted at '/api/technician-portal/me' in server.js —
// so every path below is relative to '.../me', same as /jobs and /schedule
// above. NO '/me' prefix here — that was the bug last turn: '/me/salary'
// under a mount that already supplies '/me' produced '.../me/me/salary'.

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "March 2026" → working days in that month (weekends excluded), for the
// LOP daily-rate math shown in the payslip modal.
function getWorkingDays(period) {
  const [monthName, yearStr] = (period || '').split(' ');
  const monthIdx = MONTH_NAMES.indexOf(monthName);
  const year = Number(yearStr);
  if (monthIdx === -1 || !year) return null;
  const totalDays = new Date(year, monthIdx + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dow = new Date(year, monthIdx, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

// GET /api/technician-portal/me/salary — payslip history, newest first
router.get('/salary', async (req, res) => {
  try {
    const runs = await PayrollRun.find({
      technician: req.technician._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const data = runs.map((r) => ({
      id: r._id,
      period: r.period,
      status: r.status,
      basic: r.basic,
      incentive: r.incentive,
      overtime: r.overtime,
      gross: r.gross,
      lop: r.lop,
      net: r.net,
      daysWorked: r.presentDays,
      totalDays: r.totalDays,
      absentDays: r.absentDays,
      attLive: r.presentDays != null,
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/technician-portal/me/salary/summary — powers the KPI strip
// Static route — must stay above /:id
router.get('/salary/summary', async (req, res) => {
  try {
    const runs = await PayrollRun.find({
      technician: req.technician._id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    const settled = runs.filter((r) => r.status !== 'draft' && r.net > 0);
    const avgNet = settled.length
      ? Math.round(settled.reduce((s, r) => s + r.net, 0) / settled.length)
      : 0;
    const totalIncentive = settled.reduce((s, r) => s + (r.incentive || 0), 0);
    const totalLOP = runs.reduce((s, r) => s + (r.lop || 0), 0);
    const pending = runs.find((r) => r.status === 'draft' || r.status === 'generated' && r.net === 0);

    res.json({
      basicSalary: req.technician.salary || 0,
      avgNet,
      totalIncentive,
      totalLOP,
      monthsCounted: settled.length,
      nextPeriod: pending?.period ?? runs[0]?.period ?? null,
      liveCount: runs.filter((r) => r.presentDays != null).length,
      totalMonths: runs.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/technician-portal/me/salary/:id — full payslip detail
router.get('/salary/:id', async (req, res) => {
  try {
    const run = await PayrollRun.findOne({
      _id: req.params.id,
      technician: req.technician._id,
      isDeleted: { $ne: true },
    });
    if (!run) return res.status(404).json({ message: 'Payslip not found.' });

    const records = await AdvanceIncentive.find({
      technician: req.technician._id,
      month: run.period,
      isDeleted: { $ne: true },
    }).select('type amount reason status');

    const totalDays = run.totalDays ?? getWorkingDays(run.period);
    const dailyRate = totalDays ? Math.round(run.basic / totalDays) : 0;

    res.json({
      data: {
        id: run._id,
        period: run.period,
        status: run.status,
        payDate: run.status === 'paid' ? run.updatedAt : null,
        technician: {
          name: req.technician.name,
          techId: req.technician.techId,
          role: req.technician.role,
          bankAccount: req.technician.bankAccount,
          rating: req.technician.rating,
          jobsCompleted: req.technician.completed,
        },
        basic: run.basic,
        hra: run.hra,
        travel: run.travel,
        incentive: run.incentive,
        uniformAllw: run.uniformAllw,
        toolAllw: run.toolAllw,
        overtime: run.overtime,
        gross: run.gross,
        pf: run.pf,
        tds: run.tds,
        advance: run.advance,
        lop: run.lop,
        dailyRate,
        totalDeductions: run.pf + run.tds + run.advance + run.lop,
        net: run.net,
        daysWorked: run.presentDays,
        totalDays,
        absentDays: run.absentDays,
        attLive: run.presentDays != null,
        advanceIncentiveRecords: records,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/technician-portal/me/salary/:id/download — single payslip PDF
router.get('/salary/:id/download', async (req, res) => {
  try {
    const run = await PayrollRun.findOne({
      _id: req.params.id,
      technician: req.technician._id,
      isDeleted: { $ne: true },
    });
    if (!run) return res.status(404).json({ message: 'Payslip not found.' });
    if (run.status === 'draft') {
      return res.status(400).json({ message: 'This payslip has not been finalized yet.' });
    }

    const pdfBuffer = await buildPayslipPDF(run, {
      technicianMeta: {
        techId: req.technician.techId,
        role: req.technician.role,
        bankAccount: req.technician.bankAccount,
      },
    });

    const safeName = (run.period || 'payslip').replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${safeName}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// ── Advances / Loans ─────────────────────────────────────────────────────────
router.get('/advances', async (req, res) => {
  try {
    const records = await AdvanceIncentive.find(scoped(req))
      .sort({ createdAt: -1 })
      .select('recordId type amount reason date month status notes createdAt');
    res.json({ data: records });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/advances/summary', async (req, res) => {
  try {
    const records = await AdvanceIncentive.find(scoped(req, { type: 'advance' }));
    const totalTaken  = records.reduce((s, r) => s + r.amount, 0);
    const totalPaid    = records.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
    const totalUnpaid   = records.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
    const totalPending  = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
    res.json({ totalTaken, totalPaid, totalUnpaid, totalPending });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/advances', async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ message: 'Enter a valid amount.' });
    const doc = await AdvanceIncentive.create({
      technician: req.technician._id, techName: req.technician.name,
      type: 'advance', amount: Number(amount), reason: reason || '',
      month: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      status: 'pending',
    });
    res.status(201).json({ data: doc });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Profile ──────────────────────────────────────────────────────────────────

// GET /api/technician-portal/me/profile
router.get('/profile', async (req, res) => {
  try {
    const t = req.technician;
    res.json({
      data: {
        id: t.techId,
        name: t.name,
        role: t.role,
        phone: t.phone,
        email: t.email,
        area: t.area,
        rating: t.rating,
        skills: t.skills,
        certifications: t.certifications,
        joinDate: t.joinDate,
        status: t.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/technician-portal/me/profile — self-editable fields only.
// Skills/certifications/area stay admin-managed via the /admin/technicians CRUD.
router.put('/profile', async (req, res) => {
  try {
    const allowed = ['phone', 'email'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updated = await Technician.findByIdAndUpdate(
      req.technician._id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({
      message: 'Profile updated successfully.',
      data: { phone: updated.phone, email: updated.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/technician-portal/me/performance-summary
router.get('/performance-summary', async (req, res) => {
  try {
    const t = req.technician;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [monthly, doneToday, lastPayroll] = await Promise.all([
      Job.aggregate([
        {
          $match: {
            technician: t._id,
            status: 'completed',
            isDeleted: { $ne: true },
            completedAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$completedAt' }, month: { $month: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Job.countDocuments({
        technician: t._id,
        status: 'completed',
        isDeleted: { $ne: true },
        completedAt: { $gte: startOfToday },
      }),
      PayrollRun.findOne({ technician: t._id, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .select('net period'),
    ]);

    const monthlyCompletion = monthly.map((m) => ({
      month: `${MONTH_NAMES[m._id.month - 1].slice(0, 3)} ${m._id.year}`,
      jobsDone: m.count,
    }));

    res.json({
      data: {
        totalJobs: t.completed,       // live-maintained counter, incremented on job complete
        doneCurrent: doneToday,
        rating: t.rating,
        lastNetPay: lastPayroll?.net ?? null,
        lastPayPeriod: lastPayroll?.period ?? null,
        monthlyCompletion,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Error handler — must be LAST so it can catch anything thrown above ──────
router.use((err, req, res, _next) => {
  console.error('[Technician Portal Route Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

export default router;
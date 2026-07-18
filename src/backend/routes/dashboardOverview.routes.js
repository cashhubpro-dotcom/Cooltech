// routes/dashboardOverview.routes.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import Job from '../models/Job.js';
import Invoice from '../models/Invoice.model.js';
import Quotation from '../models/Quotation.js';
import Technician from '../models/Technician.js';
import { Ticket } from '../models/index.js';
import { Notification } from '../models/extendedModels.js';
// import { Complaint } from '../models/index.js'; // uncomment if you want openComplaints in the payload — unused in the current Dashboard.jsx UI, so left out for now

const router = express.Router();
router.use(protect);

const JOB_TYPES = ['Service', 'Repair', 'Installation', 'AMC Visit'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

// ── Period → date range + chart granularity ──────────────────────────────────
// Query params send snake_case keys ('this_week', 'last_month', ...) —
// mapped from the dropdown's human labels on the frontend side.
// NOTE: every period filter below matches on Job.createdAt, not
// scheduledDate. Job also has a scheduledDate field which might be the
// more intuitive "when did this job happen" filter for Jobs Overview /
// Jobs by Category specifically — flagging this as an assumption, easy to
// swap if scheduledDate is what you actually want filtered.
function getPeriodRange(period, now = new Date()) {
  switch (period) {
    case 'this_week': {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - diffToMonday);
      return { start, end: now, granularity: 'day' };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, granularity: 'day' };
    }
    case 'this_quarter': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start, end: now, granularity: 'month' };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return { start, end: now, granularity: 'month' };
    }
    case 'this_month':
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now, granularity: 'day' };
    }
  }
}

// Same-length window immediately preceding [start, end] — used for the
// Revenue Overview panel's % change, independent of the fixed "this month
// vs last month" comparison the KPI row always shows.
function getPreviousRange(start, end) {
  const lengthMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - lengthMs);
  return { start: prevStart, end: prevEnd };
}

async function buildRevenueSeries(start, end, granularity) {
  if (granularity === 'day') {
    const agg = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dayOfMonth: '$createdAt' }, total: { $sum: '$total' } } },
    ]);
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayNum = cursor.getDate();
      const found = agg.find(a => a._id === dayNum);
      days.push({ m: String(dayNum), v: found?.total || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }
  // monthly
  const agg = await Invoice.aggregate([
    { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, total: { $sum: '$total' } } },
  ]);
  const months = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const found = agg.find(a => a._id.y === cursor.getFullYear() && a._id.m === cursor.getMonth() + 1);
    months.push({ m: MONTH_LABELS[cursor.getMonth()], v: found?.total || 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

    // ── KPI row — always fixed "today" / "this month", independent of any
    //    dropdown on the page; these are headline KPIs, not chart filters ──
    const [
      todayJobs, openJobs, pendingQuotes, overdueInvoices, openTickets,
      revenueThisMonthAgg, revenueLastMonthAgg,
    ] = await Promise.all([
      Job.countDocuments({ isDeleted: { $ne: true }, scheduledDate: { $gte: todayStart, $lte: todayEnd } }),
      Job.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['new', 'assigned', 'in_progress'] } }),
      Quotation.countDocuments({ isDeleted: { $ne: true }, status: 'sent' }),
      Invoice.countDocuments({ isDeleted: { $ne: true }, status: 'pending', dueDate: { $lt: now.toISOString().slice(0, 10) } }),
      Ticket.countDocuments({ isDeleted: { $ne: true }, status: 'open' }),
      Invoice.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Invoice.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    const revenueThisMonth = revenueThisMonthAgg[0]?.total || 0;
    const revenueLastMonth = revenueLastMonthAgg[0]?.total || 0;
    const revenueChangePct = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;

    // ── Dropdown-driven periods — one independent period per panel ─────────
    const jobsOverviewPeriod = req.query.jobsOverviewPeriod || 'this_week';
    const categoryPeriod     = req.query.categoryPeriod     || 'this_month';
    const topRevenuePeriod   = req.query.topRevenuePeriod   || 'this_month';
    const revenuePeriod      = req.query.revenuePeriod      || 'this_month';

    const jobsOverviewRange = getPeriodRange(jobsOverviewPeriod, now);
    const categoryRange     = getPeriodRange(categoryPeriod, now);
    const topRevenueRange   = getPeriodRange(topRevenuePeriod, now);
    const revenueRange      = getPeriodRange(revenuePeriod, now);

    // ── Jobs Overview donut — now period-filtered by the dropdown ──────────
    const statusCounts = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, createdAt: { $gte: jobsOverviewRange.start, $lte: jobsOverviewRange.end } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const jobsOverview = statusCounts.map(s => ({ status: s._id, count: s.count }));

    // ── Jobs by Type donut — stays all-time, no dropdown on this panel ─────
    const typeCounts = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, type: { $in: JOB_TYPES } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const jobsByType = JOB_TYPES.map(type => ({
      type,
      count: typeCounts.find(t => t._id === type)?.count || 0,
    }));

    // ── Jobs by Category bars — separate field from jobsByType now that it
    //    has its own period, driven by categoryPeriod ───────────────────────
    const categoryCounts = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, type: { $in: JOB_TYPES }, createdAt: { $gte: categoryRange.start, $lte: categoryRange.end } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const jobsByCategory = JOB_TYPES.map(type => ({
      label: type,
      value: categoryCounts.find(c => c._id === type)?.count || 0,
    }));

    // ── Top Revenue by Service — period-filtered by topRevenuePeriod ───────
    const revenueByType = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, type: { $in: JOB_TYPES }, amount: { $gt: 0 }, createdAt: { $gte: topRevenueRange.start, $lte: topRevenueRange.end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
    const topRevenueByService = revenueByType.map(r => ({ type: r._id, total: r.total }));

    // ── Recent Jobs — last 4, newest first (not period-filtered) ───────────
    const recentJobsRaw = await Job.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('jobId customerName type status createdAt');
    const recentJobs = recentJobsRaw.map(j => ({
      id: j._id.toString(),
      jobId: j.jobId,
      customer: j.customerName || 'Unknown',
      type: j.type,
      status: j.status,
    }));

    // ── Field Technicians ───────────────────────────────────────────────────
    const techniciansRaw = await Technician.find({ isDeleted: { $ne: true }, isActive: true })
      .select('name area status')
      .limit(6);
    const technicians = techniciansRaw.map(t => ({
      id: t._id.toString(),
      name: t.name,
      area: t.area || '',
      status: t.status,
    }));

    // ── Revenue Overview panel — period-filtered total, % change vs the
    //    same-length prior window, and a chart series at the matching
    //    granularity (daily for month-length periods, monthly otherwise) ───
    const [revTotalAgg, revPrevTotal] = await Promise.all([
      Invoice.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: revenueRange.start, $lte: revenueRange.end } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      (async () => {
        const prev = getPreviousRange(revenueRange.start, revenueRange.end);
        const agg = await Invoice.aggregate([
          { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: prev.start, $lte: prev.end } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
        return agg[0]?.total || 0;
      })(),
    ]);
    const revenueTotal = revTotalAgg[0]?.total || 0;
    const revenuePanelChangePct = revPrevTotal > 0
      ? Math.round(((revenueTotal - revPrevTotal) / revPrevTotal) * 100)
      : null;
    const revenueSeries = await buildRevenueSeries(revenueRange.start, revenueRange.end, revenueRange.granularity);

    // ── Recent Activity ─────────────────────────────────────────────────────
    const recentActivityRaw = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(4)
      .select('title type icon isRead createdAt');
    const recentActivity = recentActivityRaw.map(n => ({
      id: n._id.toString(),
      title: n.title,
      type: n.type,
      icon: n.icon || null,
      read: n.isRead,
      createdAt: n.createdAt,
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          todayJobs, openJobs, pendingQuotes, overdueInvoices, openTickets,
          revenueThisMonth, revenueLastMonth, revenueChangePct,
        },
        jobsOverview,
        jobsByType,
        jobsByCategory,
        topRevenueByService,
        recentJobs,
        technicians,
        revenue: {
          period: revenuePeriod,
          total: revenueTotal,
          changePct: revenuePanelChangePct,
          series: revenueSeries,
        },
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
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

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

router.get('/overview', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(startOfThisMonth.getTime() - 1);

    // ── KPI row ──────────────────────────────────────────────────────────────
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
      : null; // null, not 0 — "no prior month revenue" isn't the same as "0% change"; let the frontend decide how to render that

    // ── Jobs Overview donut — one count per JOB_STATUS key ─────────────────
    const statusCounts = await Job.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const jobsOverview = statusCounts.map(s => ({ status: s._id, count: s.count }));

    // ── Jobs by Type donut / Jobs by Category bars — same grouping ─────────
    const typeCounts = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, type: { $in: JOB_TYPES } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const jobsByType = JOB_TYPES.map(type => ({
      type,
      count: typeCounts.find(t => t._id === type)?.count || 0,
    }));

    // ── Top Revenue by Service — sum of job.amount grouped by type ─────────
    const revenueByType = await Job.aggregate([
      { $match: { isDeleted: { $ne: true }, type: { $in: JOB_TYPES }, amount: { $gt: 0 } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);
    const topRevenueByService = revenueByType.map(r => ({ type: r._id, total: r.total }));

    // ── Recent Jobs — last 4, newest first ──────────────────────────────────
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

    // ── Field Technicians — active list for the sidebar panel ──────────────
    const techniciansRaw = await Technician.find({ isDeleted: { $ne: true }, isActive: true })
      .select('name area status')
      .limit(6);
    const technicians = techniciansRaw.map(t => ({
      id: t._id.toString(),
      name: t.name,
      area: t.area || '',
      status: t.status, // NOTE: can be 'on_leave', which TECH_STATUS in statusMaps.js doesn't currently have an entry for
    }));

    // ── Revenue Overview chart — last 6 months of paid invoice totals ──────
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyAgg = await Invoice.aggregate([
      { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          total: { $sum: '$total' },
        },
      },
    ]);
    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueMonthly = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const found = monthlyAgg.find(x => x._id.y === d.getFullYear() && x._id.m === d.getMonth() + 1);
      return { m: MONTH_LABELS[d.getMonth()], v: found?.total || 0 };
    });

    // ── Recent Activity — logged-in admin's own notifications, unread first ─
    const recentActivityRaw = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 }) // isRead:1 puts false (unread) before true — same "unread first" order the mock used
      .limit(4)
      .select('title type icon isRead createdAt');
    const recentActivity = recentActivityRaw.map(n => ({
      id: n._id.toString(),
      title: n.title,
      type: n.type,
      icon: n.icon || null, // Notification.icon is optional — frontend falls back to NOTIF_TYPE_CFG's icon per type if this is null
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
        topRevenueByService,
        recentJobs,
        technicians,
        revenueMonthly,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
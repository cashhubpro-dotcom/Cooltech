// controllers/technicianLeaveController.js
import Leave from '../models/leaveModel.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

const calcDays = (from, to) => {
  const diff = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  return diff > 0 ? diff : 1;
};

// Shape a Leave doc the same way the technician frontend expects
// (mirrors admin's getLeaves mapping so both panels stay consistent).
const toRow = (l) => ({
  id:           l._id.toString(),
  type:         l.type,
  from: (l.from || l.startDate) ? new Date(l.from || l.startDate).toISOString().slice(0, 10) : '',
  to:   (l.to   || l.endDate)   ? new Date(l.to   || l.endDate).toISOString().slice(0, 10)   : '',
  days:         l.days || 0,
  reason:       l.reason || '',
  status:       l.status,
  approvedBy:   l.approvedBy || '',
  approvalNote: l.approvalNote || '',
  appliedOn:    l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : '',
});

// Sum approved days per type for a technician, for the current calendar year.
const usedByType = async (technicianId) => {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const rows = await Leave.aggregate([
    { $match: { technician: technicianId, status: 'approved', from: { $gte: yearStart } } },
    { $group: { _id: '$type', used: { $sum: '$days' } } },
  ]);
  return Object.fromEntries(rows.map(r => [r._id, r.used]));
};

// GET /api/technician/leaves/balance
export const getMyLeaveBalance = async (req, res) => {
  const totals = req.technician.leaveBalance || { casual: 12, sick: 7, earned: 12 };
  const used = await usedByType(req.technician._id);

  const build = (type) => {
    const total = totals[type] ?? 0;
    const u = used[type] || 0;
    return { total, used: u, balance: Math.max(total - u, 0) };
  };

  ok(res, { casual: build('casual'), sick: build('sick'), earned: build('earned') });
};

// GET /api/technician/leaves?search=&type=&status=&page=1&limit=10
export const getMyLeaves = async (req, res) => {
  const { search = '', type, status, page = 1, limit = 10 } = req.query;
  const q = { technician: req.technician._id };
  if (search) q.reason = { $regex: search, $options: 'i' };
  if (type   && type   !== 'all') q.type   = type;
  if (status && status !== 'all') q.status = status;

  const leaves = await Leave.find(q)
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);

  ok(res, leaves.map(toRow));
};

// GET /api/technician/leaves/:id
export const getMyLeaveById = async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, technician: req.technician._id });
  if (!leave) return err(res, 'Leave request not found', 404);
  ok(res, toRow(leave));
};

// POST /api/technician/leaves
export const applyLeave = async (req, res) => {
  const { type, from, to, reason } = req.body;
  if (!type || !from || !to || !reason) return err(res, 'All fields are required', 400);

  const days = calcDays(from, to);
  if (days <= 0) return err(res, 'End date must be on or after the start date', 400);

  // Own-record overlap check only (not a global one — matches "my leaves" scope)
  const overlap = await Leave.findOne({
    technician: req.technician._id,
    status: { $ne: 'rejected' },
    from: { $lte: new Date(to) },
    to:   { $gte: new Date(from) },
  });
  if (overlap) return err(res, 'You already have a leave request overlapping these dates', 400);

  // Balance check
  const totals = req.technician.leaveBalance || { casual: 12, sick: 7, earned: 12 };
  const used = await usedByType(req.technician._id);
  const available = Math.max((totals[type] ?? 0) - (used[type] || 0), 0);
  if (days > available)
    return err(res, `Insufficient ${type} leave balance. You have ${available} day(s) left.`, 400);

  const leave = await Leave.create({
    technician:     req.technician._id,
    technicianName: req.technician.name,
    techName:       req.technician.name, // legacy field support
    type, from, to,
    startDate: from, endDate: to,        // legacy field support
    days, reason,
    status: 'pending',
  });

  ok(res, toRow(leave), 201);
};

// PUT /api/technician/leaves/:id  (only while status === 'pending')
export const updateMyLeave = async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, technician: req.technician._id });
  if (!leave) return err(res, 'Leave request not found', 404);
  if (leave.status !== 'pending') return err(res, 'Only pending requests can be edited', 400);

  const { type, from, to, reason } = req.body;
  const days = (from && to) ? calcDays(from, to) : leave.days;
  if (days <= 0) return err(res, 'End date must be on or after the start date', 400);

  leave.type = type ?? leave.type;
  leave.from = from ?? leave.from;
  leave.to   = to   ?? leave.to;
  leave.startDate = leave.from;
  leave.endDate   = leave.to;
  leave.days   = days;
  leave.reason = reason ?? leave.reason;
  await leave.save();

  ok(res, toRow(leave));
};

// DELETE /api/technician/leaves/:id  (withdraw — only while status === 'pending')
export const withdrawMyLeave = async (req, res) => {
  const leave = await Leave.findOne({ _id: req.params.id, technician: req.technician._id });
  if (!leave) return err(res, 'Leave request not found', 404);
  if (leave.status !== 'pending') return err(res, 'Only pending requests can be withdrawn', 400);

  await leave.deleteOne();
  ok(res, { message: 'Leave request withdrawn' });
};
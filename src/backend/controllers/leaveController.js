import Leave from '../models/leaveModel.js';

const calcDays = (from, to) => {
  const diff = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
  return diff > 0 ? diff : 1;
};

// ── shape every response so leavesApi gets { data: [...] } ──────────────────
const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

// GET /api/leaves?search=&type=&status=&page=1&limit=10
export const getLeaves = async (req, res) => {
  try {
    const { search = '', type, status, page = 1, limit = 10 } = req.query;
    const q = {};
    if (search) q.$or = [
      { technicianName: { $regex: search, $options: 'i' } },
      { reason:         { $regex: search, $options: 'i' } },
      { type:           { $regex: search, $options: 'i' } },
    ];
    if (type   && type   !== 'all') q.type   = type;
    if (status && status !== 'all') q.status = status;

    const total  = await Leave.countDocuments(q);
    const leaves = await Leave.find(q)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .populate('technician', 'name');

    // map to shape leavesApi / table expects: { id, tech, type, from, to, days, reason, approvedBy, status }

    const data = leaves.map(l => ({
  id:             l.leaveId || l._id.toString(),
  _id:            l._id.toString(),
  // ↓ handle both old (techName) and new (technicianName) schema
  tech:           l.technicianName || l.techName || l.technician?.name || '?',
  technicianName: l.technicianName || l.techName || '',
  type:           l.type,
  // ↓ handle both old (startDate/endDate) and new (from/to) schema
  from: (l.from || l.startDate)
          ? new Date(l.from || l.startDate).toISOString().slice(0, 10)
          : '',
  to:   (l.to   || l.endDate)
          ? new Date(l.to   || l.endDate).toISOString().slice(0, 10)
          : '',
  days:        l.days || 0,
  reason:      l.reason || '',
  approvedBy:  l.approvedBy || '',
  approvalNote: l.approvalNote || '',
  status:      l.status,
  createdAt:   l.createdAt,
}));

    res.json({ success: true, data, pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } });
  } catch (e) { err(res, e.message); }
};

// GET /api/leaves/stats
export const getLeaveStats = async (req, res) => {
  try {
    const now           = new Date();
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
    const today         = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow      = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [pending, approvedThisMonth, totalDaysAgg, onLeaveToday] = await Promise.all([
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved', approvedAt: { $gte: startOfMonth } }),
      Leave.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: null, total: { $sum: '$days' } } }]),
      Leave.countDocuments({ status: 'approved', from: { $lte: tomorrow }, to: { $gte: today } }),
    ]);

    ok(res, { pending, approvedThisMonth, totalDays: totalDaysAgg[0]?.total || 0, onLeaveToday });
  } catch (e) { err(res, e.message); }
};

// GET /api/leaves/:id
export const getLeaveById = async (req, res) => {
  try {
    const l = await Leave.findById(req.params.id).populate('technician', 'name');
    if (!l) return err(res, 'Leave not found', 404);
    ok(res, l);
  } catch (e) { err(res, e.message); }
};

// POST /api/leaves
export const createLeave = async (req, res) => {
  try {
    const { technician, technicianName, techName, type, from, to, startDate, endDate, reason } = req.body;
    
    const resolvedName = technicianName || techName || '';
    const resolvedFrom = from || startDate;
    const resolvedTo   = to   || endDate;

    if (!resolvedName || !type || !resolvedFrom || !resolvedTo || !reason)
      return err(res, 'All fields are required', 400);

    const days = calcDays(resolvedFrom, resolvedTo);
    if (days <= 0) return err(res, 'End date must be after start date', 400);

    const overlap = await Leave.findOne({
      $or: [{ technicianName: resolvedName }, { techName: resolvedName }],
      status: { $ne: 'rejected' },
      $or: [
        { from: { $lte: new Date(resolvedTo) }, to: { $gte: new Date(resolvedFrom) } },
        { startDate: { $lte: new Date(resolvedTo) }, endDate: { $gte: new Date(resolvedFrom) } },
      ],
    });
    if (overlap) return err(res, 'Overlapping leave already exists', 400);

    const leave = await Leave.create({
      technician,
      technicianName: resolvedName,
      techName:       resolvedName,   // ← save to both
      type,
      from:      resolvedFrom,
      to:        resolvedTo,
      startDate: resolvedFrom,        // ← save to both
      endDate:   resolvedTo,          // ← save to both
      days,
      reason,
    });

    ok(res, {
      id:   leave.leaveId || leave._id.toString(),
      _id:  leave._id.toString(),
      tech: leave.technicianName || leave.techName,
      from: new Date(leave.from || leave.startDate).toISOString().slice(0, 10),
      to:   new Date(leave.to   || leave.endDate).toISOString().slice(0, 10),
      ...leave.toObject(),
    }, 201);
  } catch (e) { err(res, e.message); }
};

// PUT /api/leaves/:id
export const updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return err(res, 'Leave not found', 404);
    if (leave.status !== 'pending') return err(res, 'Only pending leaves can be edited', 400);

    const { type, from, to, reason, technicianName } = req.body;
    const days = from && to ? calcDays(from, to) : leave.days;
    const updated = await Leave.findByIdAndUpdate(req.params.id, { type, from, to, reason, days, technicianName }, { new: true });
    ok(res, { id: updated._id.toString(), tech: updated.technicianName, ...updated.toObject() });
  } catch (e) { err(res, e.message); }
};

// DELETE /api/leaves/:id
export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return err(res, 'Leave not found', 404);
    ok(res, { message: 'Leave deleted successfully' });
  } catch (e) { err(res, e.message); }
};

// PATCH /api/leaves/:id/approve
export const approveLeave = async (req, res) => {
  try {
    const { approvedBy = 'Admin User', note = '' } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave)               return err(res, 'Leave not found', 404);
    if (leave.status !== 'pending') return err(res, 'Leave is not pending', 400);

    leave.status      = 'approved';
    leave.approvedBy  = approvedBy;
    leave.approvalNote = note;
    leave.approvedAt  = new Date();
    await leave.save();

    ok(res, { id: leave._id.toString(), tech: leave.technicianName, ...leave.toObject() });
  } catch (e) { err(res, e.message); }
};

// PATCH /api/leaves/:id/reject
export const rejectLeave = async (req, res) => {
  try {
    const { note = '' } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave)               return err(res, 'Leave not found', 404);
    if (leave.status !== 'pending') return err(res, 'Leave is not pending', 400);

    leave.status       = 'rejected';
    leave.approvalNote = note;
    leave.rejectedAt   = new Date();
    await leave.save();

    ok(res, { id: leave._id.toString(), tech: leave.technicianName, ...leave.toObject() });
  } catch (e) { err(res, e.message); }
};
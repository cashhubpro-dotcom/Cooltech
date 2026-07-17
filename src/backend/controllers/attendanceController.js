import AttendanceSession from '../models/AttendanceSession.js';
import ClockSettings     from '../models/ClockSettings.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function calcWorkedMins(clockIn, clockOut, totalBreakSecs) {
  const elapsed = Math.floor((clockOut - clockIn) / 1000);
  return Math.max(0, Math.floor((elapsed - totalBreakSecs) / 60));
}
function calcLateMins(clockInTime, shiftStart) {
  const [sh, sm] = shiftStart.split(':').map(Number);
  return Math.max(0, (clockInTime.getHours() * 60 + clockInTime.getMinutes()) - (sh * 60 + sm));
}
function calcOTMins(workedMins, otThresholdH) {
  return Math.max(0, workedMins - otThresholdH * 60);
}

// ─── CLOCK ACTIONS ────────────────────────────────────────────────────────────

export const clockIn = async (req, res) => {
  try {
    const { userId, ipAddress } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const settings = await ClockSettings.findOne();
    if (settings?.ipEnabled && ipAddress && !settings.allowedIPs.includes(ipAddress)) {
      return res.status(403).json({ error: 'IP not allowed', currentIP: ipAddress });
    }

    const existing = await AttendanceSession.findOne({
      userId, isDeleted: false,
      status: { $in: ['active', 'on_break'] },
    });
    if (existing) return res.status(409).json({ error: 'Already clocked in', session: existing });

    const session = await AttendanceSession.create({
      userId, date: todayStr(), clockInTime: new Date(),
      status: 'active', ipAddress: ipAddress || null, isDeleted: false,
    });
    res.status(201).json({ message: 'Clocked in', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const breakStart = async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await AttendanceSession.findOne({ userId, status: 'active', isDeleted: false });
    if (!session) return res.status(404).json({ error: 'No active session' });
    session.breaks.push({ startTime: new Date() });
    session.status = 'on_break';
    await session.save();
    res.json({ message: 'Break started', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const breakEnd = async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await AttendanceSession.findOne({ userId, status: 'on_break', isDeleted: false });
    if (!session) return res.status(404).json({ error: 'No break session' });
    const now = new Date();
    const last = session.breaks[session.breaks.length - 1];
    if (last && !last.endTime) {
      last.endTime = now;
      last.durationSecs = Math.floor((now - last.startTime) / 1000);
    }
    session.totalBreakSecs = session.breaks.reduce((s, b) => s + (b.durationSecs || 0), 0);
    session.status = 'active';
    await session.save();
    res.json({ message: 'Break ended', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const clockOut = async (req, res) => {
  try {
    const { userId } = req.body;
    const session = await AttendanceSession.findOne({
      userId, isDeleted: false, status: { $in: ['active', 'on_break'] },
    });
    if (!session) return res.status(404).json({ error: 'No active session' });

    const now = new Date();
    if (session.status === 'on_break') {
      const last = session.breaks[session.breaks.length - 1];
      if (last && !last.endTime) {
        last.endTime = now;
        last.durationSecs = Math.floor((now - last.startTime) / 1000);
      }
      session.totalBreakSecs = session.breaks.reduce((s, b) => s + (b.durationSecs || 0), 0);
    }
    const settings = await ClockSettings.findOne();
    session.clockOutTime = now;
    session.workedMins   = calcWorkedMins(session.clockInTime, now, session.totalBreakSecs);
    session.lateMins     = calcLateMins(session.clockInTime, settings?.shiftStart ?? '09:00');
    session.otMins       = calcOTMins(session.workedMins, settings?.otThresholdH ?? 9);
    session.status       = 'complete';
    await session.save();
    res.json({ message: 'Clocked out', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── SESSION CRUD ─────────────────────────────────────────────────────────────

export const getSessions = async (req, res) => {
  try {
    const { userId, date, startDate, endDate, status, page = 1, limit = 20 } = req.query;
    // Only non-deleted docs
    const filter = { isDeleted: false };
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (date)   filter.date   = date;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await AttendanceSession.countDocuments(filter);
    const sessions = await AttendanceSession.find(filter)
      .sort({ clockInTime: -1 }).skip(skip).limit(Number(limit))
      .populate('userId', 'name email role');
    res.json({ total, page: Number(page), limit: Number(limit), sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getActiveSession = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const session = await AttendanceSession.findOne({
      userId, isDeleted: false, status: { $in: ['active', 'on_break'] },
    });
    res.json({ session: session || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await AttendanceSession.findOne({ _id: req.params.id, isDeleted: false })
      .populate('userId', 'name email role');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateSession = async (req, res) => {
  try {
    const allowed = ['clockInTime','clockOutTime','totalBreakSecs','workedMins','lateMins','otMins','status','notes'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.clockInTime || updates.clockOutTime || updates.totalBreakSecs !== undefined) {
      const s = await AttendanceSession.findOne({ _id: req.params.id, isDeleted: false });
      if (!s) return res.status(404).json({ error: 'Session not found' });
      const inTime   = updates.clockInTime   ? new Date(updates.clockInTime)  : s.clockInTime;
      const outTime  = updates.clockOutTime  ? new Date(updates.clockOutTime) : s.clockOutTime;
      const breakSec = updates.totalBreakSecs ?? s.totalBreakSecs;
      if (inTime && outTime) {
        const cfg = await ClockSettings.findOne();
        updates.workedMins = calcWorkedMins(inTime, outTime, breakSec);
        updates.lateMins   = calcLateMins(inTime, cfg?.shiftStart ?? '09:00');
        updates.otMins     = calcOTMins(updates.workedMins, cfg?.otThresholdH ?? 9);
      }
    }
    const session = await AttendanceSession.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session updated', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── SOFT DELETE → Recently Deleted ──────────────────────────────────────────
export const deleteSession = async (req, res) => {
  try {
    const deletedBy = req.user?.name || req.user?.email || 'Admin';
    const session = await AttendanceSession.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy } },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Moved to Recently Deleted', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── GET DELETED — used by DeletedItemsPage ───────────────────────────────────
export const getDeletedSessions = async (req, res) => {
  try {
    // Explicitly query isDeleted: true (no pre-hook interference)
    const sessions = await AttendanceSession.find({ isDeleted: true })
      .sort({ deletedAt: -1 })
      .populate('userId', 'name email role');
    res.json({ data: sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── RESTORE — Recover button in DeletedItemsPage ────────────────────────────
export const restoreSession = async (req, res) => {
  try {
    // Use findById (no isDeleted filter) so we can find the soft-deleted doc
    const session = await AttendanceSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.isDeleted) return res.status(400).json({ error: 'Session is not deleted' });

    session.isDeleted = false;
    session.deletedAt = undefined;
    session.deletedBy = undefined;
    await session.save();

    res.json({ message: 'Session restored', session });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── HARD DELETE — "Delete permanently" in DeletedItemsPage ──────────────────
export const hardDeleteSession = async (req, res) => {
  try {
    // findByIdAndDelete ignores isDeleted — works on any doc
    const session = await AttendanceSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session permanently deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── TEAM STATUS ──────────────────────────────────────────────────────────────
export const getTeamStatus = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({ date: todayStr(), isDeleted: false })
      .populate('userId', 'name role avatar');
    res.json({ sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export const getReports = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const filter = { status: 'complete', isDeleted: false };
    if (userId) filter.userId = userId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }
    const sessions = await AttendanceSession.find(filter).sort({ date: 1 });
    const totalWorkedMins = sessions.reduce((s, r) => s + (r.workedMins || 0), 0);
    const totalOTMins     = sessions.reduce((s, r) => s + (r.otMins    || 0), 0);
    const totalLateDays   = sessions.filter(r => (r.lateMins || 0) > 5).length;
    const avgWorkedMins   = sessions.length ? Math.round(totalWorkedMins / sessions.length) : 0;
    const maxWorkedMins   = sessions.length ? Math.max(...sessions.map(r => r.workedMins || 0)) : 0;
    res.json({ totalSessions: sessions.length, totalWorkedMins, totalOTMins, totalLateDays, avgWorkedMins, maxWorkedMins, sessions });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
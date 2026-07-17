import AttendanceSession    from '../models/AttendanceSession.js';
import ClockSettings        from '../models/ClockSettings.js';
import { Attendance }       from '../models/hrModels.js';
import CorrectionRequest    from '../models/CorrectionRequest.js';
import { syncAttendanceFromSession } from '../utils/syncAttendanceFromSession.js';
import { wrap } from '../utils/wrap.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }
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
const STATUS_TO_CODE = { present: 'P', absent: 'A', half_day: 'HD', holiday: 'H', on_leave: 'L' };
const timeLabel = d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;

// ─── CLOCK ACTIONS — userId always comes from the JWT, never the request body ─

export const clockIn = wrap(async (req, res) => {
  const userId = req.user._id;
  const settings = await ClockSettings.findOne();
  if (settings?.ipEnabled && req.body.ipAddress && !settings.allowedIPs.includes(req.body.ipAddress)) {
    return res.status(403).json({ error: 'IP not allowed', currentIP: req.body.ipAddress });
  }

  const existing = await AttendanceSession.findOne({
    userId, isDeleted: false, status: { $in: ['active', 'on_break'] },
  });
  if (existing) return res.status(409).json({ error: 'Already clocked in', session: existing });

  const session = await AttendanceSession.create({
    userId, date: todayStr(), clockInTime: new Date(),
    status: 'active', ipAddress: req.body.ipAddress || null, isDeleted: false,
  });
  res.status(201).json({ message: 'Clocked in', session });
});

export const breakStart = wrap(async (req, res) => {
  const session = await AttendanceSession.findOne({ userId: req.user._id, status: 'active', isDeleted: false });
  if (!session) return res.status(404).json({ error: 'No active session' });
  session.breaks.push({ startTime: new Date() });
  session.status = 'on_break';
  await session.save();
  res.json({ message: 'Break started', session });
});

export const breakEnd = wrap(async (req, res) => {
  const session = await AttendanceSession.findOne({ userId: req.user._id, status: 'on_break', isDeleted: false });
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
});

export const clockOut = wrap(async (req, res) => {
  const session = await AttendanceSession.findOne({
    userId: req.user._id, isDeleted: false, status: { $in: ['active', 'on_break'] },
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

  await syncAttendanceFromSession(session); // keeps the calendar in sync automatically

  res.json({ message: 'Clocked out', session });
});

// ─── READ-ONLY VIEWS — always filtered to req.user, ignores any id in the query ─

export const getMyActiveSession = wrap(async (req, res) => {
  const session = await AttendanceSession.findOne({
    userId: req.user._id, isDeleted: false, status: { $in: ['active', 'on_break'] },
  });
  res.json({ session: session || null });
});

export const getMySessions = wrap(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 20 } = req.query;
  const filter = { userId: req.user._id, isDeleted: false };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = startDate;
    if (endDate)   filter.date.$lte = endDate;
  }
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await AttendanceSession.countDocuments(filter);
  const sessions = await AttendanceSession.find(filter).sort({ clockInTime: -1 }).skip(skip).limit(Number(limit));
  res.json({ total, page: Number(page), limit: Number(limit), sessions });
});

export const getMyReports = wrap(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { userId: req.user._id, status: 'complete', isDeleted: false };
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
});

// GET /me/summary?month=&year=  — merges the Attendance calendar into the
// exact { dates: { [day]: {...} }, counts: {...} } shape the technician
// calendar UI expects.
export const getMyMonthSummary = wrap(async (req, res) => {
  const month = Number(req.query.month);
  const year  = Number(req.query.year);
  const start = new Date(Date.UTC(year, month, 1));
  const end   = new Date(Date.UTC(year, month + 1, 1));

  const records = await Attendance.find({
    technician: req.technician._id,
    date: { $gte: start, $lt: end },
  }).sort({ date: 1 });

  const dates = {};
  records.forEach(r => {
    dates[r.date.getUTCDate()] = {
      status: STATUS_TO_CODE[r.status] || 'P',
      in: timeLabel(r.clockIn),
      out: timeLabel(r.clockOut),
      hours: r.hoursWorked ? `${r.hoursWorked.toFixed(1)}h` : null,
      late: !!r.notes?.toLowerCase?.().includes('late'),
      note: r.notes || null,
      _id: r._id,
    };
  });

  const counts = {
    P:  records.filter(r => r.status === 'present').length,
    A:  records.filter(r => r.status === 'absent').length,
    HD: records.filter(r => r.status === 'half_day').length,
    H:  records.filter(r => r.status === 'holiday').length,
    L:  records.filter(r => r.status === 'on_leave').length,
  };

  res.json({ dates, counts, month, year });
});

// ─── CORRECTION REQUESTS ──────────────────────────────────────────────────────

export const requestCorrection = wrap(async (req, res) => {
  const { targetDate, reason, sessionId, requestedClockIn, requestedClockOut } = req.body;
  if (!targetDate || !reason?.trim()) {
    return res.status(400).json({ error: 'targetDate and reason are required' });
  }
  const request = await CorrectionRequest.create({
    technician: req.technician._id,
    user: req.user._id,
    session: sessionId || undefined,
    targetDate, reason: reason.trim(),
    requestedClockIn, requestedClockOut,
    status: 'pending',
  });
  res.status(201).json({ message: 'Correction request submitted', request });
});

export const getMyCorrectionRequests = wrap(async (req, res) => {
  const requests = await CorrectionRequest.find({ technician: req.technician._id }).sort({ createdAt: -1 });
  res.json({ requests });
});

// ─── Read-only shift settings (so the UI can show "Shift: 9:00–6:00, OT after 9h") ─
export const getMySettings = wrap(async (req, res) => {
  const settings = await ClockSettings.findOne();
  res.json({ settings: settings || {} });
});
import CorrectionRequest from '../models/CorrectionRequest.js';
import AttendanceSession from '../models/AttendanceSession.js';
import { syncAttendanceFromSession } from '../utils/syncAttendanceFromSession.js';
import { wrap } from '../utils/wrap.js';

// GET /api/attendance/corrections?status=pending
export const listCorrections = wrap(async (req, res) => {
  const { status = 'pending' } = req.query;
  const requests = await CorrectionRequest.find({ status })
    .populate('technician', 'name role')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

// PATCH /api/attendance/corrections/:id  { decision: 'approved' | 'rejected', reviewNote? }
export const reviewCorrection = wrap(async (req, res) => {
  const { decision, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: "decision must be 'approved' or 'rejected'" });
  }

  const request = await CorrectionRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') return res.status(409).json({ error: 'This request was already reviewed' });

  if (decision === 'approved' && request.session) {
    const session = await AttendanceSession.findById(request.session);
    if (session) {
      if (request.requestedClockIn)  session.clockInTime  = new Date(request.requestedClockIn);
      if (request.requestedClockOut) session.clockOutTime = new Date(request.requestedClockOut);
      if (session.clockInTime && session.clockOutTime) {
        const elapsedMins = Math.floor((session.clockOutTime - session.clockInTime) / 60000);
        session.workedMins = Math.max(0, elapsedMins - Math.floor(session.totalBreakSecs / 60));
      }
      await session.save();
      await syncAttendanceFromSession(session);
    }
  }

  request.status     = decision;
  request.reviewedBy  = req.user._id;
  request.reviewedAt  = new Date();
  request.reviewNote  = reviewNote || '';
  await request.save();

  res.json({ message: `Request ${decision}`, request });
});
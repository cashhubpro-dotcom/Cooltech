import { Attendance } from '../models/hrModels.js';
import Technician from '../models/Technician.js';

/**
 * The admin calendar (Attendance: present/absent/half_day/holiday/on_leave)
 * and the clock log (AttendanceSession: real clockIn/clockOut/breaks) used
 * to be two disconnected data sources — an admin had to manually re-mark a
 * day as "Present" even after the technician had already clocked a full
 * shift. This closes that gap: whenever a session is completed (clock-out)
 * or corrected, we upsert the matching Attendance record from it.
 *
 * Attendance.status is only ever set to 'present' / 'half_day' / 'absent'
 * here — 'holiday' and 'on_leave' are left alone since those come from the
 * admin or the Leave workflow, not from a clock session, and a completed
 * session should never silently overwrite an approved leave day.
 */
export async function syncAttendanceFromSession(session) {
  if (!session || session.status !== 'complete' || !session.clockOutTime) return null;

  const technician = await Technician.findOne({ user: session.userId, isDeleted: { $ne: true } });
  if (!technician) return null; // this User has no linked Technician profile — nothing to sync

  const dateObj = new Date(`${session.date}T00:00:00.000Z`);
  const existing = await Attendance.findOne({ technician: technician._id, date: dateObj });
  if (existing && ['holiday', 'on_leave'].includes(existing.status)) return existing;

  const hoursWorked = +(session.workedMins / 60).toFixed(2);
  const status = hoursWorked >= 6 ? 'present' : hoursWorked > 0 ? 'half_day' : 'absent';

  return Attendance.findOneAndUpdate(
    { technician: technician._id, date: dateObj },
    {
      $set: {
        technician: technician._id,
        techName: technician.name,
        date: dateObj,
        status,
        clockIn: session.clockInTime,
        clockOut: session.clockOutTime,
        hoursWorked,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
// utils/payrollCalc.js
export function calcAdvanceDeduction(bucketAdvance, gross, settings, includeAdvances) {
  if (!includeAdvances || !bucketAdvance) return 0;
  if (settings.advanceRecoveryMode === 'full') {
    return bucketAdvance;
  }
  // percent_cap mode — recover up to X% of gross this period, carry the rest
  const cap = Math.round((gross * settings.advanceRecoveryCapPercent) / 100);
  return Math.min(bucketAdvance, cap);
}

// ── NEW ─────────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// "March 2026" → "2026-03", to match AttendanceSession.date's stored prefix.
// NOTE: assumes AttendanceSession.date is stored as "YYYY-MM-DD" — confirm
// against wherever clock-in writes that field; adjust the regex below if not.
export function periodToYearMonth(period) {
  const [monthName, yearStr] = (period || '').split(' ');
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1 || !yearStr) return null;
  return `${yearStr}-${String(idx + 1).padStart(2, '0')}`;
}

// Working days (Mon–Fri) in the given "Month Year" period.
export function getWorkingDays(period) {
  const [monthName, yearStr] = (period || '').split(' ');
  const idx = MONTH_NAMES.indexOf(monthName);
  const year = Number(yearStr);
  if (idx === -1 || !year) return 0;
  const totalDays = new Date(year, idx + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dow = new Date(year, idx, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

// Reduces a technician's AttendanceSession docs for one period into the
// figures a payslip needs. Present days are counted by distinct date (not
// session count) so multiple clock-ins/breaks in one day don't inflate it.
// leaveDates: Set of "YYYY-MM-DD" strings the technician has *approved*
// leave for this month — those days are excluded from LOP even if there's
// no attendance session for them.
export function summarizeAttendance(sessions, { basic, totalDays, otRatePerHour = 0, leaveDates = new Set() }) {
  const presentDates = new Set(
    sessions.filter((s) => s.clockOutTime || s.status === 'complete').map((s) => s.date)
  );
  const presentDays = presentDates.size;

  // Only exclude a leave day if the technician didn't ALSO clock in that
  // day — clocking in overrides a stale/unused leave record.
  const leaveDaysCovered = [...leaveDates].filter((d) => !presentDates.has(d)).length;

  const absentDays = Math.max(totalDays - presentDays - leaveDaysCovered, 0);
  const dailyRate = totalDays > 0 ? basic / totalDays : 0;
  const lop = Math.round(absentDays * dailyRate);

  const otMinsTotal = sessions.reduce((s, r) => s + (r.otMins || 0), 0);
  const overtime = otRatePerHour > 0 ? Math.round((otMinsTotal / 60) * otRatePerHour) : 0;

  return { presentDays, absentDays, leaveDaysCovered, lop, overtime };
}

// ── NEW — Leave support ──────────────────────────────────────────────────
// Expands a Leave doc's [startDate, endDate] into individual "YYYY-MM-DD"
// strings, so it can be compared 1:1 against AttendanceSession.date.
function expandDateRange(startDate, endDate) {
  const dates = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Returns the Set of weekday "YYYY-MM-DD" dates within `yearMonth`
// ("2026-03") that fall under any of the given approved leaves. Weekend
// dates are dropped since totalDays (working days) never counted them
// as attendable in the first place.
export function approvedLeaveDatesForMonth(leaves, yearMonth) {
  const set = new Set();
  for (const lv of leaves) {
    for (const d of expandDateRange(lv.startDate, lv.endDate)) {
      if (!d.startsWith(yearMonth)) continue;
      const dow = new Date(d).getDay();
      if (dow === 0 || dow === 6) continue;
      set.add(d);
    }
  }
  return set;
}
import { useState, useEffect, useMemo, useCallback } from 'react';
import { attendanceApi, techsApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { SectionHdr } from '../../components/ui/Cards';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const YEARS = [2025, 2026, 2027];
const STATUS_CYCLE = ['', 'P', 'A', 'HD', 'L', 'Late', 'H'];
const STATUS_MAP = {
  present: 'P',
  absent: 'A',
  halfday: 'HD',
  'half-day': 'HD',
  half_day: 'HD',
  leave: 'L',
  late: 'Late',
  holiday: 'H',
  P: 'P',
  A: 'A',
  HD: 'HD',
  L: 'L',
  Late: 'Late',
  H: 'H'
};

// Reverse map: display code → backend status string
const CODE_TO_BACKEND = {
  P: 'present',
  A: 'absent',
  HD: 'halfday',
  L: 'leave',
  Late: 'late',
  H: 'holiday',
  '': null
};
const STATUS_META = {
  P: {
    label: 'Present',
    color: "var(--success-text)",
    bg: "var(--success-bg)",
    border: "var(--x16a34a30)"
  },
  A: {
    label: 'Absent',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)",
    border: "var(--xdc262630)"
  },
  HD: {
    label: 'Half Day',
    color: "var(--warning-text)",
    bg: "var(--warning-bg)",
    border: "var(--xb4530930)"
  },
  H: {
    label: 'Holiday',
    color: "var(--purple-text)",
    bg: "var(--purple-bg)",
    border: "var(--x7c3aed30)"
  },
  L: {
    label: 'Leave',
    color: "var(--info-text)",
    bg: "var(--info-bg)",
    border: "var(--x0369a130)"
  },
  Late: {
    label: 'Late',
    color: "var(--warning)",
    bg: "var(--xfef3c7)",
    border: "var(--xd9770630)"
  },
  '': {
    label: '—',
    color: "var(--xcbd5e1)",
    bg: "var(--bg)",
    border: "var(--xe5e7eb20)"
  }
};

// Statuses selectable from the "Mark Today" modal (Late/Holiday are edge cases
// better handled from the day-detail modal, so we keep the "mark today" modal
// focused on the four day-to-day statuses).
const QUICK_STATUS_OPTIONS = ['P', 'A', 'HD', 'L'];

// Statuses selectable from the per-day detail modal (opened by clicking an
// already-marked cell in the grid). Covers every status, including the
// edge cases (Late / Holiday) that the quick "Mark Today" modal skips.
const DAY_DETAIL_OPTIONS = ['P', 'A', 'HD', 'L', 'Late', 'H'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDayOfWeek(day, month, year) {
  return new Date(year, month, day).getDay();
}
function isWeekend(day, month, year) {
  const d = getDayOfWeek(day, month, year);
  return d === 0 || d === 6;
}
function getWorkingDays(month, year) {
  const total = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= total; d++) if (!isWeekend(d, month, year)) count++;
  return count;
}

/**
 * FIX — Elapsed working days.
 *
 * `getWorkingDays` returns the working-day count for the ENTIRE month, which
 * is correct for the "23 working days" info badge but wrong as a denominator
 * for any attendance PERCENTAGE calculation mid-month: a technician present
 * every day so far this month would still show a capped, misleadingly low
 * percentage because the denominator includes days that haven't happened
 * yet. This counts only working days from day 1 through "today" (or through
 * the end of the month, if viewing a past month) — the correct denominator
 * for percentage-of-attendance calculations.
 */
function getElapsedWorkingDays(month, year, today) {
  const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
  if (isFutureMonth) return 0;
  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
  const lastDay = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) if (!isWeekend(d, month, year)) count++;
  return count;
}

/** Build a YYYY-MM-DD string without any timezone conversion */
function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * FIX 1 — Timezone-safe date parsing.
 *
 * `new Date(isoString).getDate()` converts to *local* time, which in IST
 * (UTC+5:30) can push a midnight-UTC record to the previous calendar day.
 * We split the ISO string on 'T' and '-' to get the raw YYYY / MM / DD parts.
 */
function parseISODay(isoString, year, month) {
  if (!isoString) return null;
  const datePart = String(isoString).split('T')[0]; // "2026-05-14"
  const parts = datePart.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1; // 0-indexed
  const d = parseInt(parts[2], 10);
  return y === year && m === month ? d : null;
}

/**
 * FIX 2 — Transform: flat per-day API records → per-technician grouped.
 * Only builds the `dates` map; counters are derived after.
 */
function transformRecords(rawRecords, month, year, techList) {
  const map = {};
  rawRecords.forEach(rec => {
    let techId, name, role;
    if (rec.technician && typeof rec.technician === 'object') {
      techId = String(rec.technician._id || rec.technician.id || '');
      name = rec.technician.name || rec.technician.fullName || rec.technician.username || 'Unknown';
      role = rec.technician.role || rec.technician.department || 'Technician';
    } else {
      techId = String(rec.technician || rec.techId || rec._id || '');
      const local = (techList ?? []).find(t => String(t.id || t._id) === techId);
      name = local?.name || 'Unknown';
      role = local?.role || local?.department || 'Technician';
    }
    if (!techId) return;

    // Timezone-safe day extraction
    const dayNum = rec.date ? parseISODay(rec.date, year, month) : rec.day != null ? Number(rec.day) : null;
    const rawStatus = String(rec.status || '').toLowerCase().trim();
    const code = STATUS_MAP[rec.status] || STATUS_MAP[rawStatus] || '';
    if (!map[techId]) {
      const local = (techList ?? []).find(t => String(t.id || t._id) === techId);
      map[techId] = {
        techId,
        name: local?.name || name,
        role: local?.role || local?.department || role,
        dates: {}
      };
    }
    if (dayNum !== null && code) {
      map[techId].dates[dayNum] = code;
    }
  });
  return Object.values(map).map(withCounters);
}

/** Derive presentDays / absentDays / leaves from dates map */
function withCounters(t) {
  const vals = Object.values(t.dates);
  return {
    ...t,
    presentDays: vals.filter(v => v === 'P').length,
    absentDays: vals.filter(v => v === 'A').length,
    leaves: vals.filter(v => v === 'L').length
  };
}

/** Extract array from any API response wrapper shape */
function extractArray(r) {
  if (!r) return [];
  if (Array.isArray(r)) return r;
  if (Array.isArray(r.data)) return r.data;
  if (Array.isArray(r.attendance)) return r.attendance;
  if (Array.isArray(r.records)) return r.records;
  if (Array.isArray(r.items)) return r.items;
  if (Array.isArray(r.results)) return r.results;
  const first = Object.values(r).find(v => Array.isArray(v));
  return first ?? [];
}

// ─── Legend Pill ──────────────────────────────────────────────────────────────

const LegendPill = ({
  code
}) => {
  const m = STATUS_META[code];
  return <div className="ap-attendance-page-1">
      <div style={{
      color: m.color,
      background: m.bg,
      border: `1px solid ${m.border}`
    }} className="ap-attendance-page-2">
        {code || '—'}
      </div>
      <span className="ap-attendance-page-3">{m.label}</span>
    </div>;
};

// ─── Attendance Cell ──────────────────────────────────────────────────────────
//
// Cells are read-only at rest. A cell is only interactive when it already
// holds a status ("has data") — clicking it opens the DayDetailModal so the
// person can review or change that specific day's record. Blank cells
// (nothing recorded yet — the "orange today outline" / plain grey cells in
// the grid) are never clickable; new attendance can only be entered through
// the "+ Mark Today" / "Mark All Present" actions or by editing an existing
// marked day.
const AttCell = ({
  status,
  onClick,
  isToday,
  isWeekend: weekend,
  saving
}) => {
  const m = STATUS_META[status] || STATUS_META[''];
  const isBlank = !status;
  const clickable = !isBlank && !saving;
  return <div onClick={clickable ? onClick : undefined} title={isBlank ? '' : `${m.label} — click to view / edit`} style={{
    // FIX (dark mode) — was hardcoded '#F1F5F9' / '#CBD5E1' / '#E2E8F0',
    // which never respond to [data-theme="dark"]. Swapped for theme-aware vars.
    background: weekend && isBlank ? 'var(--bg)' : m.bg,
    color: weekend && isBlank ? 'var(--text-faint)' : m.color,
    cursor: saving ? 'wait' : clickable ? 'pointer' : 'default',
    border: `1px solid ${isToday ? COLORS.brand : weekend && isBlank ? 'var(--border)' : m.border}`,
    opacity: saving ? 0.6 : weekend && isBlank ? 0.5 : 1,
    boxShadow: isToday ? "0 0 0 2px var(--xea580c33)" : "none"
  }} onMouseEnter={e => {
    if (clickable) {
      e.currentTarget.style.transform = 'scale(1.18)';
      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    }
  }} onMouseLeave={e => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = isToday ? `0 0 0 2px ${COLORS.brand}33` : 'none';
  }} className="ap-attendance-page-4">
      {saving ? '…' : status === 'Late' ? '⚠' : status === 'H' ? '🎉' : status || (weekend ? '—' : '·')}
    </div>;
};

// ─── Attendance Bar ───────────────────────────────────────────────────────────

const AttBar = ({
  pct
}) => {
  const safe = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
  const color = safe >= 90 ? '#10B981' : safe >= 75 ? COLORS.brand : '#EF4444';
  return <div className="ap-attendance-page-5">
      <div className="ap-attendance-page-6">
        <div style={{
        width: `${safe}%`,
        background: color
      }} className="ap-attendance-page-7" />
      </div>
      <span style={{
      color
    }} className="ap-attendance-page-8">{safe}%</span>
    </div>;
};

// ─── View Toggle Button ───────────────────────────────────────────────────────

const ViewBtn = ({
  active,
  onClick,
  icon,
  label
}) => <button onClick={onClick} title={label} style={{
  border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
  background: active ? "var(--brand)" : "var(--white)",
  color: active ? "white" : "var(--text-muted)"
}} className="ap-attendance-page-9">{icon}</button>;

// ─── Per-Person Card View ─────────────────────────────────────────────────────

const PersonView = ({
  data,
  workingDays
}) => <div className="ap-attendance-page-10">
    {data.map(a => {
    const pct = workingDays > 0 ? Math.round(a.presentDays / workingDays * 100) : 0;
    const lateCount = Object.values(a.dates || {}).filter(v => v === 'Late').length;
    const hdCount = Object.values(a.dates || {}).filter(v => v === 'HD').length;
    const lowAtt = pct < 75;
    return <div key={a.techId} style={{
      // FIX (dark mode) — '#FCA5A520' was a hardcoded translucent red that
      // doesn't shift with the dark palette; COLORS.border also never
      // adapts since it's a plain JS hex, not a CSS var.
      border: `1px solid ${lowAtt ? 'var(--danger-border)' : 'var(--border)'}`,
      boxShadow: lowAtt ? "0 1px 4px var(--xef444420)" : "0 1px 4px rgba(0,0,0,.05)"
    }} className="ap-attendance-page-11">
          {lowAtt && <div className="ap-attendance-page-12" />}
          <div className="ap-attendance-page-13">
            <Avatar name={a.name} size={36} />
            <div>
              <div className="ap-attendance-page-14">{a.name.split(' ')[0]}</div>
              <div className="ap-attendance-page-15">{a.role}</div>
            </div>
          </div>
          <div className="ap-attendance-page-16">
            <div className="ap-attendance-page-17">
              <span className="ap-attendance-page-18">Attendance</span>
              <span style={{
            color: pct >= 90 ? '#16A34A' : pct >= 75 ? COLORS.brand : '#DC2626'
          }} className="ap-attendance-page-19">{pct}%</span>
            </div>
            <div className="ap-attendance-page-20">
              <div style={{
            width: `${pct}%`,
            background: pct >= 90 ? '#10B981' : pct >= 75 ? COLORS.brand : '#EF4444'
          }} className="ap-attendance-page-21" />
            </div>
          </div>
          <div className="ap-attendance-page-22">
            {[{
          label: 'P',
          val: a.presentDays,
          color: '#16A34A',
          bg: '#F0FDF4'
        }, {
          label: 'A',
          val: a.absentDays,
          color: '#DC2626',
          bg: '#FEF2F2'
        }, {
          label: 'HD',
          val: hdCount,
          color: '#B45309',
          bg: '#FFFBEB'
        }, {
          label: 'L',
          val: a.leaves,
          color: '#0369A1',
          bg: '#EFF6FF'
        }].map(s => <div key={s.label} style={{
          background: s.bg
        }} className="ap-attendance-page-23">
                <div style={{
            color: s.color
          }} className="ap-attendance-page-24">{s.val}</div>
                <div style={{
            color: s.color
          }} className="ap-attendance-page-25">{s.label}</div>
              </div>)}
          </div>
          {lateCount > 0 && <div className="ap-attendance-page-26">⚠ {lateCount} late arrival{lateCount > 1 ? 's' : ''}</div>}
        </div>;
  })}
  </div>;

// ─── Summary Table View ───────────────────────────────────────────────────────

const SummaryView = ({
  data,
  workingDays
}) => <div className="ap-attendance-page-27">
    <table className="ap-attendance-page-28">
      <thead>
        <tr className="ap-attendance-page-29">
          {['Technician', 'Role', 'Present', 'Absent', 'Half Day', 'Leave', 'Late', 'Holidays', 'Att %'].map(h => <th key={h} style={{
          textAlign: h === 'Technician' || h === 'Role' ? "left" : "center"
        }} className="ap-attendance-page-30">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((a, i) => {
        const pct = workingDays > 0 ? Math.round(a.presentDays / workingDays * 100) : 0;
        const hd = Object.values(a.dates || {}).filter(v => v === 'HD').length;
        const late = Object.values(a.dates || {}).filter(v => v === 'Late').length;
        const holidays = Object.values(a.dates || {}).filter(v => v === 'H').length;
        const lowAtt = pct < 75;
        return <tr key={a.techId} style={{
          // FIX (dark mode) — hardcoded '#FFF5F5' / '#FAFAFA' / COLORS.white
          // never adapt to [data-theme="dark"]; swapped to theme-aware vars.
          background: lowAtt ? 'var(--danger-bg)' : i % 2 === 0 ? 'var(--white)' : 'var(--bg)'
        }} className="ap-attendance-page-31">
              <td className="ap-attendance-page-32">
                <div className="ap-attendance-page-33">
                  <Avatar name={a.name} size={28} />
                  <span className="ap-attendance-page-34">{a.name}</span>
                  {lowAtt && <span className="ap-attendance-page-35">LOW</span>}
                </div>
              </td>
              <td className="ap-attendance-page-36">{a.role}</td>
              <td className="ap-attendance-page-37"><span className="ap-attendance-page-38">{a.presentDays}</span></td>
              <td className="ap-attendance-page-39"><span className="ap-attendance-page-40">{a.absentDays}</span></td>
              <td className="ap-attendance-page-41"><span className="ap-attendance-page-42">{hd}</span></td>
              <td className="ap-attendance-page-43"><span className="ap-attendance-page-44">{a.leaves}</span></td>
              <td className="ap-attendance-page-45"><span className="ap-attendance-page-46">{late}</span></td>
              <td className="ap-attendance-page-47"><span className="ap-attendance-page-48">{holidays}</span></td>
              <td className="ap-attendance-page-49"><AttBar pct={pct} /></td>
            </tr>;
      })}
      </tbody>
    </table>
  </div>;

// ─── Mark / Edit Attendance For A Date Modal ─────────────────────────────────
//
// Self-contained: targets a specific calendar date — either today (default,
// used by the "+ Mark Today" button) or any past date passed in via
// `targetDate` (used when the person clicks a day-number header in the grid
// to view/edit that whole day's attendance). Pre-fills any statuses already
// saved for that date, and persists each change through the same
// attendanceApi.upsert used by the day-detail modal.

const MarkTodayModal = ({
  roster,
  existingToday,
  targetDate,
  onClose,
  onSaved
}) => {
  const now = targetDate ? new Date(targetDate.year, targetDate.month, targetDate.day) : new Date();
  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const realToday = new Date();
  const isRealToday = now.getFullYear() === realToday.getFullYear() && now.getMonth() === realToday.getMonth() && now.getDate() === realToday.getDate();
  const [selections, setSelections] = useState(() => {
    const init = {};
    roster.forEach(t => {
      init[t.techId] = existingToday[t.techId] || '';
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Close on Escape
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);
  const setStatus = (techId, code) => setSelections(prev => ({
    ...prev,
    [techId]: prev[techId] === code ? '' : code
  }));
  const markAllPresent = () => setSelections(prev => {
    const next = {
      ...prev
    };
    roster.forEach(t => {
      next[t.techId] = 'P';
    });
    return next;
  });
  const clearAll = () => setSelections(prev => {
    const next = {
      ...prev
    };
    roster.forEach(t => {
      next[t.techId] = '';
    });
    return next;
  });
  const markedCount = Object.values(selections).filter(Boolean).length;
  const changedCount = roster.filter(t => (selections[t.techId] || '') !== (existingToday[t.techId] || '')).length;
  const handleSave = async () => {
    if (saving || changedCount === 0) return;
    setSaving(true);
    setErr(null);
    const dateStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    const changed = roster.filter(t => (selections[t.techId] || '') !== (existingToday[t.techId] || ''));
    try {
      await Promise.all(changed.map(t => {
        const code = selections[t.techId] || '';
        return code ? attendanceApi.upsert({
          technician: t.techId,
          date: dateStr,
          status: CODE_TO_BACKEND[code]
        }) : attendanceApi.delete({
          technician: t.techId,
          date: dateStr
        });
      }));
      onSaved();
      onClose();
    } catch (e) {
      console.error('[Attendance] Mark date save failed:', e);
      setErr('Some entries failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <div role="dialog" aria-modal="true" aria-label="Mark attendance" onClick={() => !saving && onClose()} className="ap-attendance-page-50">
      <div onClick={e => e.stopPropagation()} className="ap-attendance-page-51">
        {/* Header */}
        <div className="ap-attendance-page-52">
          <div className="ap-attendance-page-53">
            <div className="ap-attendance-page-54">📅</div>
            <div className="ap-attendance-page-55">
              {isRealToday ? "Mark Today's Attendance" : 'Edit Attendance'}
            </div>
          </div>
          <button onClick={() => !saving && onClose()} aria-label="Close" style={{
          cursor: saving ? "default" : "pointer"
        }} className="ap-attendance-page-56">✕</button>
        </div>

        {/* Date banner */}
        <div className="ap-attendance-page-57">
          <div className="ap-attendance-page-58">
            <span>{isRealToday ? 'Marking attendance for' : 'Viewing / editing attendance for'} <strong>{dateLabel}</strong></span>
            <span className="ap-attendance-page-59">{markedCount}/{roster.length} marked</span>
          </div>

          {err && <div className="ap-attendance-page-60">⚠️ {err}</div>}

          <div className="ap-attendance-page-61">
            <button onClick={clearAll} disabled={saving} style={{
            cursor: saving ? "default" : "pointer"
          }} className="ap-attendance-page-62">Clear all</button>
            <button onClick={markAllPresent} disabled={saving} style={{
            cursor: saving ? "default" : "pointer"
          }} className="ap-attendance-page-63">✓ Mark all Present</button>
          </div>
        </div>

        {/* Roster list */}
        <div className="ap-attendance-page-64">
          {roster.length === 0 && <div className="ap-attendance-page-65">
              No technicians found.
            </div>}
          {roster.map(t => {
          const sel = selections[t.techId] || '';
          const meta = STATUS_META[sel];
          const wasSaved = !!existingToday[t.techId];
          return <div key={t.techId} style={{
            background: sel ? meta.bg : '#FAFAFA',
            border: `1px solid ${sel ? meta.border : COLORS.border}`
          }} className="ap-attendance-page-66">
                <div className="ap-attendance-page-67">
                  <Avatar name={t.name} size={30} />
                  <div className="ap-attendance-page-68">
                    <div className="ap-attendance-page-69">
                      {t.name}
                      {wasSaved && <span className="ap-attendance-page-70">· saved</span>}
                    </div>
                    <div className="ap-attendance-page-71">{t.role}</div>
                  </div>
                </div>
                <div className="ap-attendance-page-72">
                  {QUICK_STATUS_OPTIONS.map(code => {
                const opt = STATUS_META[code];
                const active = sel === code;
                return <button key={code} onClick={() => setStatus(t.techId, code)} disabled={saving} title={opt.label} style={{
                  cursor: saving ? "default" : "pointer",
                  border: `1px solid ${active ? opt.color : COLORS.border}`,
                  background: active ? opt.color : COLORS.white,
                  color: active ? "white" : "var(--text-muted)"
                }} className="ap-attendance-page-73">{opt.label}</button>;
              })}
                </div>
              </div>;
        })}
        </div>

        {/* Footer */}
        <div className="ap-attendance-page-74">
          <button onClick={() => !saving && onClose()} disabled={saving} style={{
          cursor: saving ? "default" : "pointer"
        }} className="ap-attendance-page-75">Cancel</button>
          <button onClick={handleSave} disabled={saving || changedCount === 0} style={{
          background: saving || changedCount === 0 ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
          cursor: saving || changedCount === 0 ? "not-allowed" : "pointer",
          boxShadow: saving || changedCount === 0 ? "none" : "0 3px 10px var(--xea580c40)"
        }} className="ap-attendance-page-76">
            {saving ? '⏳ Saving…' : `Save Attendance${changedCount ? ` (${changedCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>;
};

// ─── Day Detail Modal ─────────────────────────────────────────────────────────
//
// Opened by clicking an already-marked cell in the grid (empty cells are not
// clickable — see AttCell). Shows the technician + exact date being viewed,
// the status currently on file, and lets the person change or clear it.
// Nothing is written until "Save" is pressed, so browsing past attendance
// never risks an accidental change.
const DayDetailModal = ({
  techId,
  techName,
  day,
  month,
  year,
  status,
  onClose,
  onSaved
}) => {
  const dateLabel = new Date(year, month, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const [sel, setSel] = useState(status || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onClose]);
  const changed = sel !== (status || '');
  const handleSave = async () => {
    if (saving || !changed) return;
    setSaving(true);
    setErr(null);
    const dateStr = toDateStr(year, month, day);
    try {
      if (sel) {
        await attendanceApi.upsert({
          technician: techId,
          date: dateStr,
          status: CODE_TO_BACKEND[sel]
        });
      } else {
        await attendanceApi.delete({
          technician: techId,
          date: dateStr
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error('[Attendance] Day detail save failed:', e);
      setErr('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return <div role="dialog" aria-modal="true" aria-label="Attendance detail" onClick={() => !saving && onClose()} className="ap-attendance-page-77">
      <div onClick={e => e.stopPropagation()} className="ap-attendance-page-78">
        {/* Header */}
        <div className="ap-attendance-page-79">
          <div className="ap-attendance-page-80">
            <Avatar name={techName} size={32} />
            <div>
              <div className="ap-attendance-page-81">{techName}</div>
              <div className="ap-attendance-page-82">{dateLabel}</div>
            </div>
          </div>
          <button onClick={() => !saving && onClose()} aria-label="Close" style={{
          cursor: saving ? "default" : "pointer"
        }} className="ap-attendance-page-83">✕</button>
        </div>

        {/* Body */}
        <div className="ap-attendance-page-84">
          {err && <div className="ap-attendance-page-85">⚠️ {err}</div>}
          <div className="ap-attendance-page-86">Status for this day</div>
          <div className="ap-attendance-page-87">
            {DAY_DETAIL_OPTIONS.map(code => {
            const opt = STATUS_META[code];
            const active = sel === code;
            return <button key={code} onClick={() => !saving && setSel(prev => prev === code ? '' : code)} disabled={saving} style={{
              cursor: saving ? "default" : "pointer",
              border: `1px solid ${active ? opt.color : COLORS.border}`,
              background: active ? opt.color : COLORS.white,
              color: active ? "white" : "var(--text-muted)"
            }} className="ap-attendance-page-88">{opt.label}</button>;
          })}
          </div>
          {!status && <div className="ap-attendance-page-89">No record existed for this day — selecting a status will create one.</div>}
        </div>

        {/* Footer */}
        <div className="ap-attendance-page-90">
          <button onClick={() => !saving && onClose()} disabled={saving} style={{
          cursor: saving ? "default" : "pointer"
        }} className="ap-attendance-page-91">Cancel</button>
          <button onClick={handleSave} disabled={saving || !changed} style={{
          background: saving || !changed ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
          cursor: saving || !changed ? "not-allowed" : "pointer"
        }} className="ap-attendance-page-92">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AttendancePage = ({
  openModal
}) => {
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [rawRecords, setRawRecords] = useState([]);
  const [selTech, setSelTech] = useState('all');
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [selDept, setSelDept] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // "+ Mark Today" modal
  const [showMarkToday, setShowMarkToday] = useState(false);
  // Day-column modal — opened by clicking a day-number header in the grid so
  // the person can view/edit that whole day's attendance across every
  // technician (only enabled for today or a previous date).
  const [dateModal, setDateModal] = useState(null); // { year, month, day } | null
  // Day-detail modal — opened by clicking an already-marked grid cell so the
  // person can review or edit that specific technician/day.
  const [dayDetail, setDayDetail] = useState(null); // { techId, techName, day, status } | null

  // ── Technicians (fetched from backend Technician collection) ────────────────
  const [techList, setTechList] = useState([]);
  const [techLoading, setTechLoading] = useState(true);
  const [techError, setTechError] = useState(null);
  const fetchTechnicians = useCallback(() => {
    setTechLoading(true);
    setTechError(null);
    return techsApi.list().then(r => {
      const raw = extractArray(r);
      // Normalize so every technician has an `id` alongside Mongo's `_id`
      setTechList(raw.map(t => ({
        ...t,
        id: t.id || t._id
      })));
    }).catch(err => {
      console.error('[Attendance] Technician fetch error:', err);
      setTechError(err.message || 'Failed to load technicians');
    }).finally(() => setTechLoading(false));
  }, []);
  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // ── Fetch all records (extracted so modals can trigger a refresh too) ───────
  const fetchRecords = useCallback(() => {
    setLoading(true);
    setError(null);
    return attendanceApi.list({
      limit: 500
    }).then(r => {
      const raw = extractArray(r);
      console.log(`[Attendance] ${raw.length} records. Sample:`, raw[0]);
      setRawRecords(raw);
    }).catch(err => {
      console.error('[Attendance] Fetch error:', err);
      setError(err.message || 'Failed to load attendance data');
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ── FIX 2: Re-transform + merge with full technicians list ──────────────────
  //
  // Always seed from the backend technician list so every technician appears
  // even with zero attendance records. Then overlay whatever the API
  // returned for the selected month/year.
  //
  useEffect(() => {
    const transformed = transformRecords(rawRecords, selMonth, selYear, techList);
    const apiMap = Object.fromEntries(transformed.map(t => [t.techId, t]));
    const merged = (techList ?? []).map(t => {
      const id = String(t.id || t._id);
      return apiMap[id] ?? {
        techId: id,
        name: t.name,
        role: t.role || t.department || 'Technician',
        dates: {},
        presentDays: 0,
        absentDays: 0,
        leaves: 0
      };
    });

    // Also include any API-returned techs not in the technician list
    transformed.forEach(t => {
      if (!merged.find(m => m.techId === t.techId)) merged.push(t);
    });
    setLocalData(merged);
  }, [rawRecords, selMonth, selYear, techList]);
  const days = new Date(selYear, selMonth + 1, 0).getDate();
  const workingDays = getWorkingDays(selMonth, selYear);
  // FIX — new denominator for attendance PERCENTAGES only. `workingDays`
  // (whole month) stays as-is for the "23 working days" info badge below.
  const elapsedWorkingDays = getElapsedWorkingDays(selMonth, selYear, today);
  const dayLabels = Array.from({
    length: days
  }, (_, i) => i + 1);
  const todayDate = today.getDate();
  const departments = ['all', ...new Set((techList ?? []).map(t => t.department || 'Field Service'))];
  const shown = useMemo(() => localData.filter(a => selTech === 'all' || a.techId === selTech).filter(a => {
    if (selDept === 'all') return true;
    const tech = (techList ?? []).find(t => String(t.id || t._id) === a.techId);
    return (tech?.department || 'Field Service') === selDept;
  }).filter(a => !search.trim() || a.name.toLowerCase().includes(search.trim().toLowerCase())), [localData, selTech, selDept, search, techList]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalPresent = shown.reduce((s, a) => s + (a.presentDays || 0), 0);
  const totalAbsent = shown.reduce((s, a) => s + (a.absentDays || 0), 0);
  const totalLeave = shown.reduce((s, a) => s + (a.leaves || 0), 0);
  const totalLate = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'Late').length, 0);
  const totalHD = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'HD').length, 0);
  const totalHolidays = shown.reduce((s, a) => s + Object.values(a.dates || {}).filter(v => v === 'H').length, 0);
  // FIX — was dividing by `workingDays` (full month), which understates
  // attendance for any month still in progress. Now uses elapsedWorkingDays.
  const avgAtt = shown.length > 0 && elapsedWorkingDays > 0 ? Math.round(shown.reduce((s, a) => s + (a.presentDays || 0) / elapsedWorkingDays * 100, 0) / shown.length) : 0;

  // ── FIX 4: markAllPresent — optimistic update + backend persist ─────────────
  const markAllPresent = useCallback(() => {
    if (markingAll) return;
    setMarkingAll(true);
    setSaveError(null);
    const dateStr = toDateStr(selYear, selMonth, todayDate);
    setLocalData(prev => prev.map(a => withCounters({
      ...a,
      dates: {
        ...a.dates,
        [todayDate]: 'P'
      }
    })));
    const saves = localData.map(a => attendanceApi.upsert({
      technician: a.techId,
      date: dateStr,
      status: 'present'
    }).catch(err => console.error('[Attendance] markAllPresent failed for', a.name, err)));
    Promise.allSettled(saves).then(() => setMarkingAll(false));
  }, [localData, selYear, selMonth, todayDate, markingAll]);

  // ── FIX 5: "+ Mark Today" opens a real, working modal ───────────────────────
  //
  // The modal always targets today's actual calendar date regardless of which
  // month/year the grid is currently filtered to, and it works out of any
  // already-saved statuses for today from the fetched records.
  const todayByTech = useMemo(() => {
    const transformed = transformRecords(rawRecords, today.getMonth(), today.getFullYear(), techList);
    const map = {};
    transformed.forEach(t => {
      map[t.techId] = (t.dates || {})[today.getDate()] || '';
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRecords, techList]);

  // ── Day-column header click: view/edit any previous (or today's) date ───────
  //
  // Clicking a day number in the grid header opens the same modal used for
  // "+ Mark Today", but pre-loaded with whichever date was clicked, so the
  // person can walk backward from the active date to any earlier day and
  // review or correct the whole team's attendance for it.
  const dateModalExisting = useMemo(() => {
    if (!dateModal) return {};
    const transformed = transformRecords(rawRecords, dateModal.month, dateModal.year, techList);
    const map = {};
    transformed.forEach(t => {
      map[t.techId] = (t.dates || {})[dateModal.day] || '';
    });
    return map;
  }, [rawRecords, techList, dateModal]);
  const fullRoster = useMemo(() => (techList ?? []).map(t => ({
    techId: String(t.id || t._id),
    name: t.name,
    role: t.role || t.department || 'Technician'
  })), [techList]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading || techLoading) return <div className="ap-attendance-page-93">
      <div className="ap-attendance-page-94">
        <div className="ap-attendance-page-95">⏳</div>
        Loading attendance data…
      </div>
    </div>;
  if (error || techError) return <div className="ap-attendance-page-96">
      <div className="ap-attendance-page-97">
        <div className="ap-attendance-page-98">⚠️</div>
        <div className="ap-attendance-page-99">Failed to load attendance</div>
        <div className="ap-attendance-page-100">{error || techError}</div>
        <button onClick={() => window.location.reload()} className="ap-attendance-page-101">Retry</button>
      </div>
    </div>;
  const filters = [{
    id: 'tech',
    value: selTech,
    onChange: v => setSelTech(v),
    options: [{
      value: 'all',
      label: 'All Technicians'
    }, ...(techList ?? []).map(t => ({
      value: String(t.id || t._id),
      label: t.name
    }))]
  }, {
    id: 'dept',
    value: selDept,
    onChange: v => setSelDept(v),
    options: departments.map(d => ({
      value: d,
      label: d === 'all' ? 'All Depts' : d
    }))
  }, {
    id: 'month',
    value: selMonth,
    onChange: v => setSelMonth(+v),
    options: MONTHS.map((m, i) => ({
      value: i,
      label: m
    }))
  }, {
    id: 'year',
    value: selYear,
    onChange: v => setSelYear(+v),
    options: YEARS.map(y => ({
      value: y,
      label: String(y)
    }))
  }];
  return <div className="ap-attendance-page-102">

      {/* ── Save-error toast ─────────────────────────────────────────────────── */}
      {saveError && <div className="ap-attendance-page-103">
          <span>⚠️ {saveError}</span>
          <button onClick={() => setSaveError(null)} className="ap-attendance-page-104">✕</button>
        </div>}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="ap-attendance-page-105">
        <div>
          <SectionHdr title="Attendance" sub={`${MONTHS[selMonth]} ${selYear} · ${shown.length} Technician${shown.length !== 1 ? 's' : ''}`} />
          <div className="ap-attendance-page-106">
            <span className="ap-attendance-page-107">
              📅 {workingDays} working days
            </span>
            <span className="ap-attendance-page-108">
              🎉 {days - workingDays} weekends
            </span>
          </div>
        </div>

        <div className="ap-attendance-page-109">
          <div className="ap-attendance-page-110">
            <ViewBtn active={viewMode === 'table'} onClick={() => setViewMode('table')} icon="☰" label="Calendar Grid" />
            <ViewBtn active={viewMode === 'person'} onClick={() => setViewMode('person')} icon="⊞" label="Per-Person Cards" />
            <ViewBtn active={viewMode === 'summary'} onClick={() => setViewMode('summary')} icon="⊟" label="Summary Table" />
          </div>

          <div className="ap-attendance-page-111">
            <span className="ap-attendance-page-112">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search technician…" className="ap-attendance-page-113" />
          </div>

          {filters.map(f => <select key={f.id} value={f.value} onChange={e => f.onChange(e.target.value)} className="ap-attendance-page-114">
              {f.options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
            </select>)}

          <button className="btn ap-attendance-page-115" onClick={() => openModal('report', {
          title: 'Attendance Report',
          format: 'CSV'
        })}>
            Export
          </button>

          <button className="btn ap-attendance-page-116" onClick={markAllPresent} disabled={markingAll} style={{
          cursor: markingAll ? "wait" : "pointer",
          opacity: markingAll ? "0.7" : "1"
        }}>
            {markingAll ? '⏳ Saving…' : '✓ Mark All Present'}
          </button>

          <button className="btn ap-attendance-page-117" onClick={() => setShowMarkToday(true)}>
            + Mark Today
          </button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div className="ap-attendance-page-118">
        {[{
        label: 'Total Present',
        value: totalPresent,
        color: '#16A34A',
        bg: '#ECFDF5',
        icon: '✓'
      }, {
        label: 'Total Absent',
        value: totalAbsent,
        color: '#DC2626',
        bg: '#FEF2F2',
        icon: '✗'
      }, {
        label: 'Half Days',
        value: totalHD,
        color: '#B45309',
        bg: '#FFFBEB',
        icon: '½'
      }, {
        label: 'On Leave',
        value: totalLeave,
        color: '#0369A1',
        bg: '#EFF6FF',
        icon: '📅'
      }, {
        label: 'Late Arrivals',
        value: totalLate,
        color: '#D97706',
        bg: '#FEF3C7',
        icon: '⚠'
      }, {
        label: 'Holidays',
        value: totalHolidays,
        color: '#7C3AED',
        bg: '#F5F3FF',
        icon: '🎉'
      }, {
        label: 'Avg Attendance',
        value: `${avgAtt}%`,
        color: COLORS.brand,
        bg: COLORS.brandL,
        icon: '📊'
      }].map(k => <div key={k.label} className="ap-attendance-page-119">
            <div className="ap-attendance-page-120">
              <div className="ap-attendance-page-121">{k.label}</div>
              <div style={{
            background: k.bg
          }} className="ap-attendance-page-122">{k.icon}</div>
            </div>
            <div style={{
          color: k.color
        }} className="ap-attendance-page-123">{k.value}</div>
          </div>)}
      </div>

      {/* ── Legend ────────────────────────────────────────────────────────────── */}
      {/* Legend is informational only — it no longer doubles as an inline
          "click to cycle" control. Marking attendance now happens exclusively
          through the "+ Mark Today" / "Mark All Present" actions, by clicking
          an already-marked cell to open its day-detail modal, or by clicking
          a day-number header to view/edit that whole day. */}
      <div className="ap-attendance-page-124">
        <span className="ap-attendance-page-125">Legend:</span>
        {Object.keys(STATUS_META).filter(k => k !== '').map(k => <LegendPill key={k} code={k} />)}
        <span className="ap-attendance-page-126">💡 Click a day number to view/edit that whole day · click a marked cell to edit one record</span>
      </div>

      {/* ── Table View ────────────────────────────────────────────────────────── */}
      {viewMode === 'table' && <div className="ap-attendance-page-127">
          <div className="ap-attendance-page-128">
            <table className="ap-attendance-page-129">
              <thead>
                <tr className="ap-attendance-page-130">
                  <th className="ap-attendance-page-131">
                    Technician
                  </th>
                  {dayLabels.map(d => {
                const isToday = d === todayDate && selMonth === today.getMonth() && selYear === today.getFullYear();
                const weekend = isWeekend(d, selMonth, selYear);
                const cellDate = new Date(selYear, selMonth, d);
                const isFuture = cellDate > todayMidnight;
                return <th key={`hd-${d}`} onClick={!isFuture ? () => setDateModal({
                  year: selYear,
                  month: selMonth,
                  day: d
                }) : undefined} title={isFuture ? '' : `Click to view/edit attendance for ${MONTHS[selMonth]} ${d}, ${selYear}`} style={{
                  color: isToday ? 'white' : weekend ? '#A0AEC0' : COLORS.muted,
                  background: isToday ? COLORS.brand : weekend ? '#F8FAFC' : '#F9FAFB',
                  borderRadius: isToday ? "6px" : "0",
                  cursor: isFuture ? "default" : "pointer"
                }} onMouseEnter={e => {
                  if (!isFuture && !isToday) {
                    e.currentTarget.style.background = COLORS.brandL;
                    e.currentTarget.style.color = COLORS.brand;
                  }
                }} onMouseLeave={e => {
                  if (!isFuture && !isToday) {
                    e.currentTarget.style.background = weekend ? '#F8FAFC' : '#F9FAFB';
                    e.currentTarget.style.color = weekend ? '#A0AEC0' : COLORS.muted;
                  }
                }} className="ap-attendance-page-132">{d}</th>;
              })}
                  <th className="ap-attendance-page-133">P</th>
                  <th className="ap-attendance-page-134">A</th>
                  <th className="ap-attendance-page-135">HD</th>
                  <th className="ap-attendance-page-136">L</th>
                  <th className="ap-attendance-page-137">Att %</th>
                </tr>
                <tr className="ap-attendance-page-138">
                  <th className="ap-attendance-page-139">
                    Dept: <span className="ap-attendance-page-140">{selDept === 'all' ? 'All' : selDept}</span>
                  </th>
                  {dayLabels.map(d => {
                const dow = getDayOfWeek(d, selMonth, selYear);
                return <th key={`dn-${d}`} style={{
                  color: dow === 0 || dow === 6 ? "var(--xcbd5e1)" : "var(--text-faint)"
                }} className="ap-attendance-page-141">
                        {DAY_NAMES[dow]}
                      </th>;
              })}
                  <th colSpan={5} />
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 && <tr>
                    <td colSpan={days + 6} className="ap-attendance-page-142">
                      {search ? `No technician found matching "${search}"` : 'No records for this month.'}
                    </td>
                  </tr>}
                {shown.map((tech, ri) => {
              const hd = Object.values(tech.dates || {}).filter(v => v === 'HD').length;
              // FIX — was `/ workingDays`, understating attendance mid-month
              const safePct = elapsedWorkingDays > 0 ? Math.round((tech.presentDays || 0) / elapsedWorkingDays * 100) : 0;
              const lowAtt = safePct < 75;
              // FIX (dark mode) — hardcoded '#FFFBFB' / COLORS.white / '#FAFAFA'
              // never adapt to [data-theme="dark"]; swapped to theme-aware vars.
              const rowBg = lowAtt ? 'var(--danger-bg)' : ri % 2 === 0 ? 'var(--white)' : 'var(--bg)';
              return <tr key={tech.techId} style={{
                background: rowBg
              }} className="ap-attendance-page-143">
                      <td style={{
                  background: rowBg
                }} className="ap-attendance-page-144">
                        <div className="ap-attendance-page-145">
                          <Avatar name={tech.name} size={28} />
                          <div>
                            <div className="ap-attendance-page-146">
                              {tech.name}
                              {lowAtt && <span className="ap-attendance-page-147">LOW</span>}
                            </div>
                            <div className="ap-attendance-page-148">{tech.role}</div>
                          </div>
                        </div>
                      </td>
                      {dayLabels.map(d => {
                  const s = (tech.dates || {})[d] || '';
                  const weekend = isWeekend(d, selMonth, selYear);
                  const isToday = d === todayDate && selMonth === today.getMonth() && selYear === today.getFullYear();
                  return <td key={`${tech.techId}-${d}`} className="ap-attendance-page-149">
                            <AttCell status={s}
                    // Only marked ("has data") cells are clickable — opens
                    // the day-detail modal to view/edit that record.
                    // Blank cells do nothing; new entries go through
                    // "+ Mark Today" / "Mark All Present" instead.
                    onClick={s ? () => setDayDetail({
                      techId: tech.techId,
                      techName: tech.name,
                      day: d,
                      status: s
                    }) : undefined} isToday={isToday} isWeekend={weekend} />
                          </td>;
                })}
                      <td className="ap-attendance-page-150"><span className="ap-attendance-page-151">{tech.presentDays || 0}</span></td>
                      <td className="ap-attendance-page-152"><span className="ap-attendance-page-153">{tech.absentDays || 0}</span></td>
                      <td className="ap-attendance-page-154"><span className="ap-attendance-page-155">{hd}</span></td>
                      <td className="ap-attendance-page-156"><span className="ap-attendance-page-157">{tech.leaves || 0}</span></td>
                      <td className="ap-attendance-page-158"><AttBar pct={safePct} /></td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>
        </div>}

      {viewMode === 'person' && <PersonView data={shown} workingDays={elapsedWorkingDays} />}
      {viewMode === 'summary' && <SummaryView data={shown} workingDays={elapsedWorkingDays} />}

      {/* ── Mark Today's Attendance modal (button-triggered, always "today") ─── */}
      {showMarkToday && <MarkTodayModal roster={fullRoster} existingToday={todayByTech} onClose={() => setShowMarkToday(false)} onSaved={fetchRecords} />}

      {/* ── Date modal — opened via a day-number header click, any past date ─── */}
      {dateModal && <MarkTodayModal roster={fullRoster} existingToday={dateModalExisting} targetDate={dateModal} onClose={() => setDateModal(null)} onSaved={fetchRecords} />}

      {/* ── Day detail modal — view/edit a single marked cell ───────────────── */}
      {dayDetail && <DayDetailModal techId={dayDetail.techId} techName={dayDetail.techName} day={dayDetail.day} month={selMonth} year={selYear} status={dayDetail.status} onClose={() => setDayDetail(null)} onSaved={fetchRecords} />}

    </div>;
};
export default AttendancePage;
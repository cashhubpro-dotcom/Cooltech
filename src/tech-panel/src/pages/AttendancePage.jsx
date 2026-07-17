import { useState, useEffect, useMemo, useCallback } from 'react';

// Adjust this relative path to match where this file lives in your project —
// same depth technicianPortalApi.js itself uses to reach services/api.js
// (its own file uses '../../../services/api', three levels up).
import { techAttendanceApi } from '../services/technicianPortalApi';

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — unchanged from the design pass
   ─────────────────────────────────────────────────────────────────────── */
const C = {
  brand: "var(--brand)",
  brandD: "var(--brand-d)",
  brandL: "var(--brand-xl)",
  brandXL: "var(--brand-l)",
  ink: "var(--h1)",
  ink2: "var(--h2)",
  body: "var(--h2)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  border: "var(--border)",
  line: "var(--bg)",
  bg: "var(--bg)",
  card: "var(--white)",
  green: "var(--success-text)",
  greenD: "var(--success-text)",
  greenBg: "var(--success-bg)",
  greenBd: "var(--success-border)",
  red: "var(--danger-text)",
  redD: "var(--danger-text)",
  redBg: "var(--danger-bg)",
  redBd: "var(--danger-border)",
  amber: "var(--warning-text)",
  amberD: "var(--warning-text)",
  amberBg: "var(--warning-bg)",
  amberBd: "var(--warning-border)",
  purple: "var(--purple-text)",
  purpleBg: "var(--purple-bg)",
  purpleBd: "var(--purple-border)",
  blue: "var(--info-text)",
  blueBg: "var(--info-bg)",
  blueBd: "var(--info-border)"
};
const F = {
  sans: "'Inter','Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif",
  mono: "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace"
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_META = {
  P: {
    label: 'Present',
    short: 'P',
    color: C.green,
    bg: C.greenBg,
    bd: C.greenBd
  },
  A: {
    label: 'Absent',
    short: 'A',
    color: C.red,
    bg: C.redBg,
    bd: C.redBd
  },
  HD: {
    label: 'Half Day',
    short: '½',
    color: C.amber,
    bg: C.amberBg,
    bd: C.amberBd
  },
  H: {
    label: 'Holiday',
    short: 'H',
    color: C.purple,
    bg: C.purpleBg,
    bd: C.purpleBd
  },
  L: {
    label: 'Leave',
    short: 'L',
    color: C.blue,
    bg: C.blueBg,
    bd: C.blueBd
  }
};

/* ────────────────────────────────────────────────────────────────────────
   HELPERS
   ─────────────────────────────────────────────────────────────────────── */
function fmtHMS(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600),
    m = Math.floor(s % 3600 / 60),
    sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}
function fmtMins(mins) {
  if (mins == null) return '—';
  const h = Math.floor(mins / 60),
    m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function timeLabel(d) {
  return d ? new Date(d).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : '—';
}
function isWeekend(day, month, year) {
  const dow = new Date(year, month, day).getDay();
  return dow === 0 || dow === 6;
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}
function mondayOf(d) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}
// Matches the error shape produced by the patched req() in api.js
// (err.message from data.message/data.error, plus err.data = full body).
function errMsg(err, fallback) {
  return err?.data?.message || err?.data?.error || err?.message || (typeof err === 'string' ? err : fallback);
}
const TODAY = new Date();
const YEAR = TODAY.getFullYear();
const MONTH = TODAY.getMonth();
const TODAY_DATE = TODAY.getDate();
const WEEK_START_STR = toISODate(mondayOf(TODAY));
const TODAY_STR = toISODate(TODAY);

/* ────────────────────────────────────────────────────────────────────────
   SMALL UI PRIMITIVES
   ─────────────────────────────────────────────────────────────────────── */
const Toast = ({
  msg,
  onClose
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="tp-toast" role="status">{msg}</div>;
};
const Spinner = ({
  label
}) => <div className="tp-spinner-wrap">
    <div className="tp-spinner" />
    {label && <div className="tp-spinner-label">{label}</div>}
  </div>;
const ErrorBanner = ({
  message,
  onRetry
}) => <div className="tp-error-banner">
    <span>⚠️ {message}</span>
    {onRetry && <button className="tp-btn tp-btn-ghost sm" onClick={onRetry}>Retry</button>}
  </div>;
const KpiCard = ({
  label,
  value,
  icon,
  color,
  bg
}) => <div className="tp-kpi">
    <div className="tp-kpi-top">
      <span className="tp-kpi-label">{label}</span>
      <span className="tp-kpi-icon" style={{
      background: bg
    }}>{icon}</span>
    </div>
    <div className="tp-kpi-value" style={{
    color
  }}>{value}</div>
  </div>;
const NavToggle = ({
  page,
  setPage
}) => <div className="tp-nav">
    <button className={`tp-nav-btn ${page === 'attendance' ? 'active' : ''}`} onClick={() => setPage('attendance')}>
      <span>📅</span> Attendance
    </button>
    <button className={`tp-nav-btn ${page === 'clock' ? 'active' : ''}`} onClick={() => setPage('clock')}>
      <span>⏱</span> Clock In / Out
    </button>
  </div>;

/* Shared "today" duty banner — driven by the real active-session state */
const DutyBanner = ({
  clockStatus,
  clockInAt,
  netSecs,
  onPrimary,
  busy,
  compact
}) => {
  const cfg = {
    in: {
      label: 'Currently On Duty',
      chip: 'ON DUTY',
      color: C.green,
      bg: C.greenBg,
      bd: C.greenBd,
      emoji: '⏱'
    },
    break: {
      label: 'On Break',
      chip: 'ON BREAK',
      color: C.amber,
      bg: C.amberBg,
      bd: C.amberBd,
      emoji: '☕'
    },
    out: {
      label: 'Not Clocked In',
      chip: 'OFF DUTY',
      color: C.red,
      bg: C.redBg,
      bd: C.redBd,
      emoji: '⏸'
    }
  }[clockStatus];
  const dateLabel = TODAY.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return <div className={`tp-card tp-duty ${compact ? 'compact' : ''}`}>
      <div className="tp-duty-left">
        <div className="tp-duty-eyebrow">TODAY — {dateLabel}</div>
        <div className="tp-duty-title">{cfg.emoji} {cfg.label}</div>
        {clockStatus !== 'out' && <div className="tp-duty-sub">
            Clocked in at <strong className="tp-attendance-page-1">{timeLabel(clockInAt)}</strong>
            {!compact && <> · Net time <strong className="tp-attendance-page-2">{fmtHMS(netSecs)}</strong></>}
          </div>}
      </div>
      <div className="tp-duty-right">
        <div className="tp-duty-chip" style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.bd}`,
        color: cfg.color
      }}>
          <div className="tp-duty-chip-icon">{cfg.emoji}</div>
          <div className="tp-duty-chip-label">{cfg.chip}</div>
        </div>
        <button className={`tp-btn ${clockStatus === 'out' ? 'tp-btn-green' : 'tp-btn-red'}`} onClick={onPrimary} disabled={busy}>
          {busy ? '⏳ Working…' : clockStatus === 'out' ? '▶ Clock In' : clockStatus === 'break' ? '▶ Resume & Clock Out' : '⏹ Clock Out'}
        </button>
      </div>
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   MODALS
   ─────────────────────────────────────────────────────────────────────── */
const ModalShell = ({
  onClose,
  width = 440,
  children,
  label
}) => <div className="tp-overlay" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
    <div className="tp-modal" style={{
    maxWidth: width
  }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>;
const DayDetailModal = ({
  day,
  rec,
  month,
  year,
  onClose,
  onRequestCorrection
}) => {
  const label = new Date(year, month, day).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const meta = rec?.status ? STATUS_META[rec.status] : null;
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return <ModalShell onClose={onClose} label="Attendance day detail">
      <div className="tp-modal-header">
        <div>
          <div className="tp-modal-title">{label}</div>
          <div className="tp-modal-sub">Attendance detail</div>
        </div>
        <button className="tp-x" onClick={onClose}>✕</button>
      </div>
      <div className="tp-modal-body">
        {meta ? <>
            <div className="tp-pill" style={{
          color: meta.color,
          background: meta.bg,
          border: `1px solid ${meta.bd}`
        }}>
              {meta.short} · {meta.label}
            </div>
            {rec.in && <div className="tp-detail-grid">
                <div><span>Clock In</span><strong className="tp-attendance-page-3">{rec.in}</strong></div>
                <div><span>Clock Out</span><strong className="tp-attendance-page-4">{rec.out || 'Active'}</strong></div>
                <div><span>Hours Worked</span><strong className="tp-attendance-page-5">{rec.hours || '—'}</strong></div>
                <div><span>Arrival</span><strong style={{
              color: rec.late ? "var(--warning-text)" : "var(--success-text)"
            }}>{rec.late ? 'Late' : 'On time'}</strong></div>
              </div>}
            {rec.note && <div className="tp-note">{rec.note}</div>}
          </> : <div className="tp-empty">No record found for this day.</div>}
      </div>
      <div className="tp-modal-footer">
        <button className="tp-btn tp-btn-ghost" onClick={onClose}>Close</button>
        <button className="tp-btn tp-btn-outline" onClick={() => onRequestCorrection({
        label,
        targetDate: dateStr
      })}>✏️ Request Correction</button>
      </div>
    </ModalShell>;
};
const CorrectionModal = ({
  target,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    if (!reason.trim() || sending) return;
    setSending(true);
    setErr(null);
    try {
      await onSubmit({
        targetDate: target?.targetDate,
        reason: reason.trim(),
        sessionId: target?.sessionId
      });
    } catch (e) {
      setErr(errMsg(e, 'Failed to submit request. Please try again.'));
    } finally {
      setSending(false);
    }
  };
  return <ModalShell onClose={onClose} label="Request attendance correction">
      <div className="tp-modal-header">
        <div>
          <div className="tp-modal-title">Request Correction</div>
          <div className="tp-modal-sub">{target?.label}</div>
        </div>
        <button className="tp-x" onClick={onClose}>✕</button>
      </div>
      <div className="tp-modal-body">
        {err && <div className="tp-modal-error">⚠️ {err}</div>}
        <div className="tp-field-label">What needs to be fixed?</div>
        <textarea className="tp-textarea" rows={4} placeholder="e.g. My clock-out time is wrong — I actually left at 6:45 PM." value={reason} onChange={e => setReason(e.target.value)} />
        <div className="tp-hint">Your supervisor will review this request and update the record if approved.</div>
      </div>
      <div className="tp-modal-footer">
        <button className="tp-btn tp-btn-ghost" onClick={onClose} disabled={sending}>Cancel</button>
        <button className="tp-btn tp-btn-primary" onClick={submit} disabled={!reason.trim() || sending}>
          {sending ? 'Sending…' : 'Submit Request'}
        </button>
      </div>
    </ModalShell>;
};

/* ────────────────────────────────────────────────────────────────────────
   ATTENDANCE PAGE
   ─────────────────────────────────────────────────────────────────────── */
const AttendanceView = ({
  clockStatus,
  clockInAt,
  netSecs,
  onPrimary,
  busy,
  monthLoading,
  monthError,
  dates,
  counts,
  onRetryMonth,
  setDayDetail
}) => {
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const firstDow = new Date(YEAR, MONTH, 1).getDay();
  const workingDaysSoFar = TODAY_DATE - (counts.H || 0);
  const avgAtt = workingDaysSoFar > 0 ? Math.round((counts.P || 0) / workingDaysSoFar * 100) : 0;
  return <>
      <DutyBanner clockStatus={clockStatus} clockInAt={clockInAt} netSecs={netSecs} onPrimary={onPrimary} busy={busy} />

      {monthError && <ErrorBanner message={monthError} onRetry={onRetryMonth} />}

      <div className="tp-kpi-row">
        <KpiCard label="Present Days" value={counts.P ?? 0} icon="✅" color={C.green} bg={C.greenBg} />
        <KpiCard label="Absent Days" value={counts.A ?? 0} icon="❌" color={C.red} bg={C.redBg} />
        <KpiCard label="Half Days" value={counts.HD ?? 0} icon="½" color={C.amber} bg={C.amberBg} />
        <KpiCard label="On Leave" value={counts.L ?? 0} icon="📅" color={C.blue} bg={C.blueBg} />
        <KpiCard label="Holidays" value={counts.H ?? 0} icon="🎉" color={C.purple} bg={C.purpleBg} />
        <KpiCard label="Late Arrivals" value={counts.Late ?? 0} icon="⚠" color={C.amber} bg={C.amberBg} />
        <KpiCard label="Attendance %" value={`${avgAtt}%`} icon="📊" color={C.brand} bg={C.brandXL} />
      </div>

      <div className="tp-split">
        <div className="tp-card tp-cal">
          <div className="tp-card-header">
            <div className="tp-card-title">📅 {MONTHS[MONTH]} {YEAR}</div>
            <div className="tp-legend">
              {Object.entries(STATUS_META).map(([k, m]) => <div key={k} className="tp-legend-item">
                  <span className="tp-legend-dot" style={{
                background: m.bg,
                border: `1.5px solid ${m.bd}`
              }} />
                  {m.label}
                </div>)}
            </div>
          </div>
          <div className="tp-card-body">
            {monthLoading ? <Spinner label="Loading your attendance…" /> : <>
                <div className="tp-cal-grid tp-cal-labels">
                  {DAY_NAMES.map(d => <div key={d} className="tp-cal-daylabel">{d}</div>)}
                </div>
                <div className="tp-cal-grid">
                  {Array.from({
                length: firstDow
              }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({
                length: daysInMonth
              }, (_, i) => {
                const day = i + 1;
                const rec = dates[day];
                const meta = rec ? STATUS_META[rec.status] : null;
                const today = day === TODAY_DATE;
                const weekend = isWeekend(day, MONTH, YEAR);
                const future = day > TODAY_DATE;
                const clickable = !!rec;
                return <button key={day} className={`tp-cal-cell ${today ? 'today' : ''} ${clickable ? 'clickable' : ''}`} onClick={clickable ? () => setDayDetail({
                  day,
                  rec
                }) : undefined} style={{
                  background: meta ? meta.bg : today ? C.brandXL : weekend ? '#F8FAFC' : '#FBFBFC',
                  color: meta ? meta.color : today ? C.brand : weekend ? C.faint : C.faint,
                  borderColor: today ? C.brand : meta ? meta.bd : 'transparent',
                  cursor: clickable ? "pointer" : "default",
                  opacity: future ? "0.55" : "1"
                }} title={meta ? `${meta.label} — click for details` : ''}>
                        <span className="tp-cal-num">{day}</span>
                        {meta && <span className="tp-cal-tag">{meta.short}</span>}
                        {rec?.late && <span className="tp-cal-late">⚠</span>}
                      </button>;
              })}
                </div>
              </>}
          </div>
        </div>

        <div className="tp-card tp-records">
          <div className="tp-card-header"><div className="tp-card-title">🕐 Recent Clock Records</div></div>
          {monthLoading ? <Spinner label="Loading records…" /> : <div className="tp-record-list">
              {Object.entries(dates).sort((a, b) => b[0] - a[0]).filter(([, r]) => r.in).slice(0, 6).map(([day, r]) => <div key={day} className="tp-record-item">
                    <div className="tp-record-top">
                      <span className="tp-record-date">{MONTHS[MONTH].slice(0, 3)} {day}</span>
                      <span className="tp-mini-badge tp-attendance-page-6">P</span>
                    </div>
                    <div className="tp-record-bottom">
                      <span>In: <strong className="tp-attendance-page-7">{r.in}</strong></span>
                      <span>Out: <strong style={{
                  color: r.out ? "var(--danger-text)" : "var(--faint)"
                }}>{r.out || 'Active'}</strong></span>
                      {r.hours && <span className="tp-record-hours">{r.hours}</span>}
                    </div>
                    {r.late && <div className="tp-record-late">⚠ Late arrival</div>}
                  </div>)}
              <div className="tp-record-item">
                <div className="tp-record-top">
                  <span className="tp-record-date">{MONTHS[MONTH].slice(0, 3)} {TODAY_DATE} (Today)</span>
                  <span className="tp-mini-badge" style={{
                background: clockStatus === 'out' ? "var(--danger-bg)" : "var(--success-bg)",
                color: clockStatus === 'out' ? "var(--danger-text)" : "var(--success-text)",
                border: `1px solid ${clockStatus === 'out' ? C.redBd : C.greenBd}`
              }}>{clockStatus === 'out' ? '—' : 'P'}</span>
                </div>
                <div className="tp-record-bottom">
                  <span>In: <strong className="tp-attendance-page-8">{clockStatus !== 'out' ? timeLabel(clockInAt) : '—'}</strong></span>
                  <span>Out: <strong className="tp-attendance-page-9">{clockStatus === 'out' ? '—' : 'Active'}</strong></span>
                  {clockStatus !== 'out' && <span className="tp-record-hours">{fmtHMS(netSecs)}</span>}
                </div>
              </div>
            </div>}
        </div>
      </div>
    </>;
};

/* ────────────────────────────────────────────────────────────────────────
   CLOCK IN / OUT PAGE
   ─────────────────────────────────────────────────────────────────────── */
const ClockView = ({
  clockStatus,
  clockInAt,
  netSecs,
  breakSecs,
  onPrimary,
  onBreak,
  busy,
  openCorrection
}) => {
  const [tab, setTab] = useState('today');
  const [weekMins, setWeekMins] = useState(null);
  const [weekLoading, setWeekLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const [reportsLoaded, setReportsLoaded] = useState(false);

  // "This Week" stat — loaded once on mount
  useEffect(() => {
    let cancelled = false;
    setWeekLoading(true);
    techAttendanceApi.reports({
      startDate: WEEK_START_STR,
      endDate: TODAY_STR
    }).then(data => {
      if (!cancelled) setWeekMins(data.totalWorkedMins || 0);
    }).catch(() => {
      if (!cancelled) setWeekMins(null);
    }).finally(() => {
      if (!cancelled) setWeekLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    setHistoryError(null);
    return techAttendanceApi.sessions({
      limit: 20
    }).then(data => {
      setHistory(data.sessions || []);
      setHistoryLoaded(true);
    }).catch(err => setHistoryError(errMsg(err, 'Failed to load history.'))).finally(() => setHistoryLoading(false));
  }, []);
  const loadReports = useCallback(() => {
    setReportsLoading(true);
    setReportsError(null);
    return techAttendanceApi.reports().then(data => {
      setReports(data);
      setReportsLoaded(true);
    }).catch(err => setReportsError(errMsg(err, 'Failed to load reports.'))).finally(() => setReportsLoading(false));
  }, []);

  // Tab-driven lazy loads, same pattern as the admin ClockInOutPage
  useEffect(() => {
    if (tab === 'history' && !historyLoaded) loadHistory();
    if (tab === 'reports' && !reportsLoaded) loadReports();
  }, [tab, historyLoaded, reportsLoaded, loadHistory, loadReports]);
  return <>
      <DutyBanner clockStatus={clockStatus} clockInAt={clockInAt} netSecs={netSecs} onPrimary={onPrimary} busy={busy} />

      {clockStatus !== 'out' && <div className="tp-break-row">
          <button className="tp-btn tp-btn-amber" onClick={onBreak} disabled={busy}>
            {clockStatus === 'break' ? '▶ Resume Work' : '⏸ Start Break'}
          </button>
          {clockStatus === 'break' && <span className="tp-break-live">Break running · {fmtHMS(breakSecs)}</span>}
        </div>}

      <div className="tp-kpi-row five">
        <KpiCard label="Today Worked" value={clockStatus !== 'out' ? fmtHMS(netSecs) : '—'} icon="⏱" color="#3B82F6" bg="#EFF6FF" />
        <KpiCard label="Break Taken" value={fmtMins(Math.floor(breakSecs / 60))} icon="☕" color={C.amber} bg={C.amberBg} />
        <KpiCard label="Overtime Today" value={netSecs > 9 * 3600 ? fmtHMS(netSecs - 9 * 3600) : '—'} icon="⚡" color={netSecs > 9 * 3600 ? C.brandD : C.faint} bg={netSecs > 9 * 3600 ? C.brandXL : C.bg} />
        <KpiCard label="Clocked In At" value={clockStatus !== 'out' ? timeLabel(clockInAt) : '—'} icon="🕘" color={C.brand} bg={C.brandXL} />
        <KpiCard label="This Week" value={weekLoading ? '…' : fmtMins(weekMins)} icon="📅" color={C.purple} bg={C.purpleBg} />
      </div>

      <div className="tp-tabbar">
        {[['today', '📋 Today'], ['history', '📊 History'], ['reports', '📈 Reports']].map(([id, lbl]) => <button key={id} className={`tp-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>)}
      </div>

      {tab === 'today' && <div className="tp-card">
          <div className="tp-card-header">
            <div className="tp-card-title">Today's Attendance Log</div>
            <div className="tp-muted-sm">{TODAY.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}</div>
          </div>
          <div className="tp-table-wrap">
            <table className="tp-table">
              <thead><tr><th>Event</th><th>Time</th><th>Duration</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                {clockStatus !== 'out' ? <tr>
                    <td className="strong">Clock In</td>
                    <td className="mono tp-attendance-page-10">{timeLabel(clockInAt)}</td>
                    <td className="mono">{fmtHMS(netSecs)}</td>
                    <td><span className="tp-badge tp-attendance-page-11">● {clockStatus === 'break' ? 'On Break' : 'Active'}</span></td>
                    <td className="faint">On time</td>
                  </tr> : <tr><td colSpan={5} className="tp-empty-row">No attendance recorded today yet. Tap Clock In to start.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>}

      {tab === 'history' && <div className="tp-card">
          <div className="tp-card-header"><div className="tp-card-title">Attendance History</div></div>
          {historyLoading ? <Spinner label="Loading history…" /> : historyError ? <ErrorBanner message={historyError} onRetry={loadHistory} /> : <div className="tp-table-wrap">
              <table className="tp-table">
                <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Break</th><th>Net Work</th><th>Overtime</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {history.length === 0 && <tr><td colSpan={8} className="tp-empty-row">No completed sessions yet.</td></tr>}
                  {history.map(s => <tr key={s._id}>
                      <td className="strong">{s.date}</td>
                      <td className="mono tp-attendance-page-12">
                        {timeLabel(s.clockInTime)}
                        {s.lateMins > 5 && <div className="tp-late-tag">⏰ Late {s.lateMins}m</div>}
                      </td>
                      <td className="mono tp-attendance-page-13">{s.clockOutTime ? timeLabel(s.clockOutTime) : 'Active'}</td>
                      <td className="faint">{Math.floor((s.totalBreakSecs || 0) / 60)}m</td>
                      <td className="mono strong">{fmtMins(s.workedMins)}</td>
                      <td>{s.otMins > 0 ? <span className="tp-badge tp-attendance-page-14">⚡ +{fmtMins(s.otMins)}</span> : <span className="faint">—</span>}</td>
                      <td><span className="tp-badge tp-attendance-page-15">{s.status === 'complete' ? '✓ Complete' : s.status}</span></td>
                      <td>
                        <button className="tp-btn tp-btn-outline sm" onClick={() => openCorrection({
                  label: s.date,
                  targetDate: s.date,
                  sessionId: s._id
                })}>
                          Request Correction
                        </button>
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>}
        </div>}

      {tab === 'reports' && <div className="tp-stack">
          {reportsLoading ? <Spinner label="Loading reports…" /> : reportsError ? <ErrorBanner message={reportsError} onRetry={loadReports} /> : reports && <>
              <div className="tp-kpi-row four">
                <KpiCard label="Total Hours" value={fmtMins(reports.totalWorkedMins)} icon="⏱" color="#3B82F6" bg="#EFF6FF" />
                <KpiCard label="Overtime" value={fmtMins(reports.totalOTMins)} icon="⚡" color={reports.totalOTMins > 0 ? C.brandD : C.faint} bg={reports.totalOTMins > 0 ? C.brandXL : C.bg} />
                <KpiCard label="Late Arrivals" value={`${reports.totalLateDays} day${reports.totalLateDays !== 1 ? 's' : ''}`} icon="🕐" color={C.amber} bg={C.amberBg} />
                <KpiCard label="Avg Daily Hours" value={fmtMins(reports.avgWorkedMins)} icon="📊" color={C.purple} bg={C.purpleBg} />
              </div>
              <div className="tp-card">
                <div className="tp-card-header"><div className="tp-card-title">Session Breakdown</div></div>
                <div className="tp-table-wrap">
                  <table className="tp-table">
                    <thead><tr><th>Date</th><th>In</th><th>Out</th><th>Work</th><th>Break</th><th>Overtime</th><th>Efficiency</th></tr></thead>
                    <tbody>
                      {(reports.sessions || []).length === 0 && <tr><td colSpan={7} className="tp-empty-row">No completed sessions in range.</td></tr>}
                      {(reports.sessions || []).map(s => {
                  const eff = Math.min(100, Math.round(Math.min(s.workedMins || 0, 540) / 540 * 100));
                  return <tr key={s._id}>
                            <td className="strong">{s.date}</td>
                            <td className="mono tp-attendance-page-16">{timeLabel(s.clockInTime)}</td>
                            <td className="mono tp-attendance-page-17">{s.clockOutTime ? timeLabel(s.clockOutTime) : 'Active'}</td>
                            <td className="mono strong">{fmtMins(s.workedMins)}</td>
                            <td className="faint">{Math.floor((s.totalBreakSecs || 0) / 60)}m</td>
                            <td>{s.otMins > 0 ? <span className="tp-badge tp-attendance-page-18">+{fmtMins(s.otMins)}</span> : <span className="faint">—</span>}</td>
                            <td>
                              <div className="tp-eff">
                                <div className="tp-eff-track"><div className="tp-eff-fill" style={{
                            width: `${eff}%`,
                            background: eff >= 90 ? C.green : eff >= 70 ? C.brand : C.red
                          }} /></div>
                                <span className="mono tp-attendance-page-19" style={{
                          color: eff >= 90 ? C.green : eff >= 70 ? C.brand : C.red
                        }}>{eff}%</span>
                              </div>
                            </td>
                          </tr>;
                })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>}
        </div>}
    </>;
};

/* ────────────────────────────────────────────────────────────────────────
   ROOT COMPONENT
   ─────────────────────────────────────────────────────────────────────── */
const AttendancePage = () => {
  const [page, setPage] = useState('attendance');

  // ── Live session state — sourced from the server, not local mock state ──
  const [session, setSession] = useState(null); // active/on_break session doc, or null if clocked out
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Month calendar summary ──
  const [monthData, setMonthData] = useState({
    dates: {},
    counts: {}
  });
  const [monthLoading, setMonthLoading] = useState(true);
  const [monthError, setMonthError] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [correction, setCorrection] = useState(null);

  // ── Initial + refreshable loaders ──
  const loadSession = useCallback(() => {
    setSessionLoading(true);
    setSessionError(null);
    return techAttendanceApi.activeSession().then(data => setSession(data.session || null)).catch(err => setSessionError(errMsg(err, 'Failed to load your clock status.'))).finally(() => setSessionLoading(false));
  }, []);
  const loadMonth = useCallback(() => {
    setMonthLoading(true);
    setMonthError(null);
    return techAttendanceApi.summary(MONTH, YEAR).then(data => setMonthData({
      dates: data.dates || {},
      counts: data.counts || {}
    })).catch(err => setMonthError(errMsg(err, 'Failed to load your attendance.'))).finally(() => setMonthLoading(false));
  }, []);
  useEffect(() => {
    loadSession();
    loadMonth();
  }, [loadSession, loadMonth]);

  // Live ticking clock while on duty / on break
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const clockStatus = !session ? 'out' : session.status === 'on_break' ? 'break' : 'in';
  const clockInAt = session ? new Date(session.clockInTime) : null;
  const elapsedSecs = session ? Math.floor((tick - clockInAt.getTime()) / 1000) : 0;
  const lastBreak = session?.breaks?.[session.breaks.length - 1];
  const currentBreakSecs = clockStatus === 'break' && lastBreak && !lastBreak.endTime ? Math.floor((tick - new Date(lastBreak.startTime).getTime()) / 1000) : 0;
  const allBreakSecs = (session?.totalBreakSecs || 0) + currentBreakSecs;
  const netSecs = Math.max(0, elapsedSecs - allBreakSecs);

  // ── Clock actions — thin wrappers around the real API, with optimistic
  //    busy state and a full refresh afterward (clock-out auto-syncs the
  //    day's Attendance record server-side, so the calendar needs reloading) ──
  const handlePrimary = useCallback(async () => {
    setBusy(true);
    try {
      if (clockStatus === 'out') {
        const data = await techAttendanceApi.clockIn();
        setSession(data.session);
        setToast('✅ Clocked in successfully!');
      } else {
        const data = await techAttendanceApi.clockOut();
        setSession(null);
        setToast('👋 Clocked out. Have a good evening!');
        loadMonth(); // pick up the auto-synced Attendance record
      }
    } catch (err) {
      // e.g. a 409 "already clocked in" still returns the real session in
      // err.data — recover it so the UI reflects reality instead of just
      // showing an error and staying stuck on stale state.
      if (err?.data?.session) setSession(err.data.session);
      setToast(`⚠️ ${errMsg(err, 'Something went wrong.')}`);
    } finally {
      setBusy(false);
    }
  }, [clockStatus, loadMonth]);
  const handleBreak = useCallback(async () => {
    setBusy(true);
    try {
      if (clockStatus === 'break') {
        const data = await techAttendanceApi.breakEnd();
        setSession(data.session);
        setToast('▶ Back to work!');
      } else {
        const data = await techAttendanceApi.breakStart();
        setSession(data.session);
        setToast('☕ Break started.');
      }
    } catch (err) {
      setToast(`⚠️ ${errMsg(err, 'Something went wrong.')}`);
    } finally {
      setBusy(false);
    }
  }, [clockStatus]);
  const handleCorrectionSubmit = useCallback(async ({
    targetDate,
    reason,
    sessionId
  }) => {
    await techAttendanceApi.requestCorrection({
      targetDate,
      reason,
      sessionId
    });
    setCorrection(null);
    setToast('📨 Correction request submitted to your supervisor.');
  }, []);

  // ── Full-page loading / hard-error gate (mirrors admin panel's pattern) ──
  if (sessionLoading && monthLoading) {
    return <div className="tp-wrap">
        <style>{ROOT_STYLES}</style>
        <div className="tp-fullpage-loader"><Spinner label="Loading your attendance…" /></div>
      </div>;
  }
  if (sessionError && !session) {
    return <div className="tp-wrap">
        <style>{ROOT_STYLES}</style>
        <div className="tp-fullpage-error">
          <div className="tp-attendance-page-20">⚠️</div>
          <div className="tp-attendance-page-21">Couldn't load your attendance</div>
          <div className="tp-attendance-page-22">{sessionError}</div>
          <button className="tp-btn tp-btn-primary" onClick={loadSession}>Retry</button>
        </div>
      </div>;
  }
  return <div className="tp-wrap">
      <style>{ROOT_STYLES}</style>

      <NavToggle page={page} setPage={setPage} />

      {page === 'attendance' ? <AttendanceView clockStatus={clockStatus} clockInAt={clockInAt} netSecs={netSecs} onPrimary={handlePrimary} busy={busy} monthLoading={monthLoading} monthError={monthError} dates={monthData.dates} counts={monthData.counts} onRetryMonth={loadMonth} setDayDetail={setDayDetail} /> : <ClockView clockStatus={clockStatus} clockInAt={clockInAt} netSecs={netSecs} breakSecs={allBreakSecs} onPrimary={handlePrimary} onBreak={handleBreak} busy={busy} openCorrection={setCorrection} />}

      {dayDetail && <DayDetailModal day={dayDetail.day} rec={dayDetail.rec} month={MONTH} year={YEAR} onClose={() => setDayDetail(null)} onRequestCorrection={t => {
      setDayDetail(null);
      setCorrection(t);
    }} />}

      {correction && <CorrectionModal target={correction} onClose={() => setCorrection(null)} onSubmit={handleCorrectionSubmit} />}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   STYLES — unchanged from the design pass, plus loader/error additions
   ─────────────────────────────────────────────────────────────────────── */
const ROOT_STYLES = `
  .tp-wrap{ font-family:${F.sans}; color:${C.body}; max-width:1180px; margin:0 auto; }
  .tp-wrap *{ box-sizing:border-box; }
  .tp-nav{ display:flex; gap:6px; background:${C.card}; border:1px solid ${C.border}; border-radius:12px; padding:5px; width:fit-content; margin-bottom:18px; box-shadow:0 1px 3px rgba(15,23,42,.04); }
  .tp-nav-btn{ display:flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px; border:none; background:transparent; color:${C.muted}; font-weight:700; font-size:13px; cursor:pointer; transition:all .15s; font-family:${F.sans}; }
  .tp-nav-btn.active{ background:linear-gradient(135deg,${C.brand},${C.brandD}); color:#fff; box-shadow:0 3px 10px ${C.brand}45; }
  .tp-card{ background:${C.card}; border:1px solid ${C.border}; border-radius:16px; box-shadow:0 1px 4px rgba(15,23,42,.05); }
  .tp-card-header{ display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; padding:16px 20px; border-bottom:1px solid ${C.line}; }
  .tp-card-title{ font-size:14.5px; font-weight:800; color:${C.ink}; }
  .tp-card-body{ padding:18px 20px; }
  .tp-muted-sm{ font-size:11.5px; color:${C.muted}; }

  .tp-duty{ display:flex; align-items:center; justify-content:space-between; gap:24px; padding:24px 28px; margin-bottom:18px; flex-wrap:wrap; }
  .tp-duty.compact{ padding:18px 22px; }
  .tp-duty-eyebrow{ font-size:12px; font-weight:700; color:${C.muted}; margin-bottom:5px; letter-spacing:.3px; }
  .tp-duty-title{ font-size:23px; font-weight:800; color:${C.ink}; margin-bottom:5px; }
  .tp-duty-sub{ font-size:13px; color:${C.muted}; }
  .tp-duty-right{ display:flex; gap:14px; align-items:center; }
  .tp-duty-chip{ text-align:center; padding:11px 20px; border-radius:12px; min-width:86px; }
  .tp-duty-chip-icon{ font-size:20px; }
  .tp-duty-chip-label{ font-size:10.5px; font-weight:800; margin-top:4px; letter-spacing:.3px; }

  .tp-btn{ padding:11px 22px; font-size:13.5px; font-weight:700; border-radius:11px; border:none; cursor:pointer; font-family:${F.sans}; transition:transform .1s, box-shadow .15s; white-space:nowrap; }
  .tp-btn:disabled{ opacity:.65; cursor:default; }
  .tp-btn.sm{ padding:6px 12px; font-size:11.5px; border-radius:8px; }
  .tp-btn-green{ background:linear-gradient(135deg,#16A34A,${C.greenD}); color:#fff; box-shadow:0 4px 14px rgba(22,163,74,.32); }
  .tp-btn-red{ background:linear-gradient(135deg,#EF4444,${C.redD}); color:#fff; box-shadow:0 4px 14px rgba(220,38,38,.3); }
  .tp-btn-amber{ background:linear-gradient(135deg,#F59E0B,#D97706); color:#fff; box-shadow:0 4px 14px rgba(217,119,6,.28); }
  .tp-btn-primary{ background:linear-gradient(135deg,${C.brand},${C.brandD}); color:#fff; box-shadow:0 3px 10px ${C.brand}40; }
  .tp-btn-ghost{ background:${C.bg}; color:${C.muted}; border:1px solid ${C.border}; }
  .tp-btn-outline{ background:${C.card}; color:${C.brandD}; border:1.5px solid ${C.brand}55; }

  .tp-break-row{ display:flex; align-items:center; gap:14px; margin-bottom:18px; }
  .tp-break-live{ font-size:12.5px; font-weight:700; color:${C.amberD}; font-family:${F.mono}; }

  .tp-kpi-row{ display:grid; grid-template-columns:repeat(7,1fr); gap:12px; margin-bottom:18px; }
  .tp-kpi-row.five{ grid-template-columns:repeat(5,1fr); }
  .tp-kpi-row.four{ grid-template-columns:repeat(4,1fr); }
  .tp-kpi{ background:${C.card}; border:1px solid ${C.border}; border-radius:13px; padding:13px 15px; box-shadow:0 1px 4px rgba(15,23,42,.04); }
  .tp-kpi-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:9px; }
  .tp-kpi-label{ font-size:10.5px; font-weight:700; color:${C.muted}; line-height:1.3; }
  .tp-kpi-icon{ width:27px; height:27px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
  .tp-kpi-value{ font-size:21px; font-weight:800; font-family:${F.mono}; }

  .tp-split{ display:grid; grid-template-columns:1fr 320px; gap:16px; align-items:start; }
  .tp-legend{ display:flex; gap:12px; flex-wrap:wrap; }
  .tp-legend-item{ display:flex; align-items:center; gap:5px; font-size:11px; color:${C.muted}; }
  .tp-legend-dot{ width:13px; height:13px; border-radius:4px; }

  .tp-cal-grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
  .tp-cal-labels{ margin-bottom:8px; }
  .tp-cal-daylabel{ text-align:center; font-size:10.5px; font-weight:700; color:${C.faint}; padding:2px 0; }
  .tp-cal-cell{ aspect-ratio:1; border-radius:10px; border:1.5px solid transparent; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; position:relative; font-family:${F.sans}; padding:0; }
  .tp-cal-cell.today{ box-shadow:0 0 0 2px ${C.brand}30; }
  .tp-cal-cell.clickable:hover{ transform:scale(1.06); box-shadow:0 2px 8px rgba(15,23,42,.14); }
  .tp-cal-num{ font-size:12px; font-weight:700; }
  .tp-cal-tag{ font-size:9px; font-weight:800; }
  .tp-cal-late{ position:absolute; top:2px; right:3px; font-size:8px; }

  .tp-record-list{ display:flex; flex-direction:column; }
  .tp-record-item{ padding:12px 20px; border-bottom:1px solid ${C.line}; }
  .tp-record-item:last-child{ border-bottom:none; }
  .tp-record-top{ display:flex; justify-content:space-between; margin-bottom:5px; }
  .tp-record-date{ font-size:12.5px; font-weight:700; color:${C.ink2}; }
  .tp-mini-badge{ width:20px; height:20px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; }
  .tp-record-bottom{ display:flex; justify-content:space-between; font-size:11.5px; color:${C.muted}; gap:8px; }
  .tp-record-hours{ color:${C.brand}; font-weight:700; }
  .tp-record-late{ margin-top:3px; font-size:10.5px; color:${C.amberD}; font-weight:600; }

  .tp-tabbar{ display:flex; gap:3px; background:${C.bg}; padding:4px; border-radius:10px; border:1px solid ${C.border}; width:fit-content; margin-bottom:16px; }
  .tp-tab{ padding:7px 15px; border-radius:7px; border:none; cursor:pointer; font-size:12.5px; font-weight:700; background:transparent; color:${C.muted}; font-family:${F.sans}; transition:all .15s; }
  .tp-tab.active{ background:${C.card}; color:${C.ink}; box-shadow:0 1px 4px rgba(15,23,42,.08); }

  .tp-table-wrap{ overflow-x:auto; }
  .tp-table{ width:100%; border-collapse:collapse; min-width:640px; }
  .tp-table thead tr{ background:${C.bg}; border-bottom:1px solid ${C.border}; }
  .tp-table th{ text-align:left; padding:10px 16px; font-size:11px; font-weight:700; color:${C.muted}; white-space:nowrap; }
  .tp-table td{ padding:11px 16px; font-size:12.5px; color:${C.body}; border-bottom:1px solid ${C.line}; vertical-align:middle; }
  .tp-table tbody tr:last-child td{ border-bottom:none; }
  .tp-table tbody tr:nth-child(even){ background:#FBFBFC; }
  .tp-table .strong{ font-weight:700; color:${C.ink2}; }
  .tp-table .mono{ font-family:${F.mono}; }
  .tp-table .faint{ color:${C.faint}; }
  .tp-late-tag{ font-size:9.5px; color:${C.amberD}; margin-top:2px; }
  .tp-badge{ display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
  .tp-empty-row{ text-align:center; padding:36px 0; color:${C.faint}; font-size:13px; }
  .tp-eff{ display:flex; align-items:center; gap:8px; min-width:110px; }
  .tp-eff-track{ flex:1; height:6px; border-radius:99px; background:${C.line}; overflow:hidden; }
  .tp-eff-fill{ height:100%; border-radius:99px; }
  .tp-stack{ display:flex; flex-direction:column; gap:16px; }

  .tp-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
  .tp-modal{ width:100%; background:${C.card}; border-radius:16px; box-shadow:0 24px 64px rgba(15,23,42,.28); overflow:hidden; }
  .tp-modal-header{ display:flex; justify-content:space-between; align-items:flex-start; padding:18px 22px; border-bottom:1px solid ${C.line}; }
  .tp-modal-title{ font-size:15px; font-weight:800; color:${C.ink}; }
  .tp-modal-sub{ font-size:11.5px; color:${C.muted}; margin-top:2px; }
  .tp-modal-body{ padding:18px 22px; }
  .tp-modal-footer{ display:flex; justify-content:flex-end; gap:10px; padding:14px 22px; border-top:1px solid ${C.line}; }
  .tp-modal-error{ margin-bottom:12px; padding:9px 13px; border-radius:8px; background:${C.redBg}; border:1px solid ${C.redBd}; color:${C.red}; font-size:12px; }
  .tp-x{ width:27px; height:27px; border-radius:7px; border:none; background:${C.bg}; color:${C.muted}; cursor:pointer; font-size:12px; flex-shrink:0; }
  .tp-pill{ display:inline-block; padding:5px 12px; border-radius:8px; font-size:12px; font-weight:800; margin-bottom:14px; }
  .tp-detail-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .tp-detail-grid div{ display:flex; flex-direction:column; gap:3px; }
  .tp-detail-grid span{ font-size:10.5px; color:${C.muted}; font-weight:600; text-transform:uppercase; letter-spacing:.3px; }
  .tp-detail-grid strong{ font-size:13.5px; }
  .tp-note{ font-size:12.5px; color:${C.body}; background:${C.bg}; border:1px solid ${C.border}; border-radius:9px; padding:10px 13px; }
  .tp-empty{ font-size:12.5px; color:${C.faint}; text-align:center; padding:20px 0; }
  .tp-field-label{ font-size:11.5px; font-weight:700; color:${C.muted}; margin-bottom:8px; }
  .tp-textarea{ width:100%; padding:10px 12px; border-radius:9px; border:1px solid ${C.border}; font-size:13px; font-family:${F.sans}; resize:vertical; }
  .tp-hint{ font-size:11px; color:${C.faint}; margin-top:8px; }

  .tp-toast{ position:fixed; bottom:24px; right:24px; background:${C.ink}; color:#fff; padding:12px 20px; border-radius:11px; font-size:13px; font-weight:600; box-shadow:0 10px 30px rgba(0,0,0,.25); z-index:1200; max-width:360px; }

  .tp-spinner-wrap{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:40px 0; }
  .tp-spinner{ width:30px; height:30px; border-radius:50%; border:3px solid ${C.border}; border-top-color:${C.brand}; animation:tp-spin .7s linear infinite; }
  .tp-spinner-label{ font-size:12.5px; color:${C.muted}; }
  @keyframes tp-spin{ to{ transform:rotate(360deg); } }

  .tp-error-banner{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px; border-radius:10px; background:${C.redBg}; border:1px solid ${C.redBd}; color:${C.red}; font-size:12.5px; font-weight:600; margin-bottom:16px; }

  .tp-fullpage-loader{ min-height:320px; display:flex; align-items:center; justify-content:center; }
  .tp-fullpage-error{ min-height:320px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }

  @media (max-width:900px){
    .tp-split{ grid-template-columns:1fr; }
    .tp-kpi-row, .tp-kpi-row.five, .tp-kpi-row.four{ grid-template-columns:repeat(2,1fr); }
  }
`;
export default AttendancePage;
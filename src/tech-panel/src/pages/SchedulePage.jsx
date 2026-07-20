// SchedulePage.jsx — Technician Panel · wired to the real backend

import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../constants/token';
import { JOB_STATUS } from '../constants/statusMaps';
import { SBadge, TypeTag, PBadge, Avatar, Divider } from '../components/ui/Badges';
import { scheduleApi, techJobsApi } from '../services/technicianPortalApi';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Breakpoint hook (same pattern as DispatchBoard) ───────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
}

// ─── Date helpers ────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad2 = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtDate = d => fmtDateDMY(d);
const isSameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const startOfWeek = d => {
  const dow = (d.getDay() + 6) % 7;
  const m = new Date(d);
  m.setDate(d.getDate() - dow);
  m.setHours(0, 0, 0, 0);
  return m;
};

// Builds a 6-row/7-col grid of cells (Mon-first) for the given month cursor,
// including the trailing/leading days from neighboring months.
const getMonthGrid = cursor => {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({
    date: new Date(year, month - 1, daysInPrevMonth - i),
    inMonth: false
  });
  for (let d = 1; d <= daysInMonth; d++) cells.push({
    date: new Date(year, month, d),
    inMonth: true
  });
  let next = cells[cells.length - 1].date;
  while (cells.length < 42) {
    next = addDays(next, 1);
    cells.push({
      date: next,
      inMonth: next.getMonth() === month
    });
  }
  return cells;
};

// Transforms a raw Job document from the API into the flat shape the UI uses.
const mapJob = j => {
  const dt = j.scheduledDate ? new Date(j.scheduledDate) : null;
  return {
    _id: j._id,
    id: j.jobId || j._id,
    customer: j.customer?.name || j.customerName || 'Unknown Customer',
    phone: j.customer?.phone || '',
    address: j.customer?.address || j.address || '',
    ac: j.ac || '—',
    issue: j.issue || '—',
    type: j.type,
    priority: j.priority,
    status: j.status,
    rawDate: dt,
    date: dt ? fmtDate(dt) : '',
    time: j.scheduledTime || '',
    amount: j.amount || 0,
    notes: j.remarks || '',
    rescheduleRequest: j.rescheduleRequest && j.rescheduleRequest.status ? j.rescheduleRequest : null
  };
};
const BORDER_COLOR = {
  in_progress: COLORS.brand,
  assigned: "var(--info)",
  completed: "var(--success)",
  invoiced: "var(--purple)",
  new: "var(--faint)",
  cancelled: "var(--danger)"
};

// Statuses a technician is allowed to drive a job through, forward only —
// mirrors STATUS_FLOW enforced server-side in technicianSchedule.routes.js.
const STATUS_FLOW = [{
  key: 'assigned',
  icon: '📋',
  label: 'Assigned',
  color: '#3B82F6',
  bg: '#EFF6FF'
}, {
  key: 'in_progress',
  icon: '🔧',
  label: 'In Progress',
  color: COLORS.brand,
  bg: COLORS.brandL
}, {
  key: 'completed',
  icon: '✅',
  label: 'Completed',
  color: '#22C55E',
  bg: '#ECFDF5'
}];
const getStatsCards = s => [{
  label: "Today's Jobs",
  value: s.todayJobs ?? 0,
  color: COLORS.brand,
  bg: COLORS.brandL,
  icon: '📅'
}, {
  label: 'This Week',
  value: s.weekJobs ?? 0,
  color: '#3B82F6',
  bg: '#EFF6FF',
  icon: '🗓️'
}, {
  label: 'Completed',
  value: s.completed ?? 0,
  color: '#22C55E',
  bg: '#ECFDF5',
  icon: '✅'
}, {
  label: 'Pending',
  value: s.pending ?? 0,
  color: '#F59E0B',
  bg: '#FFFBEB',
  icon: '⏳'
}];
const FieldLabel = ({
  children
}) => <div className="tp-schedule-page-1">
    {children}
  </div>;
const inputStyle = {
  padding: '9px 11px',
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .15s'
};
const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 72,
  lineHeight: 1.5
};

// ─── Reschedule Modal ───────────────────────────────────────────────────────
const RescheduleModal = ({
  job,
  onClose,
  onSubmit
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = date && time && !submitting;
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        requestedDate: date,
        requestedTime: time,
        reason
      });
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Could not send the request. Please try again.');
    }
  };
  return <div onClick={onClose} className="tp-schedule-page-2">
      <div onClick={e => e.stopPropagation()} className="modal-box tp-schedule-page-3">
        <div className="tp-schedule-page-4">
          <div>
            <div className="tp-schedule-page-5">Request Reschedule</div>
            <div className="tp-schedule-page-6">{job.id} · {job.customer}</div>
          </div>
          <button onClick={onClose} className="tp-schedule-page-7">✕</button>
        </div>

        <div className="tp-schedule-page-8">
          Currently scheduled for <strong className="tp-schedule-page-9">{job.date} · {job.time}</strong>
        </div>

        {error && <div className="tp-schedule-page-10">
            {error}
          </div>}

        <div className="tp-schedule-page-11">
          <div className="tp-schedule-page-12">
            <FieldLabel>New Date</FieldLabel>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="tp-schedule-page-13" />
          </div>
          <div className="tp-schedule-page-14">
            <FieldLabel>New Time</FieldLabel>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="tp-schedule-page-13" />
          </div>
        </div>

        <div className="tp-schedule-page-15">
          <FieldLabel>Reason (optional)</FieldLabel>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Running late on previous job, customer unavailable…" className="tp-schedule-page-16" />
        </div>

        <div className="tp-schedule-page-17">
          <button onClick={onClose} className="btn btn-secondary tp-schedule-page-18">
            Cancel
          </button>
          <button disabled={!canSubmit} onClick={handleSubmit} className="btn tp-schedule-page-19" style={{
          background: canSubmit ? "linear-gradient(135deg,var(--brand),var(--brand-d))" : "var(--disabled)",
          cursor: canSubmit ? "pointer" : "not-allowed",
          boxShadow: canSubmit ? "0 4px 12px var(--brand-glow)" : "none"
        }}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>;
};

// ─── Job Detail View ────────────────────────────────────────────────────────
const JobDetailView = ({
  job,
  onBack,
  onStatusChange,
  onReschedule,
  isMobile
}) => {
  const [toast, setToast] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [incompleteItems, setIncompleteItems] = useState(null);
  const bc = BORDER_COLOR[job.status] || COLORS.faint;
  const flash = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === job.status);
  const handleStatus = async key => {
    const nextIdx = STATUS_FLOW.findIndex(s => s.key === key);
    if (nextIdx !== currentIdx + 1) return; // forward-only, guards a stray click
    setSubmittingStatus(true);
    setStatusError('');
    setIncompleteItems(null);
    try {
      await onStatusChange(job, key);
      flash(`Status updated to ${STATUS_FLOW.find(s => s.key === key)?.label}`);
    } catch (err) {
      setStatusError(err.message || 'Could not update status. Please try again.');
      if (err.data?.data?.incompleteItems) setIncompleteItems(err.data.data.incompleteItems);
    } finally {
      setSubmittingStatus(false);
    }
  };
  const handleReschedule = async payload => {
    await onReschedule(job, payload);
    setShowReschedule(false);
    flash(`Reschedule request sent for ${payload.requestedDate} · ${payload.requestedTime}`);
  };
  const primaryAction = job.status === 'assigned' ? {
    label: '▶ Start Job',
    next: 'in_progress'
  } : job.status === 'in_progress' ? {
    label: '✓ Mark Complete',
    next: 'completed'
  } : null;
  return <>
      <div className="tp-schedule-page-20">
        <button onClick={onBack} className="back-btn">←</button>
        <span className="tp-schedule-page-21">My Schedule</span>
        <span className="tp-schedule-page-22">›</span>
        <span className="tp-schedule-page-23">{job.id}</span>

        <div className="tp-schedule-page-24">
          <button onClick={() => setShowReschedule(true)} className="btn btn-secondary btn-sm">
            🔁 Request Reschedule
          </button>
        </div>
      </div>

      {job.rescheduleRequest?.status === 'pending' && <div className="tp-schedule-page-25">
          ⏳ Reschedule requested for <strong>{fmtDate(new Date(job.rescheduleRequest.requestedDate))} · {job.rescheduleRequest.requestedTime}</strong> — waiting on admin approval.
        </div>}

      <div className="job-detail-grid">
        <div style={{
        padding: isMobile ? "14px" : "20px"
      }} className="tp-schedule-page-26">
          <div className="tp-schedule-page-27">
            <span className="tp-schedule-page-28">{job.id}</span>
            <TypeTag type={job.type} />
            <PBadge p={job.priority} />
            <span className="tp-schedule-page-29"><SBadge s={job.status} map={JOB_STATUS} /></span>
          </div>

          <div className="tp-schedule-page-30">
            <Avatar name={job.customer} size={48} color={bc} />
            <div className="tp-schedule-page-31">
              <div style={{
              fontSize: isMobile ? "17px" : "19px"
            }} className="tp-schedule-page-32">{job.customer}</div>
              <div className="tp-schedule-page-33">📍 {job.address}</div>
              <div className="tp-schedule-page-34">📱 {job.phone || '—'}</div>
            </div>
          </div>

          <Divider />

          <div className="job-field-grid tp-schedule-page-35">
            <div><FieldLabel>AC Unit</FieldLabel><div className="tp-schedule-page-36">❄️ {job.ac}</div></div>
            <div><FieldLabel>Issue</FieldLabel><div className="tp-schedule-page-37">{job.issue}</div></div>
            <div><FieldLabel>Scheduled</FieldLabel><div className="tp-schedule-page-38">{job.date} · {job.time}</div></div>
            <div><FieldLabel>Amount</FieldLabel><div className="tp-schedule-page-39">₹{job.amount.toLocaleString()}</div></div>
          </div>

          <Divider />

          <div className="tp-schedule-page-40">
            <div className="tp-schedule-page-41">Job Notes</div>
            <div className="tp-schedule-page-42">
              {job.notes || 'No additional notes for this job.'}
            </div>
          </div>

          {statusError && <div className="tp-schedule-page-43">
              <div>{statusError}</div>
              {incompleteItems?.length > 0 && <ul className="tp-schedule-page-44">
                  {incompleteItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>}
            </div>}

          <div className="job-action-btns tp-schedule-page-45">
            {primaryAction && <button disabled={submittingStatus} onClick={() => handleStatus(primaryAction.next)} className="btn tp-schedule-page-46" style={{
            background: submittingStatus ? "var(--disabled)" : "linear-gradient(135deg,var(--brand),var(--brand-d))",
            boxShadow: submittingStatus ? "none" : "0 4px 12px var(--brand-glow)",
            cursor: submittingStatus ? "not-allowed" : "pointer"
          }}>
                {submittingStatus ? 'Updating…' : primaryAction.label}
              </button>}
            <button className="btn tp-schedule-page-47">
              📞 Call Customer
            </button>
            <button className="btn tp-schedule-page-48">
              🧭 Get Directions
            </button>
          </div>
        </div>

        <div className="job-detail-sidebar">
          <div className="tp-schedule-page-49">
            <div className="tp-schedule-page-50">Update Status</div>
            {currentIdx === -1 && <div className="tp-schedule-page-51">Status changes aren't available for this job.</div>}
            {STATUS_FLOW.map(({
            key,
            icon,
            label,
            color,
            bg
          }, idx) => {
            const isCurrent = job.status === key;
            const isPast = currentIdx !== -1 && idx < currentIdx;
            const isNext = currentIdx !== -1 && idx === currentIdx + 1;
            const clickable = isNext && !submittingStatus;
            return <button key={key} disabled={!clickable} onClick={() => clickable && handleStatus(key)} style={{
              background: isCurrent ? bg : isPast ? '#F0FDF4' : '#FAFAF9',
              color: isCurrent ? color : isPast ? '#16A34A' : clickable ? COLORS.h2 : COLORS.faint,
              fontWeight: isCurrent ? "700" : "500",
              border: `1px solid ${isCurrent ? color + '55' : COLORS.border}`,
              cursor: clickable ? "pointer" : "default",
              opacity: !isCurrent && !isPast && !isNext ? "0.55" : "1"
            }} className="tp-schedule-page-52">
                  <span>{isPast ? '✓' : icon}</span>
                  <span className="tp-schedule-page-53">{isCurrent ? '● ' : isNext ? '→ ' : ''}{label}</span>
                  {isCurrent && <span style={{
                background: color + '22',
                color
              }} className="tp-schedule-page-54">Current</span>}
                </button>;
          })}
          </div>

          <div className="tp-schedule-page-55">
            <div className="tp-schedule-page-56">Job Timeline</div>
            {[{
            label: 'Job Assigned',
            done: true
          }, {
            label: 'Scheduled Visit',
            done: true,
            sub: `${job.date} · ${job.time}`
          }, {
            label: 'In Progress',
            done: ['in_progress', 'completed', 'invoiced'].includes(job.status)
          }, {
            label: 'Completed',
            done: ['completed', 'invoiced'].includes(job.status)
          }].map((step, i, arr) => <div key={step.label} style={{
            paddingBottom: i < arr.length - 1 ? "14px" : "0"
          }} className="tp-schedule-page-57">
                {i < arr.length - 1 && <div className="tp-schedule-page-58" />}
                <div style={{
              background: step.done ? "var(--success)" : "var(--border)"
            }} className="tp-schedule-page-59" />
                <div>
                  <div style={{
                color: step.done ? "var(--h1)" : "var(--faint)"
              }} className="tp-schedule-page-60">{step.label}</div>
                  {step.sub && <div className="tp-schedule-page-61">{step.sub}</div>}
                </div>
              </div>)}
          </div>

          <div className="tp-schedule-page-62">
            <div className="tp-schedule-page-63">Customer Info</div>
            {[['Customer', job.customer], ['Phone', job.phone || '—'], ['Address', job.address], ['AC Unit', job.ac]].map(([k, v]) => <div key={k} className="tp-schedule-page-64">
                <span className="tp-schedule-page-65">{k}</span>
                <span className="tp-schedule-page-66">{v}</span>
              </div>)}
          </div>
        </div>
      </div>

      {showReschedule && <RescheduleModal job={job} onClose={() => setShowReschedule(false)} onSubmit={handleReschedule} />}
      {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
    </>;
};

// ─── SchedulePage ────────────────────────────────────────────────────────────
const SchedulePage = () => {
  const {
    isMobile
  } = useBreakpoint();
  const [today] = useState(() => new Date());
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [monthCursor, setMonthCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'

  const [weekJobs, setWeekJobs] = useState([]);
  const [dayJobs, setDayJobs] = useState([]);
  const [monthCounts, setMonthCounts] = useState({});
  const [stats, setStats] = useState({});
  const [openJob, setOpenJob] = useState(null);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const weekDays = Array.from({
    length: 7
  }, (_, i) => addDays(weekAnchor, i));
  const monthCells = getMonthGrid(monthCursor);

  // ── Fetch: stats (always, refetches after any status/reschedule change) ──
  useEffect(() => {
    scheduleApi.stats().then(setStats).catch(err => setErrorMsg(err.message));
  }, [refreshKey]);

  // ── Fetch: the currently displayed week ──────────────────────────────────
  useEffect(() => {
    setLoadingWeek(true);
    const to = addDays(weekAnchor, 6);
    scheduleApi.week(isoDate(weekAnchor), isoDate(to)).then(data => setWeekJobs(data.map(mapJob))).catch(err => setErrorMsg(err.message)).finally(() => setLoadingWeek(false));
  }, [weekAnchor, refreshKey]);

  // ── Fetch: jobs for the selected day (independent of week/month view) ────
  useEffect(() => {
    setLoadingDay(true);
    const iso = isoDate(activeDate);
    scheduleApi.week(iso, iso).then(data => setDayJobs(data.map(mapJob).sort((a, b) => (a.time || '').localeCompare(b.time || '')))).catch(err => setErrorMsg(err.message)).finally(() => setLoadingDay(false));
  }, [activeDate, refreshKey]);

  // ── Fetch: month calendar dot counts (only while month tab is active) ────
  useEffect(() => {
    if (viewMode !== 'month') return;
    setLoadingMonth(true);
    scheduleApi.month(monthCursor.getMonth(), monthCursor.getFullYear()).then(setMonthCounts).catch(err => setErrorMsg(err.message)).finally(() => setLoadingMonth(false));
  }, [viewMode, monthCursor, refreshKey]);
  const allUpcoming = weekJobs.filter(j => ['assigned', 'new'].includes(j.status));
  const statsCards = getStatsCards(stats);

  // Patches a job in-place across whichever local lists hold it, so the UI
  // reflects a status/reschedule change immediately without a full refetch.
  const patchLocalJob = useCallback(updated => {
    const apply = list => list.map(j => j._id === updated._id ? updated : j);
    setWeekJobs(apply);
    setDayJobs(apply);
    setOpenJob(prev => prev && prev._id === updated._id ? updated : prev);
  }, []);
  const handleStatusChange = async (job, nextStatus) => {
    let res;
    if (nextStatus === 'in_progress') {
      res = await techJobsApi.start(job._id);
    } else if (nextStatus === 'completed') {
      // No parts-capture UI on this page yet, so this sends an empty parts
      // list — the backend's checklist gate still applies and will reject
      // completion (with the incomplete items listed) if the technician
      // hasn't finished the job's checklist in My Jobs first.
      res = await techJobsApi.complete(job._id, []);
    } else {
      throw new Error(`Unsupported status transition to "${nextStatus}".`);
    }
    const updated = mapJob(res.data);
    patchLocalJob(updated);
    setRefreshKey(k => k + 1);
    return updated;
  };
  const handleReschedule = async (job, payload) => {
    const updated = mapJob(await scheduleApi.requestReschedule(job._id, payload));
    patchLocalJob(updated);
    setRefreshKey(k => k + 1);
    return updated;
  };
  const selectDate = d => {
    setActiveDate(d);
    if (viewMode === 'month' && d.getMonth() !== monthCursor.getMonth()) {
      setMonthCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    if (viewMode === 'week' && !weekDays.some(wd => isSameDay(wd, d))) {
      setWeekAnchor(startOfWeek(d));
    }
  };
  const goPrevWeek = () => {
    setWeekAnchor(w => addDays(w, -7));
    setActiveDate(d => addDays(d, -7));
  };
  const goNextWeek = () => {
    setWeekAnchor(w => addDays(w, 7));
    setActiveDate(d => addDays(d, 7));
  };
  const goPrevMonth = () => setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const goNextMonth = () => setMonthCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const goToday = () => {
    setActiveDate(today);
    setWeekAnchor(startOfWeek(today));
    setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // ── Detail view ─────────────────────────────────────────────────────────
  if (openJob) {
    return <JobDetailView job={openJob} onBack={() => setOpenJob(null)} onStatusChange={handleStatusChange} onReschedule={handleReschedule} isMobile={isMobile} />;
  }

  // ── List view ───────────────────────────────────────────────────────────
  return <div className="fu tp-schedule-page-67">

      <div className="sec-hdr">
        <div>
          <div className="sec-title">My Schedule</div>
          <div className="sec-sub">
            {viewMode === 'week' ? `Week of ${MONTH_ABBR[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${MONTH_ABBR[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}` : `${MONTH_NAMES[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`}
          </div>
        </div>
      </div>

      {errorMsg && <div className="tp-schedule-page-68">
          {errorMsg}
        </div>}

      {/* Stats bar */}
      <div className="dispatch-stats-grid">
        {statsCards.map(s => <div key={s.label} style={{
        background: s.bg,
        border: `1px solid ${s.color}20`
      }} className="tp-schedule-page-69">
            <div className="tp-schedule-page-70">
              <div style={{
            color: s.color
          }} className="tp-schedule-page-71">{s.value}</div>
              <span className="tp-schedule-page-72">{s.icon}</span>
            </div>
            <div style={{
          color: s.color
        }} className="tp-schedule-page-73">{s.label}</div>
          </div>)}
      </div>

      {/* Calendar — Week / Month tabs */}
      <div className="card afu tp-schedule-page-74">
        <div className="card-header tp-schedule-page-75">
          <div className="tp-schedule-page-76">
            {['week', 'month'].map(mode => <button key={mode} onClick={() => setViewMode(mode)} style={{
            background: viewMode === mode ? "var(--white)" : "transparent",
            color: viewMode === mode ? "var(--brand)" : "var(--muted)",
            boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,.1)" : "none"
          }} className="tp-schedule-page-77">
                {mode}
              </button>)}
          </div>

          <div className="tp-schedule-page-78">
            <button onClick={viewMode === 'week' ? goPrevWeek : goPrevMonth} className="back-btn tp-schedule-page-79">‹</button>
            {viewMode === 'month' && <div className="tp-schedule-page-80">
                {MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
              </div>}
            <button onClick={viewMode === 'week' ? goNextWeek : goNextMonth} className="back-btn tp-schedule-page-81">›</button>
            <button onClick={goToday} className="btn btn-secondary btn-sm tp-schedule-page-82">Today</button>
          </div>
        </div>

        <div className="card-body tp-schedule-page-83">
          {viewMode === 'week' ? <div className="tp-schedule-page-84">
              {weekDays.map((d, i) => {
            const count = weekJobs.filter(j => isSameDay(j.rawDate, d)).length;
            const isActive = isSameDay(activeDate, d);
            const isToday = isSameDay(today, d);
            return <button key={i} onClick={() => selectDate(d)} style={{
              background: isActive ? COLORS.brand : isToday ? COLORS.brandL : '#F8FAFC',
              outline: isToday && !isActive ? "2px solid var(--brand)" : "none"
            }} className="tp-schedule-page-85">
                    <div style={{
                color: isActive ? "rgba(255,255,255,.7)" : "var(--faint)"
              }} className="tp-schedule-page-86">{WEEKDAY_LABELS[i]}</div>
                    <div style={{
                color: isActive ? '#fff' : isToday ? COLORS.brand : COLORS.h1
              }} className="tp-schedule-page-87">{d.getDate()}</div>
                    <div className="tp-schedule-page-88">
                      {count > 0 ? Array.from({
                  length: Math.min(count, 3)
                }).map((_, k) => <div key={k} style={{
                  background: isActive ? "rgba(255,255,255,.7)" : "var(--brand)"
                }} className="tp-schedule-page-89" />) : <div className="tp-schedule-page-90" />}
                    </div>
                    {count > 0 && <div style={{
                color: isActive ? "rgba(255,255,255,.8)" : "var(--muted)"
              }} className="tp-schedule-page-91">{count} job{count !== 1 ? 's' : ''}</div>}
                  </button>;
          })}
            </div> : <div>
              <div className="tp-schedule-page-92">
                {WEEKDAY_LABELS.map(w => <div key={w} className="tp-schedule-page-93">{w}</div>)}
              </div>
              <div className="tp-schedule-page-94">
                {monthCells.map((cell, i) => {
              const key = isoDate(cell.date);
              const count = monthCounts[key]?.count || 0;
              const isActive = isSameDay(activeDate, cell.date);
              const isToday = isSameDay(today, cell.date);
              return <button key={i} onClick={() => selectDate(cell.date)} style={{
                minHeight: isMobile ? "46px" : "62px",
                background: isActive ? COLORS.brand : isToday ? COLORS.brandL : cell.inMonth ? '#F8FAFC' : 'transparent',
                opacity: cell.inMonth ? "1" : "0.4",
                outline: isToday && !isActive ? "2px solid var(--brand)" : "none"
              }} className="tp-schedule-page-95">
                      <span style={{
                  fontWeight: isToday || isActive ? "800" : "600",
                  color: isActive ? '#fff' : isToday ? COLORS.brand : cell.inMonth ? COLORS.h1 : COLORS.faint
                }} className="tp-schedule-page-96">
                        {cell.date.getDate()}
                      </span>
                      <div className="tp-schedule-page-97">
                        {count > 0 && Array.from({
                    length: Math.min(count, 3)
                  }).map((_, di) => <div key={di} style={{
                    background: isActive ? "rgba(255,255,255,.8)" : "var(--brand)"
                  }} className="tp-schedule-page-98" />)}
                      </div>
                    </button>;
            })}
              </div>
              {loadingMonth && <div className="tp-schedule-page-99">Loading month…</div>}
            </div>}
        </div>
      </div>

      {viewMode === 'month' && <div className="tp-schedule-page-100">
          Showing jobs for <strong className="tp-schedule-page-101">{fmtDate(activeDate)}</strong> below
        </div>}

      <div className="dispatch-main-grid">

        {/* Day timeline */}
        <div className="card afu1">
          <div className="card-header">
            <div className="card-title">📅 {fmtDate(activeDate)}</div>
            <span className="tp-schedule-page-102">{loadingDay ? 'Loading…' : `${dayJobs.length} job${dayJobs.length !== 1 ? 's' : ''}`}</span>
          </div>

          {dayJobs.length > 0 ? <div className="tp-schedule-page-103">
              {dayJobs.map((job, i) => {
            const bc = BORDER_COLOR[job.status] || COLORS.faint;
            return <div key={job._id} className="tp-schedule-page-104">
                    <div className="tp-schedule-page-105">
                      <div className="tp-schedule-page-106">{job.time}</div>
                    </div>
                    <div className="tp-schedule-page-107">
                      <div style={{
                  background: bc,
                  boxShadow: `0 0 0 2px ${bc}`
                }} className="tp-schedule-page-108" />
                      {i < dayJobs.length - 1 && <div className="tp-schedule-page-109" />}
                    </div>
                    <div className="tp-schedule-page-110">
                      <div onClick={() => setOpenJob(job)} style={{
                  background: `${bc}0D`,
                  border: `1px solid ${bc}30`
                }} onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${bc}40`;
                }} onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                }} className="tp-schedule-page-111">
                        <div className="tp-schedule-page-112">
                          <div className="tp-schedule-page-113">
                            <div className="tp-schedule-page-114">
                              <span className="tp-schedule-page-115">{job.id}</span>
                              <TypeTag type={job.type} />
                              <PBadge p={job.priority} />
                              {job.rescheduleRequest?.status === 'pending' && <span className="tp-schedule-page-116">⏳ Reschedule pending</span>}
                            </div>
                            <div className="tp-schedule-page-117">{job.customer}</div>
                            <div className="tp-schedule-page-118">📍 {job.address}</div>
                            <div className="tp-schedule-page-119">🔧 {job.ac} · {job.issue}</div>
                          </div>
                          <div className="tp-schedule-page-120">
                            <SBadge s={job.status} map={JOB_STATUS} />
                            <div className="tp-schedule-page-121">₹{job.amount.toLocaleString()}</div>
                            <span className="tp-schedule-page-122">View →</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>;
          })}
            </div> : <div className="tp-schedule-page-123">
              <div className="tp-schedule-page-124">📅</div>
              {loadingDay ? 'Loading jobs…' : 'No jobs scheduled for this day'}
            </div>}
        </div>

        {/* Upcoming sidebar */}
        <div className="tp-schedule-page-125">
          <div className="card afu2">
            <div className="card-header"><div className="card-title">🔜 Upcoming Jobs</div></div>
            {loadingWeek ? <div className="tp-schedule-page-126">Loading…</div> : allUpcoming.length > 0 ? allUpcoming.map(job => <div key={job._id} onClick={() => setOpenJob(job)} onMouseEnter={e => {
            e.currentTarget.style.background = '#FAFBFF';
          }} onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }} className="tp-schedule-page-127">
                <div className="tp-schedule-page-128">
                  <span className="tp-schedule-page-129">{job.id}</span>
                  <TypeTag type={job.type} />
                </div>
                <div className="tp-schedule-page-130">{job.customer}</div>
                <div className="tp-schedule-page-131">📅 {job.date} · {job.time}</div>
              </div>) : <div className="tp-schedule-page-132">No upcoming jobs</div>}
          </div>
        </div>
      </div>
    </div>;
};
export default SchedulePage;
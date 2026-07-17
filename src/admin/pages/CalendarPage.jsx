import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { COLORS } from '../constants/tokens';
import { calendarApi, holidaysApi } from '../services/api';

// ─── FALLBACK_HOLIDAYS ──────────────────────────────────────────────────────
// Used only if the /api/holidays/:year request fails (network issue, backend
// down, etc.) — so the calendar still shows *something* correct instead of
// silently showing nothing. Deliberately minimal: just the fixed national
// holidays that never move year to year. Real (lunar-accurate) holiday data
// comes from the backend, which pulls it live from calendar-bharat — see
// services/holidaysService.js.
const FALLBACK_HOLIDAYS_FOR_YEAR = year => ({
  [`${year}-01-26`]: 'Republic Day',
  [`${year}-08-15`]: 'Independence Day',
  [`${year}-10-02`]: 'Gandhi Jayanti',
  [`${year}-12-25`]: 'Christmas'
});
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TASK_PRIO = {
  urgent: {
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  high: {
    bg: "var(--brand-light)",
    color: "var(--brand)"
  },
  normal: {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  low: {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  }
};
function pad(n) {
  return String(n).padStart(2, '0');
}
function toDateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function monthKey(y, m) {
  return `${y}-${pad(m + 1)}`;
}

// ─── EventChip ────────────────────────────────────────────────────────────────
const EventChip = ({
  event,
  onClick
}) => {
  const prioStyle = event.type === 'task' && event.priority ? TASK_PRIO[event.priority] || TASK_PRIO.normal : null;
  return <div className={`cal-chip cal-chip--${event.type}`} onClick={e => {
    e.stopPropagation();
    onClick(event);
  }} title={event.title} style={prioStyle ? {
    background: prioStyle.bg,
    color: prioStyle.color,
    borderLeft: `3px solid ${prioStyle.color}`,
    borderRadius: 4,
    paddingLeft: 5
  } : {}}>
      {event.priority === 'urgent' && event.type === 'task' ? '🔴 ' : ''}
      {event.title}
    </div>;
};

// ─── EventModal ───────────────────────────────────────────────────────────────
const EventModal = ({
  event,
  onClose,
  onDelete
}) => {
  if (!event) return null;
  const typeLabel = {
    task: 'Task',
    job: 'Job / Work order',
    meeting: 'Meeting',
    holiday: 'Hindu Holiday'
  };
  const PRIO_STYLE = {
    urgent: {
      color: "var(--danger-text)",
      bg: "var(--danger-bg)"
    },
    high: {
      color: "var(--brand)",
      bg: "var(--brand-light)"
    },
    normal: {
      color: "var(--info-text)",
      bg: "var(--info-bg)"
    },
    low: {
      color: "var(--success-text)",
      bg: "var(--success-bg)"
    }
  };
  return createPortal(<div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <div className={`cal-modal-type-dot cal-modal-type-dot--${event.type}`} />
          <div className="cal-modal-title">{event.title}</div>
          <button className="cal-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cal-modal-body">
          <div className="cal-modal-row">
            <span className="cal-modal-key">Date</span>
            <span className="cal-modal-val">{event.date}</span>
          </div>
          <div className="cal-modal-row">
            <span className="cal-modal-key">Type</span>
            <span className={`cal-modal-badge cal-modal-badge--${event.type}`}>
              {typeLabel[event.type] || event.type}
            </span>
          </div>
          {event.priority && <div className="cal-modal-row">
              <span className="cal-modal-key">Priority</span>
              <span style={{
            background: PRIO_STYLE[event.priority]?.bg,
            color: PRIO_STYLE[event.priority]?.color
          }} className="ap-calendar-page-1">
                {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
              </span>
            </div>}
          {event.assignedTo && <div className="cal-modal-row">
              <span className="cal-modal-key">Assigned</span>
              <span className="cal-modal-val">{event.assignedTo}</span>
            </div>}
          {event.desc && <div className="cal-modal-desc">{event.desc}</div>}

          {/* delete button only for manual events */}
          {event.source === 'manual' && onDelete && <div className="ap-calendar-page-2">
              <button onClick={() => {
            onDelete(event);
            onClose();
          }} className="ap-calendar-page-3">
                🗑 Delete Event
              </button>
            </div>}
        </div>
      </div>
    </div>, document.body);
};

// ─── AddEventModal ────────────────────────────────────────────────────────────
const AddEventModal = ({
  defaultDate,
  onClose,
  onSave
}) => {
  const [form, setForm] = useState({
    title: '',
    date: defaultDate || '',
    type: 'meeting',
    desc: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const setF = k => e => setForm(p => ({
    ...p,
    [k]: e.target.value
  }));
  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError('Failed to save event.');
    } finally {
      setSaving(false);
    }
  };
  return createPortal(<div className="cal-modal-overlay" onClick={onClose}>
      <div className="cal-modal-card" onClick={e => e.stopPropagation()}>
        <div className="cal-modal-header">
          <div className="cal-modal-title">Add Event</div>
          <button className="cal-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cal-modal-body">
          {error && <div className="ap-calendar-page-4">⚠️ {error}</div>}
          <div className="cal-form-group">
            <label className="cal-form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={setF('title')} placeholder="Event title" autoFocus />
          </div>
          <div className="ap-calendar-page-5">
            <div className="cal-form-group">
              <label className="cal-form-label">Date *</label>
              <input className="form-input" type="date" value={form.date} onChange={setF('date')} />
            </div>
            <div className="cal-form-group">
              <label className="cal-form-label">Type</label>
              <select className="form-select" value={form.type} onChange={setF('type')}>
                <option value="meeting">Meeting</option>
                <option value="job">Job</option>
                <option value="task">Task</option>
              </select>
            </div>
          </div>
          <div className="cal-form-group">
            <label className="cal-form-label">Description</label>
            <input className="form-input" value={form.desc} onChange={setF('desc')} placeholder="Optional details" />
          </div>
          <div className="cal-modal-actions">
            <button className="cal-btn cal-btn--ghost" onClick={onClose}>Cancel</button>
            <button className="cal-btn cal-btn--primary" disabled={!form.title.trim() || !form.date || saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save Event'}
            </button>
          </div>
        </div>
      </div>
    </div>, document.body);
};

// ─── CalendarPage ─────────────────────────────────────────────────────────────
const CalendarPage = () => {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [manualEvts, setManualEvts] = useState([]);
  const [taskEvts, setTaskEvts] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [filters, setFilters] = useState({
    task: true,
    job: true,
    meeting: true,
    holiday: true
  });
  const [loading, setLoading] = useState(false);

  // ── Holidays: fetched live per year, cached client-side so switching
  // months within the same year doesn't refetch ─────────────────────────────
  const [holidays, setHolidays] = useState({});
  const holidayCacheRef = useRef({}); // { [year]: { "YYYY-MM-DD": "name" } }

  const y = current.getFullYear();
  const m = current.getMonth();
  const mk = monthKey(y, m);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const prevMonth = () => setCurrent(new Date(y, m - 1, 1));
  const nextMonth = () => setCurrent(new Date(y, m + 1, 1));
  const goToday = () => setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
  const toggleFilter = key => setFilters(f => ({
    ...f,
    [key]: !f[key]
  }));

  // ── fetch holidays whenever the visible year changes ─────────────────────
  useEffect(() => {
    if (holidayCacheRef.current[y]) {
      setHolidays(holidayCacheRef.current[y]);
      return;
    }
    let cancelled = false;
    holidaysApi.getByYear(y).then(r => {
      if (cancelled) return;
      const data = r?.data ?? r ?? {};
      const map = Object.keys(data).length > 0 ? data : FALLBACK_HOLIDAYS_FOR_YEAR(y);
      holidayCacheRef.current[y] = map;
      setHolidays(map);
    }).catch(() => {
      if (cancelled) return;
      const fallback = FALLBACK_HOLIDAYS_FOR_YEAR(y);
      holidayCacheRef.current[y] = fallback;
      setHolidays(fallback);
    });
    return () => {
      cancelled = true;
    };
  }, [y]);

  // ── fetch all events for current month ───────────────────────────────────
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await calendarApi.getEvents(mk);
      if (res.success) {
        setManualEvts(res.data.events || []);
        setTaskEvts(res.data.taskEvents || []);
      }
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, [mk]); // re-runs when month changes

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // merge all events
  const allEvents = [...manualEvts, ...taskEvts];

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleAddEvent = async form => {
    const res = await calendarApi.create(form);
    if (!res.success) throw new Error(res.message);
    setManualEvts(prev => [...prev, res.data]);
  };
  const handleDeleteEvent = async event => {
    try {
      await calendarApi.delete(event._id);
      setManualEvts(prev => prev.filter(e => e._id !== event._id));
    } catch {/* silent */}
  };

  // ── build grid ────────────────────────────────────────────────────────────
  const firstDow = new Date(y, m, 1).getDay();
  const startOff = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMo = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOff; i++) {
    const d = daysInPrev - startOff + 1 + i;
    cells.push({
      day: d,
      cur: false,
      y: m === 0 ? y - 1 : y,
      mo: m === 0 ? 11 : m - 1
    });
  }
  for (let i = 1; i <= daysInMo; i++) cells.push({
    day: i,
    cur: true,
    y,
    mo: m
  });
  const rem = 42 - cells.length;
  for (let i = 1; i <= rem; i++) {
    cells.push({
      day: i,
      cur: false,
      y: m === 11 ? y + 1 : y,
      mo: m === 11 ? 0 : m + 1
    });
  }

  // ── counts ────────────────────────────────────────────────────────────────
  const moEvts = allEvents.filter(e => e.date?.startsWith(mk));
  const counts = {
    task: moEvts.filter(e => e.type === 'task').length,
    job: moEvts.filter(e => e.type === 'job').length,
    meeting: moEvts.filter(e => e.type === 'meeting').length,
    holiday: Object.keys(holidays).filter(d => d.startsWith(mk)).length
  };
  return <div className="cal-page">

      {/* KPI row */}
      <div className="cal-kpi-row">
        {[{
        key: 'task',
        label: 'Tasks',
        icon: '✓',
        color: '#3B6D11'
      }, {
        key: 'job',
        label: 'Jobs',
        icon: '🔧',
        color: '#185FA5'
      }, {
        key: 'meeting',
        label: 'Meetings',
        icon: '👥',
        color: '#534AB7'
      }, {
        key: 'holiday',
        label: 'Holidays',
        icon: '🪔',
        color: '#854F0B'
      }].map(({
        key,
        label,
        icon,
        color
      }) => <div key={key} className="cal-kpi-card ap-calendar-page-6" onClick={() => toggleFilter(key)} style={{
        opacity: filters[key] ? "1" : "0.45"
      }}>
            <div className="cal-kpi-icon" style={{
          color
        }}>{icon}</div>
            <div className="cal-kpi-value" style={{
          color
        }}>{counts[key]}</div>
            <div className="cal-kpi-label">{label} this month</div>
          </div>)}
      </div>

      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
          <button className="cal-nav-btn cal-nav-btn--today" onClick={goToday}>Today</button>
          <button className="cal-nav-btn" onClick={nextMonth}>›</button>
          <span className="cal-month-title">{MONTHS[m]} {y}</span>
          {loading && <span className="ap-calendar-page-7">↻ loading…</span>}
        </div>

        <div className="cal-filter-row">
          {[{
          key: 'task',
          label: 'Tasks'
        }, {
          key: 'job',
          label: 'Jobs'
        }, {
          key: 'meeting',
          label: 'Meetings'
        }, {
          key: 'holiday',
          label: 'Holidays'
        }].map(({
          key,
          label
        }) => <button key={key} className={`cal-filter-pill cal-filter-pill--${key}${filters[key] ? ' cal-filter-pill--on' : ''}`} onClick={() => toggleFilter(key)}>
              {label}
            </button>)}
        </div>

        <button className="cal-add-btn" onClick={() => setActiveModal({
        type: 'add',
        date: todayStr
      })}>
          + Add Event
        </button>
      </div>

      {/* Grid */}
      <div className="cal-grid-wrap">
        <div className="cal-head-row">
          {DAYS.map((d, i) => <div key={d} className={`cal-head-cell${i >= 5 ? ' cal-head-cell--weekend' : ''}`}>{d}</div>)}
        </div>
        <div className="cal-body">
          {cells.map((cell, idx) => {
          const dateStr = toDateStr(cell.y, cell.mo, cell.day);
          const isToday = dateStr === todayStr;
          const holiday = holidays[dateStr];
          const dayEvs = allEvents.filter(e => e.date === dateStr);
          const isWeekend = idx % 7 >= 5;
          const visible = [...(holiday && filters.holiday ? [{
            id: `h-${dateStr}`,
            title: holiday,
            date: dateStr,
            type: 'holiday',
            desc: 'Hindu / National Holiday'
          }] : []), ...dayEvs.filter(e => filters[e.type])];
          const maxShow = 3;
          const shown = visible.slice(0, maxShow);
          const overflow = visible.length - maxShow;
          return <div key={idx} className={['cal-cell', !cell.cur ? 'cal-cell--other' : '', isToday ? 'cal-cell--today' : '', isWeekend ? 'cal-cell--weekend' : ''].filter(Boolean).join(' ')} onClick={() => setActiveModal({
            type: 'add',
            date: dateStr
          })}>
                <div className={`cal-day-num${isToday ? ' cal-day-num--today' : ''}`}>{cell.day}</div>
                {holiday && filters.holiday && <div className="cal-holiday-label">{holiday}</div>}
                {shown.filter(e => e.type !== 'holiday').map(ev => <EventChip key={ev.id} event={ev} onClick={ev => setActiveModal({
              type: 'view',
              event: ev
            })} />)}
                {overflow > 0 && <div className="cal-overflow" onClick={e => {
              e.stopPropagation();
              setActiveModal({
                type: 'view',
                event: visible[maxShow]
              });
            }}>
                    +{overflow} more
                  </div>}
              </div>;
        })}
        </div>
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--task" />Task</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--job" />Job / Work order</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--meeting" />Meeting</span>
        <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot--holiday" />Hindu Holiday</span>
        <span className="ap-calendar-page-8">Click any date to add an event</span>
      </div>

      {/* Modals */}
      {activeModal?.type === 'view' && <EventModal event={activeModal.event} onClose={() => setActiveModal(null)} onDelete={handleDeleteEvent} />}
      {activeModal?.type === 'add' && <AddEventModal defaultDate={activeModal.date} onClose={() => setActiveModal(null)} onSave={handleAddEvent} />}
    </div>;
};
export default CalendarPage;
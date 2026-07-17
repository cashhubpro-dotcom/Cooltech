import { useState, useEffect } from 'react';
import { Grid3x3, Bell } from 'lucide-react';
import { COLORS } from '../../constants/tokens';
import { useDarkMode } from '../../../shared/useDarkMode';

// ─── Notification Dropdown ────────────────────────────────────────────────────
const NotifDropdown = ({
  notifs,
  onMarkRead,
  onMarkAllRead,
  onOpenNotification,
  onViewAll,
  onClose
}) => {
  const unread = notifs.filter(n => !n.read);
  const preview = notifs.slice(0, 5);
  return <>
      {/* backdrop */}
      <div onClick={onClose} className="ap-header-1" />
      <div className="notif-dropdown">
        {/* ── Header ── */}
        <div className="ap-header-2">
          <div>
            <div className="ap-header-3">
              NOTIFICATIONS
            </div>
            <div className="ap-header-4">
              {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
            </div>
          </div>
          <div className="ap-header-5">
            {unread.length > 0 && <button onClick={() => {
            onMarkAllRead();
          }} className="ap-header-6">
                ✓ Mark all read
              </button>}
            {/* Close button — always visible (desktop + mobile).
                Inline styles used deliberately here so this button's
                visibility never depends on ap-header-7 resolving correctly. */}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              className="notif-close-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                minWidth: 26,
                flexShrink: 0,
                borderRadius: '50%',
                border: 'none',
                background: '#E2E5EA',
                color: '#1F2937',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1,
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#D5D9E0';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#E2E5EA';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Notification Items ── */}
        <div className="ap-header-8">
          {preview.length === 0 ? <div className="ap-header-9">
              No notifications
            </div> : preview.map(n => <NotifItem key={n.id} n={n} onMarkRead={onMarkRead} onOpenNotification={onOpenNotification} onClose={onClose} />)}
        </div>

        {/* ── Footer: View All ── */}
        <div className="ap-header-10">
          <button onClick={() => {
          onViewAll();
          onClose();
        }} onMouseEnter={e => {
          e.currentTarget.style.background = `${COLORS.brand}10`;
        }} onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
        }} className="ap-header-11">
            View all notifications
            <span className="ap-header-12">→</span>
          </button>
        </div>
      </div>
    </>;
};

// ─── Single Notification Item ─────────────────────────────────────────────────
const NOTIF_COLORS = {
  urgent: {
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  alert: {
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  invoice: {
    bg: "var(--warning-bg)",
    color: "var(--warning)"
  },
  payment: {
    bg: "var(--warning-bg)",
    color: "var(--warning)"
  },
  ticket: {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  salary: {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  schedule: {
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  lead: {
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  contract: {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  default: {
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
const NotifItem = ({
  n,
  onMarkRead,
  onOpenNotification,
  onClose
}) => {
  const cfg = NOTIF_COLORS[n.type] || NOTIF_COLORS.default;
  const handleClick = () => {
    // Prefer the shared navigation handler (resolves sourceModel -> page,
    // marks read, and navigates) — falls back to just marking read if
    // for some reason that handler wasn't passed down.
    if (onOpenNotification) {
      onOpenNotification(n);
    } else if (onMarkRead) {
      onMarkRead(n.id);
    }
    onClose();
  };
  return <div onClick={handleClick} style={{
    background: n.read ? "var(--white)" : "var(--xfffbf5)"
  }} onMouseEnter={e => {
    e.currentTarget.style.background = '#F8FAFC';
  }} onMouseLeave={e => {
    e.currentTarget.style.background = n.read ? COLORS.white : '#FFFBF5';
  }} className="ap-header-13">
      {/* Icon */}
      <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.color}30`
    }} className="ap-header-14">
        {n.icon}
      </div>

      {/* Content */}
      <div className="ap-header-15">
        <div style={{
        fontWeight: n.read ? "600" : "800"
      }} className="ap-header-16">
          {n.title}
        </div>
        <div className="ap-header-17">
          {n.body}
        </div>
        <div className="ap-header-18">{n.time}</div>
      </div>

      {/* Unread dot */}
      {!n.read && <div className="ap-header-19" />}
    </div>;
};

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = ({
  page,
  openJob,
  TITLES,
  // time,
  clockProps,
  urgentCount,
  overdueInv,
  openComps,
  setPage,
  setSidebarOpen,
  onLogout,
  // ── Shared notification state/handlers, now lifted up to App.jsx ──────────
  // `notifs` is the SAME array NotificationsPage renders — no more duplicate
  // local state here, so the bell and the full page always agree.
  notifs = [],
  onMarkRead,
  onMarkAllRead,
  onOpenNotification
}) => {
  const [time, setTime] = useState(new Date());
  const notifCount = notifs.filter(n => !n.read).length;
  const [isDark, setIsDark] = useDarkMode();
  const {
    clockStatus,
    clockInTime,
    setClockStatus,
    setClockInTime,
    setTotalBreakSecs,
    setClockSessions,
    setBreakStartTime
  } = clockProps || {};
  const [clockDropOpen, setClockDropOpen] = useState(false);
  const [notifDropOpen, setNotifDropOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

const computeStatus = () => {
  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem('admin_token');
  const netOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  return hasToken && netOnline;
};
const [isOnline, setIsOnline] = useState(computeStatus);
useEffect(() => {
  const update = () => setIsOnline(computeStatus());
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  // catches token being cleared — either from another tab (storage event) or
  // from a same-tab logout via the custom 'authchange' event below
  window.addEventListener('storage', update);
  window.addEventListener('authchange', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
    window.removeEventListener('storage', update);
    window.removeEventListener('authchange', update);
  };
}, []);
useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (clockInTime) setElapsed(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInTime]);
  const fmtTime = secs => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor(secs % 3600 / 60);
    const s = secs % 60;
    return [h, m, s].map(x => String(x).padStart(2, '0')).join(':');
  };
  const doClockIn = () => {
    setClockInTime(new Date());
    setClockStatus('in');
    setTotalBreakSecs(0);
    setElapsed(0);
    setClockDropOpen(false);
  };
  const doBreak = () => {
    setBreakStartTime(new Date());
    setClockStatus('break');
    setClockDropOpen(false);
  };
  const doClockOut = () => {
    const t = new Date();
    const inStr = clockInTime ? clockInTime.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : '—';
    const outStr = t.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    if (setClockSessions) {
      setClockSessions(prev => [{
        id: `CS-${Date.now()}`,
        date: 'Mar 3, 2026',
        day: 'Today',
        user: 'Admin',
        inTime: inStr,
        outTime: outStr,
        breakMins: 0,
        workedMins: Math.floor(elapsed / 60),
        status: 'complete'
      }, ...prev]);
    }
    setClockStatus('out');
    setClockInTime(null);
    setTotalBreakSecs(0);
    setElapsed(0);
    setClockDropOpen(false);
  };

  // Clock button appearance
  const clockBg = {
    in: {
      bg: '#ECFDF5',
      color: '#16A34A',
      label: 'Clocked In'
    },
    break: {
      bg: '#FFFBEB',
      color: '#D97706',
      label: 'On Break'
    },
    out: {
      bg: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
      color: '#fff',
      label: 'Clock In'
    }
  }[clockStatus || 'out'];
  return <header className="header">

      {/* ── Left: breadcrumb ────────────────────────────────────── */}
      <div className="header-left">
        {/* Persistent sidebar-toggle icon — visible on all screen sizes */}
        {/* <button className="header-menu-btn ap-header-20" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar" onMouseEnter={e => {
        e.currentTarget.style.background = '#F3F4F6';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
      }}>
          <Grid3x3 size={18} color={COLORS.muted} strokeWidth={2} />
        </button> */}
        <div className="breadcrumb">
          <span className="breadcrumb-root">CoolTech</span>
          <span className="breadcrumb-sep breadcrumb-root">›</span>
          <span className="breadcrumb-page">{TITLES[page]}</span>
          {openJob && <>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-job">{openJob}</span>
            </>}
        </div>
      </div>

      {/* ── Right: actions ──────────────────────────────────────── */}
      <div className="header-right">

        {/* Live clock */}
        <div className="clock-display">
          {time.toLocaleTimeString('en-IN', {
          hour12: true
        })}
        </div>

        {/* ── Clock In/Out button ── */}
        <div className="ap-header-21">
          <button className="btn ap-header-22" style={{
          background: clockBg.bg,
          color: clockBg.color,
          boxShadow: clockStatus === 'out' ? "0 3px 10px var(--xea580c40)" : "none"
        }} onClick={() => {
          setClockDropOpen(o => !o);
          setNotifDropOpen(false);
        }}>
            <span style={{
            background: clockStatus === 'out' ? '#fff' : clockBg.color,
            animation: clockStatus === 'in' ? "blink 1.6s ease-in-out infinite" : "none"
          }} className="ap-header-23" />
            {clockBg.label}
            {clockStatus === 'in' && <span className="ap-header-24">
                {fmtTime(elapsed)}
              </span>}
          </button>

          {clockDropOpen && <>
              <div onClick={() => setClockDropOpen(false)} className="ap-header-25" />
              <div className="ap-header-26">
                <div className="ap-header-27">
                  <div className="ap-header-28">ADMIN — TODAY</div>
                  <div className="ap-header-29">
                    {clockStatus === 'out' ? 'Not clocked in yet' : `Since ${clockInTime?.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}`}
                  </div>
                </div>
                <div className="ap-header-30">
                  {clockStatus === 'out' && <ClockDropBtn icon="▶" label="Clock In" color="#16A34A" bg="#ECFDF5" onClick={doClockIn} />}
                  {clockStatus === 'in' && <>
                      <ClockDropBtn icon="⏸" label="Start Break" color="#D97706" bg="#FFFBEB" onClick={doBreak} />
                      <ClockDropBtn icon="⏹" label="Clock Out" color="#DC2626" bg="#FEF2F2" onClick={doClockOut} />
                    </>}
                  {clockStatus === 'break' && <>
                      <ClockDropBtn icon="▶" label="Resume Work" color="#16A34A" bg="#ECFDF5" onClick={() => {
                  setClockStatus('in');
                  setClockDropOpen(false);
                }} />
                      <ClockDropBtn icon="⏹" label="Clock Out" color="#DC2626" bg="#FEF2F2" onClick={doClockOut} />
                    </>}
                  <div className="ap-header-31" />
                  <ClockDropBtn icon="⏱" label="View Attendance" color={COLORS.brand} bg={COLORS.brandL} onClick={() => {
                setPage('clock');
                setClockDropOpen(false);
              }} />
                </div>
                {clockStatus === 'in' && <div className="ap-header-32">
                    <span className="ap-header-33">Work time</span>
                    <span className="ap-header-34">{fmtTime(elapsed)}</span>
                  </div>}
              </div>
            </>}
        </div>

        {/* ── Online/Offline status badge (replaces old "Live" indicator) ── */}
        <div className="live-badge" style={!isOnline ? {
        background: '#FEF2F2',
        color: '#DC2626'
      } : undefined}>
          <span className={isOnline ? 'live-dot animate-blink' : 'live-dot'} style={!isOnline ? {
          background: '#DC2626',
          animation: 'none'
        } : undefined} />
          <span className="live-text">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* ── Notifications bell + dropdown ── */}
        <div className="notif-wrapper ap-header-35">
          <button className="btn-icon" onClick={() => {
          setNotifDropOpen(o => !o);
          setClockDropOpen(false);
        }}>
            <Bell size={17} color={COLORS.muted} strokeWidth={2} />
          </button>
          {notifCount > 0 && <div className="notif-count">{notifCount}</div>}

          {notifDropOpen && <NotifDropdown notifs={notifs} onMarkRead={onMarkRead} onMarkAllRead={onMarkAllRead} onOpenNotification={onOpenNotification} onViewAll={() => setPage('notifications')} onClose={() => setNotifDropOpen(false)} />}
        </div>

        {/* Settings */}
<button className="btn-icon" onClick={() => setPage('settings')}>⚙</button>

<button onClick={() => setIsDark(d => !d)} className="icon-btn" title="Toggle dark mode">
  {isDark ? '☀️' : '🌙'}
</button>

{/* Logout */}
<button className="btn-logout" onClick={onLogout}>
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
  <span className="ap-header-36">Logout</span>
  <span className="breadcrumb-root ap-header-37">Logout</span>
</button>
      </div>
    </header>;
};

// ─── Clock Dropdown Button ────────────────────────────────────────────────────
const ClockDropBtn = ({
  icon,
  label,
  color,
  bg,
  onClick
}) => <button onClick={onClick} onMouseEnter={e => {
  e.currentTarget.style.background = bg;
}} onMouseLeave={e => {
  e.currentTarget.style.background = 'transparent';
}} className="ap-header-38">
    <span style={{
    color
  }} className="ap-header-39">{icon}</span>
    <span style={{
    color
  }} className="ap-header-40">{label}</span>
  </button>;
export default Header;
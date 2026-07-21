import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { CLIENT_TITLES } from '../../constants/navigation';
import { COLORS } from '../../constants/tokens';
import { LOGGED_IN_CLIENT } from '../../data/mockData';
import { useDarkMode } from '../../../../shared/useDarkMode';
import { fmtDateDMY } from '../../../../shared/formatDate';

// ─── Relative time formatter — backend gives ISO timestamps ──────────────────
const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return fmtDateDMY(d);
};

// ─── Map a raw backend notification doc into what this dropdown renders ──────
const normaliseNotif = (n) => ({
  id: n._id,
  title: n.title,
  body: n.message ?? '',
  read: !!n.isRead,
  time: formatTime(n.createdAt),
  icon: n.icon || '🔔',
  link: n.link || '',
});

const Header = ({
  page,
  setSidebarOpen,
  // ── Notification state now lifted to ClientApp.jsx — same array Sidebar
  // uses for its badge counts, so the bell and the sidebar never drift. ──
  notifs = [],
  onMarkRead,
  onMarkAllRead,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const title = CLIENT_TITLES[page] || 'Dashboard';
  const [isDark, setIsDark] = useDarkMode();

  const normalisedNotifs = notifs.map(normaliseNotif);
  const unreadCount = normalisedNotifs.filter((n) => !n.read).length;

  const handleMarkRead = (id) => {
    onMarkRead && onMarkRead(id);
  };

  const handleMarkAllRead = () => {
    onMarkAllRead && onMarkAllRead();
  };

  return <header className="header">
      {/* Left */}
      <div className="header-left">
        {/* ── Mobile-only hamburger — opens the sidebar drawer. Hidden on
            desktop (>=1024px) via CSS since the sidebar has its own
            collapse toggle there. ── */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="header-hamburger-btn"
          aria-label="Open menu"
        >
          <Menu size={18} color={COLORS.muted} strokeWidth={2} />
        </button>
        <span className="header-sep">❄</span>
        <span className="header-title">{title}</span>
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Support quick link */}
        <button onClick={() => navigate('/portal/tickets')} className="cp-header-1">
          🎫 New Ticket
        </button>

        {/* ── Notifications bell ── */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
            className="icon-btn"
            style={{ position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={17} color={COLORS.muted} strokeWidth={2} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16,
                borderRadius: 8, background: '#DC2626', color: '#fff', fontSize: 10,
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div className="notif-dropdown" style={{
                position: 'absolute', top: 36, right: 0, width: 340, maxHeight: 420,
                background: '#fff', border: `1px solid ${COLORS.border || '#E5E7EB'}`, borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50, display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #EEE' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: .4 }}>NOTIFICATIONS</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ border: 'none', background: 'none', color: COLORS.brand, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ✓ Mark all read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {normalisedNotifs.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>No notifications</div>
                  ) : normalisedNotifs.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => { handleMarkRead(n.id); setNotifOpen(false); }}
                      style={{
                        display: 'flex', gap: 10, padding: '10px 14px', cursor: 'pointer',
                        background: n.read ? '#fff' : '#FFFBF5', borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <div style={{ fontSize: 16 }}>{n.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: n.read ? 600 : 800, fontSize: 12.5 }}>{n.title}</div>
                        <div style={{ fontSize: 11.5, color: '#555', marginTop: 2 }}>{n.body}</div>
                        <div style={{ fontSize: 10.5, color: COLORS.muted, marginTop: 2 }}>{n.time}</div>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.brand, flexShrink: 0, marginTop: 4 }} />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => setIsDark(d => !d)} className="icon-btn header-darkmode-btn" title="Toggle dark mode">
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Profile dropdown */}
        <div className="cp-header-2">
          <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }} className="cp-header-3">
            SH
          </button>

          {profileOpen && <div className="cp-header-4">
              <div className="cp-header-5">
                <div className="cp-header-6">{LOGGED_IN_CLIENT.name}</div>
                <div className="cp-header-7">{LOGGED_IN_CLIENT.email}</div>
              </div>
              {[{
            label: '👤 My Profile',
            action: () => { navigate('/portal/profile'); setProfileOpen(false); }
          }, {
            label: '🔧 My Jobs',
            action: () => { navigate('/portal/jobs'); setProfileOpen(false); }
          }, {
            label: '🔔 Reminders',
            action: () => { navigate('/portal/reminders'); setProfileOpen(false); }
          },{
      // ── Mobile-only: same toggle as the header icon-btn, just
      // relocated here since there's no room for a separate icon
      // in the mobile header. ──
      label: isDark ? '☀️ Light Mode' : '🌙 Dark Mode',
      action: () => setIsDark(d => !d),
      mobileOnly: true,
    }].map(item => <button key={item.label} onClick={item.action} className="cp-header-8">
                  {item.label}
                </button>)}
              <div className="cp-header-9">
                <button onClick={() => navigate('/logout')} className="cp-header-10">
                  🚪 Sign Out
                </button>
              </div>
            </div>}
        </div>
      </div>
    </header>;
};
export default Header;
import { Link, useLocation } from 'react-router-dom';
import { CLIENT_NAV, CLIENT_PATH } from '../../constants/navigation';
import { COLORS } from '../../constants/tokens';

// ─── This panel is always mounted under /portal/* by the root router ─────────
const PORTAL_PREFIX = '/portal';
const pathFor = id => {
  const p = CLIENT_PATH[id];
  if (p === undefined) return PORTAL_PREFIX;
  const seg = p === '/' ? '' : p.replace(/^\//, '');
  return seg ? `${PORTAL_PREFIX}/${seg}` : PORTAL_PREFIX;
};

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  notifs = []
}) => {
  const location = useLocation();

  const relativePath = location.pathname.replace(/^\/portal\/?/, '/');
  const activePage = Object.entries(CLIENT_PATH).find(([, p]) => p === relativePath)?.[0] ?? 'dashboard';

  // ── Badge counts — unread notifications whose `link` falls under that
  // nav item's own route (e.g. a notif linking to "/portal/invoices/INV-2042"
  // counts toward the "invoices" nav item, since pathFor('invoices') ===
  // "/portal/invoices"). Same pattern as the technician panel's Sidebar. ──
  const unread = notifs.filter(n => !n.isRead);
  const badges = {};
  CLIENT_NAV.forEach(n => {
    const base = pathFor(n.id);
    badges[n.id] = unread.filter(notif => notif.link && notif.link.startsWith(base) && base !== PORTAL_PREFIX).length;
  });

  const handleMobileClose = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const isCollapsed = !sidebarOpen;
  return <>
      <div className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          {!isCollapsed && <>
              <div className="sidebar-logo-icon">❄</div>
              <div className="sidebar-logo-text">
                <div className="sidebar-logo-title">CoolTech</div>
                <div className="sidebar-logo-sub">CLIENT PORTAL</div>
              </div>
            </>}
          <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {CLIENT_NAV.map(n => {
          const badge = badges[n.id] || 0;
          const isActive = activePage === n.id;
          const to = pathFor(n.id);
          return <div key={n.id} className="nav-item">
                {isCollapsed && <div className="nav-tooltip">
                    {n.label}{badge > 0 ? ` (${badge})` : ''}
                  </div>}
                <Link to={to} onClick={handleMobileClose} className={`${`sidebar-nav-btn ${isActive ? 'active' : ''}`} cp-sidebar-1`}>
                  <span className="nav-icon">{n.icon}</span>
                  <span className="nav-label">{n.label}</span>
                  {badge > 0 && <span className="nav-badge">{badge}</span>}
                </Link>
              </div>;
        })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">SH</div>
            {!isCollapsed && <div className="sidebar-footer-info">
                <div className="sidebar-user-name">Sunrise Hotel</div>
                <div className="sidebar-user-role">Client Account</div>
              </div>}
          </div>
        </div>
      </aside>
    </>;
};
export default Sidebar;
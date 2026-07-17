import { Link, useLocation } from 'react-router-dom';
import { NAV, PATHS } from '../../constants/navigation';

const TECH_PREFIX = '/tech';
const pathFor = id => {
  const p = PATHS[id];
  if (p === undefined) return TECH_PREFIX;
  const seg = p === '/' ? '' : p.replace(/^\//, '');
  return seg ? `${TECH_PREFIX}/${seg}` : TECH_PREFIX;
};

const Sidebar = ({ open, setOpen, notifs = [] }) => {
  const location = useLocation();
  const relativePath = location.pathname.replace(/^\/tech\/?/, '/');
  const activePage = Object.entries(PATHS).find(([, p]) => p === relativePath)?.[0] ?? 'dashboard';
  const collapsed = !open;

  // ── Badge counts — unread notifications whose `link` falls under that
  // nav item's own route. e.g. a notif linking to "/tech/jobs/JOB-1013"
  // counts toward the "jobs" nav item, since pathFor('jobs') === "/tech/jobs".
  const unread = notifs.filter(n => !n.isRead);
  const badges = {};
  NAV.forEach(n => {
    const base = pathFor(n.id);
    badges[n.id] = unread.filter(notif => notif.link && notif.link.startsWith(base) && base !== TECH_PREFIX).length;
  });

  const close = () => {
    if (window.innerWidth < 1024) setOpen(false);
  };

  return <>
      <div className={`sb-backdrop ${open && window.innerWidth < 1024 ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sb-logo">
          {!collapsed && <>
              <div className="sb-logo-icon">🔧</div>
              <div className="sb-logo-text">
                <div className="sb-logo-title">CoolTech</div>
                <div className="sb-logo-sub">TECHNICIAN PANEL</div>
              </div>
            </>}
          <button className="hbg" onClick={() => setOpen(o => !o)}>
            <span className="hbg-line" /><span className="hbg-line" /><span className="hbg-line" />
          </button>
        </div>

        <nav className="sb-nav">
          {NAV.map(n => {
            const badge = badges[n.id] || 0;
            const isActive = activePage === n.id;
            return <div key={n.id} className="nav-item">
                {collapsed && <div className="nav-tip">{n.label}{badge > 0 ? ` (${badge})` : ''}</div>}
                <Link to={pathFor(n.id)} onClick={close} className={`nav-btn ${isActive ? 'active' : ''} tp-sidebar-1`}>
                  <span className="nav-icon">{n.icon}</span>
                  <span className="nav-label">{n.label}</span>
                  {badge > 0 && <span className="nav-badge">{badge}</span>}
                </Link>
              </div>;
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">RK</div>
            {!collapsed && <div className="sb-footer-info">
                <div className="sb-user-name">Ramesh Kumar</div>
                <div className="sb-user-role">Senior Technician</div>
              </div>}
          </div>
        </div>
      </aside>
    </>;
};
export default Sidebar;
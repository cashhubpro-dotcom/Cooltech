import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../../constants/tokens";
import { PATH_FOR } from "../../constants/routes";
import { ChevronRight } from "lucide-react";
import { useCompany } from "../../context/CompanyContext";

// ─── Admin panel is mounted at /admin/* — every route must be prefixed ───────
const ADMIN_PREFIX = "/admin";
const pathFor = id => {
  const p = PATH_FOR[id];
  if (p === undefined || p === "" || p === "/") return ADMIN_PREFIX;
  return `${ADMIN_PREFIX}${p.startsWith("/") ? p : `/${p}`}`;
};

const Sidebar = ({
  setOpenJob,
  badges = {},
  sidebarOpen,
  setSidebarOpen,
  NAV,
  setPage,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCollapsed = !sidebarOpen;
  const [flyout, setFlyout] = useState(null);
  const {
    logoUrl,
    companyName,
    companySubtitle
  } = useCompany();

  const flyoutRef = useRef(null);
  const flyoutTimerRef = useRef(null);

  // Build parent→children map
  const parentOf = {};
  const childrenOf = {};
  let lastParentId = null;
  NAV.forEach(n => {
    if (n.sub) {
      if (lastParentId) {
        parentOf[n.id] = lastParentId;
        if (!childrenOf[lastParentId]) childrenOf[lastParentId] = [];
        childrenOf[lastParentId].push(n.id);
      }
    } else {
      lastParentId = n.id;
    }
  });

  const relativePath = '/' + location.pathname.replace(/^\/admin\/?/, "");
  const activePage = Object.entries(PATH_FOR).find(([, p]) => p === relativePath)?.[0] ?? "dashboard";
  const activeParent = parentOf[activePage] || null;
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    if (activeParent) init[activeParent] = true;
    return init;
  });
  const toggleExpand = id => setExpanded(prev => ({
    ...prev,
    [id]: !prev[id]
  }));

  const handleMobileClose = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const openFlyout = (id, el) => {
    clearTimeout(flyoutTimerRef.current);
    const r = el.getBoundingClientRect();
    setFlyout({ id, top: r.top, left: r.right + 6 });
  };
  const closeFlyout = () => {
    flyoutTimerRef.current = setTimeout(() => setFlyout(null), 120);
  };
  const keepFlyout = () => clearTimeout(flyoutTimerRef.current);

  return <>
      <div className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>

        {/* Logo */}
<div className="sidebar-logo">
  {!isCollapsed && <>
      {logoUrl ? <img src={logoUrl} alt={companyName} onError={e => {
            e.target.style.display = 'none';
          }} className="ap-sidebar-5" /> : <div className="sidebar-logo-icon">❄</div>}

      <div className="sidebar-logo-text">
        <div className="sidebar-logo-title">{companyName || 'CoolTech'}</div>
        <div className="sidebar-logo-sub">{companySubtitle || 'AC SERVICES PLATFORM'}</div>
      </div>
    </>}

  <button className="hamburger-btn ap-sidebar-6" onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
    <span className="hamburger-line" /><span className="hamburger-line" /><span className="hamburger-line" />
  </button>
  <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">✕</button>
</div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map(n => {
          const badge = badges[n.id] || 0;
          const isActive = activePage === n.id;
          const hasKids = !!childrenOf[n.id];
          const isOpen = !!expanded[n.id];
          const isSub = !!n.sub;
          const to = pathFor(n.id);
          if (isSub) return null;
          return <div key={n.id} className="nav-item" onMouseEnter={isCollapsed && hasKids ? e => openFlyout(n.id, e.currentTarget) : undefined} onMouseLeave={isCollapsed && hasKids ? closeFlyout : undefined}>
                {n.section && !isCollapsed && <div className="nav-section-header">{n.section}</div>}
                {isCollapsed && <div className="nav-tooltip">{n.label}{badge > 0 ? ` (${badge})` : ""}</div>}
                <Link to={to} onClick={() => {
              if (hasKids && !isCollapsed) toggleExpand(n.id);
              setOpenJob(null);
              handleMobileClose();
            }} className={`${["sidebar-nav-btn", isActive ? "active" : "", !isActive && activeParent === n.id ? "parent-active" : ""].filter(Boolean).join(" ")} ap-sidebar-7`}>
                  <span className="nav-icon">{n.icon}</span>
                  <span className="nav-label">{n.label}</span>
                  {badge > 0 && <span className="nav-badge">{badge}</span>}
                  {hasKids && !isCollapsed && <span style={{
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)"
              }} className="ap-sidebar-8">
                      <ChevronRight height={18} />
                    </span>}
                </Link>
                {hasKids && isOpen && !isCollapsed && <div className="ap-sidebar-9">
                    {childrenOf[n.id].map(childId => {
                const child = NAV.find(x => x.id === childId);
                const isChildActive = activePage === childId;
                if (!child) return null;
                return <Link key={childId} to={pathFor(childId)} onClick={handleMobileClose} className={`${`sidebar-nav-btn sidebar-sub-btn ${isChildActive ? "active" : ""}`} ap-sidebar-10`} style={{
                  fontWeight: isChildActive ? "700" : "500",
                  color: isChildActive ? "var(--brand)" : "var(--text-white)",
                  background: isChildActive ? "var(--xea580c10)" : "transparent"
                }}>
                          <span className="ap-sidebar-11">{child.icon}</span>
                          <span>{child.label}</span>
                        </Link>;
              })}
                  </div>}
              </div>;
        })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!isCollapsed && <div className="sidebar-footer-stats">
              {[["0 jobs", "Today", "#F97316"], ["₹91K", "Revenue", "#22C55E"]].map(([v, k, c]) => <div key={k} className="sidebar-stat">
                  <div className="sidebar-stat-value" style={{
              color: c
            }}>{v}</div>
                  <div className="sidebar-stat-label">{k}</div>
                </div>)}
            </div>}
        </div>
      </aside>

      {/* Collapsed flyout */}
      {flyout && isCollapsed && (() => {
      const children = childrenOf[flyout.id] || [];
      return <div ref={flyoutRef} className="nav-flyout" style={{
        top: flyout.top,
        left: flyout.left
      }} onMouseEnter={keepFlyout} onMouseLeave={closeFlyout}>
            <div className="nav-flyout-title">{NAV.find(x => x.id === flyout.id)?.label}</div>
            {children.map(childId => {
          const child = NAV.find(x => x.id === childId);
          const isChildActive = activePage === childId;
          if (!child) return null;
          return <Link key={childId} to={pathFor(childId)} onClick={() => {
            setFlyout(null);
            handleMobileClose();
          }} className={`${`nav-flyout-item ${isChildActive ? "active" : ""}`} ap-sidebar-13`}>
                  <span className="nav-flyout-icon">{child.icon}</span>
                  <span>{child.label}</span>
                </Link>;
        })}
          </div>;
    })()}

      <style>{`
        @keyframes subSlideIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        .sidebar-nav-btn.parent-active { background:${COLORS.brand}08; color:${COLORS.brand}; }
      `}</style>
    </>;
};
export default Sidebar;
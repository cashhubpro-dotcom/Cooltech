import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { COLORS } from "../../constants/tokens";
import { PATH_FOR } from "../../constants/routes";
import { ChevronRight, ChevronUp, User, Settings, LogOut, Shield, Clock } from "lucide-react";
import { useCompany } from "../../context/CompanyContext";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Admin panel is mounted at /admin/* — every route must be prefixed ───────
const ADMIN_PREFIX = "/admin";
const pathFor = id => {
  const p = PATH_FOR[id];
  if (p === undefined || p === "" || p === "/") return ADMIN_PREFIX;
  // PATH_FOR values already include their own leading slash (e.g. "/jobs"),
  // so adding another "/" here produced "/admin//jobs" — a URL React Router
  // can't match, which silently redirected every sidebar click back to the
  // dashboard via the catch-all route.
  return `${ADMIN_PREFIX}${p.startsWith("/") ? p : `/${p}`}`;
};

// ─── Avatar display: image if available, else initials ───────────────────────
const UserAvatar = ({
  avatar,
  initials,
  size = 32,
  className = ""
}) => {
  const hasImg = avatar && avatar !== "" && avatar !== "null";
  const src = hasImg ? avatar.startsWith("/") ? `${API}${avatar}` : avatar : null;
  return <div className={`${className} ap-sidebar-1`} style={{
    width: size,
    height: size,
    borderRadius: size * 0.25,
    background: hasImg ? "transparent" : "linear-gradient(135deg,var(--xea580c22),var(--xea580c44))",
    fontSize: size * 0.38
  }}>
      {hasImg ? <img src={src} alt="avatar" className="ap-sidebar-2" /> : initials}
    </div>;
};

// ─── Read user from localStorage ─────────────────────────────────────────────
const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("admin_user")) || {};
  } catch {
    return {};
  }
};
const Sidebar = ({
  setOpenJob,
  badges = {},
  sidebarOpen,
  setSidebarOpen,
  clockStatus,
  NAV,
  setPage,
  onLogout
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const todayJobs = 0;
  const isCollapsed = !sidebarOpen;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({});
  const [flyout, setFlyout] = useState(null);
  const {
    logoUrl,
    companyName,
    companySubtitle
  } = useCompany();

  // ── Live user state — syncs when avatar changes in ProfilePage ──────────────
  const [currentUser, setCurrentUser] = useState(readUser);
  const userName = currentUser.name || "Admin";
  const userRole = currentUser.role || "admin";
  const userAvatar = currentUser.avatar || "";
  const userInitials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "AD";

  // Listen for "user-updated" custom event dispatched by ProfilePage
  useEffect(() => {
    const handler = () => setCurrentUser(readUser());
    window.addEventListener("user-updated", handler);
    return () => window.removeEventListener("user-updated", handler);
  }, []);
  const userMenuRef = useRef(null);
  const userBtnRef = useRef(null);
  const flyoutRef = useRef(null);
  const flyoutTimerRef = useRef(null);
  useEffect(() => {
    if (userMenuOpen && isCollapsed && userBtnRef.current) {
      const r = userBtnRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - r.top,
        left: r.right + 8
      });
    }
  }, [userMenuOpen, isCollapsed]);

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

  // ── Active page: strip the /admin prefix before comparing against
  //    PATH_FOR's values, which always keep a leading slash (e.g. "/jobs").
  //    Re-adding it here after stripping is required, or "jobs" would never
  //    match "/jobs" and activePage would always fall back to "dashboard". ──
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
  useEffect(() => {
    const handler = e => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target) && userBtnRef.current && !userBtnRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const handleMobileClose = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const openFlyout = (id, el) => {
    clearTimeout(flyoutTimerRef.current);
    const r = el.getBoundingClientRect();
    setFlyout({
      id,
      top: r.top,
      left: r.right + 6
    });
  };
  const closeFlyout = () => {
    flyoutTimerRef.current = setTimeout(() => setFlyout(null), 120);
  };
  const keepFlyout = () => clearTimeout(flyoutTimerRef.current);

  // ── Shared user menu content ────────────────────────────────────────────────
  const UserMenuContent = () => <>
      <div className="sum-header">
        <UserAvatar avatar={userAvatar} initials={userInitials} size={36} />
        <div className="sum-info ap-sidebar-3">
          <div className="sum-name">{userName}</div>
          <div className="sum-role">{userRole} · CoolTech</div>
        </div>
        <div className={`${`status-dot ${clockStatus}`} ap-sidebar-4`} />
      </div>
      <div className="sum-divider" />
      <button className="sum-item" onClick={() => {
      navigate(pathFor("profile"));
      setUserMenuOpen(false);
    }}>
        <User size={14} /><span>My Profile</span>
      </button>
      <button className="sum-item" onClick={() => {
      navigate(pathFor("account_settings"));
      setUserMenuOpen(false);
    }}>
        <Settings size={14} /><span>Account Settings</span>
      </button>
      <button className="sum-item" onClick={() => {
      navigate(pathFor("clock"));
      setUserMenuOpen(false);
    }}>
        <Clock size={14} /><span>My Attendance</span>
      </button>
      <div className="sum-divider" />
      <div className="sum-status-row">
        <div className={`status-dot ${clockStatus}`} />
        <span className="sum-status-label">
          {clockStatus === "in" ? "Currently clocked in" : clockStatus === "break" ? "On break" : "Not clocked in"}
        </span>
      </div>
      <div className="sum-divider" />
      <button className="sum-item sum-item-danger" onClick={() => {
      onLogout?.();
      setUserMenuOpen(false);
    }}>
  <LogOut size={14} /><span>Logout</span>
</button>
    </>;
  return <>
      <div className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`}>

        {/* Logo */}
<div className="sidebar-logo">
  {!isCollapsed && <>
      {/* ── Company logo or fallback snowflake ── */}
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

          <div className="sidebar-user-wrap" ref={userMenuRef}>
            {/* Inline dropdown (expanded sidebar) */}
            {userMenuOpen && !isCollapsed && <div className="sidebar-user-menu"><UserMenuContent /></div>}

            {/* Clickable user card */}
            <button ref={userBtnRef} className={`sidebar-user ${userMenuOpen ? "active" : ""}`} onClick={() => setUserMenuOpen(o => !o)} aria-label="User menu">
              {/* ── Avatar: image or initials ── */}
              <UserAvatar avatar={userAvatar} initials={userInitials} size={32} className="sidebar-user-avatar" />
              {!isCollapsed && <>
                  <div className="sidebar-user-text">
                    <div className="sidebar-user-name">{userName}</div>
                    <div className="sidebar-user-role">{userRole}</div>
                  </div>
                  <div className="sum-chevron" style={{
                transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)"
              }}>
                    <ChevronUp size={14} color="#475569" />
                  </div>
                </>}
              {isCollapsed && <div className={`${`status-dot ${clockStatus}`} ap-sidebar-12`} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Portal dropdown (collapsed sidebar) */}
      {userMenuOpen && isCollapsed && <div ref={userMenuRef} className="sidebar-user-menu sidebar-user-menu--portal" style={{
      bottom: menuPos.bottom,
      left: menuPos.left
    }}>
          <UserMenuContent />
        </div>}

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
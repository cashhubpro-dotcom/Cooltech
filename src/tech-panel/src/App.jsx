import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WelcomeToast from './components/ui/WelcomeToast';
import './styles/main.css';

import Sidebar      from './components/layout/Sidebar';
import Header       from './components/layout/Header';

// import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import JobsPage     from './pages/JobsPage';
import SchedulePage from './pages/SchedulePage';
import AMCPage      from './pages/AMCPage';
import AttendancePage from './pages/AttendancePage';
import ExpensesPage from './pages/ExpensesPage';
import InventoryPage from './pages/InventoryPage';
import LeavesPage   from './pages/LeavesPage';
import SalaryPage   from './pages/SalaryPage';
import ProfilePage  from './pages/ProfilePage';
import AdvancesPage from './pages/AdvancesPage';

import { PATHS } from './constants/navigation';
import { technicianDashboardApi, technicianNotificationsApi } from './services/technicianPortalApi';

// ─── This panel is always mounted under /tech/* by the root router ───────────
const TECH_PREFIX = '/tech';

// ─── App root ──────────────────────────────────────────────────────────────────
export default function TechApp() {

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // ── Notifications — single source of truth, shared by Sidebar + Header ──
  const [notifs, setNotifs] = useState([]);

  const fetchNotifs = useCallback(() => {
    technicianNotificationsApi.list({ limit: 50 })
      .then((r) => setNotifs(r?.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNotifs();
    window.addEventListener('focus', fetchNotifs);
    return () => window.removeEventListener('focus', fetchNotifs);
  }, [fetchNotifs]);

  const markRead = async (id) => {
    const target = notifs.find((n) => n._id === id);
    if (!target || target.isRead) return;
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    try {
      await technicianNotificationsApi.markRead(id);
    } catch {
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await technicianNotificationsApi.markAll();
    } catch {
      fetchNotifs();
    }
  };

  const [welcomeName, setWelcomeName] = useState(null);

  // ── Welcome toast stats — NEW ─────────────────────────────────────────────
  // Initialized with labeled placeholders (value 0) rather than an empty
  // array, so the grid renders immediately instead of disappearing while
  // loading or if the fetch fails.
  const [welcomeStats, setWelcomeStats] = useState([
    { icon: '📋', label: "Today's Jobs", value: 0 },
    { icon: '🗓️', label: 'Upcoming',     value: 0 },
    { icon: '✅', label: 'Done (Month)', value: 0 },
    { icon: '🌴', label: 'Leave Left',   value: 0 },
  ]);
  const [welcomeStatsLoading, setWelcomeStatsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('tech_just_logged_in')) {
      sessionStorage.removeItem('tech_just_logged_in');
      const user = JSON.parse(localStorage.getItem('tech_user') || '{}');
      setWelcomeName(user.name || 'Technician');
    }
  }, []);

  // Only fetches once the toast is actually showing (fresh login). Reuses
  // technicianDashboardApi.get(), which already existed but wasn't called
  // from anywhere yet — same /technician-portal/me/dashboard endpoint the
  // full Dashboard page presumably also uses.
  useEffect(() => {
    if (!welcomeName) return;

    let cancelled = false;
    setWelcomeStatsLoading(true);

    technicianDashboardApi.get()
      .then((res) => {
        if (cancelled) return;
        const d = res?.data ?? {};
        const earnings = d?.stats?.earnings?.amount;
        const earningsLabel = earnings == null
          ? '—'
          : (earnings >= 100000 ? `₹${(earnings / 100000).toFixed(2)}L` : `₹${Number(earnings).toLocaleString('en-IN')}`);

        setWelcomeStats([
          { icon: '📋', label: "Today's Jobs", value: d?.stats?.todaysJobsCount ?? 0 },
          { icon: '🗓️', label: 'Upcoming',     value: d?.stats?.upcomingCount ?? 0 },
          { icon: '✅', label: 'Done (Month)', value: d?.stats?.jobsDoneThisMonth ?? 0 },
          { icon: '🌴', label: 'Leave Left',   value: d?.monthSummary?.leaveBalance ?? 0 },
        ]);
      })
      .catch(() => {}) // toast still shows with the 0-value placeholders, just no live numbers
      .finally(() => { if (!cancelled) setWelcomeStatsLoading(false); });

    return () => { cancelled = true; };
  }, [welcomeName]);

  // Strip /tech before matching against PATHS' absolute-style values
  const relativePath = location.pathname.replace(/^\/tech\/?/, '/');
  const pageEntry = Object.entries(PATHS).find(([, p]) => p === relativePath);
  const page = pageEntry?.[0] ?? 'dashboard';

  return (
    <div className="tech-panel-scope">
      <div id="tech-portal-root" />
    <div className="app-shell">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} notifs={notifs} />
      {welcomeName && (
        <WelcomeToast
          name={welcomeName}
          panelLabel="Technician Panel"
          stats={welcomeStats}
          statsLoading={welcomeStatsLoading}
          onClose={() => setWelcomeName(null)}
        />
      )}
      <div className={`main-area ${sidebarOpen ? '' : 'collapsed'}`}>
        <Header page={page} setOpen={setSidebarOpen} notifs={notifs}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}/>
        <div className="page-content">
          <Routes>
            <Route path=""            element={<Dashboard />} />
            <Route path="jobs"        element={<JobsPage />} />
            <Route path="schedule"    element={<SchedulePage />} />
            <Route path="amc"         element={<AMCPage />} />
            <Route path="attendance"  element={<AttendancePage />} />
            <Route path="expenses"    element={<ExpensesPage />} />
            <Route path="inventory"   element={<InventoryPage />} />
            <Route path="leaves"      element={<LeavesPage />} />
            <Route path="salary"      element={<SalaryPage />} />
            <Route path="advances" element={<AdvancesPage />} />
            <Route path="profile"     element={<ProfilePage />} />
            <Route path="*"           element={<Navigate to="/tech" replace />} />
          </Routes>
        </div>
      </div>
    </div>
    </div>
  );
}
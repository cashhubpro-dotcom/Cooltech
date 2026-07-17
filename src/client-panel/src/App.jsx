import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import WelcomeToast from './components/ui/WelcomeToast';
import './styles/main.css';

import Sidebar from './components/layout/Sidebar';
import Header  from './components/layout/Header';

import Dashboard      from './pages/Dashboard';
import JobsPage       from './pages/JobsPage';
import InvoicesPage   from './pages/InvoicesPage';
import PaymentsPage   from './pages/PaymentsPage';
import AMCPage        from './pages/AMCPage';
import QuotationsPage from './pages/QuotationsPage';
import ContractsPage  from './pages/ContractsPage';
import TicketsPage    from './pages/TicketsPage';
import RemindersPage  from './pages/RemindersPage';
import DocumentsPage  from './pages/DocumentsPage';
import ProfilePage    from './pages/ProfilePage';

import { CLIENT_PATH } from './constants/navigation';
import { PortalDataProvider, usePortalData } from './context/PortalDataContext';
import { clientNotificationsApi } from './services/clientPortalApi'; // adjust path if it lives elsewhere

const PORTAL_PREFIX = '/portal';

function formatRupees(amount = 0) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function AppShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [welcomeName, setWelcomeName] = useState(null);
  const { data, loading } = usePortalData();

  useEffect(() => {
    if (sessionStorage.getItem('portal_just_logged_in')) {
      sessionStorage.removeItem('portal_just_logged_in');
      const user = JSON.parse(localStorage.getItem('portal_user') || '{}');
      setWelcomeName(user.name || 'Client');
    }
  }, []);

  // ── Notifications — single source of truth, shared by Sidebar + Header ──
  const [notifs, setNotifs] = useState([]);

  const fetchNotifs = useCallback(() => {
    clientNotificationsApi.list({ limit: 50 })
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
      await clientNotificationsApi.markRead(id);
    } catch {
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)));
    }
  };

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await clientNotificationsApi.markAll();
    } catch {
      fetchNotifs();
    }
  };

  const welcomeStats = [
    { icon: '🛠️', label: 'Open Requests', value: data?.kpis?.openRequests ?? 0 },
    { icon: '🎫', label: 'Open Tickets',  value: data?.openTickets ?? 0 },
    { icon: '📋', label: 'Active AMC',    value: data?.kpis?.activeAmcCount ?? 0 },
    { icon: '💳', label: 'Amount Due',    value: formatRupees(data?.kpis?.pendingInvoiceTotal) },
  ];

  const relativePath = location.pathname.replace(/^\/portal\/?/, '/');
  const pageMap = Object.entries(CLIENT_PATH).find(([, p]) => p === relativePath);
  const page = pageMap?.[0] ?? 'dashboard';

  return (
    <div className="client-portal-scope">
    <div id="client-portal-root" />
    <div className="app-shell">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notifs={notifs} />
      {welcomeName && (
        <WelcomeToast
          name={welcomeName}
          panelLabel="Client Portal"
          stats={welcomeStats}
          statsLoading={loading}
          onClose={() => setWelcomeName(null)}
        />
      )}
      <div className="main-area">
        <Header
          page={page}
          setSidebarOpen={setSidebarOpen}
          notifs={notifs}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
        />
        <div className="page-content">
          <Routes>
            <Route path=""            element={<Dashboard />} />
            <Route path="jobs"        element={<JobsPage />} />
            <Route path="invoices"    element={<InvoicesPage />} />
            <Route path="payments"    element={<PaymentsPage />} />
            <Route path="amc"         element={<AMCPage />} />
            <Route path="quotations"  element={<QuotationsPage />} />
            <Route path="contracts"   element={<ContractsPage />} />
            <Route path="tickets"     element={<TicketsPage />} />
            <Route path="reminders"   element={<RemindersPage />} />
            <Route path="documents"   element={<DocumentsPage />} />
            <Route path="profile"     element={<ProfilePage />} />
            <Route path="*"           element={<Navigate to="/portal" replace />} />
          </Routes>
        </div>
      </div>
    </div>
    </div>
  );
}

export default function ClientApp() {
  return (
    <PortalDataProvider>
      <AppShell />
    </PortalDataProvider>
  );
}
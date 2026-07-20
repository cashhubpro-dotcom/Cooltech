import './styles/main.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Routes, Route, Navigate,
  useNavigate, useLocation,
} from 'react-router-dom';

// ── Layout ────────────────────────────────────────────────────────────────────
import Sidebar from './components/layout/Sidebar';
import Header  from './components/layout/Header';
import Toast   from './components/ui/Toast';
import WelcomeToast from './components/ui/WelcomeToast';

// ── Constants ─────────────────────────────────────────────────────────────────
import { NAV, TITLES } from './constants/navigation';
import { PATH_FOR }    from './constants/routes';

// ── Data ──────────────────────────────────────────────────────────────────────
import {
  jobs, quotations, invoices, complaints, tickets,
  leads,
  INIT_CLOCK_SESSIONS,
} from './data/mockData';

// ── Shared state ──────────────────────────────────────────────────────────────
import { useLeadSources }    from './hooks/useLeadSources';
import { useCustomerTypes }  from './hooks/useCustomerTypes';
import { useContractTypes } from './hooks/useContractTypes';
import { usePlans } from './hooks/usePlans';
import {
  useJobTypes, useExpenseCategories, useNoticeCategories, useTicketIssueTypes,
  useTicketChannels, useItemCategories, useInventoryUnits, usePoTypes,
  useVehicleSubtypes, useEquipmentSubtypes, usePartTypes, useAcTypes,
  useUnitWarrantyTypes, usePartWarrantyTypes, useAdminRoles, usePaymentMethods,
  usePriceItemCategories, usePriceItemUnits, useReminderTypes, useLeaveTypes,
  useGasTypes, useGasReasons, useGasRegulationRefs, useGasDisposalMethods,
  useTaskCategories, useTaskLabels, useActivityTypes, useRecoveryPlans, useIncentiveTypes
} from './hooks/useOptionSets';
import {
  jobsApi, quotationsApi, customersApi, amcApi, invoicesApi,
  techsApi, expensesApi, inventoryApi, leadsApi, purchaseApi,
  suppliersApi, assetsApi, remindersApi, noticesApi,
  notificationsApi, uploadApi, ticketsApi, contractsApi,
} from './services/api';

// ── Modals ────────────────────────────────────────────────────────────────────
import {
  NewJobModal, NewQuotationModal, NewCustomerModal, NewAMCModal,
  NewInvoiceModal, AddTechnicianModal, AddExpenseModal, AddInventoryModal,
  NewLeadModal, NewPOModal, NewSupplierModal, NewAssetModal,
  RegisterWarrantyModal, NewNoticeModal, MarkAttendanceModal,
  AdvanceModal, SendQuotationModal, ConvertToJobModal, ReportModal,
  AddAdminUserModal, UseInventoryModal, LogFuelModal, ScheduleAMCModal,
  RequestReviewModal, AssignComplaintModal, ResolveComplaintModal,
  SetReminderModal, CustomReportModal, NewSOModal,
} from './components/modals/Modals';
import {
  SendRemindersModal, RecordPaymentModal, NewPriceItemModal,
  NewReminderModal, ApplyLeaveModal, LogGasModal, NewTaskModal, LogTimeModal,
} from './components/modals/HRModals';

// ── Clock ─────────────────────────────────────────────────────────────────────
import ClockInOutPage from './components/clock/ClockInOutPage';

// ── Pages — Main ─────────────────────────────────────────────────────────────
import Dashboard        from './pages/Dashboard';
import JobsPage         from './pages/JobsPage';
import QuotationsPage   from './pages/QuotationsPage';
import CustomersPage    from './pages/CustomersPage';
import CustomerTypesPage from './pages/CustomerTypesPage';
import AMCPage          from './pages/AMCPage';
import FeedbackPage     from './pages/FeedbackPage';
import NoticeBoardPage  from './pages/NoticeBoardPage';
import SettingsPage     from './pages/SettingsPage';
import DispatchBoard    from './pages/DispatchBoard';
import ReportsPage      from './pages/ReportsPage';
// import LogoutPage       from './pages/LogoutPage';
import ContractSettingsPage from './pages/productivity/ContractSettingsPage';
import OptionSetsPage from './pages/settings/OptionSetsPage';

// ── Pages — Finance ───────────────────────────────────────────────────────────
import InvoicesPage      from './pages/finance/InvoicesPage';
import ExpensesPage      from './pages/finance/ExpensesPage';
import PaymentsPage      from './pages/finance/PaymentsPage';
import PriceListPage     from './pages/finance/PriceListPage';
import CreateInvoicePage from './pages/finance/CreateInvoicePage';

// ── Pages — HR ────────────────────────────────────────────────────────────────
import AttendancePage       from './pages/hr/AttendancePage';
import SalaryPage           from './pages/hr/SalaryPage';
import TechniciansPage      from './pages/hr/TechniciansPage';
import LeaveManagementPage  from './pages/hr/LeaveManagementPage';
import PerformancePage      from './pages/hr/PerformancePage';
import RecruitmentPage      from './pages/hr/RecruitmentPage';
import TechniciansLookups   from './pages/hr/TechnicianLookups';
import GeneratePayroll      from './pages/hr/GeneratePayroll';
import AdvanceIncentivePage from './pages/hr/AdvanceIncentivePage';

// ── Pages — Operations ────────────────────────────────────────────────────────
import InventoryPage      from './pages/operations/InventoryPage';
import PurchaseOrdersPage from './pages/operations/PurchaseOrdersPage';
import SuppliersPage      from './pages/operations/SuppliersPage';
import AssetsPage         from './pages/operations/AssetsPage';
import WarrantyPage       from './pages/operations/WarrantyPage';
import GasLogPage         from './pages/operations/GasLogPage';
import PartsRequestsPage from './pages/operations/PartsRequestsPage';

// ── Pages — CRM ───────────────────────────────────────────────────────────────
import LeadsPage        from './pages/crm/LeadsPage';
import LeadSourcesPage  from './pages/crm/LeadSourcesPage';
import ComplaintsPage   from './pages/crm/ComplaintsPage';
import RemindersPage    from './pages/crm/RemindersPage';
import CRMAnalyticsPage from './pages/crm/CRMAnalyticsPage';

// ── Pages — Marketing ─────────────────────────────────────────────────────────
import SocialDashboard    from './pages/marketing/SocialDashboard';
import PostSchedulerPage  from './pages/marketing/PostSchedulerPage';
import CampaignPage       from './pages/marketing/CampaignPage';
import WhatsAppPage       from './pages/marketing/WhatsAppPage';
import ReviewsPage        from './pages/marketing/ReviewsPage';
import ContentLibraryPage from './pages/marketing/ContentLibraryPage';

// ── Pages — Productivity ──────────────────────────────────────────────────────
import TaskManagerPage from './pages/productivity/TaskManagerPage';
import KanbanPage      from './pages/productivity/KanbanPage';
import TeamChatPage    from './pages/productivity/TeamChatPage';
import TimeLogPage     from './pages/productivity/TimeLogPage';
import ProjectsPage    from './pages/productivity/ProjectsPage';
import ContractsPage   from './pages/productivity/ContractsPage';

// ── Pages — Support ───────────────────────────────────────────────────────────
import TicketsPage       from './pages/support/TicketsPage';
import NotificationsPage from './pages/support/NotificationsPage';
import ClientPortalPage  from './pages/support/ClientPortalPage';
import CalendarPage      from './pages/CalendarPage';
import ServicesPage      from './pages/ServicesPage';
import ACErrorCodesPage  from './pages/ACErrorCodesPage';
import DeletedItemsPage  from './pages/DeletedItemsPage';
// import LoginPage         from './pages/LoginPage';
import ProfilePage       from './pages/ProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import GstSettings from './pages/GstSettings';

import { logout } from '../services/api';
import { fmtDateDMY } from '../shared/formatDate';

// =============================================================================
//  Path helper — this panel is always mounted under /admin/* by the root
//  router (see root App.jsx). PATH_FOR now stores RELATIVE segments
//  ('', 'jobs', 'invoices/create-invoice', ...) so <Route path={...}> works
//  correctly when nested. Any time we need an actual browser URL to hand to
//  navigate(), we must go through pathFor() to add the /admin prefix back.
// =============================================================================
const ADMIN_PREFIX = '/admin';
function pathFor(id) {
  const p = PATH_FOR[id];
  if (p === undefined || p === '' || p === '/') return ADMIN_PREFIX;
  // PATH_FOR values already carry their own leading slash (e.g. '/salary/payroll'),
  // so we must NOT add another one here — doing so produced URLs like
  // '/admin//salary/payroll', which React Router fails to match against the
  // route table and silently redirects to the dashboard via the catch-all route.
  return `${ADMIN_PREFIX}${p.startsWith('/') ? p : `/${p}`}`;
}

// =============================================================================
//  ROUTE MAP
// =============================================================================
const ROUTE_MAP = [
  { id: 'dashboard',          component: Dashboard },
  { id: 'jobs',               component: JobsPage },
  { id: 'quotations',         component: QuotationsPage },
  { id: 'customers',          component: CustomersPage },
  { id: 'customer_type',      component: CustomerTypesPage },
  { id: 'amc',                component: AMCPage },
  { id: 'feedback',           component: FeedbackPage },
  { id: 'notices',            component: NoticeBoardPage },
  { id: 'settings',           component: SettingsPage },
  { id: 'dispatch',           component: DispatchBoard },
  { id: 'reports',            component: ReportsPage },
  { id: 'invoices',           component: InvoicesPage },
  { id: 'create_invoice',     component: CreateInvoicePage },
  { id: 'expenses',           component: ExpensesPage },
  { id: 'payments',           component: PaymentsPage },
  { id: 'pricelist',          component: PriceListPage },
  { id: 'attendance',         component: AttendancePage },
  { id: 'salary',             component: SalaryPage },
  { id: 'payroll',            component: GeneratePayroll },
  { id: 'advance_incentive',  component: AdvanceIncentivePage },
  { id: 'technicians',        component: TechniciansPage },
  { id: 'technician_lookups', component: TechniciansLookups },
  { id: 'leave',              component: LeaveManagementPage },
  { id: 'performance',        component: PerformancePage },
  { id: 'recruitment',        component: RecruitmentPage },
  { id: 'clock',              component: ClockInOutPage },
  { id: 'inventory',          component: InventoryPage },
  { id: 'part_requests',      component: PartsRequestsPage },
  { id: 'purchase',           component: PurchaseOrdersPage },
  { id: 'suppliers',          component: SuppliersPage },
  { id: 'assets',             component: AssetsPage },
  { id: 'warranty',           component: WarrantyPage },
  { id: 'gaslog',             component: GasLogPage },
  { id: 'leads',              component: LeadsPage },
  { id: 'lead_sources',       component: LeadSourcesPage },
  { id: 'complaints',         component: ComplaintsPage },
  { id: 'reminders',          component: RemindersPage },
  { id: 'services',           component: ServicesPage },
  { id: 'crm_analytics',      component: CRMAnalyticsPage },
  { id: 'sm_dashboard',       component: SocialDashboard },
  { id: 'sm_posts',           component: PostSchedulerPage },
  { id: 'sm_campaign',        component: CampaignPage },
  { id: 'sm_whatsapp',        component: WhatsAppPage },
  { id: 'sm_reviews',         component: ReviewsPage },
  { id: 'error_codes',        component: ACErrorCodesPage },
  { id: 'sm_content',         component: ContentLibraryPage },
  { id: 'tasks',              component: TaskManagerPage },
  { id: 'kanban',             component: KanbanPage },
  { id: 'teamchat',           component: TeamChatPage },
  { id: 'timelog',            component: TimeLogPage },
  { id: 'projects',           component: ProjectsPage },
  { id: 'contracts',          component: ContractsPage },
  { id: 'tickets',            component: TicketsPage },
  { id: 'notifications',      component: NotificationsPage },
  { id: 'client_portal',      component: ClientPortalPage },
  { id: 'calendar',           component: CalendarPage },
  { id: 'deleted_item',       component: DeletedItemsPage },
  { id: 'profile',            component: ProfilePage },
  { id: 'account_settings',   component: AccountSettingsPage },
  { id: 'contract_settings', component: ContractSettingsPage },
  { id: 'option_sets',      component: OptionSetsPage },
  { id: 'gst_sets',      component: GstSettings },
];

const SPECIAL_PROPS = new Set([
  'dashboard', 'jobs', 'clock', 'lead_sources', 'customer_type',
  'sm_dashboard', 'notifications', 'profile',
  // ↓ advance_incentive needs prefillAdvance injected
  'advance_incentive','contract_settings','amc'
]);

// =============================================================================
//  Notification routing helper
// =============================================================================
const SOURCE_MODEL_TO_PAGE_ID = {
  Complaint:    'complaints',
  Job:          'jobs',
  Invoice:      'invoices',
  Quotation:    'quotations',
  Lead:         'leads',
  Ticket:       'tickets',
  Leave:        'leave',
  AMC:          'amc',
  Customer:     'customers',
  Technician:   'technicians',
  Expense:      'expenses',
  Payment:      'payments',
  Inventory:    'inventory',
  PurchaseOrder:'purchase',
  Supplier:     'suppliers',
  Asset:        'assets',
  Warranty:     'warranty',
  Contract:     'contracts',
  Task:         'tasks',
  Project:      'projects',
  Notice:       'notices',
  Reminder:     'reminders',
};

export function resolveNotificationPageId(n) {
  const model = n?.sourceModel || n?.raw?.sourceModel;
  if (model && SOURCE_MODEL_TO_PAGE_ID[model]) return SOURCE_MODEL_TO_PAGE_ID[model];
  return null;
}

// =============================================================================
//  Helper
// =============================================================================
async function saveWithFallback(apiFn, data, successMsg, showToast, closeModal) {
  try {
    await apiFn(data);
    showToast(successMsg);
    closeModal();
  } catch (e) {
    showToast(e.message || 'Something went wrong', 'error');
  }
}

// =============================================================================
//  AppShell
// =============================================================================
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const relativePath = '/' + location.pathname.replace(/^\/admin\/?/, '');
  const activePage = Object.entries(PATH_FOR).find(([, p]) => p === relativePath)?.[0] ?? 'dashboard';

  const [openJob,        setOpenJob]        = useState(null);
  const [openJobLabel,   setOpenJobLabel]   = useState(null); // human-readable jobId shown in the header breadcrumb (openJob itself is the Mongo _id, used for lookups)
  const [sidebarOpen,    setSidebarOpen]    = useState(window.innerWidth >= 1024);
  // const [time,           setTime]           = useState(new Date());
  const [modal,          setModal]          = useState(null);
  const [toast,          setToast]          = useState(null);
  const [welcomeToast, setWelcomeToast] = useState(null);

  // ── Welcome toast stats — NEW ─────────────────────────────────────────────
  // Initialized with the labeled placeholder cards (value 0) up front —
  // NOT an empty array — so the grid renders immediately with "—" loading
  // placeholders instead of disappearing entirely until the fetch resolves.
  const [welcomeStats, setWelcomeStats] = useState([
    { icon: '📋', label: "Today's Jobs",   value: 0 },
    { icon: '🔧', label: 'Open Jobs',      value: 0 },
    { icon: '📄', label: 'Pending Quotes', value: 0 },
    { icon: '💰', label: 'Revenue',        value: '₹0' },
  ]);
  const [welcomeStatsLoading, setWelcomeStatsLoading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('admin_just_logged_in')) {
      sessionStorage.removeItem('admin_just_logged_in');
      const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
      setWelcomeToast(user.name || 'Admin');
    }
  }, []);

  // Only fetch once the toast is actually showing (fresh login), not on every
  // page load. Hits the same /admin/dashboard/stats endpoint used elsewhere,
  // extended (see admin_controller.js) to also return todaysJobs + pendingQuotes.
  useEffect(() => {
    if (!welcomeToast) return;

    let cancelled = false;
    setWelcomeStatsLoading(true);

    const token = localStorage.getItem('admin_token');
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

    fetch(`${base}/dashboard/stats`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const revenue = data?.finance?.revenueThisMonth ?? 0;
        const revenueLabel = revenue >= 100000
          ? `₹${(revenue / 100000).toFixed(2)}L`
          : `₹${revenue.toLocaleString('en-IN')}`;

        setWelcomeStats([
          { icon: '📋', label: "Today's Jobs",   value: data?.jobs?.todaysJobs ?? 0 },
          { icon: '🔧', label: 'Open Jobs',      value: data?.jobs?.open ?? 0 },
          { icon: '📄', label: 'Pending Quotes', value: data?.quotations?.pending ?? 0 },
          { icon: '💰', label: 'Revenue',        value: revenueLabel },
        ]);
      })
      .catch(() => {}) // toast still shows with the 0-value placeholders, just no live numbers
      .finally(() => { if (!cancelled) setWelcomeStatsLoading(false); });

    return () => { cancelled = true; };
  }, [welcomeToast]);

  const handleLogout = useCallback(() => {
  logout('admin');
  navigate('/login');
}, [navigate]);

  // ── Advance prefill state ─────────────────────────────────────────────────
  const [prefillAdvance, setPrefillAdvance] = useState(null);

  const { sources: leadSources, activeSources: activeLeadSources, addSource: addLeadSource, deleteSource: deleteLeadSource, toggleSource: toggleLeadSource } = useLeadSources();
  const { types: customerTypes, addType: addCustomerType, deleteType: deleteCustomerType, toggleType: toggleCustomerType } = useCustomerTypes();
  const { activeTypes: activeContractTypes, addType: addContractType } = useContractTypes();
  const { activePlans, addPlan } = usePlans();

  // ── Tier-1 option sets (DynamicSelect-backed dropdowns) ───────────────────
  const { activeItems: activeJobTypes, add: addJobType } = useJobTypes();
  const { activeItems: activeExpenseCategories, add: addExpenseCategory } = useExpenseCategories();
  const { activeItems: activeNoticeCategories, add: addNoticeCategory } = useNoticeCategories();
  const { activeItems: activeTicketIssueTypes, add: addTicketIssueType } = useTicketIssueTypes();
  const { activeItems: activeTicketChannels, add: addTicketChannel } = useTicketChannels();
  const { activeItems: activeItemCategories, add: addItemCategory } = useItemCategories();
  const { activeItems: activeInventoryUnits, add: addInventoryUnit } = useInventoryUnits();
  const { activeItems: activePoTypes, add: addPoType } = usePoTypes();
  const { activeItems: activeVehicleSubtypes, add: addVehicleSubtype } = useVehicleSubtypes();
  const { activeItems: activeEquipmentSubtypes, add: addEquipmentSubtype } = useEquipmentSubtypes();
  const { activeItems: activePartTypes, add: addPartType } = usePartTypes();
  const { activeItems: activeAcTypes, add: addAcType } = useAcTypes();
  const { activeItems: activeUnitWarrantyTypes, add: addUnitWarrantyType } = useUnitWarrantyTypes();
  const { activeItems: activePartWarrantyTypes, add: addPartWarrantyType } = usePartWarrantyTypes();
  const { activeItems: activeAdminRoles, add: addAdminRole } = useAdminRoles();
  const { activeItems: activePaymentMethods, add: addPaymentMethod } = usePaymentMethods();
  const { activeItems: activePriceItemCategories, add: addPriceItemCategory } = usePriceItemCategories();
  const { activeItems: activePriceItemUnits, add: addPriceItemUnit } = usePriceItemUnits();
  const { activeItems: activeReminderTypes, add: addReminderType } = useReminderTypes();
  const { activeItems: activeLeaveTypes, add: addLeaveType } = useLeaveTypes();
  const { activeItems: activeGasTypes, add: addGasType } = useGasTypes();
  const { activeItems: activeGasReasons, add: addGasReason } = useGasReasons();
  const { activeItems: activeGasRegulationRefs, add: addGasRegulationRef } = useGasRegulationRefs();
  const { activeItems: activeGasDisposalMethods, add: addGasDisposalMethod } = useGasDisposalMethods();
  const { activeItems: activeTaskCategories, add: addTaskCategory } = useTaskCategories();
  const { activeItems: activeTaskLabels, add: addTaskLabel } = useTaskLabels();
  const { activeItems: activeActivityTypes, add: addActivityType } = useActivityTypes();
  const { activeItems: activeRecoveryPlans, add: addRecoveryPlan } = useRecoveryPlans();
  const { activeItems: activeIncentiveTypes, add: addIncentiveType } = useIncentiveTypes();

  const [clockStatus,    setClockStatus]    = useState('out');
  const [clockInTime,    setClockInTime]    = useState(null);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakSecs, setTotalBreakSecs] = useState(0);
  const [clockSessions,  setClockSessions]  = useState(INIT_CLOCK_SESSIONS || []);

  // ── Technicians — used by AddExpenseModal's technician picker ────────────
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    techsApi.list({ limit: 500 })
      .then(r => setTechnicians(r?.data ?? []))
      .catch(() => {});
  }, []);

  const [notifs,        setNotifs]        = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(true);
  const [notifsError,   setNotifsError]   = useState(null);

  const formatNotifTime = (iso) => {
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

  const normaliseNotif = useCallback((n) => ({
    id:          n._id,
    title:       n.title,
    body:        n.message ?? '',
    type:        n.type ?? 'system',
    icon:        n.icon || '🔔',
    link:        n.link || '',
    read:        !!n.isRead,
    readAt:      n.readAt,
    time:        formatNotifTime(n.createdAt),
    createdAt:   n.createdAt,
    sourceId:    n.sourceId,
    sourceModel: n.sourceModel,
    raw:         n,
  }), []);

  const fetchNotifs = useCallback(() => {
    setNotifsLoading(true);
    notificationsApi.list({ limit: 100 })
      .then(r => {
        setNotifs((r?.data ?? []).map(normaliseNotif));
        setNotifsError(null);
      })
      .catch(err => setNotifsError(err.message || 'Failed to load notifications.'))
      .finally(() => setNotifsLoading(false));
  }, [normaliseNotif]);

  useEffect(() => {
    fetchNotifs();
    window.addEventListener('focus', fetchNotifs);
    return () => window.removeEventListener('focus', fetchNotifs);
  }, [fetchNotifs]);

  const markNotifRead = useCallback((id) => {
    if (id === undefined) return;
    setNotifs(prev => {
      const target = prev.find(n => n.id === id);
      if (!target || target.read) return prev;
      return prev.map(n => n.id === id ? { ...n, read: true } : n);
    });
    notificationsApi.markRead(id).catch(() => {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
      setToast('Failed to mark notification as read.');
    });
  }, []);

  const markAllNotifsRead = useCallback(() => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    notificationsApi.markAll().catch(() => {
      fetchNotifs();
      setToast('Failed to mark all as read.');
    });
  }, [fetchNotifs]);

  const openNotification = useCallback((n) => {
    markNotifRead(n.id);
    const pageId = resolveNotificationPageId(n);
    if (pageId && PATH_FOR[pageId] !== undefined) {
      navigate(pathFor(pageId));
      setOpenJob(null); setOpenJobLabel(null);
    }
  }, [markNotifRead, navigate]);

  const setPage = useCallback((id) => {
    navigate(pathFor(id));
    setOpenJob(null); setOpenJobLabel(null);
  }, [navigate]);

  const clockProps = {
    clockStatus, setClockStatus,
    clockInTime, setClockInTime,
    breakStartTime, setBreakStartTime,
    totalBreakSecs, setTotalBreakSecs,
    clockSessions, setClockSessions,
    setPage,
  };

  // useEffect(() => {
  //   const t = setInterval(() => setTime(new Date()), 1000);
  //   return () => clearInterval(t);
  // }, []);

  const urgentCount = jobs.filter(j =>
    j.priority === 'urgent' && !['completed', 'cancelled'].includes(j.status)
  ).length;
  const overdueInv = invoices.filter(i => i.status === 'overdue').length;
  const openComps  = complaints.filter(c => c.status === 'open').length;

  // const badges = {
  //   jobs:        urgentCount,
  //   invoices:    overdueInv,
  //   complaints:  openComps,
  //   quotations:  quotations.filter(q => q.status === 'sent').length,
  //   leads:       leads.filter(l => l.stage === 'new').length,
  //   sm_reviews:  0,
  //   tickets:     tickets.filter(t => t.status === 'open').length,
  //   recruitment: 0,
  // };

  const badges = useMemo(() => {
  const counts = {};
  notifs.forEach(n => {
    if (n.read) return;
    const pageId = resolveNotificationPageId(n);
    if (!pageId) return;
    counts[pageId] = (counts[pageId] || 0) + 1;
  });
  return counts;
}, [notifs]);

  const openModal = useCallback((type, data = {}) => {
    if (type === 'advance') {
      setPrefillAdvance(data.prefillTech ?? null);
      navigate(pathFor('advance_incentive'));
      return;
    }
    setModal({ type, data });
  }, [navigate]);

  const closeModal = () => setModal(null);
  const showToast  = useCallback(msg => { setToast(msg); closeModal(); }, []);

  const getPageElement = (id, Page) => {
    if (!SPECIAL_PROPS.has(id)) return <Page openModal={openModal} />;
    switch (id) {
      case 'profile':
        return <Page clockProps={clockProps} />;
      case 'dashboard':
        return <Page setPage={setPage} openModal={openModal} clockProps={clockProps} />;
      case 'jobs':
        return <Page openJob={openJob} setOpenJob={setOpenJob} setOpenJobLabel={setOpenJobLabel} openModal={openModal} />;
      case 'clock': {
  const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
  return <Page {...clockProps} openModal={openModal} currentUserId={user._id || user.id} />;
}
      case 'customer_type':
        return <Page types={customerTypes} onAdd={addCustomerType} onDelete={deleteCustomerType} onToggle={toggleCustomerType} />;
      case 'lead_sources':
        return <Page sources={leadSources} onAdd={addLeadSource} onDelete={deleteLeadSource} onToggle={toggleLeadSource} />;
      case 'sm_dashboard':
        return <Page setPage={setPage} />;
      case 'notifications':
        return (
          <Page
            setPage={setPage}
            notifs={notifs}
            loading={notifsLoading}
            error={notifsError}
            onRefresh={fetchNotifs}
            onMarkRead={markNotifRead}
            onMarkAllRead={markAllNotifsRead}
            onOpenNotification={openNotification}
          />
        );
      case 'amc':
        return <Page openModal={openModal} goToInvoices={() => setPage('invoices')} />;
        return (
          <Page
            openModal={openModal}
            prefillAdvance={prefillAdvance}
            onPrefillConsumed={() => setPrefillAdvance(null)}
            recoveryPlans={activeRecoveryPlans}
            onAddRecoveryPlan={addRecoveryPlan}
             incentiveTypes={activeIncentiveTypes}
            onAddIncentiveType={addIncentiveType}
          />
        );
      default:
        return <Page openModal={openModal} />;
    }
  };

  return (
    <div className="app-shell">
      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <RecordPaymentModal    open={modal?.type === 'record_payment'}    onClose={closeModal} onSave={() => showToast('Payment recorded!')}
        paymentMethods={activePaymentMethods} onAddPaymentMethod={addPaymentMethod} />
      <SendRemindersModal    open={modal?.type === 'send_reminder_all'} onClose={closeModal} onSave={() => showToast('Reminders sent!')} />
      <NewPriceItemModal
  open={modal?.type === 'new_price_item'}
  onClose={closeModal}
  item={modal?.data?.item}
  onSave={() => {
    showToast('Price item saved!');
    window.dispatchEvent(new Event('focus'));
  }}
  priceItemCategories={activePriceItemCategories} onAddPriceItemCategory={addPriceItemCategory}
  priceItemUnits={activePriceItemUnits} onAddPriceItemUnit={addPriceItemUnit}
/>
      <NewReminderModal      open={modal?.type === 'new_reminder'}      onClose={closeModal} onSave={async (data) => { await saveWithFallback(remindersApi.create, data, 'Reminder added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
        reminderTypes={activeReminderTypes} onAddReminderType={addReminderType} />
      <ApplyLeaveModal       open={modal?.type === 'apply_leave'}       onClose={closeModal} onSave={() => showToast('Leave submitted!')}
        leaveTypes={activeLeaveTypes} onAddLeaveType={addLeaveType} />
      <LogGasModal
  open={modal?.type === 'log_gas'}
  onClose={closeModal}
  onSave={(created) => {
    modal?.data?.onSave?.(created);
    showToast('Gas log saved!');
  }}
  gasTypes={activeGasTypes} onAddGasType={addGasType}
  gasReasons={activeGasReasons} onAddGasReason={addGasReason}
  gasRegulationRefs={activeGasRegulationRefs} onAddGasRegulationRef={addGasRegulationRef}
  gasDisposalMethods={activeGasDisposalMethods} onAddGasDisposalMethod={addGasDisposalMethod}
/>
      <NewTaskModal          open={modal?.type === 'new_task'}          onClose={closeModal} onSave={() => showToast('Task created!')}
        taskCategories={activeTaskCategories} onAddTaskCategory={addTaskCategory}
        taskLabels={activeTaskLabels} onAddTaskLabel={addTaskLabel} />
      <LogTimeModal          open={modal?.type === 'new_timelog'}       onClose={closeModal} onSave={() => { showToast('Time logged!'); window.dispatchEvent(new Event('focus')); }}
        activityTypes={activeActivityTypes} onAddActivityType={addActivityType} />
      <NewJobModal
  open={modal?.type === 'new_job'}
  onClose={closeModal}
   prefill={modal?.data?.fromTicket ?? modal?.data?.fromService}
  jobTypes={activeJobTypes}
  onAddJobType={addJobType}
  onSave={async (data) => {
    try {
      const created = await jobsApi.create(data);
      const newJob = created.data ?? created;

      const ticketId = modal?.data?.fromTicket?.id;
      if (ticketId) {
        await ticketsApi.update(ticketId, { job: newJob._id }).catch(() => {});
      }

      showToast('Work order created!');
      closeModal();
      window.dispatchEvent(new Event('focus'));

      navigate(pathFor('jobs'));
      setOpenJob(null); setOpenJobLabel(null);
    } catch (e) {
      showToast(e.message || 'Failed to create work order.', 'error');
    }
  }}
/>
      <NewQuotationModal
  open={modal?.type === 'new_quotation'}
  onClose={closeModal}
  preselect={modal?.data?.preselect}
  onSave={async (data) => { await saveWithFallback(quotationsApi.create, data, 'Quotation created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
  jobTypes={activeJobTypes} onAddJobType={addJobType}
/>
      <NewCustomerModal      open={modal?.type === 'new_customer'}      onClose={closeModal} onSave={async (data) => { await saveWithFallback(customersApi.create, data, 'Customer added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <NewAMCModal
  open={modal?.type === 'new_amc'}
  onClose={closeModal}
  onSave={async (data) => { await saveWithFallback(amcApi.create, data, 'AMC Contract created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
  contractTypes={activeContractTypes}
  onAddContractType={addContractType}
  plans={activePlans}
  onAddPlan={addPlan}
/>
      {/* ── NEW — Contracts page "New Contract" button. Temporarily reuses
          NewAMCModal's form shell since it already collects title/customer/
          type/plan/value/dates. Swap for a dedicated NewContractModal once
          you want the contract-specific fields (AC equipment, address,
          payment terms, etc.) collected at creation time too — right now
          those extra fields will exist on the row but empty until edited. */}
      <NewAMCModal
  open={modal?.type === 'new_contract'}
  onClose={closeModal}
  onSave={async (data) => {
    const payload = {
      title: `${data.plan || 'Service'} Contract – ${data.customerName || 'Customer'}`,
      customer: data.customerName || '',
      type: ['AMC','Installation','Service','Other'].includes(data.contractType)
        ? data.contractType
        : 'AMC',
      plan: data.plan,
      value: data.value,
      startDate: data.start,
      endDate: data.end,
      autoRenew: data.autoRenew,
      currency: data.currency,
      status: data.status || 'draft',
    };
    await saveWithFallback(contractsApi.create, payload, 'Contract created!', showToast, closeModal);
    window.dispatchEvent(new Event('focus'));
  }}
  contractTypes={activeContractTypes}
  onAddContractType={addContractType}
  plans={activePlans}
  onAddPlan={addPlan}
/>
      <NewInvoiceModal       open={modal?.type === 'new_invoice'}       onClose={closeModal} onSave={async (data) => { await saveWithFallback(invoicesApi.create, data, 'Invoice generated!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <AddTechnicianModal    open={modal?.type === 'new_tech'}          onClose={closeModal} onSave={async (data) => { await saveWithFallback(techsApi.create, data, 'Technician added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }} />
      <AddExpenseModal
  open={modal?.type === 'new_expense'}
  onClose={closeModal}
  technicians={technicians}
  expenseCategories={activeExpenseCategories}
  onAddExpenseCategory={addExpenseCategory}
  onSave={async ({ receiptFile, ...payload }) => {
    let receiptUrl;

    if (receiptFile) {
      const uploadRes = await uploadApi.upload(receiptFile);
      receiptUrl = (uploadRes.data ?? uploadRes)?.url;
    }

    await expensesApi.create({
      ...payload,
      ...(receiptUrl ? { receiptUrl, receipt: true } : {}),
    });

    showToast('Expense submitted!');
    closeModal();
    window.dispatchEvent(new Event('focus'));
  }}
/>
      <AddInventoryModal     open={modal?.type === 'new_inventory'}     onClose={closeModal} onSave={async (data) => { await saveWithFallback(inventoryApi.create, data, 'Item added!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
        itemCategories={activeItemCategories} onAddItemCategory={addItemCategory}
        inventoryUnits={activeInventoryUnits} onAddInventoryUnit={addInventoryUnit} />
      <NewLeadModal          open={modal?.type === 'new_lead'}          onClose={closeModal} onSave={async (data) => { await saveWithFallback(leadsApi.create, data, 'Lead created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
                             sources={activeLeadSources} onAddSource={addLeadSource}
                             customerTypes={customerTypes} onAddCustomerType={addCustomerType} />
      <NewPOModal            open={modal?.type === 'new_po'}            onClose={closeModal} onSave={async (data) => { await saveWithFallback(purchaseApi.create, data, 'PO created!', showToast, closeModal); window.dispatchEvent(new Event('focus')); }}
        itemCategories={activeItemCategories} onAddItemCategory={addItemCategory}
        poTypes={activePoTypes} onAddPoType={addPoType} />
      <NewSOModal            open={modal?.type === 'new_so'}            onClose={closeModal} onSave={() => showToast('SO created!')}
        itemCategories={activeItemCategories} onAddItemCategory={addItemCategory} />
      <NewSupplierModal
  open={modal?.type === 'new_supplier'}
  onClose={closeModal}
  itemCategories={activeItemCategories}
  onAddItemCategory={addItemCategory}
  onSave={async (data) => {
    const submit = modal?.data?.onSubmit ?? ((d) => suppliersApi.create(d));
    await saveWithFallback(submit, data, 'Supplier added!', showToast, closeModal);
    window.dispatchEvent(new Event('focus'));
  }}
/>
      <NewAssetModal
  open={modal?.type === 'new_asset'}
  onClose={closeModal}
  editAsset={modal?.data?.asset}
  defaultTab={modal?.data?.defaultTab || 'Vehicle'}
  vehicleSubtypes={activeVehicleSubtypes}
  onAddVehicleSubtype={addVehicleSubtype}
  equipmentSubtypes={activeEquipmentSubtypes}
  onAddEquipmentSubtype={addEquipmentSubtype}
  onSave={async (payload, editId) => {
    try {
      if (editId) {
        await assetsApi.update(editId, payload);
        showToast('Asset updated!');
      } else {
        await assetsApi.create(payload);
        showToast('Asset registered!');
      }
      closeModal();
      window.dispatchEvent(new Event('focus'));
    } catch (e) {
      showToast(e.message || 'Failed to save asset.', 'error');
    }
  }}
/>
      <RegisterWarrantyModal
  open={modal?.type === 'new_warranty'}
  onClose={closeModal}
  unitOptions={modal?.data?.unitOptions || []}
  defaultRecordType={modal?.data?.defaultRecordType || 'unit'}
  partTypes={activePartTypes} onAddPartType={addPartType}
  acTypes={activeAcTypes} onAddAcType={addAcType}
  unitWarrantyTypes={activeUnitWarrantyTypes} onAddUnitWarrantyType={addUnitWarrantyType}
  partWarrantyTypes={activePartWarrantyTypes} onAddPartWarrantyType={addPartWarrantyType}
  onSave={async (data) => {
    await modal?.data?.onSave?.(data);
    showToast('Warranty registered!');
    window.dispatchEvent(new Event('focus'));
  }}
/>
      <NewNoticeModal
        open={modal?.type === 'new_notice'}
        onClose={closeModal}
        editId={modal?.data?.id}
        noticeCategories={activeNoticeCategories}
        onAddNoticeCategory={addNoticeCategory}
        onSave={async (data, editId) => {
          try {
            if (editId) {
              await noticesApi.update(editId, data);
              showToast('Notice updated!');
            } else {
              await noticesApi.create(data);
              showToast('Notice posted!');
            }
            closeModal();
            window.dispatchEvent(new Event('focus'));
          } catch {
            showToast('Failed to save notice.');
          }
        }}
      />
      <MarkAttendanceModal   open={modal?.type === 'mark_attendance'}   onClose={closeModal} onSave={() => showToast('Attendance saved!')} />
      <AdvanceModal          open={modal?.type === 'give_advance'}      onClose={closeModal} onSave={() => showToast('Advance approved!')}  techName={modal?.data?.techName} />
      <SendQuotationModal    open={modal?.type === 'send_quotation'}    onClose={closeModal} onSave={() => showToast('Quotation sent!')}    quotId={modal?.data?.id} />
      <ConvertToJobModal     open={modal?.type === 'convert_to_job'}    onClose={closeModal} onSave={() => showToast('Job created!')}       quotId={modal?.data?.id}
        jobTypes={activeJobTypes} onAddJobType={addJobType} />
      <ReportModal           open={modal?.type === 'report'}            onClose={closeModal} title={modal?.data?.title || ''} format={modal?.data?.format || 'PDF'} />
      <AddAdminUserModal     open={modal?.type === 'new_admin'}         onClose={closeModal} onSave={() => showToast('Admin user added!')}
        adminRoles={activeAdminRoles} onAddAdminRole={addAdminRole} />
      <UseInventoryModal     open={modal?.type === 'use_inventory'}     onClose={closeModal} onSave={() => showToast('Usage logged!')}      itemName={modal?.data?.name} />
      <LogFuelModal          open={modal?.type === 'log_fuel'}          onClose={closeModal} onSave={() => showToast('Fuel logged!')}       assetName={modal?.data?.name} />
      <ScheduleAMCModal      open={modal?.type === 'schedule_amc'}      onClose={closeModal} onSave={() => showToast('Visit scheduled!')}   contractId={modal?.data?.id} />
      <RequestReviewModal    open={modal?.type === 'request_review'}    onClose={closeModal} onSave={() => showToast('Review request sent!')} />
      <AssignComplaintModal
  open={modal?.type === 'assign_complaint'}
  onClose={closeModal}
  compId={modal?.data?.displayId ?? modal?.data?.id}
  technicians={technicians}
  onSave={async (payload) => {
    try {
      await complaintsApi.assign(modal.data.id, payload);
      showToast('Complaint assigned!');
      closeModal();
      window.dispatchEvent(new Event('focus'));
    } catch (e) {
      showToast(e.message || 'Failed to assign complaint.', 'error');
    }
  }}
/>
<ResolveComplaintModal
  open={modal?.type === 'resolve_complaint'}
  onClose={closeModal}
  compId={modal?.data?.displayId ?? modal?.data?.id}
  onSave={async (payload) => {
    try {
      await complaintsApi.resolve(modal.data.id, payload);
      showToast('Complaint resolved!');
      closeModal();
      window.dispatchEvent(new Event('focus'));
    } catch (e) {
      showToast(e.message || 'Failed to resolve complaint.', 'error');
    }
  }}
/>
      <SetReminderModal      open={modal?.type === 'set_reminder'}      onClose={closeModal} onSave={() => showToast('Reminder set!')} />
      <CustomReportModal     open={modal?.type === 'custom_report'}     onClose={closeModal} onSave={() => showToast('Generating report…')} />

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {welcomeToast && (
        <WelcomeToast
          name={welcomeToast}
          panelLabel="Admin Panel"
          stats={welcomeStats}
          statsLoading={welcomeStatsLoading}
          onClose={() => setWelcomeToast(null)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        page={activePage}
        setPage={setPage}
        // onLogout={handleLogout}
        setOpenJob={setOpenJob}
        badges={badges}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        // clockStatus={clockStatus}
        NAV={NAV}
      />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="main-area">
        <Header
          page={activePage}
          openJob={openJobLabel}
          TITLES={TITLES}
          // time={time}
          clockProps={clockProps}
          urgentCount={urgentCount}
          overdueInv={overdueInv}
          openComps={openComps}
          setPage={setPage}
          onLogout={handleLogout}
          setSidebarOpen={setSidebarOpen}
          notifs={notifs}
          onMarkRead={markNotifRead}
          onMarkAllRead={markAllNotifsRead}
          onOpenNotification={openNotification}
        />

        <div className="page-content">
          <Routes>
            {ROUTE_MAP.map(({ id, component: Page }) => (
              <Route
                key={id}
                path={PATH_FOR[id]}
                element={getPageElement(id, Page)}
              />
            ))}
            <Route path="*" element={<Navigate to={pathFor('dashboard')} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
//  App root
// =============================================================================
export default function AdminApp() {
  return (
    <AppShell />
  );
}
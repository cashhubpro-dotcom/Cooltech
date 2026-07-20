import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket as TicketIcon, Phone, MessageCircle, Mail, Wrench, Receipt, ShieldCheck, CreditCard, Star, Calendar, Clock, Wind, Droplet, Zap, Package, Search, User } from 'lucide-react';
import { COLORS, FONTS } from '../constants/tokens';
import { STATUS_MAPS } from '../data/mockData'; // keep — this is just style config, not fake data
import { SBadge } from '../components/ui/Components';
import { RequestsDonut, RequestTrendChart, StarRating, KpiSparkline, BannerCityscape, TechnicianAvatar } from '../components/DashboardCharts';
import { usePortalData } from '../context/PortalDataContext';
import { clientDashboardApi } from '../services/clientPortalApi';
import { fmtDateDMY } from '../../../shared/formatDate';
const TREND_PERIODS = [{
  value: 'this_month',
  label: 'This Month'
}, {
  value: 'last_month',
  label: 'Last Month'
}, {
  value: 'this_year',
  label: 'This Year'
}];
const fmtDate = d => d ?fmtDateDMY(new Date(d)) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit'
}) : '—';
const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-IN', {
  hour: 'numeric',
  minute: '2-digit'
}) : null;

// Turns raw day-number labels from the backend into display labels matching
// the selected period ("1 Jul", "Jan"). this_year labels already arrive as
// month abbreviations from the backend, so they pass through unchanged.
const formatTrendLabels = (trendPeriod, days) => {
  if (trendPeriod === 'this_year') return days;
  const now = new Date();
  const monthDate = trendPeriod === 'last_month' ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAbbr =fmtDateDMY(monthDate);
  return days.map(d => `${d} ${monthAbbr}`);
};

// Colored icon + background per request type/issue, matching the reference
// design's colored circular icons in the "Recent Service Requests" list.
const getRequestIcon = r => {
  const text = `${r.type || ''} ${r.issue || ''} ${r.ac || ''}`.toLowerCase();
  if (text.includes('water') || text.includes('leak')) return {
    Icon: Droplet,
    bg: '#ECFEFF',
    color: '#0891B2'
  };
  if (text.includes('electric') || text.includes('wiring')) return {
    Icon: Zap,
    bg: '#FEFCE8',
    color: '#CA8A04'
  };
  if (text.includes('install')) return {
    Icon: Package,
    bg: '#F0FDF4',
    color: '#16A34A'
  };
  if (text.includes('inspect')) return {
    Icon: Search,
    bg: '#F5F3FF',
    color: '#7C3AED'
  };
  if (text.includes('cool') || text.includes('ac ') || r.type === 'Service' || r.type === 'AMC Visit') return {
    Icon: Wind,
    bg: '#EFF6FF',
    color: '#3B82F6'
  };
  return {
    Icon: Wrench,
    bg: '#FFF7ED',
    color: COLORS.brand
  };
};
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    data,
    loading,
    error
  } = usePortalData();
  const go = path => navigate(path);
  const [trendPeriod, setTrendPeriod] = useState('this_month');
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Dashboard-summary always loads "this_month" trend data on first render —
  // seed local state from it so switching periods later doesn't need to
  // refetch on mount. Runs once summary data first arrives.
  useEffect(() => {
    if (data?.trend && trendData === null) setTrendData(data.trend);
  }, [data, trendData]);

  // Refetch just the trend chart when the dropdown changes — not the whole
  // dashboard. Skips the initial 'this_month' since that's already seeded
  // from the summary call above.
  useEffect(() => {
    if (trendPeriod === 'this_month' && trendData !== null) return;
    let cancelled = false;
    setTrendLoading(true);
    clientDashboardApi.trend(trendPeriod).then(res => {
      if (!cancelled) setTrendData(res.data);
    }).catch(() => {
      if (!cancelled) setTrendData({
        days: [],
        series: {
          pending: [],
          inProgress: [],
          completed: [],
          cancelled: []
        }
      });
    }).finally(() => {
      if (!cancelled) setTrendLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendPeriod]);
  if (loading && !data) {
    return <div className="cp-dashboard-1">Loading dashboard…</div>;
  }
  if (error || !data) {
    return <div className="cp-dashboard-2">Couldn't load dashboard. {error}</div>;
  }
  const {
    client,
    kpis = {},
    requestsOverview = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0
    },
    recentRequests = [],
    recentInvoices = [],
    activeAmc = null,
    announcements = []
  } = data;

  // Defensive defaults — if the backend hasn't been redeployed with the new
  // dashboard-summary shape yet (or a field genuinely has no data), these
  // fall back to 0 instead of crashing the page on .toLocaleString().
  const {
    openRequests = 0,
    pendingInvoiceTotal = 0,
    activeAmcCount = 0,
    totalPaymentsThisYear = 0,
    serviceRating = {
      avg: 0,
      count: 0
    }
  } = kpis;
  const initials = (client?.name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const KPI_CARDS = [{
    label: 'Open Requests',
    value: openRequests,
    sub: 'in progress',
    Icon: Wrench,
    iconBg: '#FFF7ED',
    color: COLORS.brand,
    link: 'jobs'
  }, {
    label: 'Pending Invoices',
    value: `₹${pendingInvoiceTotal.toLocaleString('en-IN')}`,
    sub: 'amount due',
    Icon: Receipt,
    iconBg: '#FFFBEB',
    color: '#D97706',
    link: 'invoices'
  }, {
    label: 'Active AMC',
    value: activeAmcCount,
    sub: 'contracts',
    Icon: ShieldCheck,
    iconBg: '#F0FDF4',
    color: '#16A34A',
    link: 'amc'
  }, {
    label: 'Total Payments',
    value: `₹${totalPaymentsThisYear.toLocaleString('en-IN')}`,
    sub: 'this year',
    Icon: CreditCard,
    iconBg: '#EEF2FF',
    color: '#4F46E5',
    link: 'payments'
  }];
  const formattedTrend = trendData ? {
    ...trendData,
    days: formatTrendLabels(trendPeriod, trendData.days)
  } : null;
  return <div className="cp-dashboard-3">

      {/* Welcome banner */}
      <div className="portal-banner animate-fade-up cp-dashboard-4">
        <div className="portal-avatar">{initials}</div>
        <div className="cp-dashboard-5">
          <div className="cp-dashboard-6">
            Welcome back, {client.name} 👋
          </div>
          <div className="cp-dashboard-7">We're glad to have you with us.</div>
          <div className="cp-dashboard-8">
            <span className="cp-dashboard-9">
              <span className="cp-dashboard-10">Customer ID</span>
              <span className="cp-dashboard-11">{client.customerDisplayId}</span>
            </span>
            <span className="cp-dashboard-9">
              <span className="cp-dashboard-10">Member Since</span>
              <span className="cp-dashboard-11">{fmtDate(client.memberSince)}</span>
            </span>
            <span className="cp-dashboard-12">
              <span className="cp-dashboard-10">Account Status</span>
              <span className="cp-dashboard-13">● {client.accountStatus === 'active' || client.accountStatus === 'Active' ? 'Active' : client.accountStatus}</span>
            </span>
          </div>
        </div>
        <div className="cp-dashboard-14">
          <BannerCityscape width={230} height={110} />
        </div>
        <div className="cp-dashboard-15">
          <div className="cp-dashboard-16">
            <Calendar size={13} color="#818CF8" />
            <span className="cp-dashboard-17">
              {fmtDateDMY(new Date())}
            </span>
          </div>
          <div className="cp-dashboard-18">
            <Clock size={13} color="#64748B" />
            <span className="cp-dashboard-19">
              {new Date().toLocaleTimeString('en-IN', {
              hour: 'numeric',
              minute: '2-digit'
            })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="cp-dashboard-20">
        {KPI_CARDS.map((k, i) => <div key={k.label} className={`${`stat-card animate-fade-up${i || ''}`} cp-dashboard-21`} onClick={() => go(k.link)}>
            <div className="stat-card-header">
              <div className="stat-card-label">{k.label.toUpperCase()}</div>
              <div className="stat-card-icon cp-dashboard-22" style={{
            background: k.iconBg
          }}>
                <k.Icon size={16} color={k.color} />
              </div>
            </div>
            <div className="stat-card-value cp-dashboard-23">{k.value}</div>
            <div className="cp-dashboard-24">
              <div className="stat-card-sub">{k.sub}</div>
              <KpiSparkline color={k.color} width={64} height={20} />
            </div>
          </div>)}

        {/* Service Rating — separate card, star display instead of a number-only stat */}
        <div className="stat-card animate-fade-up3">
          <div className="stat-card-header">
            <div className="stat-card-label">SERVICE RATING</div>
            <div className="stat-card-icon cp-dashboard-25">
              <Star size={16} color="#F59E0B" fill="#F59E0B" />
            </div>
          </div>
          <div className="stat-card-value cp-dashboard-26">
            {serviceRating.count > 0 ? serviceRating.avg.toFixed(1) : '—'}
          </div>
          <div className="stat-card-sub cp-dashboard-27">
            {serviceRating.count > 0 ? <>
                <StarRating value={serviceRating.avg} size={11} />
                <span>({serviceRating.count} reviews)</span>
              </> : 'No ratings yet'}
          </div>
        </div>
      </div>

      {/* Row 2: Overview donut / Trend chart / Recent requests */}
      <div className="cp-dashboard-28">

        <div className="card animate-fade-up1">
          <div className="card-header">
            <div className="card-title">Service Requests Overview</div>
          </div>
          <RequestsDonut overview={requestsOverview} />
          <div className="cp-dashboard-29">
            <button onClick={() => go('jobs')} className="cp-dashboard-30">View All Requests →</button>
          </div>
        </div>

        <div className="card animate-fade-up2">
          <div className="card-header">
            <div className="card-title">Request Status Trend</div>
            <select value={trendPeriod} onChange={e => setTrendPeriod(e.target.value)} className="cp-dashboard-31">
              {TREND_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          {trendLoading ? <div className="cp-dashboard-32">
              Loading trend…
            </div> : <RequestTrendChart trend={formattedTrend || {
          days: [],
          series: {
            pending: [],
            inProgress: [],
            completed: [],
            cancelled: []
          }
        }} />}
        </div>

        <div className="card animate-fade-up3">
          <div className="card-header">
            <div className="card-title">Recent Service Requests</div>
            <button onClick={() => go('jobs')} className="cp-dashboard-33">View All →</button>
          </div>
          {recentRequests.length > 0 ? recentRequests.map(r => {
          const {
            Icon,
            bg,
            color
          } = getRequestIcon(r);
          return <div key={r._id} className="cp-dashboard-34">
                <div style={{
              background: bg
            }} className="cp-dashboard-35">
                  <Icon size={14} color={color} />
                </div>
                <div className="cp-dashboard-36">
                  <div className="cp-dashboard-37">
                    <span className="cp-dashboard-38">{r.jobId}</span>
                    <SBadge s={r.status} map={STATUS_MAPS.job} />
                  </div>
                  <div className="cp-dashboard-39">{r.issue || r.ac || r.type}</div>
                  <div className="cp-dashboard-40">{fmtDateTime(r.createdAt)}</div>
                </div>
              </div>;
        }) : <div className="cp-dashboard-41">No service requests yet</div>}
        </div>
      </div>

      {/* Row 3: AMC / Recent invoices / Announcements + Quick support */}
      <div className="cp-dashboard-42">

        <div className="card animate-fade-up1">
          <div className="card-header">
            <div className="card-title">Upcoming AMC Visits</div>
            <button onClick={() => go('amc')} className="cp-dashboard-33">View All →</button>
          </div>
          {activeAmc ? <div className="card-body">
              <div className="cp-dashboard-43">
                <div className="cp-dashboard-44">{client.name} – AMC</div>
                <SBadge s={activeAmc.status} map={STATUS_MAPS.amc} />
              </div>
              {activeAmc.nextVisit ? <div className="cp-dashboard-45">
                  <div className="cp-dashboard-46">Next Visit</div>
                  <div className="cp-dashboard-47">{fmtDate(activeAmc.nextVisit)}</div>
                  {fmtTime(activeAmc.nextVisit) && <div className="cp-dashboard-48">{fmtTime(activeAmc.nextVisit)}</div>}
                  <div className="cp-dashboard-49">
                    <User size={13} color={COLORS.muted} /> {activeAmc.assignedTechnician?.name || 'Technician to be assigned'}
                  </div>
                </div> : <div className="cp-dashboard-50">No visit scheduled yet</div>}
              <button onClick={() => go('amc')} className="cp-dashboard-51">Reschedule Visit</button>
            </div> : <div className="cp-dashboard-52">No active AMC contract</div>}
        </div>

        <div className="card animate-fade-up2">
          <div className="card-header">
            <div className="card-title">Recent Invoices</div>
            <button onClick={() => go('invoices')} className="cp-dashboard-33">View All →</button>
          </div>
          {recentInvoices.length > 0 ? recentInvoices.map(inv => <div key={inv._id} className="cp-dashboard-53">
              <div className="cp-dashboard-54">📄</div>
              <div className="cp-dashboard-55">
                <div className="cp-dashboard-56">{inv.invoiceNo}</div>
                <div className="cp-dashboard-57">{inv.subject}</div>
                <div className="cp-dashboard-58">{fmtDate(inv.createdAt || inv.date)}</div>
              </div>
              <div className="cp-dashboard-59">
                <div className="cp-dashboard-60">₹{(inv.total || 0).toLocaleString('en-IN')}</div>
                <SBadge s={inv.status} map={STATUS_MAPS.invoice} />
              </div>
            </div>) : <div className="cp-dashboard-61">No invoices yet</div>}
        </div>

        <div className="cp-dashboard-62">
          <div className="card animate-fade-up3">
            <div className="card-header">
              <div className="card-title">Announcements</div>
            </div>
            {announcements.length > 0 ? announcements.map(a => <div key={a._id} className="cp-dashboard-63">
                <div className="cp-dashboard-64">
                  <span className="cp-dashboard-65">{a.icon || '📢'}</span>
                  <div className="cp-dashboard-66">
                    <div className="cp-dashboard-67">{a.title}</div>
                    <div className="cp-dashboard-68">{a.message}</div>
                    <div className="cp-dashboard-69">{fmtDate(a.createdAt)}</div>
                  </div>
                </div>
              </div>) : <div className="cp-dashboard-70">No announcements right now</div>}
          </div>

          <div className="card animate-fade-up3">
            <div className="card-header">
              <div className="card-title">Quick Support</div>
            </div>
            <div className="cp-dashboard-71">
              <QuickAction icon={<TicketIcon size={18} />} label="Raise Ticket" onClick={() => go('tickets?new=1')} />
              <QuickAction icon={<Phone size={18} />} label="Call Us" onClick={() => window.open('tel:+911234567890')} />
              <QuickAction icon={<MessageCircle size={18} />} label="WhatsApp" onClick={() => window.open('https://wa.me/911234567890')} />
              <QuickAction icon={<Mail size={18} />} label="Email Us" onClick={() => window.open('mailto:support@cooltech.com')} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA banner */}
      <div className="portal-banner animate-fade-up3 cp-dashboard-72">
        <div className="cp-dashboard-73">
          <TechnicianAvatar size={52} />
          <div>
            <div className="cp-dashboard-74">Need a service?</div>
            <div className="cp-dashboard-75">Raise a new service request and our team will get back to you.</div>
          </div>
        </div>
        <button onClick={() => go('jobs?new=1')} className="cp-dashboard-76">
          + New Service Request
        </button>
      </div>
    </div>;
};
const QuickAction = ({
  icon,
  label,
  onClick
}) => <button onClick={onClick} className="cp-dashboard-77">
    <span className="cp-dashboard-78">{icon}</span>
    <span className="cp-dashboard-79">{label}</span>
  </button>;
const pillStyle = {
  fontSize: 11,
  color: "var(--text-faint)",
  background: 'rgba(148,163,184,.12)',
  padding: '5px 12px',
  borderRadius: 7,
  display: 'flex',
  flexDirection: 'column',
  gap: 1
};
const pillLabel = {
  fontSize: 9.5,
  color: "var(--text-muted)",
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.3
};
const pillValue = {
  fontSize: 12.5,
  color: "var(--border)",
  fontWeight: 700
};
const ghostBtnStyle = {
  width: '100%',
  padding: '9px',
  borderRadius: 8,
  background: 'transparent',
  border: `1.5px solid ${COLORS.border}`,
  color: COLORS.brand,
  fontWeight: 700,
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'inherit'
};
const linkBtnStyle = {
  fontSize: 12,
  color: COLORS.brand,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontFamily: 'inherit'
};
const trendSelectStyle = {
  fontSize: 12,
  color: COLORS.h2,
  fontWeight: 600,
  fontFamily: 'inherit',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: '4px 8px',
  background: COLORS.white,
  cursor: 'pointer',
  outline: 'none'
};
export default Dashboard;
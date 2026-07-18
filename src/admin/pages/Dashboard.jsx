import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { amcApi, complaintsApi, contractsApi, invoicesApi, jobsApi, leadsApi, quotationsApi, techsApi, ticketsApi, dashboardOverviewApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../components/ui/Form';
import { RevenueChart, Donut, BarChart } from '../components/charts/Charts';
// NOTIF_TYPE_CFG is a color/icon *styling* lookup keyed by notification type,
// not mock content — kept as the source of per-type bg/color/fallback-icon
// since the Notification model itself doesn't store colors.
import { NOTIF_TYPE_CFG } from '../data/mockData';

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtClockDur(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, '0')).join(':');
}

// Merges backend counts ([{status,count}] or [{type,count}]) with a local
// label/color metadata map, and computes pct. Replaces the old
// buildDonutData, which filtered a full local `jobs` array — the backend
// now does that aggregation, so this just merges counts with display info.
function mergeCounts(counts, keys, metaFor) {
  const rows = keys.map(key => {
    const found = counts.find(c => (c.status ?? c.type) === key);
    const meta = metaFor(key);
    return { type: meta.label, count: found?.count ?? 0, color: meta.color };
  }).filter(r => r.count > 0);
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return rows.map(r => ({ ...r, pct: Math.round((r.count / total) * 100) }));
}

const formatINR = (value) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const formatActivityTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Maps a PanelCard dropdown's human label to the snake_case key the backend
// expects as a query param.
const PERIOD_KEY = {
  'This Week': 'this_week',
  'This Month': 'this_month',
  'Last Month': 'last_month',
  'This Quarter': 'this_quarter',
  'This Year': 'this_year',
};

// Job "type" colors — mirrors the categories that already exist on job
// records (job.type: "Service" | "Repair" | "Installation" | "AMC Visit").
const TYPE_COLORS = {
  Service:      '#F97316',
  Repair:       '#3B82F6',
  Installation: '#10B981',
  'AMC Visit':  '#8B5CF6',
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({ setPage, openModal, clockProps }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { clockStatus, clockInTime, totalBreakSecs, breakStartTime } = clockProps || {};
  const [clkElap, setClkElap] = useState(0);
  const [brkElap, setBrkElap] = useState(0);
  const [expandedChart, setExpandedChart] = useState(null); // null | 'revenue' | 'category'

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // One independent period per dropdown-driven panel — see PERIOD_KEY above
  // for the label → query-param mapping.
  const [jobsOverviewPeriod, setJobsOverviewPeriod] = useState('This Week');
  const [categoryPeriod, setCategoryPeriod] = useState('This Month');
  const [topRevenuePeriod, setTopRevenuePeriod] = useState('This Month');
  const [revenuePeriod, setRevenuePeriod] = useState('This Month');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardOverviewApi({
      jobsOverviewPeriod: PERIOD_KEY[jobsOverviewPeriod],
      categoryPeriod: PERIOD_KEY[categoryPeriod],
      topRevenuePeriod: PERIOD_KEY[topRevenuePeriod],
      revenuePeriod: PERIOD_KEY[revenuePeriod],
    })
      .then(res => { if (!cancelled) setOverview(res?.data ?? null); })
      .catch(e => { if (!cancelled) setLoadError(e.message || 'Could not load dashboard data'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [jobsOverviewPeriod, categoryPeriod, topRevenuePeriod, revenuePeriod]);

  useEffect(() => {
    const id = setInterval(() => {
      if (clockInTime) setClkElap(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
      if (clockStatus === 'break' && breakStartTime)
        setBrkElap(Math.floor((Date.now() - breakStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInTime, clockStatus, breakStartTime]);

  const netSecs = Math.max(0, clkElap - (totalBreakSecs || 0) - (clockStatus === 'break' ? brkElap : 0));

  // Safe fallback shape so the rest of the component can render before the
  // fetch resolves (and stay renderable if it fails) without null-checking
  // every field individually below.
  const kpis = overview?.kpis || {
    todayJobs: 0, openJobs: 0, pendingQuotes: 0, overdueInvoices: 0, openTickets: 0,
    revenueThisMonth: 0, revenueLastMonth: 0, revenueChangePct: null,
  };

  const clkColor  = { in: '#16A34A', break: '#D97706', out: COLORS.faint }[clockStatus || 'out'];
  const clkBg     = { in: '#ECFDF5', break: '#FFFBEB', out: COLORS.bg }[clockStatus || 'out'];
  const clkLabel  = { in: 'Clocked In', break: 'On Break', out: 'Not Clocked In' }[clockStatus || 'out'];

  // ── "Jobs Overview" donut — full status breakdown, driven by JOB_STATUS ──
  const jobsOverviewData = mergeCounts(
    overview?.jobsOverview || [],
    Object.keys(JOB_STATUS),
    key => ({ label: JOB_STATUS[key].label, color: JOB_STATUS[key].dot || JOB_STATUS[key].color }),
  );
  const jobsOverviewTotal = jobsOverviewData.reduce((s, d) => s + d.count, 0);

  // ── "Jobs by Type" donut — Service / Repair / Installation / AMC Visit ──
  const jobsByTypeData = mergeCounts(
    overview?.jobsByType || [],
    Object.keys(TYPE_COLORS),
    key => ({ label: key, color: TYPE_COLORS[key] }),
  );
  const jobsByTypeTotal = jobsByTypeData.reduce((s, d) => s + d.count, 0);

  // ── "Jobs by Category" bar chart — now its own period-filtered field,
  //    separate from the all-time jobsByType donut above ────────────────────
  const jobsByCategory = overview?.jobsByCategory || [];

  // ── "Top Revenue by Service" ─────────────────────────────────────────────
  const topRevenueByService = (overview?.topRevenueByService || []).map(r => ({ label: r.type, value: r.total }));
  const maxRevenueValue = Math.max(1, ...topRevenueByService.map(r => r.value));

  // ── Recent Jobs / Field Technicians — straight from the API ─────────────
  const recentJobs = overview?.recentJobs || [];
  const technicians = overview?.technicians || [];

  // ── Revenue Overview chart — now period-driven (see revenue.period) ─────
  const revenue = overview?.revenue || { total: 0, changePct: null, series: [] };
  const revenueData = revenue.series.map(r => ({ m: r.m, v: r.v }));

  // ── "Recent Activity" — real notifications, already unread-first from the API ─
  const recentActivity = overview?.recentActivity || [];

  // ── Responsive grid columns ──────────────────────────────────────────────
  const kpiCols  = isMobile ? 'repeat(2,minmax(0,1fr))' : isTablet ? 'repeat(3,minmax(0,1fr))' : 'repeat(6,minmax(0,1fr))';
  const rowACols = isMobile ? '1fr' : isTablet ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))';
  const rowBCols = isMobile ? '1fr' : isTablet ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 10 : 0,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: COLORS.h1 }}>
            Good Morning, Admin 👋
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}>
            Monday, 3 March 2026 · CoolTech AC Services
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <button
            className="btn"
            onClick={() => setPage('dispatch')}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '8px 12px' : '10px 22px',
              borderRadius: 10,
              background: '#1A1A2E',
              color: '#FDBA74',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
            }}
          >
            🚐 Dispatch Board
          </button>
          <button
            className="btn"
            onClick={() => openModal('new_job')}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '8px 12px' : '10px 22px',
              borderRadius: 10,
              background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`,
              color: 'white',
              fontSize: isMobile ? 12 : 13,
              fontWeight: 700,
              boxShadow: `0 4px 14px ${COLORS.brand}50`,
            }}
          >
            + New Job
          </button>
        </div>
      </div>

      {loadError && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
          padding: '10px 14px', fontSize: 12.5, color: '#991B1B',
        }}>
          Couldn't load live dashboard data — showing zeros/empty panels. ({loadError})
        </div>
      )}

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: isMobile ? 8 : 12 }}>
        <KCard label="Today's Jobs"     value={kpis.todayJobs}        sub="scheduled"        icon="📋" iconBg="#FFF7ED" color={COLORS.brand}  delay="0" />
        <KCard label="Open Jobs"        value={kpis.openJobs}         sub="need action"       icon="🔧" iconBg="#EFF6FF" color="#3B82F6"        delay="1" />
        <KCard label="Pending Quotes"   value={kpis.pendingQuotes}    sub="awaiting approval" icon="📄" iconBg="#F0FDF4" color="#16A34A"        delay="2" />
        <KCard label="Overdue Invoices" value={kpis.overdueInvoices}  sub="payment pending"   icon="⚠️" iconBg="#FEF2F2" color="#DC2626"        delay="3" />
        <KCard label="Open Tickets"     value={kpis.openTickets}      sub="customer support"  icon="🎫" iconBg="#F5F3FF" color="#7C3AED"        delay="4" />
        <KCard label="Revenue (This Month)" value={formatINR(kpis.revenueThisMonth)} sub={kpis.revenueChangePct === null ? 'no prior month data' : `${kpis.revenueChangePct >= 0 ? '+' : ''}${kpis.revenueChangePct}% vs last month`} icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="5" />
      </div>

      {/* ── Clock In/Out Banner ─────────────────────────────────────────────── */}
      <div
        onClick={() => setPage('clock')}
        style={{
          background: clockStatus === 'in'
            ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)'
            : clockStatus === 'break'
            ? 'linear-gradient(135deg,#FFFBEB,#FEF3C7)'
            : `linear-gradient(135deg,${COLORS.brandL},#FFE4C4)`,
          border: `1.5px solid ${clockStatus === 'in' ? '#A7F3D0' : clockStatus === 'break' ? '#FDE68A' : `${COLORS.brand}30`}`,
          borderRadius: 14,
          padding: isMobile ? '12px 14px' : '14px 20px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 10 : 0,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: clkBg, border: `1.5px solid ${clkColor}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>⏱</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.h1 }}>My Attendance Today</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: COLORS.muted, marginTop: 2, lineHeight: 1.4 }}>
              {clockStatus === 'in' && clockInTime
                ? `Clocked in at ${clockInTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} — working`
                : clockStatus === 'break'
                ? 'Currently on break — resume when ready'
                : 'Not yet clocked in — click here or use the button in the header'}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, alignSelf: isMobile ? 'flex-end' : 'center' }}>
          {clockStatus !== 'out' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: clkColor, lineHeight: 1 }}>
                {fmtClockDur(netSecs)}
              </div>
              <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>work time</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 99, background: clkBg }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: clkColor, display: 'block', animation: clockStatus === 'in' ? 'blink 1.6s ease-in-out infinite' : 'none' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: clkColor }}>{clkLabel}</span>
          </div>
          <span style={{ fontSize: 12, color: COLORS.muted }}>View →</span>
        </div>
      </div>

      {/* ── Row A: Jobs Overview · Revenue Overview · Jobs by Status · Field Technicians ── */}
      <div style={{ display: 'grid', gridTemplateColumns: rowACols, gap: 14, alignItems: 'stretch' }}>

        {/* Jobs Overview */}
        <PanelCard title="Jobs Overview" tag="This Week" periodOptions={['This Week', 'This Month', 'Last Month']} onPeriodChange={setJobsOverviewPeriod}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut data={jobsOverviewData} centerLabel={jobsOverviewTotal} centerSub="Total Jobs" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {jobsOverviewData.map(d => (
                <LegendRow key={d.type} label={d.type} count={d.count} pct={d.pct} color={d.color} />
              ))}
            </div>
          </div>
          {/* Previously a hardcoded "↑ 8% more jobs than last week" here — removed
              since it no longer makes sense once this panel is genuinely
              period-filtered (it'd stay glued to "last week" regardless of the
              selected period). Add a real period-over-period comparison field
              on the backend if this callout is worth bringing back. */}
        </PanelCard>

        {/* Revenue Overview */}
        <PanelCard title="Revenue Overview" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter', 'This Year']} onPeriodChange={setRevenuePeriod} onExpand={() => setExpandedChart('revenue')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.h1 }}>{formatINR(revenue.total)}</div>
            {revenue.changePct !== null && (
              <div style={{ fontSize: 11, color: revenue.changePct >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                {revenue.changePct >= 0 ? '↑' : '↓'} {Math.abs(revenue.changePct)}% vs previous period
              </div>
            )}
          </div>
          <RevenueChart data={revenueData} />
        </PanelCard>

        {/* Jobs by Type */}
        <PanelCard title="Jobs by Type">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Donut data={jobsByTypeData} centerLabel={jobsByTypeTotal} centerSub="Total" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {jobsByTypeData.map(d => (
                <LegendRow key={d.type} label={d.type} count={d.count} pct={d.pct} color={d.color} />
              ))}
            </div>
          </div>
        </PanelCard>

        {/* Field Technicians */}
        <PanelCard title="Field Technicians" tag="View All →" onTagClick={() => setPage('dispatch')}>
          <div style={{ maxHeight: isMobile ? 'none' : 320, overflowY: 'auto', marginTop: 8 }}>
            {technicians.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar name={t.name} size={32} color={t.status === 'available' ? COLORS.success : t.status === 'busy' ? COLORS.brand : COLORS.faint} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.h2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.faint }}>{t.area}</div>
                </div>
                <SBadge s={t.status} map={TECH_STATUS} />
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      {/* ── Row B: Jobs by Category · Recent Jobs · Top Revenue by Service · Recent Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: rowBCols, gap: 14, alignItems: 'stretch' }}>

        {/* Jobs by Category */}
        <PanelCard title="Jobs by Category" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter']} onPeriodChange={setCategoryPeriod} onExpand={() => setExpandedChart('category')}>
          <BarChart
            data={jobsByCategory.map(c => ({ label: c.label, value: c.value }))}
            color="#3B82F6"
            height={170}
          />
        </PanelCard>

        {/* Recent Jobs */}
        <PanelCard title="Recent Jobs" tag="View All →" onTagClick={() => setPage('jobs')}>
          {recentJobs.map((job, i) => (
            <div
              key={job.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                borderBottom: i < recentJobs.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: COLORS.brandL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>
                {job.type === 'Repair' ? '🔧' : job.type === 'Installation' ? '📦' : job.type === 'AMC Visit' ? '📋' : '❄️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.customer}</div>
                <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 1 }}>{job.type || 'General Service'}</div>
              </div>
              <SBadge s={job.status} map={JOB_STATUS} />
            </div>
          ))}
        </PanelCard>

        {/* Top Revenue by Service */}
        <PanelCard title="Top Revenue by Service" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter']} onPeriodChange={setTopRevenuePeriod}>
          {topRevenueByService.map(r => (
            <div key={r.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: COLORS.h2 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, fontFamily: FONTS.mono }}>₹{r.value.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: 4, borderRadius: 3, background: COLORS.border }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${(r.value / maxRevenueValue) * 100}%`,
                  background: 'linear-gradient(90deg,#16A34A,#22C55E)',
                }} />
              </div>
            </div>
          ))}
        </PanelCard>

        {/* Recent Activity */}
        <PanelCard title="Recent Activity" tag="View All →" onTagClick={() => setPage('notifications')}>
          {recentActivity.map(n => {
            const cfg = NOTIF_TYPE_CFG[n.type] || { color: COLORS.muted, bg: COLORS.bg, icon: '🔔' };
            return (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}>
                  {n.icon || cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: COLORS.h2, lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: COLORS.faint, marginTop: 2 }}>{formatActivityTime(n.createdAt)}</div>
                </div>
                {!n.read && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.brand, flexShrink: 0, marginTop: 5 }} />
                )}
              </div>
            );
          })}
        </PanelCard>
      </div>

      {/* ── Full-size chart preview ────────────────────────────────────────── */}
      {expandedChart && (
        <div
          onClick={() => setExpandedChart(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: COLORS.white, borderRadius: 16, padding: '24px 28px',
              width: 'min(880px, 92vw)', maxHeight: '85vh', overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,.25)', border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>
                {expandedChart === 'revenue' ? 'Revenue Overview' : 'Jobs by Category'}
              </div>
              <button
                onClick={() => setExpandedChart(null)}
                style={{
                  background: COLORS.bg, border: 'none', borderRadius: 8,
                  width: 32, height: 32, fontSize: 18, color: COLORS.muted, cursor: 'pointer',
                }}
              >×</button>
            </div>

            {expandedChart === 'revenue' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: COLORS.h1 }}>{formatINR(revenue.total)}</div>
                  {revenue.changePct !== null && (
                    <div style={{ fontSize: 13, color: revenue.changePct >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
                      {revenue.changePct >= 0 ? '↑' : '↓'} {Math.abs(revenue.changePct)}% vs previous period
                    </div>
                  )}
                </div>
                <RevenueChart data={revenueData} height={340} />
              </>
            )}

            {expandedChart === 'category' && (
              <BarChart
                data={jobsByCategory.map(c => ({ label: c.label, value: c.value }))}
                color="#3B82F6"
                height={340}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Shared Panel Card wrapper ─────────────────────────────────────────────────
// `tag` alone → static pill (legacy, unused now)
// `tag` + `onTagClick` → link-style button, e.g. "View All →"
// `tag` + `periodOptions` → real dropdown: click to open a menu, pick an
// option, the pill label updates and `onPeriodChange` (if given) fires.
const PanelCard = ({ title, tag, onTagClick, periodOptions, onPeriodChange, onExpand, children }) => {
  const [period, setPeriod] = useState(tag);
  const [open, setOpen] = useState(false);
  const isDropdown = Array.isArray(periodOptions) && periodOptions.length > 0;

  return (
    <div style={{
      background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,.05)', padding: '16px 18px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.h1 }}>{title}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {onExpand && (
            <button
              onClick={onExpand}
              title="View full size"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 24, height: 24, borderRadius: 6,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                color: COLORS.muted, cursor: 'pointer', fontSize: 12, lineHeight: 1,
              }}
            >⤢</button>
          )}
        {isDropdown ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: COLORS.muted, fontWeight: 700,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                cursor: 'pointer', padding: '3px 9px', borderRadius: 6,
              }}
            >
              {period}
              <span style={{ fontSize: 8, marginTop: 1, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
            </button>
            {open && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 41,
                  background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,.12)', minWidth: 130, overflow: 'hidden',
                }}>
                  {periodOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => { setPeriod(opt); setOpen(false); onPeriodChange?.(opt); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
                        fontSize: 12, fontWeight: opt === period ? 700 : 500,
                        color: opt === period ? COLORS.brand : COLORS.h2,
                        background: opt === period ? `${COLORS.brand}10` : 'transparent',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : tag && (
          <button
            onClick={onTagClick}
            style={{
              fontSize: 11, color: onTagClick ? COLORS.brand : COLORS.faint, fontWeight: 700,
              background: onTagClick ? 'transparent' : COLORS.bg,
              border: 'none', cursor: onTagClick ? 'pointer' : 'default',
              padding: onTagClick ? 0 : '3px 9px', borderRadius: 6,
            }}
          >
            {tag}
          </button>
        )}
        </div>
      </div>
      {children}
    </div>
  );
};

// ─── Donut legend row ───────────────────────────────────────────────────────────
const LegendRow = ({ label, count, pct, color, showPct = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
    <div style={{ width: 8, height: 8, borderRadius: 3, background: color, flexShrink: 0 }} />
    <div style={{ flex: 1, fontSize: 12, color: COLORS.h2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2, fontFamily: FONTS.mono }}>{count}</div>
    {showPct && <div style={{ fontSize: 11, color: COLORS.faint, width: 34, textAlign: 'right' }}>({pct}%)</div>}
  </div>
);

export default Dashboard;
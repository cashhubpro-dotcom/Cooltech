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
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtClockDur(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600),
    m = Math.floor(s % 3600 / 60),
    sec = s % 60;
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
    return {
      type: meta.label,
      count: found?.count ?? 0,
      color: meta.color
    };
  }).filter(r => r.count > 0);
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return rows.map(r => ({
    ...r,
    pct: Math.round(r.count / total * 100)
  }));
}
const formatINR = value => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};
const formatActivityTime = iso => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Job "type" colors — mirrors the categories that already exist on job
// records (job.type: "Service" | "Repair" | "Installation" | "AMC Visit").
const TYPE_COLORS = {
  Service: "var(--brand)",
  Repair: "var(--info)",
  Installation: "var(--success)",
  'AMC Visit': "var(--purple)"
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({
  setPage,
  openModal,
  clockProps
}) => {
  const {
    isMobile,
    isTablet,
    isDesktop
  } = useBreakpoint();
  const {
    clockStatus,
    clockInTime,
    totalBreakSecs,
    breakStartTime
  } = clockProps || {};
  const [clkElap, setClkElap] = useState(0);
  const [brkElap, setBrkElap] = useState(0);
  const [expandedChart, setExpandedChart] = useState(null); // null | 'revenue' | 'category'

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dashboardOverviewApi().then(res => {
      if (!cancelled) setOverview(res?.data ?? null);
    }).catch(e => {
      if (!cancelled) setLoadError(e.message || 'Could not load dashboard data');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      if (clockInTime) setClkElap(Math.floor((Date.now() - clockInTime.getTime()) / 1000));
      if (clockStatus === 'break' && breakStartTime) setBrkElap(Math.floor((Date.now() - breakStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [clockInTime, clockStatus, breakStartTime]);
  const netSecs = Math.max(0, clkElap - (totalBreakSecs || 0) - (clockStatus === 'break' ? brkElap : 0));

  // Safe fallback shape so the rest of the component can render before the
  // fetch resolves (and stay renderable if it fails) without null-checking
  // every field individually below.
  const kpis = overview?.kpis || {
    todayJobs: 0,
    openJobs: 0,
    pendingQuotes: 0,
    overdueInvoices: 0,
    openTickets: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    revenueChangePct: null
  };
  const clkColor = {
    in: '#16A34A',
    break: '#D97706',
    out: COLORS.faint
  }[clockStatus || 'out'];
  const clkBg = {
    in: '#ECFDF5',
    break: '#FFFBEB',
    out: COLORS.bg
  }[clockStatus || 'out'];
  const clkLabel = {
    in: 'Clocked In',
    break: 'On Break',
    out: 'Not Clocked In'
  }[clockStatus || 'out'];

  // ── "Jobs Overview" donut — full status breakdown, driven by JOB_STATUS ──
  const jobsOverviewData = mergeCounts(overview?.jobsOverview || [], Object.keys(JOB_STATUS), key => ({
    label: JOB_STATUS[key].label,
    color: JOB_STATUS[key].dot || JOB_STATUS[key].color
  }));
  const jobsOverviewTotal = jobsOverviewData.reduce((s, d) => s + d.count, 0);

  // ── "Jobs by Type" donut — Service / Repair / Installation / AMC Visit ──
  const jobsByTypeData = mergeCounts(overview?.jobsByType || [], Object.keys(TYPE_COLORS), key => ({
    label: key,
    color: TYPE_COLORS[key]
  }));
  const jobsByTypeTotal = jobsByTypeData.reduce((s, d) => s + d.count, 0);

  // ── "Jobs by Category" bar chart — same type grouping, shown as bars ────
  const jobsByCategory = jobsByTypeData.map(d => ({
    label: d.type,
    value: d.count,
    color: d.color
  }));

  // ── "Top Revenue by Service" ─────────────────────────────────────────────
  const topRevenueByService = (overview?.topRevenueByService || []).map(r => ({
    label: r.type,
    value: r.total
  }));
  const maxRevenueValue = Math.max(1, ...topRevenueByService.map(r => r.value));

  // ── Recent Jobs / Field Technicians — straight from the API ─────────────
  const recentJobs = overview?.recentJobs || [];
  const technicians = overview?.technicians || [];

  // ── Revenue Overview chart series ────────────────────────────────────────
  const revenueData = (overview?.revenueMonthly || []).map(r => ({
    m: r.m,
    v: r.v
  }));

  // ── "Recent Activity" — real notifications, already unread-first from the API ─
  const recentActivity = overview?.recentActivity || [];

  // ── Responsive grid columns ──────────────────────────────────────────────
  const kpiCols = isMobile ? 'repeat(2,minmax(0,1fr))' : isTablet ? 'repeat(3,minmax(0,1fr))' : 'repeat(6,minmax(0,1fr))';
  const rowACols = isMobile ? '1fr' : isTablet ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))';
  const rowBCols = isMobile ? '1fr' : isTablet ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))';
  return <div style={{
    gap: isMobile ? "12px" : "16px"
  }} className="ap-dashboard-1">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "flex-start" : "center",
      gap: isMobile ? "10px" : "0"
    }} className="ap-dashboard-2">
        <div>
          <div style={{
          fontSize: isMobile ? "18px" : "22px"
        }} className="ap-dashboard-3">
            Good Morning, Admin 👋
          </div>
          <div className="ap-dashboard-4">
            Monday, 3 March 2026 · CoolTech AC Services
          </div>
        </div>
        <div style={{
        width: isMobile ? "100%" : "auto"
      }} className="ap-dashboard-5">
          <button className="btn ap-dashboard-6" onClick={() => setPage('dispatch')} style={{
          flex: isMobile ? "1" : "none",
          padding: isMobile ? "8px 12px" : "10px 22px",
          fontSize: isMobile ? "12px" : "13px"
        }}>
            🚐 Dispatch Board
          </button>
          <button className="btn ap-dashboard-7" onClick={() => openModal('new_job')} style={{
          flex: isMobile ? "1" : "none",
          padding: isMobile ? "8px 12px" : "10px 22px",
          fontSize: isMobile ? "12px" : "13px"
        }}>
            + New Job
          </button>
        </div>
      </div>

      {loadError && <div className="ap-dashboard-8">
          Couldn't load live dashboard data — showing zeros/empty panels. ({loadError})
        </div>}

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{
      gridTemplateColumns: kpiCols,
      gap: isMobile ? "8px" : "12px"
    }} className="ap-dashboard-9">
        <KCard label="Today's Jobs" value={kpis.todayJobs} sub="scheduled" icon="📋" iconBg="#FFF7ED" color={COLORS.brand} delay="0" />
        <KCard label="Open Jobs" value={kpis.openJobs} sub="need action" icon="🔧" iconBg="#EFF6FF" color="#3B82F6" delay="1" />
        <KCard label="Pending Quotes" value={kpis.pendingQuotes} sub="awaiting approval" icon="📄" iconBg="#F0FDF4" color="#16A34A" delay="2" />
        <KCard label="Overdue Invoices" value={kpis.overdueInvoices} sub="payment pending" icon="⚠️" iconBg="#FEF2F2" color="#DC2626" delay="3" />
        <KCard label="Open Tickets" value={kpis.openTickets} sub="customer support" icon="🎫" iconBg="#F5F3FF" color="#7C3AED" delay="4" />
        <KCard label="Revenue (This Month)" value={formatINR(kpis.revenueThisMonth)} sub={kpis.revenueChangePct === null ? 'no prior month data' : `${kpis.revenueChangePct >= 0 ? '+' : ''}${kpis.revenueChangePct}% vs last month`} icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="5" />
      </div>

      {/* ── Clock In/Out Banner ─────────────────────────────────────────────── */}
      <div onClick={() => setPage('clock')} style={{
      background: clockStatus === 'in' ? 'linear-gradient(135deg,#ECFDF5,#D1FAE5)' : clockStatus === 'break' ? 'linear-gradient(135deg,#FFFBEB,#FEF3C7)' : `linear-gradient(135deg,${COLORS.brandL},#FFE4C4)`,
      border: `1.5px solid ${clockStatus === 'in' ? '#A7F3D0' : clockStatus === 'break' ? '#FDE68A' : `${COLORS.brand}30`}`,
      padding: isMobile ? "12px 14px" : "14px 20px",
      alignItems: isMobile ? "flex-start" : "center",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? "10px" : "0"
    }} onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-1px)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)';
    }} onMouseLeave={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }} className="ap-dashboard-10">
        {/* Left side */}
        <div className="ap-dashboard-11">
          <div style={{
          background: clkBg,
          border: `1.5px solid ${clkColor}30`
        }} className="ap-dashboard-12">⏱</div>
          <div>
            <div className="ap-dashboard-13">My Attendance Today</div>
            <div style={{
            fontSize: isMobile ? "11px" : "12px"
          }} className="ap-dashboard-14">
              {clockStatus === 'in' && clockInTime ? `Clocked in at ${clockInTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })} — working` : clockStatus === 'break' ? 'Currently on break — resume when ready' : 'Not yet clocked in — click here or use the button in the header'}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{
        gap: isMobile ? "10px" : "16px",
        alignSelf: isMobile ? "flex-end" : "center"
      }} className="ap-dashboard-15">
          {clockStatus !== 'out' && <div className="ap-dashboard-16">
              <div style={{
            fontSize: isMobile ? "20px" : "26px",
            color: clkColor
          }} className="ap-dashboard-17">
                {fmtClockDur(netSecs)}
              </div>
              <div className="ap-dashboard-18">work time</div>
            </div>}
          <div style={{
          background: clkBg
        }} className="ap-dashboard-19">
            <span style={{
            background: clkColor,
            animation: clockStatus === 'in' ? "blink 1.6s ease-in-out infinite" : "none"
          }} className="ap-dashboard-20" />
            <span style={{
            color: clkColor
          }} className="ap-dashboard-21">{clkLabel}</span>
          </div>
          <span className="ap-dashboard-22">View →</span>
        </div>
      </div>

      {/* ── Row A: Jobs Overview · Revenue Overview · Jobs by Status · Field Technicians ── */}
      <div style={{
      gridTemplateColumns: rowACols
    }} className="ap-dashboard-23">

        {/* Jobs Overview */}
        <PanelCard title="Jobs Overview" tag="This Week" periodOptions={['This Week', 'This Month', 'Last Month']}>
          <div className="ap-dashboard-24">
            <Donut data={jobsOverviewData} centerLabel={jobsOverviewTotal} centerSub="Total Jobs" />
            <div className="ap-dashboard-25">
              {jobsOverviewData.map(d => <LegendRow key={d.type} label={d.type} count={d.count} pct={d.pct} color={d.color} />)}
            </div>
          </div>
          <div className="ap-dashboard-26">
            ↑ 8% more jobs than last week
          </div>
        </PanelCard>

        {/* Revenue Overview */}
        <PanelCard title="Revenue Overview" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter', 'This Year']} onExpand={() => setExpandedChart('revenue')}>
          <div className="ap-dashboard-27">
            <div className="ap-dashboard-28">{formatINR(kpis.revenueThisMonth)}</div>
            {kpis.revenueChangePct !== null && <div style={{
            color: kpis.revenueChangePct >= 0 ? "var(--success-text)" : "var(--danger-text)"
          }} className="ap-dashboard-29">
                {kpis.revenueChangePct >= 0 ? '↑' : '↓'} {Math.abs(kpis.revenueChangePct)}% vs last month
              </div>}
          </div>
          <RevenueChart data={revenueData} />
        </PanelCard>

        {/* Jobs by Type */}
        <PanelCard title="Jobs by Type">
          <div className="ap-dashboard-30">
            <Donut data={jobsByTypeData} centerLabel={jobsByTypeTotal} centerSub="Total" />
            <div className="ap-dashboard-31">
              {jobsByTypeData.map(d => <LegendRow key={d.type} label={d.type} count={d.count} pct={d.pct} color={d.color} />)}
            </div>
          </div>
        </PanelCard>

        {/* Field Technicians */}
        <PanelCard title="Field Technicians" tag="View All →" onTagClick={() => setPage('dispatch')}>
          <div style={{
          maxHeight: isMobile ? "none" : "320px"
        }} className="ap-dashboard-32">
            {technicians.map(t => <div key={t.id} className="ap-dashboard-33">
                <Avatar name={t.name} size={32} color={t.status === 'available' ? COLORS.success : t.status === 'busy' ? COLORS.brand : COLORS.faint} />
                <div className="ap-dashboard-34">
                  <div className="ap-dashboard-35">{t.name}</div>
                  <div className="ap-dashboard-36">{t.area}</div>
                </div>
                <SBadge s={t.status} map={TECH_STATUS} />
              </div>)}
          </div>
        </PanelCard>
      </div>

      {/* ── Row B: Jobs by Category · Recent Jobs · Top Revenue by Service · Recent Activity ── */}
      <div style={{
      gridTemplateColumns: rowBCols
    }} className="ap-dashboard-37">

        {/* Jobs by Category */}
        <PanelCard title="Jobs by Category" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter']} onExpand={() => setExpandedChart('category')}>
          <BarChart data={jobsByCategory.map(c => ({
          label: c.label,
          value: c.value
        }))} color="#3B82F6" height={170} />
        </PanelCard>

        {/* Recent Jobs */}
        <PanelCard title="Recent Jobs" tag="View All →" onTagClick={() => setPage('jobs')}>
          {recentJobs.map((job, i) => <div key={job.id} style={{
          borderBottom: i < recentJobs.length - 1 ? "1px solid var(--border)" : "none"
        }} className="ap-dashboard-38">
              <div className="ap-dashboard-39">
                {job.type === 'Repair' ? '🔧' : job.type === 'Installation' ? '📦' : job.type === 'AMC Visit' ? '📋' : '❄️'}
              </div>
              <div className="ap-dashboard-40">
                <div className="ap-dashboard-41">{job.customer}</div>
                <div className="ap-dashboard-42">{job.type || 'General Service'}</div>
              </div>
              <SBadge s={job.status} map={JOB_STATUS} />
            </div>)}
        </PanelCard>

        {/* Top Revenue by Service */}
        <PanelCard title="Top Revenue by Service" tag="This Month" periodOptions={['This Month', 'Last Month', 'This Quarter']}>
          {topRevenueByService.map(r => <div key={r.label} className="ap-dashboard-43">
              <div className="ap-dashboard-44">
                <span className="ap-dashboard-45">{r.label}</span>
                <span className="ap-dashboard-46">₹{r.value.toLocaleString('en-IN')}</span>
              </div>
              <div className="ap-dashboard-47">
                <div style={{
              width: `${r.value / maxRevenueValue * 100}%`
            }} className="ap-dashboard-48" />
              </div>
            </div>)}
        </PanelCard>

        {/* Recent Activity */}
        <PanelCard title="Recent Activity" tag="View All →" onTagClick={() => setPage('notifications')}>
          {recentActivity.map(n => {
          const cfg = NOTIF_TYPE_CFG[n.type] || {
            color: COLORS.muted,
            bg: COLORS.bg,
            icon: '🔔'
          };
          return <div key={n.id} className="ap-dashboard-49">
                <div style={{
              background: cfg.bg
            }} className="ap-dashboard-50">
                  {n.icon || cfg.icon}
                </div>
                <div className="ap-dashboard-51">
                  <div className="ap-dashboard-52">{n.title}</div>
                  <div className="ap-dashboard-53">{formatActivityTime(n.createdAt)}</div>
                </div>
                {!n.read && <div className="ap-dashboard-54" />}
              </div>;
        })}
        </PanelCard>
      </div>

      {/* ── Full-size chart preview ────────────────────────────────────────── */}
      {expandedChart && <div onClick={() => setExpandedChart(null)} className="ap-dashboard-55">
          <div onClick={e => e.stopPropagation()} className="ap-dashboard-56">
            <div className="ap-dashboard-57">
              <div className="ap-dashboard-58">
                {expandedChart === 'revenue' ? 'Revenue Overview' : 'Jobs by Category'}
              </div>
              <button onClick={() => setExpandedChart(null)} className="ap-dashboard-59">×</button>
            </div>

            {expandedChart === 'revenue' && <>
                <div className="ap-dashboard-60">
                  <div className="ap-dashboard-61">{formatINR(kpis.revenueThisMonth)}</div>
                  {kpis.revenueChangePct !== null && <div style={{
              color: kpis.revenueChangePct >= 0 ? "var(--success-text)" : "var(--danger-text)"
            }} className="ap-dashboard-62">
                      {kpis.revenueChangePct >= 0 ? '↑' : '↓'} {Math.abs(kpis.revenueChangePct)}% vs last month
                    </div>}
                </div>
                <RevenueChart data={revenueData} height={340} />
              </>}

            {expandedChart === 'category' && <BarChart data={jobsByCategory.map(c => ({
          label: c.label,
          value: c.value
        }))} color="#3B82F6" height={340} />}
          </div>
        </div>}
    </div>;
};

// ─── Shared Panel Card wrapper ─────────────────────────────────────────────────
// `tag` alone → static pill (legacy, unused now)
// `tag` + `onTagClick` → link-style button, e.g. "View All →"
// `tag` + `periodOptions` → real dropdown: click to open a menu, pick an
// option, the pill label updates and `onPeriodChange` (if given) fires.
const PanelCard = ({
  title,
  tag,
  onTagClick,
  periodOptions,
  onPeriodChange,
  onExpand,
  children
}) => {
  const [period, setPeriod] = useState(tag);
  const [open, setOpen] = useState(false);
  const isDropdown = Array.isArray(periodOptions) && periodOptions.length > 0;
  return <div className="ap-dashboard-63">
      <div className="ap-dashboard-64">
        <div className="ap-dashboard-65">{title}</div>

        <div className="ap-dashboard-66">
          {onExpand && <button onClick={onExpand} title="View full size" className="ap-dashboard-67">⤢</button>}
        {isDropdown ? <div className="ap-dashboard-68">
            <button onClick={() => setOpen(o => !o)} className="ap-dashboard-69">
              {period}
              <span style={{
              transform: open ? "rotate(180deg)" : "none"
            }} className="ap-dashboard-70">▾</span>
            </button>
            {open && <>
                <div onClick={() => setOpen(false)} className="ap-dashboard-71" />
                <div className="ap-dashboard-72">
                  {periodOptions.map(opt => <button key={opt} onClick={() => {
                setPeriod(opt);
                setOpen(false);
                onPeriodChange?.(opt);
              }} style={{
                fontWeight: opt === period ? "700" : "500",
                color: opt === period ? "var(--brand)" : "var(--text-h2)",
                background: opt === period ? "var(--xea580c10)" : "transparent"
              }} className="ap-dashboard-73">
                      {opt}
                    </button>)}
                </div>
              </>}
          </div> : tag && <button onClick={onTagClick} style={{
          color: onTagClick ? "var(--brand)" : "var(--text-faint)",
          background: onTagClick ? "transparent" : "var(--bg)",
          cursor: onTagClick ? "pointer" : "default",
          padding: onTagClick ? "0" : "3px 9px"
        }} className="ap-dashboard-74">
            {tag}
          </button>}
        </div>
      </div>
      {children}
    </div>;
};

// ─── Donut legend row ───────────────────────────────────────────────────────────
const LegendRow = ({
  label,
  count,
  pct,
  color,
  showPct = true
}) => <div className="ap-dashboard-75">
    <div style={{
    background: color
  }} className="ap-dashboard-76" />
    <div className="ap-dashboard-77">{label}</div>
    <div className="ap-dashboard-78">{count}</div>
    {showPct && <div className="ap-dashboard-79">({pct}%)</div>}
  </div>;
export default Dashboard;
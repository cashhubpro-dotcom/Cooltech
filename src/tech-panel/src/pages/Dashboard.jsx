import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { COLORS, FONTS } from '../constants/token';
import { JOB_STATUS } from '../constants/statusMaps';
import { SBadge, TypeTag, PBadge } from '../components/ui/Components';
import { technicianDashboardApi } from '../services/technicianPortalApi';

// Today's jobs / timeline icon per job type — same emoji set the old
// dashboard used, kept here so this file has no other dependencies.
const TYPE_ICON = {
  'AMC Visit': '📋',
  Repair: '🔧',
  Installation: '📦',
  Service: '❄️',
  Inspection: '🔍'
};
const DONUT_COLORS = {
  completed: "var(--success)",
  inProgress: "var(--info)",
  pending: "var(--warning)",
  cancelled: "var(--danger)"
};
const CATEGORY_COLORS = ["var(--brand)", "var(--info)", "var(--purple)", "var(--success)", "var(--warning)"];
const CATEGORY_ICON = {
  'AC Repair': '🔧',
  'AC Service': '❄️',
  'AMC Visit': '📋',
  Installation: '📦',
  Inspection: '🔍'
};
function StatSparkline({
  points,
  color
}) {
  // Small decorative trend line for stat cards that don't have a real
  // historical series behind them yet (Today's Jobs / Upcoming / Rating).
  // Purely visual — not derived from live data.
  if (!points) return null;
  return <svg viewBox="0 0 100 32" width="72" height="26" className="tp-dashboard-1">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
    </svg>;
}

// Builds the last N months as { month, year, label } options for the
// dropdown — "This Month" for the current one, "Mon YYYY" for the rest.
function buildMonthOptions(count = 6) {
  const now = new Date();
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: i === 0 ? 'This Month' : d.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
      })
    });
  }
  return options;
}
const MONTH_OPTIONS = buildMonthOptions();
function MonthSelect({
  value,
  onChange
}) {
  return <select value={`${value.year}-${value.month}`} onChange={e => {
    const [year, month] = e.target.value.split('-').map(Number);
    onChange({
      year,
      month
    });
  }} className="tp-dashboard-2">
      {MONTH_OPTIONS.map(o => <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>{o.label}</option>)}
    </select>;
}
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState({
    month: MONTH_OPTIONS[0].month,
    year: MONTH_OPTIONS[0].year
  });
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await technicianDashboardApi.get(selectedMonth);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);
  if (loading) {
    return <div className="tp-dashboard-3">Loading dashboard…</div>;
  }
  if (error || !data) {
    return <div className="tp-dashboard-4">{error || 'Something went wrong.'}</div>;
  }
  const {
    technician,
    todaysJobs,
    timeline,
    stats,
    jobCompletionOverview,
    jobStatusByCategory,
    monthlyEarningsSeries,
    recentPerformance,
    upcomingAmcVisit,
    monthSummary
  } = data;
  const donutData = [{
    key: 'completed',
    name: 'Completed',
    value: jobCompletionOverview.completed.count,
    pct: jobCompletionOverview.completed.pct
  }, {
    key: 'inProgress',
    name: 'In Progress',
    value: jobCompletionOverview.inProgress.count,
    pct: jobCompletionOverview.inProgress.pct
  }, {
    key: 'pending',
    name: 'Pending',
    value: jobCompletionOverview.pending.count,
    pct: jobCompletionOverview.pending.pct
  }, {
    key: 'cancelled',
    name: 'Cancelled',
    value: jobCompletionOverview.cancelled.count,
    pct: jobCompletionOverview.cancelled.pct
  }].filter(d => d.value > 0);
  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const quickActions = [{
    label: 'Update Job Status',
    icon: '🔧',
    color: '#EA580C',
    bg: '#FFF7ED',
    link: '/jobs'
  }, {
    label: 'Request Parts',
    icon: '📦',
    color: '#16A34A',
    bg: '#F0FDF4',
    link: '/parts-request'
  }, {
    label: 'Mark Attendance',
    icon: '🕐',
    color: '#7C3AED',
    bg: '#F5F3FF',
    link: '/attendance'
  }, {
    label: 'Raise a Ticket',
    icon: '🎫',
    color: '#0369A1',
    bg: '#EFF6FF',
    link: '/tickets'
  }];
  return <div className="tp-dashboard-5">

      {/* Welcome banner */}
      <div className="afu tp-dashboard-6">
        <div className="tp-dashboard-7">
          {technician.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
        </div>
        <div className="tp-dashboard-8">
          <div className="tp-dashboard-9">Good morning, {technician.name.split(' ')[0]} 👋</div>
          <div className="tp-dashboard-10">{technician.role} · {technician.area} · ⭐ {technician.rating} rating</div>
          <div className="tp-dashboard-11">
            {(technician.skills || []).slice(0, 4).map(s => <span key={s} className="tp-dashboard-12">{s}</span>)}
          </div>
        </div>
        <div className="tp-dashboard-13">
          <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="#EA580C" opacity="0.12" />
            {/* head */}
            <circle cx="32" cy="22" r="8.5" fill="#F1A87A" />
            {/* cap */}
            <path d="M22 20 a10 8 0 0 1 20 0 h-2 a8 6 0 0 0 -16 0 z" fill="#EA580C" />
            <rect x="21" y="17.5" width="22" height="4" rx="2" fill="#EA580C" />
            {/* torso / overalls */}
            <rect x="17" y="34" width="30" height="22" rx="7" fill="#EA580C" />
            <rect x="27" y="34" width="10" height="22" fill="#C2410C" opacity="0.35" />
            {/* crossed arms */}
            <rect x="12" y="38" width="9" height="15" rx="4.5" fill="#F97316" transform="rotate(18 16 45)" />
            <rect x="43" y="38" width="9" height="15" rx="4.5" fill="#F97316" transform="rotate(-18 48 45)" />
          </svg>
          <div className="tp-dashboard-14">
            <div className="tp-dashboard-15">Keep up the great work!</div>
            <div className="tp-dashboard-16">
              You have {stats.todaysJobsCount} job{stats.todaysJobsCount === 1 ? '' : 's'} scheduled today. Stay safe and provide excellent service.
            </div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid-5 tp-dashboard-17">
        {[{
        label: "Today's Jobs",
        value: stats.todaysJobsCount,
        sub: 'Assigned to me',
        icon: '🗂',
        bg: '#FFF7ED',
        color: COLORS.brand,
        link: '/jobs',
        sparkColor: COLORS.brand,
        spark: '0,20 20,18 40,22 60,14 80,16 100,10'
      }, {
        label: 'Jobs Done',
        value: stats.jobsDoneThisMonth,
        sub: 'This month',
        icon: '✅',
        bg: '#F0FDF4',
        color: '#16A34A',
        link: '/jobs',
        sparkColor: '#16A34A',
        spark: '0,24 20,20 40,22 60,12 80,14 100,6'
      }, {
        label: 'Upcoming',
        value: stats.upcomingCount,
        sub: 'Scheduled',
        icon: '📅',
        bg: '#EFF6FF',
        color: '#1D4ED8',
        link: '/schedule',
        sparkColor: '#1D4ED8',
        spark: '0,10 20,16 40,12 60,20 80,14 100,18'
      }, {
        label: 'Customer Rating',
        value: `${stats.rating}★`,
        sub: `${stats.totalJobsAllTime ?? '—'} total jobs`,
        icon: '⭐',
        bg: '#FFFBEB',
        color: '#D97706',
        link: '/profile',
        sparkColor: '#D97706',
        spark: '0,18 20,16 40,17 60,12 80,13 100,8'
      }, {
        label: 'Earnings' + (stats.earnings.period ? ` (${stats.earnings.period.slice(0, 3)})` : ''),
        value: stats.earnings.amount != null ? `₹${stats.earnings.amount.toLocaleString('en-IN')}` : '—',
        sub: stats.earnings.changePct != null ? `${stats.earnings.changePct >= 0 ? '↑' : '↓'} ${Math.abs(stats.earnings.changePct)}% vs last month` : 'No prior payslip yet',
        icon: '💰',
        bg: '#FAF5FF',
        color: '#7C3AED',
        link: '/salary',
        sparkColor: '#7C3AED',
        spark: monthlyEarningsSeries.length > 1 ? monthlyEarningsSeries.map((d, i) => `${i / (monthlyEarningsSeries.length - 1) * 100},${28 - d.cumulative / (monthlyEarningsSeries[monthlyEarningsSeries.length - 1].cumulative || 1) * 24}`).join(' ') : '0,20 100,20'
      }].map(k => <div key={k.label} className="stat-card afu tp-dashboard-18" onClick={() => navigate(k.link)}>
            <div className="tp-dashboard-19">
              <div className="stat-label tp-dashboard-20">{k.label}</div>
              <div className="stat-icon tp-dashboard-21" style={{
            background: k.bg
          }}>{k.icon}</div>
            </div>
            <div className="stat-value tp-dashboard-22" style={{
          color: k.color
        }}>{k.value}</div>
            <div className="tp-dashboard-23">
              <div className="stat-sub tp-dashboard-24">{k.sub}</div>
              <StatSparkline points={k.spark} color={k.sparkColor} />
            </div>
          </div>)}
      </div>

      {/* Job Completion Overview + Monthly Earnings + Timeline */}
      <div className="tp-dashboard-25">

        {/* Job Completion donut */}
        <div className="card afu">
          <div className="card-header"><div className="card-title">Job Completion Overview</div></div>
          <div className="tp-dashboard-26">
            <div className="tp-dashboard-27">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={2} stroke="none">
                    {donutData.map(d => <Cell key={d.key} fill={DONUT_COLORS[d.key]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="tp-dashboard-28">
                <div className="tp-dashboard-29">{jobCompletionOverview.total}</div>
                <div className="tp-dashboard-30">Total Jobs</div>
              </div>
            </div>
            <div className="tp-dashboard-31">
              {[{
              key: 'completed',
              label: 'Completed'
            }, {
              key: 'inProgress',
              label: 'In Progress'
            }, {
              key: 'pending',
              label: 'Pending'
            }, {
              key: 'cancelled',
              label: 'Cancelled'
            }].map(row => <div key={row.key} className="tp-dashboard-32">
                  <span className="tp-dashboard-33">
                    <span style={{
                  background: DONUT_COLORS[row.key]
                }} className="tp-dashboard-34" />
                    <span className="tp-dashboard-35">{row.label}</span>
                  </span>
                  <span className="tp-dashboard-36">{jobCompletionOverview[row.key].count} ({jobCompletionOverview[row.key].pct}%)</span>
                </div>)}
            </div>
          </div>
        </div>

        {/* Monthly Earnings line chart */}
        <div className="card afu">
          <div className="card-header">
            <div className="card-title">Monthly Earnings Overview</div>
            <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          <div className="tp-dashboard-37">
            <div className="tp-dashboard-38">
              <div className="tp-dashboard-39">
                {stats.earnings.amount != null ? `₹${stats.earnings.amount.toLocaleString('en-IN')}` : '—'}
              </div>
              {stats.earnings.changePct != null && <div style={{
              color: stats.earnings.changePct >= 0 ? "var(--success-text)" : "var(--danger)"
            }} className="tp-dashboard-40">
                  {stats.earnings.changePct >= 0 ? '↑' : '↓'} {Math.abs(stats.earnings.changePct)}% vs last month
                </div>}
            </div>
          </div>
          <div className="tp-dashboard-41">
            {monthlyEarningsSeries.length > 0 ? <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyEarningsSeries} margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0
            }}>
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="dayLabel" tick={{
                fontSize: 11,
                fill: COLORS.faint
              }} axisLine={false} tickLine={false} />
                  <YAxis tick={{
                fontSize: 11,
                fill: COLORS.faint
              }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Math.round(v / 1000)}K`} />
                  <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Earned']} labelFormatter={l => `Day ${l}`} />
                  <Area type="monotone" dataKey="cumulative" stroke={COLORS.brand} strokeWidth={2.5} fill="url(#earningsFill)" />
                </AreaChart>
              </ResponsiveContainer> : <div className="tp-dashboard-42">No completed jobs yet this month</div>}
          </div>
        </div>

        {/* Today's Timeline */}
        <div className="card afu">
          <div className="card-header">
            <div className="card-title">⏱ Today's Timeline</div>
            <button onClick={() => navigate('/schedule')} className="tp-dashboard-43">View All →</button>
          </div>
          <div className="tp-dashboard-44">
            {timeline.length > 0 ? timeline.map((s, i) => {
            const markerColor = s.kind === 'break' ? '#94A3B8' : s.kind === 'amc' ? '#8B5CF6' : COLORS.brand;
            const markerIcon = s.kind === 'break' ? '☕' : s.kind === 'amc' ? '📋' : '📍';
            return <div key={i} className="tp-dashboard-45">
                  <div className="tp-dashboard-46">
                    <div className="tp-dashboard-47">{s.time}</div>
                  </div>
                  <div className="tp-dashboard-48">
                    <span style={{
                  background: `${markerColor}18`
                }} className="tp-dashboard-49">{markerIcon}</span>
                    {i < timeline.length - 1 && <span className="tp-dashboard-50" />}
                  </div>
                  <div className="tp-dashboard-51">
                    <div style={{
                  color: s.kind === 'break' ? "var(--muted)" : "var(--h2)"
                }} className="tp-dashboard-52">{s.title}</div>
                    {s.subtitle && <div className="tp-dashboard-53">{s.subtitle}</div>}
                    <div className="tp-dashboard-54"><TypeTag type={s.type} /></div>
                  </div>
                </div>;
          }) : <div className="tp-dashboard-55">Nothing scheduled today</div>}
          </div>
        </div>
      </div>

      {/* Today's Jobs */}
      <div className="card afu">
        <div className="card-header">
          <div className="card-title">🗓 Today's Jobs — {todayStr}</div>
          <button onClick={() => navigate('/jobs')} className="tp-dashboard-56">View All Jobs →</button>
        </div>
        {todaysJobs.length > 0 ? todaysJobs.map(job => <div key={job.id} onClick={() => navigate('/jobs')} onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} className="tp-dashboard-57">
            <div className="tp-dashboard-58">
              {TYPE_ICON[job.type] || '🔧'}
            </div>
            <div className="tp-dashboard-59">
              <div className="tp-dashboard-60">
                <span className="tp-dashboard-61">{job.jobId}</span>
                <TypeTag type={job.type} />
                <PBadge p={job.priority} />
              </div>
              <div className="tp-dashboard-62">{job.customerName}</div>
              <div className="tp-dashboard-63">📍 {job.address} {job.scheduledTime ? `· 🕐 ${job.scheduledTime}` : ''}</div>
            </div>
            <SBadge s={job.status} map={JOB_STATUS} />
          </div>) : <div className="tp-dashboard-64">No jobs scheduled for today</div>}
      </div>

      {/* Job Status by Category + Recent Performance + Quick Actions row */}
      <div className="tp-dashboard-65">

        {/* Job Status by Category */}
        <div className="card afu">
          <div className="card-header">
            <div className="card-title">Job Status by Category</div>
            <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          <div className="tp-dashboard-66">
            {jobStatusByCategory.length > 0 ? jobStatusByCategory.map((c, i) => <div key={c.category}>
                <div className="tp-dashboard-67">
                  <span className="tp-dashboard-68">
                    <span style={{
                  background: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}18`
                }} className="tp-dashboard-69">
                      {CATEGORY_ICON[c.category] || '🔧'}
                    </span>
                    <span className="tp-dashboard-70">{c.category}</span>
                  </span>
                  <span className="tp-dashboard-71">{c.count} ({c.pct}%)</span>
                </div>
                <div className="tp-dashboard-72">
                  <div style={{
                width: `${c.pct}%`,
                background: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              }} className="tp-dashboard-73" />
                </div>
              </div>) : <div className="tp-dashboard-74">No jobs logged this month yet</div>}
          </div>
        </div>

        {/* Recent Performance */}
        <div className="card afu">
          <div className="card-header">
            <div className="card-title">Recent Performance</div>
            <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
          </div>
          <div className="tp-dashboard-75">
            {[{
            label: 'Avg. Response Time',
            value: recentPerformance.avgResponseTimeMin != null ? `${recentPerformance.avgResponseTimeMin} min` : 'Not tracked',
            icon: '⏱',
            color: '#3B82F6'
          }, {
            label: 'First Time Fix Rate',
            value: recentPerformance.firstTimeFixRate != null ? `${recentPerformance.firstTimeFixRate}%` : '—',
            icon: '🎯',
            color: '#16A34A'
          }, {
            label: 'Jobs Completed',
            value: recentPerformance.jobsCompleted,
            change: recentPerformance.jobsCompletedChangePct,
            icon: '📈',
            color: '#EA580C'
          }, {
            label: 'Customer Rating',
            value: recentPerformance.customerRating != null ? `${recentPerformance.customerRating}★` : '—',
            change: recentPerformance.customerRatingChangePct,
            icon: '⭐',
            color: '#D97706'
          }].map(m => <div key={m.label}>
                <div style={{
              background: `${m.color}15`
            }} className="tp-dashboard-76">{m.icon}</div>
                <div className="tp-dashboard-77">{m.value}</div>
                <div className="tp-dashboard-78">{m.label}</div>
                {m.change != null && <div style={{
              color: m.change >= 0 ? "var(--success-text)" : "var(--danger)"
            }} className="tp-dashboard-79">
                    {m.change >= 0 ? '↑' : '↓'} {Math.abs(m.change)}{typeof m.change === 'number' && Math.abs(m.change) < 5 && m.label === 'Customer Rating' ? '' : '%'} vs last month
                  </div>}
              </div>)}
          </div>
        </div>

        {/* Quick Actions + Need Support */}
        <div className="tp-dashboard-80">
          <div className="card afu">
            <div className="card-header"><div className="card-title">Quick Actions</div></div>
            <div className="tp-dashboard-81">
              {quickActions.map(a => <button key={a.label} onClick={() => navigate(a.link)} style={{
              background: a.bg
            }} className="tp-dashboard-82">
                  <span className="tp-dashboard-83">{a.icon}</span>
                  <span style={{
                color: a.color
              }} className="tp-dashboard-84">{a.label}</span>
                </button>)}
            </div>
          </div>
          {/* <div className="card afu" style={{ background: '#FFF7ED', border: `1px solid ${COLORS.brand}30` }}>
            <div style={{ padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🎧</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.h1 }}>Need Support?</div>
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, marginBottom: 10 }}>We're here to help you</div>
              <button onClick={() => navigate('/tickets')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>Contact Support</button>
            </div>
           </div> */}
        </div>
      </div>

      {/* Upcoming AMC Visit + This Month Summary */}
      <div style={{
      gridTemplateColumns: upcomingAmcVisit ? "1fr 1fr" : "1fr"
    }} className="tp-dashboard-85">
        {upcomingAmcVisit && <div className="card afu tp-dashboard-86" onClick={() => navigate('/amc')}>
            <div className="card-header">
              <div className="card-title">📋 Upcoming AMC Visit</div>
              <span className="tp-dashboard-87">{upcomingAmcVisit.status === 'active' ? 'Active' : 'Expiring'}</span>
            </div>
            <div className="card-body tp-dashboard-88">
              <div className="tp-dashboard-89">{upcomingAmcVisit.customerName}</div>
              <div className="tp-dashboard-90">{upcomingAmcVisit.units} unit{upcomingAmcVisit.units === 1 ? '' : 's'} · {upcomingAmcVisit.plan} AMC</div>
              <div className="tp-dashboard-91">
                <span className="tp-dashboard-92">📅</span>
                <div>
                  <div className="tp-dashboard-93">Scheduled For</div>
                  <div className="tp-dashboard-94">
                    {new Date(upcomingAmcVisit.nextVisit).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
                  </div>
                </div>
              </div>
              {upcomingAmcVisit.address && <div className="tp-dashboard-95">📍 {upcomingAmcVisit.address}</div>}
              {upcomingAmcVisit.notes && <div className="tp-dashboard-96">"{upcomingAmcVisit.notes}"</div>}
            </div>
          </div>}

        <div className="card afu">
          <div className="card-header"><div className="card-title">📊 This Month Summary</div></div>
          <div className="card-body tp-dashboard-97">
            {[{
            label: 'Jobs Completed',
            value: monthSummary.jobsCompleted,
            color: '#16A34A'
          }, {
            label: 'Total Earnings',
            value: monthSummary.totalEarnings != null ? `₹${monthSummary.totalEarnings.toLocaleString('en-IN')}${monthSummary.earningsPeriod ? ` (${monthSummary.earningsPeriod.slice(0, 3)})` : ''}` : '—',
            color: COLORS.brand
          }, {
            label: 'Pending Claims',
            value: `${monthSummary.pendingClaims} expense${monthSummary.pendingClaims === 1 ? '' : 's'}`,
            color: '#D97706'
          }, {
            label: 'Leave Balance',
            value: `${monthSummary.leaveBalance} days (Casual)`,
            color: '#0369A1'
          }].map(s => <div key={s.label} className="tp-dashboard-98">
                <span className="tp-dashboard-99">{s.label}</span>
                <span style={{
              color: s.color
            }} className="tp-dashboard-100">{s.value}</span>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};
export default Dashboard;
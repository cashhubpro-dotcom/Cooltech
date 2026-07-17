import { useState, useEffect, useMemo } from 'react';
import { techsApi, salaryApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { KCard, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { ScorecardModal } from '../../components/modals/HRModals';

// ─── Column config for export ─────────────────────────────────────────────────
const SCORECARD_COLUMNS = [{
  label: 'Rank',
  key: 'rank',
  width: 8
}, {
  label: 'Technician',
  key: 'name',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Rating',
  key: 'rating',
  width: 10,
  format: v => `${v.toFixed(1)}★`
}, {
  label: 'Jobs Done',
  key: 'jobsDone',
  width: 10
}, {
  label: 'Target',
  key: 'target',
  width: 10
}, {
  label: 'Completion',
  key: 'pct',
  width: 14,
  format: v => v == null ? '—' : `${v}%`
}, {
  label: 'Incentive',
  key: 'incentive',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    color: '#16A34A'
  }
}, {
  label: 'Net Pay',
  key: 'net',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}];
const INCENTIVE_COLUMNS = [{
  label: 'Technician',
  key: 'name',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Base Salary',
  key: 'basic',
  width: 14,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Jobs Done',
  key: 'jobsDone',
  width: 10
}, {
  label: 'Target',
  key: 'target',
  width: 10
}, {
  label: 'Completion %',
  key: 'pct',
  width: 14,
  format: v => v == null ? '—' : `${v}%`
}, {
  label: 'Present Days',
  key: 'presentDays',
  width: 10
}, {
  label: 'Incentive',
  key: 'incentive',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    color: '#16A34A'
  }
}, {
  label: 'HRA',
  key: 'hra',
  width: 10,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Travel',
  key: 'travel',
  width: 10,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Gross',
  key: 'gross',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Net Pay',
  key: 'net',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800
  }
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => v === 'paid' ? 'Paid' : 'Pending'
}];
const TECH_COLORS = ["var(--brand)", "var(--info)", "var(--success)", "var(--warning)", "var(--purple)"];

// A Salary doc's `technician` field may arrive populated ({techId,_id,...})
// or as a raw ObjectId string, depending on the route. Handle both.
const sameTech = (salaryRec, tech) => {
  const ref = salaryRec.technician;
  if (ref && typeof ref === 'object') {
    return ref.techId && ref.techId === tech.techId || ref._id && ref._id === tech._id;
  }
  return ref === tech._id;
};

// ─── PerformancePage ──────────────────────────────────────────────────────────
const PerformancePage = () => {
  const [tab, setTab] = useState('scorecard');
  const [scorecardTech, setScorecardTech] = useState(null);
  const [techs, setTechs] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Local drafts for the editable target input, persisted via techsApi.update.
  // Requires `jobsTarget` on the Technician schema (see note below the code).
  const [targetDrafts, setTargetDrafts] = useState({});
  useEffect(() => {
    techsApi.list({
      limit: 500
    }).then(res => {
      setTechs(res?.data || res || []);
    }).catch(err => {
      console.error('Failed to load technicians:', err);
      setTechs([]);
      setLoadError('Could not load technicians.');
    });
    salaryApi.list({
      limit: 500
    }).then(res => {
      setSalaries(res?.data || res || []);
    }).catch(err => {
      console.error('Failed to load salary records:', err);
      setSalaries([]);
      setLoadError('Could not load salary records.');
    });
  }, []);

  // ── The most recent month present in the salary history ────────────────────
  const latestMonth = useMemo(() => {
    if (!salaries.length) return null;
    return [...salaries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].month;
  }, [salaries]);
  const currentSalaries = useMemo(() => salaries.filter(s => s.month === latestMonth), [salaries, latestMonth]);

  // ── Technicians + this month's salary, merged ───────────────────────────────
  const scorecardBase = useMemo(() => {
    const rows = techs.map(t => {
      const sal = currentSalaries.find(s => sameTech(s, t)) || {};
      const jobsDone = sal.jobsDone ?? 0;
      const target = targetDrafts[t._id] ?? t.jobsTarget ?? '';
      const pct = target !== '' && Number(target) > 0 ? Math.round(jobsDone / Number(target) * 100) : null;
      return {
        _id: t._id,
        techId: t.techId,
        name: t.name,
        role: t.role,
        area: t.area,
        rating: t.rating ?? 0,
        jobsDone,
        target,
        pct,
        incentive: sal.incentive || 0,
        gross: sal.gross || 0,
        net: sal.net || 0,
        presentDays: sal.presentDays || 0,
        status: sal.status || 'pending'
      };
    });
    return [...rows].sort((a, b) => b.jobsDone - a.jobsDone).map((r, i) => ({
      ...r,
      rank: i + 1
    }));
  }, [techs, currentSalaries, targetDrafts]);
  const topPerformer = scorecardBase[0];
  const totalJobsDone = scorecardBase.reduce((s, r) => s + r.jobsDone, 0);
  const totalIncentives = salaries.reduce((s, d) => s + (d.incentive || 0), 0);
  const avgRating = techs.length ? techs.reduce((s, t) => s + (t.rating ?? 0), 0) / techs.length : 0;
  const withTarget = scorecardBase.filter(r => r.pct != null);
  const avgCompletion = withTarget.length ? Math.round(withTarget.reduce((s, r) => s + r.pct, 0) / withTarget.length) : null;
  function saveTarget(techMongoId, value) {
    setTargetDrafts(prev => ({
      ...prev,
      [techMongoId]: value
    }));
    const num = Number(value);
    if (!value || Number.isNaN(num)) return;
    techsApi.update(techMongoId, {
      jobsTarget: num
    }).catch(err => {
      console.error('Failed to save target:', err);
    });
  }

  // ── Trend: real month-by-month jobsDone per technician, from salary history ─
  const trendMonths = useMemo(() => {
    const order = {};
    salaries.forEach(s => {
      const t = new Date(s.createdAt || 0).getTime();
      if (order[s.month] == null || t < order[s.month]) order[s.month] = t;
    });
    return Object.keys(order).sort((a, b) => order[a] - order[b]).slice(-6);
  }, [salaries]);
  const trendData = useMemo(() => trendMonths.map(m => {
    const entry = {
      m
    };
    techs.forEach(t => {
      const rec = salaries.find(s => s.month === m && sameTech(s, t));
      entry[t._id] = rec?.jobsDone ?? 0;
    });
    return entry;
  }), [trendMonths, techs, salaries]);
  const maxJobs = Math.max(1, ...trendData.flatMap(m => techs.map(t => m[t._id] || 0)));
  const hasTrend = trendMonths.length > 1;

  // Per-technician trend for the Scorecard modal (real jobsDone history).
  function trendFor(tech) {
    const months = trendMonths;
    const values = months.map(m => salaries.find(s => s.month === m && sameTech(s, tech))?.jobsDone ?? 0);
    return {
      months,
      values
    };
  }

  // ── Scorecard search + filter ─────────────────────────────────────────────
  const {
    q: scorecardQ,
    setQ: setScorecardQ,
    activeFilters: scorecardFilters,
    setFilter: setScorecardFilter,
    filtered: scorecardFiltered
  } = useTableSearch(scorecardBase, ['name'], {
    perfStatus: ''
  });
  const scorecardRows = scorecardFiltered.filter(r => {
    if (!scorecardFilters.perfStatus) return true;
    if (r.pct == null) return scorecardFilters.perfStatus === 'no_target';
    if (scorecardFilters.perfStatus === 'on_target') return r.pct >= 100;
    if (scorecardFilters.perfStatus === 'near_target') return r.pct >= 85 && r.pct < 100;
    if (scorecardFilters.perfStatus === 'below') return r.pct < 85;
    return true;
  }).sort((a, b) => a.rank - b.rank);

  // ── Incentive tab: every salary record, not just the current month ─────────
  const incentiveBase = useMemo(() => salaries.map(s => {
    const t = techs.find(x => sameTech(s, x)) || {};
    const target = targetDrafts[t._id] ?? t.jobsTarget ?? '';
    const jobsDone = s.jobsDone || 0;
    const pct = target !== '' && Number(target) > 0 ? Math.round(jobsDone / Number(target) * 100) : null;
    return {
      techId: t._id || s.technician,
      name: t.name || s.techName || '—',
      basic: s.basic || 0,
      gross: s.gross || 0,
      net: s.net || 0,
      hra: s.hra || 0,
      travel: s.travel || 0,
      incentive: s.incentive || 0,
      presentDays: s.presentDays || 0,
      jobsDone,
      target,
      pct,
      status: s.status || 'pending'
    };
  }), [salaries, techs, targetDrafts]);
  const {
    q: incentiveQ,
    setQ: setIncentiveQ,
    activeFilters: incentiveFilters,
    setFilter: setIncentiveFilter,
    filtered: incentiveFiltered
  } = useTableSearch(incentiveBase, ['name'], {
    status: ''
  });
  const incentiveRows = incentiveFiltered.filter(r => !incentiveFilters.status || r.status === incentiveFilters.status);
  const {
    paginated: incentivePaginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(incentiveRows, 10);

  // ── Exports ──────────────────────────────────────────────────────────────
  const {
    exportProps: scorecardExportProps
  } = useExport({
    title: 'Staff Performance – Scorecard',
    filename: 'cooltech-performance-scorecard',
    template: 'generic_list',
    subtitle: latestMonth ? `AC Services Platform · ${latestMonth}` : 'AC Services Platform',
    docId: 'PERF-SCORECARD-EXPORT',
    columns: SCORECARD_COLUMNS,
    rows: scorecardRows
  });
  const {
    exportProps: incentiveExportProps
  } = useExport({
    title: 'Staff Performance – Incentives',
    filename: 'cooltech-performance-incentives',
    template: 'generic_list',
    subtitle: latestMonth ? `AC Services Platform · ${latestMonth}` : 'AC Services Platform',
    docId: 'PERF-INCENTIVE-EXPORT',
    columns: INCENTIVE_COLUMNS,
    rows: incentiveRows,
    showTotals: true,
    totalColumns: ['incentive', 'gross', 'net']
  });
  return <div className="fi ap-performance-page-1">

      {/* Header */}
      <div className="ap-performance-page-2">
        <div>
          <div className="ap-performance-page-3">Performance & Incentives</div>
          <div className="ap-performance-page-4">
            {latestMonth || '—'} · {techs.length} technicians
          </div>
        </div>
        <div className="ap-performance-page-5">
          {['scorecard', 'incentives', 'trends'].map(t => <button key={t} onClick={() => setTab(t)} style={{
          background: tab === t ? "var(--brand)" : "var(--bg)",
          color: tab === t ? "white" : "var(--text-muted)"
        }} className="ap-performance-page-6">
              {t === 'scorecard' ? '🏆 Scorecard' : t === 'incentives' ? '💰 Incentives' : '📈 Trends'}
            </button>)}
        </div>
      </div>

      {loadError && <div className="ap-performance-page-7">
          {loadError}
        </div>}

      {/* KPI cards */}
      <div className="ap-performance-page-8">
        <KCard label="Top Performer" value={topPerformer?.name?.split(' ')[0] ?? '—'} sub={`${topPerformer?.jobsDone ?? 0} jobs done`} icon="🥇" iconBg="#FFF7ED" color={COLORS.brand} />
        <KCard label="Avg Rating" value={techs.length ? `${avgRating.toFixed(1)}★` : '—'} sub="team average" icon="⭐" iconBg="#FFFBEB" color="#B45309" />
        <KCard label="Avg Completion" value={avgCompletion == null ? '—' : `${avgCompletion}%`} sub={avgCompletion == null ? 'no targets set' : 'vs target'} icon="📊" iconBg="#EFF6FF" color="#0369A1" />
        <KCard label="Total Incentives" value={`₹${totalIncentives.toLocaleString()}`} sub="disbursed" icon="🎁" iconBg="#F0FDF4" color="#16A34A" />
      </div>

      {/* ── SCORECARD TAB ── */}
      {tab === 'scorecard' && <div className="ap-performance-page-9">
          <div className="ap-performance-page-10">
            <TableSearchBar value={scorecardQ} onChange={setScorecardQ} placeholder="Search technician…" />
            <FilterSelect value={scorecardFilters.perfStatus} onChange={v => setScorecardFilter('perfStatus', v)} options={['on_target', 'near_target', 'below', 'no_target']} allLabel="All Performance" />
            <div className="ap-performance-page-11"><ExportDropdown {...scorecardExportProps} /></div>
          </div>
          <div className="ap-performance-page-12">
            <table className="ap-performance-page-13">
              <Thead cols={['Rank', 'Technician', 'Rating', 'Jobs Done', 'Target', 'Completion', 'Incentive', 'Net Pay', '']} />
              <tbody>
                {scorecardRows.length === 0 && <tr><td colSpan={9} className="ap-performance-page-14">No data found.</td></tr>}
                {scorecardRows.map((p, i) => {
              const pct = p.pct;
              const pctColor = pct == null ? COLORS.faint : pct >= 100 ? '#16A34A' : pct >= 85 ? '#B45309' : '#DC2626';
              return <tr key={p._id} className="row ap-performance-page-15" style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                      <td className="ap-performance-page-16">
                        <span className="ap-performance-page-17">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</span>
                      </td>
                      <td className="ap-performance-page-18">
                        <div className="ap-performance-page-19">
                          <Avatar name={p.name} size={30} color={TECH_COLORS[i % TECH_COLORS.length]} />
                          <span className="ap-performance-page-20">{p.name}</span>
                        </div>
                      </td>
                      <td className="ap-performance-page-21">{p.rating.toFixed(1)}★</td>
                      <td className="ap-performance-page-22">{p.jobsDone}</td>
                      <td className="ap-performance-page-23">
                        <input type="number" min="0" value={p.target} onChange={e => saveTarget(p._id, e.target.value)} placeholder="—" className="ap-performance-page-24" />
                      </td>
                      <td className="ap-performance-page-25">
                        {pct == null ? <span className="ap-performance-page-26">Set a target</span> : <div className="ap-performance-page-27">
                            <div className="ap-performance-page-28">
                              <div style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pctColor
                      }} className="ap-performance-page-29" />
                            </div>
                            <span style={{
                      color: pctColor
                    }} className="ap-performance-page-30">{pct}%</span>
                          </div>}
                      </td>
                      <td className="ap-performance-page-31">₹{p.incentive.toLocaleString()}</td>
                      <td className="ap-performance-page-32">₹{p.net.toLocaleString()}</td>
                      <td className="ap-performance-page-33">
                        <button className="btn ap-performance-page-34" onClick={() => setScorecardTech({
                    ...p,
                    ...trendFor(p)
                  })}>
                          Scorecard
                        </button>
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>
        </div>}

      {/* ── INCENTIVES TAB ── */}
      {tab === 'incentives' && <div className="ap-performance-page-35">
          <div className="ap-performance-page-36">
            <TableSearchBar value={incentiveQ} onChange={setIncentiveQ} placeholder="Search technician…" />
            <FilterSelect value={incentiveFilters.status} onChange={v => setIncentiveFilter('status', v)} options={['paid', 'pending']} allLabel="All Status" />
            <div className="ap-performance-page-37"><ExportDropdown {...incentiveExportProps} /></div>
          </div>
          <div className="ap-performance-page-38">
            <table className="ap-performance-page-39">
              <Thead cols={['Technician', 'Base', 'Jobs', 'Target', 'Completion', 'Present', 'Incentive', 'HRA', 'Travel', 'Gross', 'Net', 'Status']} />
              <tbody>
                {incentivePaginated.length === 0 && <tr><td colSpan={12} className="ap-performance-page-40">No data found.</td></tr>}
                {incentivePaginated.map((r, i) => <tr key={`${r.techId}-${i}`} className="row ap-performance-page-41" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-performance-page-42">
                      <div className="ap-performance-page-43">
                        <Avatar name={r.name} size={28} color={TECH_COLORS[i % TECH_COLORS.length]} />
                        <span className="ap-performance-page-44">{r.name}</span>
                      </div>
                    </td>
                    <td className="ap-performance-page-45">₹{r.basic.toLocaleString()}</td>
                    <td className="ap-performance-page-46">{r.jobsDone}</td>
                    <td className="ap-performance-page-47">{r.target || '—'}</td>
                    <td className="ap-performance-page-48">
                      {r.pct == null ? <span className="ap-performance-page-49">—</span> : <span style={{
                  color: r.pct >= 100 ? '#16A34A' : r.pct >= 85 ? '#B45309' : '#DC2626'
                }} className="ap-performance-page-50">{r.pct}%</span>}
                    </td>
                    <td className="ap-performance-page-51">{r.presentDays}</td>
                    <td className="ap-performance-page-52">₹{r.incentive.toLocaleString()}</td>
                    <td className="ap-performance-page-53">₹{r.hra.toLocaleString()}</td>
                    <td className="ap-performance-page-54">₹{r.travel.toLocaleString()}</td>
                    <td className="ap-performance-page-55">₹{r.gross.toLocaleString()}</td>
                    <td className="ap-performance-page-56">₹{r.net.toLocaleString()}</td>
                    <td className="ap-performance-page-57">
                      <span style={{
                  background: r.status === 'paid' ? "var(--success-bg)" : "var(--warning-bg)",
                  color: r.status === 'paid' ? "var(--success-text)" : "var(--warning-text)"
                }} className="ap-performance-page-58">
                        {r.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
          <div className="ap-performance-page-59">
            <span className="ap-performance-page-60">Total Incentives: <strong className="ap-performance-page-61">₹{totalIncentives.toLocaleString()}</strong></span>
            <span className="ap-performance-page-62">Total Net Pay: <strong className="ap-performance-page-63">₹{salaries.reduce((s, d) => s + (d.net || 0), 0).toLocaleString()}</strong></span>
          </div>
        </div>}

      {/* ── TRENDS TAB ── */}
      {tab === 'trends' && <div className="ap-performance-page-64">

          <div className="ap-performance-page-65">
            Monthly Job Completion Trend · {techs.length} Technicians
          </div>

          {!hasTrend ? <div className="ap-performance-page-66">
              Not enough salary history yet to chart a trend. This fills in automatically as more monthly
              payroll runs are recorded for your technicians.
            </div> : <>
              <div className="ap-performance-page-67">
                {trendData.map(m => <div key={m.m} className="ap-performance-page-68">
                    {techs.map((t, ki) => <div key={t._id} title={`${t.name}: ${m[t._id] || 0} jobs`} style={{
              height: `${(m[t._id] || 0) / maxJobs * 140}px`,
              background: TECH_COLORS[ki % TECH_COLORS.length]
            }} className="ap-performance-page-69" />)}
                    <span className="ap-performance-page-70">{m.m}</span>
                  </div>)}
              </div>

              <div className="ap-performance-page-71">
                {techs.map((t, i) => <div key={t._id} className="ap-performance-page-72">
                    <div style={{
              background: TECH_COLORS[i % TECH_COLORS.length]
            }} className="ap-performance-page-73" />
                    <span className="ap-performance-page-74">{t.name}</span>
                  </div>)}
              </div>
            </>}
        </div>}

      {/* Scorecard Modal */}
      {scorecardTech && <ScorecardModal tech={scorecardTech} period={latestMonth} totalTechs={techs.length} salaries={incentiveBase} onClose={() => setScorecardTech(null)} />}
    </div>;
};
export default PerformancePage;
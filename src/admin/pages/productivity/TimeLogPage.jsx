import { useState, useEffect } from 'react';
import { techsApi, timelogsApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Column config for export ─────────────────────────────────────────────────
const TIMELOG_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#F97316',
    fontSize: 11
  }
}, {
  label: 'Technician',
  key: 'tech',
  width: 18,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Job',
  key: 'job',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 12
  }
}, {
  label: 'Type',
  key: 'type',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 18,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Date',
  key: 'date',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 12
  }
}, {
  label: 'Start',
  key: 'start',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'End',
  key: 'end',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Hours',
  key: 'hrs',
  width: 8,
  format: v => `${Number(v).toFixed(1)}h`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800
  }
}, {
  label: 'Billable',
  key: 'billable',
  width: 10,
  format: v => v ? 'Yes' : 'No'
}, {
  label: 'Notes',
  key: 'notes',
  width: 28,
  tdStyle: {
    fontSize: 11
  }
}];

// ─── TimeLogPage ──────────────────────────────────────────────────────────────
const TimeLogPage = ({
  openModal
}) => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  useEffect(() => {
    timelogsApi.list().then(res => setTimeLogs(Array.isArray(res) ? res : res?.data || [])).catch(() => setTimeLogs([]));
    techsApi.list().then(res => setTechnicians(res?.data || [])) // ← always use res.data
    .catch(() => setTechnicians([]));
  }, []);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(timeLogs, ['id', 'tech', 'job', 'type', 'customer', 'notes'], {
    tech: ''
  });
  const [billableFilter, setBillableFilter] = useState("");
  const filtered = searchFiltered.filter(t => !activeFilters.tech || t.tech === activeFilters.tech).filter(t => !billableFilter || (billableFilter === "Billable" ? t.billable : !t.billable));

  // ── Pagination ────────────────────────────────────────────────────────────
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(filtered, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const {
    exportProps
  } = useExport({
    title: "Time Log",
    filename: "cooltech-timelog",
    template: "generic_list",
    subtitle: `AC Services Platform · Time Tracker · ${filtered.length} entries`,
    docId: "TIMELOG-EXPORT",
    columns: TIMELOG_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['hrs']
  });

  // ── KPI (from filtered) ───────────────────────────────────────────────────
  const totalHrs = filtered.reduce((a, t) => a + t.hrs, 0);
  const billHrs = filtered.filter(t => t.billable).reduce((a, t) => a + t.hrs, 0);
  const avgHrs = filtered.length ? totalHrs / filtered.length : 0;
  const techNames = (technicians || []).map(t => t.name);
  return <div className="fu ap-time-log-page-1">

      {/* Header */}
      <div className="ap-time-log-page-2">
        <div>
          <div className="ap-time-log-page-3">Time Tracker</div>
          <div className="ap-time-log-page-4">Log & track time spent on each job</div>
        </div>
        <button className="btn ap-time-log-page-5" onClick={() => openModal("new_timelog")}>
          + Log Time
        </button>
      </div>

      {/* KPI cards */}
      <div className="ap-time-log-page-6">
        <KCard label="Total Hours" value={`${totalHrs.toFixed(1)}h`} icon="⏱" color="#3B82F6" iconBg="#EFF6FF" delay="" />
        <KCard label="Billable Hours" value={`${billHrs.toFixed(1)}h`} icon="💰" color={COLORS.brand} iconBg={COLORS.brandL} delay="1" />
        <KCard label="Non-Billable" value={`${(totalHrs - billHrs).toFixed(1)}h`} icon="📋" color="#64748B" iconBg="#F1F5F9" delay="2" />
        <KCard label="Avg per Entry" value={`${avgHrs.toFixed(1)}h`} icon="📈" color="#8B5CF6" iconBg="#F5F3FF" delay="3" />
      </div>

      {/* Table card */}
      <div className="ap-time-log-page-7">

        {/* Toolbar */}
        <div className="ap-time-log-page-8">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by technician, job, customer…" />

          <FilterSelect value={activeFilters.tech} onChange={val => setFilter("tech", val)} options={techNames} allLabel="All Technicians" />

          <FilterSelect value={billableFilter} onChange={setBillableFilter} options={["Billable", "Non-Billable"]} allLabel="All Entries" />

          <div className="ap-time-log-page-9">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        {/* Table */}
        <div className="ap-time-log-page-10">
          <table className="ap-time-log-page-11">
            <Thead cols={["ID", "Technician", "Job / Activity", "Customer", "Date", "Start", "End", "Hours", "Billable", "Notes"]} />
            <tbody>
              {paginated.length === 0 && <tr><td colSpan={10} className="ap-time-log-page-12">No time logs found.</td></tr>}
              {paginated.map((t, i) => <tr key={t.id} className="row ap-time-log-page-13" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-time-log-page-14">{t.id}</td>
                  <td className="ap-time-log-page-15">
                    <div className="ap-time-log-page-16">
                      <Avatar name={t.tech} size={26} color={COLORS.brand} />
                      <span className="ap-time-log-page-17">{t.tech.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="ap-time-log-page-18">
                    <div className="ap-time-log-page-19">{t.job === "—" ? t.type : t.job}</div>
                    <div className="ap-time-log-page-20">{t.type}</div>
                  </td>
                  <td className="ap-time-log-page-21">{t.customer}</td>
                  <td className="ap-time-log-page-22">{t.date}</td>
                  <td className="ap-time-log-page-23">{t.start}</td>
                  <td className="ap-time-log-page-24">{t.end}</td>
                  <td className="ap-time-log-page-25">
                    <span className="ap-time-log-page-26">{t.hrs.toFixed(1)}</span>
                    <span className="ap-time-log-page-27">h</span>
                  </td>
                  <td className="ap-time-log-page-28">
                    <span style={{
                  background: t.billable ? "var(--success-bg)" : "var(--bg)",
                  color: t.billable ? "var(--success-text)" : "var(--text-muted)"
                }} className="ap-time-log-page-29">
                      {t.billable ? "✓ Billable" : "Non-Bill"}
                    </span>
                  </td>
                  <td className="ap-time-log-page-30">{t.notes}</td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      {/* Summary by technician — unchanged */}
      <div className="ap-time-log-page-31">
        <div className="ap-time-log-page-32">Summary by Technician</div>
        <div className="ap-time-log-page-33">
          {technicians.map(tech => {
          const logs = timeLogs.filter(t => t.tech === tech.name);
          const hrs = logs.reduce((a, t) => a + t.hrs, 0);
          const bill = logs.filter(t => t.billable).reduce((a, t) => a + t.hrs, 0);
          return <div key={tech._id || tech.id || tech.name} className="ap-time-log-page-34">
                <div className="ap-time-log-page-35">
                  <Avatar name={tech.name} size={28} color={COLORS.brand} />
                  <span className="ap-time-log-page-36">{tech.name.split(" ")[0]}</span>
                </div>
                <div className="ap-time-log-page-37">
                  {hrs.toFixed(1)}<span className="ap-time-log-page-38">h</span>
                </div>
                <div className="ap-time-log-page-39">{bill.toFixed(1)}h billable · {logs.length} entries</div>
                <div className="ap-time-log-page-40">
                  <div style={{
                width: `${hrs > 0 ? bill / hrs * 100 : 0}%`
              }} className="ap-time-log-page-41" />
                </div>
              </div>;
        })}
        </div>
      </div>
    </div>;
};
export default TimeLogPage;
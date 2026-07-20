// ✅ FIXED:
//   1. `reminders_DATA` was not defined → replaced with `reminders` state
//   2. API returns MongoDB documents where `customer` is a nested object
//      {_id, name, phone, ...} instead of a plain string — React crashes
//      trying to render an object as a child.
//      Fix: normalize() helper extracts safe string/primitive values.
//   3. NEW: Added a Reminder Detail View (local modal) — click a row or the
//      👁 button to see the full record without needing the global openModal
//      registry to know about a new modal type.

import { remindersApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { REMINDER_STATUS } from '../../data/mockData';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Urgency is computed from dueDate, never trusted from stored workflow
// status (which is pending/done/snoozed) — mirrors the same logic used on
// the backend for the client portal's reminder urgency.
const computeUrgency = (dueDate) => {
  if (!dueDate) return 'upcoming';
  const diffDays = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 14) return 'due_soon';
  return 'upcoming';
};
const fmtDate = (d) => d ?fmtDateDMY(new Date(d)) : '';

// ─── Normalize a reminder record from either API or mock shape ────────────────
// API returns populated references as full objects; mock uses plain strings.
// This converts everything to the flat string shape the UI expects.
const normalize = r => ({
  // identity
  id: r.id ?? r._id ?? '',
  reminderId: r.reminderId ?? "",
  // customer — may be a populated object or a plain string
  customer: typeof r.customer === 'object' && r.customer !== null ? r.customer.name ?? String(r.customer._id ?? '') : r.customer ?? '',
  phone: typeof r.customer === 'object' && r.customer !== null ? r.customer.phone ?? r.phone ?? '' : r.phone ?? '',
  // AC unit — may be stored as 'ac' or 'unit'
  ac: r.ac ?? r.unit ?? '',
  // type — reminder type
  type: r.type ?? '',
  // dates — format real Date values for display; pass through already-
  // formatted strings (e.g. old mock shape) unchanged
  lastService: r.lastService ? fmtDate(r.lastService) : '',
  dueDate: r.dueDate ? fmtDate(r.dueDate) : (r.due ?? ''),
  // booleans
  sent: Boolean(r.sent ?? r.smsSent ?? false),
  // urgency status — computed from dueDate, not the stored workflow status
  status: r.dueDate ? computeUrgency(r.dueDate) : (r.status ?? 'upcoming'),
  // keep raw notes/address if backend ever sends them — safe fallback either way
  notes: typeof r.description === 'string' ? r.description : (typeof r.notes === 'string' ? r.notes : ''),
  address: typeof r.customer === 'object' && r.customer !== null ? r.customer.address ?? r.address ?? '' : r.address ?? ''
});

// ─── Column config for export ─────────────────────────────────────────────────
const REMINDER_COLUMNS = [{
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
  label: 'Customer',
  key: 'customer',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Phone',
  key: 'phone',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 11
  }
}, {
  label: 'AC Unit',
  key: 'ac',
  width: 18,
  tdStyle: {
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
  label: 'Last Service',
  key: 'lastService',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Due Date',
  key: 'dueDate',
  width: 14,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'SMS Sent',
  key: 'sent',
  width: 10,
  format: v => v ? 'Yes' : 'No'
}, {
  label: 'Status',
  key: 'status',
  width: 12,
  format: v => REMINDER_STATUS[v]?.label ?? v
}];

// ─── ReminderDetailModal ───────────────────────────────────────────────────────
// Self-contained overlay so it doesn't depend on the global openModal registry
// knowing about a new modal type. Uses the same .modal-box / COLORS / FONTS
// tokens as the rest of the design system.
const DetailRow = ({
  label,
  value
}) => <div className="ap-reminders-page-1">
    <span className="ap-reminders-page-2">{label}</span>
    <span className="ap-reminders-page-3">{value || '—'}</span>
  </div>;
const ReminderDetailModal = ({
  reminder,
  onClose,
  openModal
}) => {
  if (!reminder) return null;
  return <div onClick={onClose} className="ap-reminders-page-4">
      <div className="modal-box ap-reminders-page-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ap-reminders-page-6">
          <div>
            <div className="ap-reminders-page-7">
              {String(reminder.reminderId || reminder.id)}
            </div>
            <div className="ap-reminders-page-8">
              {String(reminder.customer || 'Reminder Details')}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="ap-reminders-page-9">
            ✕
          </button>
        </div>

        {/* Status + Sent badges */}
        <div className="ap-reminders-page-10">
          <SBadge s={reminder.status} map={REMINDER_STATUS} />
          <TypeTag type={reminder.type} />
          {reminder.sent ? <span className="ap-reminders-page-11">✅ SMS Sent</span> : <span className="ap-reminders-page-12">Not Sent</span>}
        </div>

        {/* Details */}
        <div className="ap-reminders-page-13">
          <DetailRow label="Phone" value={reminder.phone} />
          <DetailRow label="AC Unit" value={reminder.ac} />
          {reminder.address && <DetailRow label="Address" value={reminder.address} />}
          <DetailRow label="Last Service" value={reminder.lastService} />
          <DetailRow label="Due Date" value={reminder.dueDate} />
          {reminder.notes && <div className="ap-reminders-page-14">
              <div className="ap-reminders-page-15">Notes</div>
              <div className="ap-reminders-page-16">{reminder.notes}</div>
            </div>}
        </div>

        {/* Actions */}
        <div className="ap-reminders-page-17">
          <button className="btn ap-reminders-page-18" onClick={() => {
          onClose();
          openModal('new_job');
        }}>
            📤 Book Job
          </button>
          {!reminder.sent && <button className="btn ap-reminders-page-19" onClick={() => {
          onClose();
          openModal('send_quotation', {
            id: reminder.customer
          });
        }}>
              💬 Send SMS
            </button>}
        </div>
      </div>
    </div>;
};

// ─── RemindersPage ────────────────────────────────────────────────────────────
const RemindersPage = ({
  openModal
}) => {
  const [reminders, setReminders] = useState([]);
  useEffect(() => {
    remindersApi.list({
      limit: 200
    }).then(r => {
      const raw = r.data ?? r ?? [];
      if (Array.isArray(raw)) {
        setReminders(raw.map(normalize));
      }
    }).catch(() => {});
  }, []);
  const [statusFilter, setStatusFilter] = useState('');
  const [sentFilter, setSentFilter] = useState('');

  // ── Detail view state ─────────────────────────────────────────────────────
  const [selectedReminder, setSelectedReminder] = useState(null);

  // ── Search + filter ───────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(reminders,
  // ✅ was `reminders_DATA` (undefined)
  ['id', 'customer', 'phone', 'ac', 'type'], {
    type: ''
  });
  const filtered = searchFiltered.filter(r => !statusFilter || r.status === statusFilter).filter(r => sentFilter === '' ? true : sentFilter === 'Sent' ? r.sent : !r.sent);

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
    title: 'Service Reminders',
    filename: 'cooltech-reminders',
    template: 'generic_list',
    subtitle: `AC Services Platform · Reminders · ${filtered.length} records`,
    docId: 'REM-EXPORT',
    columns: REMINDER_COLUMNS,
    rows: filtered
  });

  // ── KPI counts (always from normalized state) ─────────────────────────────
  const overdue = reminders.filter(r => r.status === 'overdue').length;
  const due_soon = reminders.filter(r => r.status === 'due_soon').length;
  const sent = reminders.filter(r => r.sent).length;
  const types = [...new Set(reminders.map(r => r.type).filter(Boolean))];
  return <div className="fi ap-reminders-page-20">

      <SectionHdr title="Service Reminders" sub="Track upcoming and overdue service visits" action="+ Add Reminder" onAction={() => openModal('new_reminder')} />

      {/* KPI cards */}
      <div className="ap-reminders-page-21">
        <KCard label="Total Reminders" value={reminders.length} sub="tracked" icon="🔔" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Overdue" value={overdue} sub="action needed" icon="🔴" iconBg="#FEF2F2" color="#DC2626" delay="1" />
        <KCard label="Due Soon" value={due_soon} sub="within 2 weeks" icon="🟡" iconBg="#FFFBEB" color="#B45309" delay="2" />
        <KCard label="Reminders Sent" value={sent} sub="this month" icon="📤" iconBg="#F0FDF4" color="#16A34A" delay="3" />
      </div>

      {/* Table card */}
      <div className="ap-reminders-page-22">

        {/* Toolbar */}
        <div className="ap-reminders-page-23">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, AC unit, type…" />

          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={types} allLabel="All Types" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={['overdue', 'due_soon', 'upcoming']} allLabel="All Statuses" />
          <FilterSelect value={sentFilter} onChange={setSentFilter} options={['Sent', 'Not Sent']} allLabel="SMS: All" />

          <div className="ap-reminders-page-24">
            <ExportDropdown {...exportProps} />
          </div>

          <button className="btn ap-reminders-page-25" onClick={() => openModal('new_job')}>
            📤 Send All Pending
          </button>
        </div>

        {/* Table */}
        <div className="ap-reminders-page-26">
          <table className="ap-reminders-page-27">
            <Thead cols={['ID', 'Customer', 'AC Unit', 'Reminder Type', 'Last Service', 'Due Date', 'SMS Sent', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="ap-reminders-page-28">
                    No reminders match your filters.
                  </td>
                </tr>}
              {paginated.map((r, i) => <tr key={r.reminderId || i} className="row ap-reminders-page-29" onClick={() => setSelectedReminder(r)} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-reminders-page-30">
                    <span className="ap-reminders-page-31">{String(r.reminderId)}</span>
                  </td>
                  <td className="ap-reminders-page-32">
                    {/* ✅ customer and phone are now guaranteed strings after normalize() */}
                    <div className="ap-reminders-page-33">{String(r.customer || '—')}</div>
                    <div className="ap-reminders-page-34">{String(r.phone || '')}</div>
                  </td>
                  <td className="ap-reminders-page-35">{String(r.ac || '—')}</td>
                  <td className="ap-reminders-page-36"><TypeTag type={r.type} /></td>
                  <td className="ap-reminders-page-37">{String(r.lastService || '—')}</td>
                  <td className="ap-reminders-page-38">
                    <span style={{
                  color: r.status === 'overdue' ? '#DC2626' : r.status === 'due_soon' ? '#B45309' : COLORS.h2
                }} className="ap-reminders-page-39">
                      {String(r.dueDate || '—')}
                    </span>
                  </td>
                  <td className="ap-reminders-page-40">
                    {r.sent ? <span className="ap-reminders-page-41">✅</span> : <span className="ap-reminders-page-42">—</span>}
                  </td>
                  <td className="ap-reminders-page-43">
                    <SBadge s={r.status} map={REMINDER_STATUS} />
                  </td>
                  <td className="ap-reminders-page-44">
                    <div onClick={e => e.stopPropagation()} className="ap-reminders-page-45">
                      <button className="btn ap-reminders-page-46" onClick={() => setSelectedReminder(r)}>
                        👁 View
                      </button>
                      <button className="btn ap-reminders-page-47" onClick={() => openModal('new_job')}>
                        Book Job
                      </button>
                      {!r.sent && <button className="btn ap-reminders-page-48" onClick={() => openModal('send_quotation', {
                    id: r.customer
                  })}>
                          Send SMS
                        </button>}
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      {/* Detail view modal */}
      <ReminderDetailModal reminder={selectedReminder} onClose={() => setSelectedReminder(null)} openModal={openModal} />
    </div>;
};
export default RemindersPage;
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { payrollApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import ActionDropdown from '../../components/ui/ActionDropdown';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWorkingDays(month, year) {
  const total = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function parseSelMonth(selMonth) {
  const [monthStr, yearStr] = selMonth.split(' ');
  const monthIdx = MONTH_NAMES.indexOf(monthStr);
  const year = parseInt(yearStr, 10);
  return {
    monthIdx,
    year
  };
}

// ── Dynamic year range for the Year dropdown ───────────────────────────────
const YEARS_BACK = 3;
const YEARS_FORWARD = 1;
function buildYearOptions() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = current + YEARS_FORWARD; y >= current - YEARS_BACK; y--) years.push(y);
  return years;
}

// PayrollRun.status is 'draft' | 'generated' | 'paid'
const STATUS_MAP = {
  paid: {
    label: '✓ Paid',
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  generated: {
    label: 'Processed',
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  draft: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning)"
  }
};
function inr(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}
const AV_COLORS = [{
  bg: '#faeeda',
  col: '#854f0b'
}, {
  bg: '#e6f1fb',
  col: '#185fa5'
}, {
  bg: '#eaf3de',
  col: '#3b6d11'
}, {
  bg: '#faece7',
  col: '#993c1d'
}, {
  bg: '#eeedfe',
  col: '#534ab7'
}];
function avatarFor(name = '') {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const idx = name.charCodeAt(0) % AV_COLORS.length || 0;
  return {
    initials,
    ...AV_COLORS[idx]
  };
}

// ─── Shared modal chrome (used by Pay / Edit / Delete modals below) ──────────
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.45)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16
};
const ghostBtn = disabled => ({
  padding: '8px 18px',
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: '#fff',
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.muted,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1
});
const solidBtn = (bg, disabled) => ({
  padding: '8px 18px',
  borderRadius: 8,
  border: 'none',
  background: bg,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.6 : 1
});
const inlineError = msg => msg ? <div className="ap-salary-page-1">
    {msg}
  </div> : null;

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KCard = ({
  label,
  value,
  sub,
  icon,
  iconBg,
  color
}) => <div className="ap-salary-page-2">
    <div>
      <div className="ap-salary-page-3">{label}</div>
      <div style={{
      color
    }} className="ap-salary-page-4">{value}</div>
      <div className="ap-salary-page-5">{sub}</div>
    </div>
    <div style={{
    background: iconBg
  }} className="ap-salary-page-6">{icon}</div>
  </div>;
const StatusBadge = ({
  status
}) => {
  const m = STATUS_MAP[status] || STATUS_MAP.draft;
  return <span style={{
    background: m.bg,
    color: m.color
  }} className="ap-salary-page-7">{m.label}</span>;
};
const AttSourceBadge = ({
  live
}) => <span style={{
  background: live ? "var(--success-bg)" : "var(--warning-bg)",
  color: live ? "var(--success-text)" : "var(--warning)",
  border: `1px solid ${live ? '#BBF7D0' : '#FDE68A'}`
}} className="ap-salary-page-8">{live ? '● Live' : '○ Manual'}</span>;

// ─── Payslip Modal (view / download — unchanged) ─────────────────────────────
const PayslipModal = ({
  run,
  onClose,
  onDownload,
  downloading
}) => {
  if (!run) return null;
  const NAVY = '#1a2e5c';
  const tech = run.technician || {};
  const row = (label, value, bold = false, color = '#111') => <tr key={label}>
      <td className="ap-salary-page-9">{label}</td>
      <td style={{
      fontWeight: bold ? "700" : "400",
      color,
      fontFamily: bold ? "Fira Code, monospace" : "inherit"
    }} className="ap-salary-page-10">{value}</td>
    </tr>;
  const attLive = run.presentDays != null;
  const totalDeductions = (run.pf || 0) + (run.tds || 0) + (run.advance || 0) + (run.lop || 0);
  return <div className="ap-salary-page-11">
      <div className="ap-salary-page-12">
        <div className="ap-salary-page-13">
          <div>
            <div className="ap-salary-page-14">
              Payslip — {run.period}
              {attLive && <span className="ap-salary-page-15">● Live Attendance</span>}
            </div>
            <div className="ap-salary-page-16">{run.runId} · {tech.techId}</div>
          </div>
          <button onClick={onClose} className="ap-salary-page-17">✕</button>
        </div>

        <div className="ap-salary-page-18">
          <div className="ap-salary-page-19">
            {[['Employee', run.techName], ['Role', tech.role || '—'], ['Emp ID', tech.techId || '—'], ['Bank', tech.bankAccount || '—'], ['Days Worked', run.totalDays != null ? `${run.presentDays ?? '—'} / ${run.totalDays}` : '—'], ['Absent Days', run.absentDays ?? 0], ['Payment Date', run.status === 'paid' ?fmtDateDMY(new Date(run.updatedAt)) : '—'], ['Status', <StatusBadge status={run.status} key="s" />]].map(([k, v]) => <div key={k} className="ap-salary-page-20">
                <span className="ap-salary-page-21">{k}</span>
                <span className="ap-salary-page-22">{v}</span>
              </div>)}
          </div>

          {attLive && <div className="ap-salary-page-23">
              ✓ Days worked & LOP auto-calculated from Attendance module
            </div>}

          <div className="ap-salary-page-24">EARNINGS</div>
          <table className="ap-salary-page-25"><tbody>
            {row('Basic Salary', inr(run.basic))}
            {row('HRA (House Rent Allowance)', inr(run.hra))}
            {row('Travel Allowance', inr(run.travel))}
            {run.incentive > 0 && row('Performance Incentive', inr(run.incentive))}
            {run.uniformAllw > 0 && row('Uniform Allowance', inr(run.uniformAllw))}
            {run.toolAllw > 0 && row('Tool & Equipment Allowance', inr(run.toolAllw))}
            {run.overtime > 0 && row('Overtime Pay', inr(run.overtime), false, '#16A34A')}
            {row('Gross Earnings', inr(run.gross), true, COLORS.brand)}
          </tbody></table>

          <div className="ap-salary-page-26">DEDUCTIONS</div>
          <table className="ap-salary-page-27"><tbody>
            {row('Provident Fund (PF)', inr(run.pf), false, '#DC2626')}
            {row('TDS (Tax Deducted at Source)', run.tds > 0 ? inr(run.tds) : '—', false, run.tds > 0 ? '#DC2626' : '#9ca3af')}
            {row('Advance Recovery', run.advance > 0 ? inr(run.advance) : '—', false, run.advance > 0 ? '#DC2626' : '#9ca3af')}
            {row(`LOP — ${run.absentDays ?? 0} absent day(s)${run.totalDays ? ` × ${inr(Math.round(run.basic / run.totalDays))}/day` : ''}`, run.lop > 0 ? inr(run.lop) : '—', false, run.lop > 0 ? '#DC2626' : '#9ca3af')}
            {row('Total Deductions', inr(totalDeductions), true, '#DC2626')}
          </tbody></table>

          <div className="ap-salary-page-28">
            <div>
              <div className="ap-salary-page-29">NET PAY (Take Home)</div>
              <div className="ap-salary-page-30">{tech.bankAccount || '—'}</div>
            </div>
            <div className="ap-salary-page-31">{inr(run.net)}</div>
          </div>

          <div className="ap-salary-page-32">
            <span className="ap-salary-page-33">Year-to-Date Gross (YTD)</span>
            <span className="ap-salary-page-34">{inr(run.ytdGross)}</span>
          </div>

          <div className="ap-salary-page-35">
            <button onClick={onClose} className="ap-salary-page-36">Close</button>
            <button onClick={() => onDownload(run._id, run.techName, run.period)} disabled={downloading} style={{
            cursor: downloading ? "default" : "pointer",
            opacity: downloading ? "0.6" : "1"
          }} className="ap-salary-page-37">
              {downloading ? 'Downloading…' : '📥 Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>;
};

// ─── Pay Confirmation Modal ───────────────────────────────────────────────────
const PayConfirmModal = ({
  run,
  onClose,
  onConfirm,
  processing,
  error
}) => {
  if (!run) return null;
  return <div className="ap-salary-page-11">
      <div className="ap-salary-page-38">
        <div className="ap-salary-page-39">Mark salary as paid?</div>
        <div className="ap-salary-page-40">
          This confirms payment of <b className="ap-salary-page-41">{inr(run.net)}</b> to{' '}
          <b className="ap-salary-page-42">{run.techName}</b> for <b>{run.period}</b> and marks this
          payroll run as Paid.
        </div>
        {inlineError(error)}
        <div className="ap-salary-page-43">
          <button onClick={onClose} disabled={processing} style={ghostBtn(processing)}>Cancel</button>
          <button onClick={onConfirm} disabled={processing} style={solidBtn('#16A34A', processing)}>
            {processing ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>;
};

// ─── Edit Salary Modal ────────────────────────────────────────────────────────
const EditSalaryModal = ({
  run,
  onClose,
  onSave,
  saving,
  error
}) => {
  const [form, setForm] = useState(() => ({
    basic: run.basic ?? 0,
    hra: run.hra ?? 0,
    travel: run.travel ?? 0,
    incentive: run.incentive ?? 0,
    uniformAllw: run.uniformAllw ?? 0,
    toolAllw: run.toolAllw ?? 0,
    overtime: run.overtime ?? 0,
    pf: run.pf ?? 0,
    tds: run.tds ?? 0,
    advance: run.advance ?? 0
  }));
  const setField = key => e => {
    const v = e.target.value;
    setForm(f => ({
      ...f,
      [key]: v === '' ? '' : Number(v)
    }));
  };
  const num = v => Number(v) || 0;
  const gross = num(form.basic) + num(form.hra) + num(form.travel) + num(form.incentive) + num(form.uniformAllw) + num(form.toolAllw) + num(form.overtime);
  const net = gross - (num(form.pf) + num(form.tds) + num(form.advance) + (run.lop || 0));
  const Field = ({
    label,
    k
  }) => <div>
      <label className="ap-salary-page-44">{label}</label>
      <input type="number" value={form[k]} onChange={setField(k)} className="ap-salary-page-45" />
    </div>;
  return <div className="ap-salary-page-11">
      <div className="ap-salary-page-46">
        <div className="ap-salary-page-47">
          <div>
            <div className="ap-salary-page-48">Edit Salary — {run.techName}</div>
            <div className="ap-salary-page-49">{run.period} · {run.runId}</div>
          </div>
          <button onClick={onClose} disabled={saving} style={{
          cursor: saving ? "default" : "pointer",
          opacity: saving ? "0.6" : "1"
        }} className="ap-salary-page-50">✕</button>
        </div>

        <div className="ap-salary-page-51">
          {inlineError(error)}

          <div className="ap-salary-page-52">EARNINGS</div>
          <div className="ap-salary-page-53">
            <Field label="Basic Salary" k="basic" />
            <Field label="HRA" k="hra" />
            <Field label="Travel Allowance" k="travel" />
            <Field label="Performance Incentive" k="incentive" />
            <Field label="Uniform Allowance" k="uniformAllw" />
            <Field label="Tool Allowance" k="toolAllw" />
            <Field label="Overtime Pay" k="overtime" />
          </div>

          <div className="ap-salary-page-54">DEDUCTIONS</div>
          <div className="ap-salary-page-55">
            <Field label="Provident Fund" k="pf" />
            <Field label="TDS" k="tds" />
            <Field label="Advance Recovery" k="advance" />
          </div>
          <div className="ap-salary-page-56">
            LOP ({run.absentDays ?? 0} absent day{(run.absentDays ?? 0) === 1 ? '' : 's'} · {inr(run.lop)}) comes from
            Attendance and isn't editable here.
          </div>

          <div className="ap-salary-page-57">
            <div className="ap-salary-page-58">
              <div className="ap-salary-page-59">GROSS (PREVIEW)</div>
              <div className="ap-salary-page-60">{inr(gross)}</div>
            </div>
            <div className="ap-salary-page-61">
              <div className="ap-salary-page-62">NET PAY (PREVIEW)</div>
              <div className="ap-salary-page-63">{inr(net)}</div>
            </div>
          </div>

          <div className="ap-salary-page-64">
            <button onClick={onClose} disabled={saving} style={ghostBtn(saving)}>Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving} style={solidBtn(`linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, saving)}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>;
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
const DeleteConfirmModal = ({
  run,
  onClose,
  onConfirm,
  processing,
  error
}) => {
  if (!run) return null;
  return <div className="ap-salary-page-11">
      <div className="ap-salary-page-65">
        <div className="ap-salary-page-66">Delete this payroll run?</div>
        <div className="ap-salary-page-67">
          This permanently deletes the {run.period} payroll run for{' '}
          <b className="ap-salary-page-68">{run.techName}</b> ({inr(run.net)} net). This cannot be undone.
        </div>
        {inlineError(error)}
        <div className="ap-salary-page-69">
          <button onClick={onClose} disabled={processing} style={ghostBtn(processing)}>Cancel</button>
          <button onClick={onConfirm} disabled={processing} style={solidBtn('#DC2626', processing)}>
            {processing ? 'Deleting…' : 'Delete Run'}
          </button>
        </div>
      </div>
    </div>;
};

// ─── SalaryPage ───────────────────────────────────────────────────────────────
const SalaryPage = ({
  onGoToGeneratePayroll
}) => {
  const [selMonth, setSelMonth] = useState(() => {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [payslipRun, setPayslipRun] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // ── Pay / Edit / Delete modal state ─────────────────────────────────────
  const [payConfirmRun, setPayConfirmRun] = useState(null);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payError, setPayError] = useState('');
  const [editRun, setEditRun] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingRun, setDeletingRun] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await payrollApi.listRuns(selMonth);
      setRuns(res.data ?? []);
    } catch (err) {
      setLoadError(err.message || 'Could not load payroll runs.');
    } finally {
      setLoading(false);
    }
  }, [selMonth]);
  useEffect(() => {
    load();
  }, [load]);
  const data = useMemo(() => runs.map(r => {
    const av = avatarFor(r.techName);
    return {
      ...r,
      id: r._id,
      name: r.techName,
      role: r.technician?.role || '—',
      empId: r.technician?.techId || '—',
      bank: r.technician?.bankAccount || '—',
      avatar: av.initials,
      avatarBg: av.bg,
      avatarCol: av.col,
      attLive: r.presentDays != null,
      daysWorked: r.presentDays,
      totalDays: r.totalDays,
      absentDays: r.absentDays ?? 0,
      payDate: r.status === 'paid' ?fmtDateDMY(new Date(r.updatedAt)) : '—'
    };
  }), [runs]);

  // ── Pay ──────────────────────────────────────────────────────────────────
  const openPayConfirm = run => {
    setPayError('');
    setPayConfirmRun(run);
  };
  const confirmPay = async () => {
    if (!payConfirmRun) return;
    setPayProcessing(true);
    setPayError('');
    try {
      await payrollApi.markPaid(payConfirmRun._id);
      setRuns(prev => prev.map(r => r._id === payConfirmRun._id ? {
        ...r,
        status: 'paid',
        updatedAt: new Date().toISOString()
      } : r));
      showToast(`Marked ${payConfirmRun.techName}'s salary as paid.`);
      setPayConfirmRun(null);
    } catch (err) {
      setPayError(err.message || 'Could not mark as paid.');
    } finally {
      setPayProcessing(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = run => {
    setEditError('');
    setEditRun(run);
  };
  const handleSaveEdit = async payload => {
    if (!editRun) return;
    setSavingEdit(true);
    setEditError('');
    try {
      await payrollApi.updateRun(editRun._id, payload);
      await load(); // refetch so gross/net reflect whatever the backend authoritatively computed
      showToast('Salary updated.');
      setEditRun(null);
    } catch (err) {
      setEditError(err.message || 'Could not update salary.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const openDeleteConfirm = run => {
    setDeleteError('');
    setDeleteTarget(run);
  };
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingRun(true);
    setDeleteError('');
    try {
      await payrollApi.deleteRun(deleteTarget._id);
      setRuns(prev => prev.filter(r => r._id !== deleteTarget._id));
      showToast('Payroll run deleted.');
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || 'Could not delete payroll run.');
    } finally {
      setDeletingRun(false);
    }
  };
  const downloadOne = async (id, techName, period) => {
    setDownloadingId(id);
    try {
      const blob = await payrollApi.downloadOne(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${(techName || 'technician').replace(/\s+/g, '-')}-${period.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Payslip for ${techName} downloaded!`);
    } catch (err) {
      showToast(err.message || 'Download failed — please try again.');
    } finally {
      setDownloadingId(null);
    }
  };
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered
  } = useTableSearch(data, ['name', 'role', 'empId', 'bank'], {
    status: ''
  });
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
  const summary = useMemo(() => ({
    totalGross: data.reduce((s, e) => s + (e.gross || 0), 0),
    totalNet: data.reduce((s, e) => s + (e.net || 0), 0),
    totalOT: data.reduce((s, e) => s + (e.overtime || 0), 0),
    totalLOP: data.reduce((s, e) => s + (e.lop || 0), 0),
    paid: data.filter(e => e.status === 'paid').length,
    total: data.length,
    ytdGross: data.reduce((s, e) => s + (e.ytdGross || 0), 0),
    liveCount: data.filter(e => e.attLive).length
  }), [data]);
  const COLS = [{
    label: 'Emp ID',
    key: 'empId',
    width: 10,
    tdStyle: {
      fontFamily: 'monospace',
      fontWeight: 700,
      fontSize: 11
    }
  }, {
    label: 'Name',
    key: 'name',
    width: 16,
    tdStyle: {
      fontWeight: 600
    }
  }, {
    label: 'Role',
    key: 'role',
    width: 16
  }, {
    label: 'Days',
    key: 'daysWorked',
    width: 7,
    format: v => v ?? '—'
  }, {
    label: 'Total Days',
    key: 'totalDays',
    width: 8,
    format: v => v ?? '—'
  }, {
    label: 'Absent',
    key: 'absentDays',
    width: 7,
    format: v => `${v}`
  }, {
    label: 'Basic',
    key: 'basic',
    width: 9,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'HRA',
    key: 'hra',
    width: 8,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'Travel',
    key: 'travel',
    width: 7,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'Incentive',
    key: 'incentive',
    width: 9,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'Overtime',
    key: 'overtime',
    width: 9,
    format: v => v ? `₹${Number(v).toLocaleString()}` : '—'
  }, {
    label: 'Gross',
    key: 'gross',
    width: 10,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'PF',
    key: 'pf',
    width: 8,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'TDS',
    key: 'tds',
    width: 7,
    format: v => v ? `₹${Number(v).toLocaleString()}` : '—'
  }, {
    label: 'Advance',
    key: 'advance',
    width: 8,
    format: v => v ? `₹${Number(v).toLocaleString()}` : '—'
  }, {
    label: 'LOP',
    key: 'lop',
    width: 7,
    format: v => v ? `₹${Number(v).toLocaleString()}` : '—'
  }, {
    label: 'Net Pay',
    key: 'net',
    width: 10,
    format: v => `₹${Number(v).toLocaleString()}`
  }, {
    label: 'Status',
    key: 'status',
    width: 9
  }, {
    label: 'Pay Date',
    key: 'payDate',
    width: 11
  }];
  const {
    exportProps
  } = useExport({
    title: 'Salary Register',
    filename: `salary-${selMonth.replace(' ', '-')}`,
    template: 'generic_list',
    subtitle: `CoolTech AC Services · ${selMonth} · ${filtered.length} records`,
    docId: 'SAL-EXPORT',
    columns: COLS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['basic', 'gross', 'pf', 'net']
  });
  const th = (label, align = 'left') => <th key={label} style={{
    textAlign: align
  }} className="ap-salary-page-70">{label}</th>;
  const td = (content, extra = {}) => <td style={{
    ...extra
  }} className="ap-salary-page-71">{content}</td>;
  const {
    monthIdx,
    year
  } = parseSelMonth(selMonth);
  const workingDays = getWorkingDays(monthIdx, year);
  const YEARS = useMemo(() => buildYearOptions(), []);
  const handleMonthChange = e => setSelMonth(`${e.target.value} ${year}`);
  const handleYearChange = e => setSelMonth(`${MONTH_NAMES[monthIdx]} ${e.target.value}`);
  if (loading) {
    return <div className="ap-salary-page-72">Loading payroll…</div>;
  }
  if (loadError) {
    return <div className="ap-salary-page-73">
        <div className="ap-salary-page-74">{loadError}</div>
        <button onClick={load} className="ap-salary-page-75">Try again</button>
      </div>;
  }
  return <>
      <div className="fi ap-salary-page-76">

        <div className="ap-salary-page-77">
          <div>
            <div className="ap-salary-page-78">Salary</div>
            <div className="ap-salary-page-79">{selMonth} · Review and pay processed salaries</div>
            <div className="ap-salary-page-80">
              <span className="ap-salary-page-81">
                ● {summary.liveCount}/{summary.total} technicians linked to Attendance
              </span>
              <span className="ap-salary-page-82">
                📅 {workingDays} working days
              </span>
            </div>
          </div>
          <div className="ap-salary-page-83">
            <select value={MONTH_NAMES[monthIdx]} onChange={handleMonthChange} className="ap-salary-page-84">
              {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={year} onChange={handleYearChange} className="ap-salary-page-85">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => onGoToGeneratePayroll ? onGoToGeneratePayroll() : navigate('/admin/salary/payroll')} className="ap-salary-page-86">
              Go to Generate Payroll →
            </button>
          </div>
        </div>

        <div className="ap-salary-page-87">
          <KCard label="Total Gross" value={`₹${(summary.totalGross / 1000).toFixed(1)}K`} sub="before deductions" icon="💰" iconBg="#FFF7ED" color={COLORS.brand} />
          <KCard label="Total Net Pay" value={`₹${(summary.totalNet / 1000).toFixed(1)}K`} sub="after all deductions" icon="✅" iconBg="#F0FDF4" color="#16A34A" />
          <KCard label="Overtime Pay" value={`₹${(summary.totalOT / 1000).toFixed(1)}K`} sub="this month total" icon="⏱" iconBg="#F0F9FF" color="#0369A1" />
          <KCard label="Total LOP" value={inr(summary.totalLOP)} sub="loss of pay (live)" icon="📉" iconBg="#FEF2F2" color="#DC2626" />
          <KCard label="Paid" value={`${summary.paid}/${summary.total}`} sub="staff paid" icon="✓" iconBg="#F0FDF4" color="#16A34A" />
          <KCard label="YTD Gross" value={`₹${(summary.ytdGross / 100000).toFixed(2)}L`} sub="year to date" icon="📊" iconBg="#F5F3FF" color="#7C3AED" />
        </div>

        <div className="ap-salary-page-88">

          <div className="ap-salary-page-89">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, role, bank…" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['paid', 'generated', 'draft']} allLabel="All Statuses" />
            <div className="ap-salary-page-90">
              <ExportDropdown {...exportProps} />
            </div>
          </div>

          <div className="ap-salary-page-91">
            <table className="ap-salary-page-92">
              <thead>
                <tr>
                  {th('TECHNICIAN')}{th('ROLE')}{th('DAYS', 'center')}{th('ABSENT', 'center')}
                  {th('BASIC', 'right')}{th('HRA', 'right')}{th('TRAVEL', 'right')}{th('INCENTIVE', 'right')}
                  {th('UNIFORM+TOOL', 'right')}{th('OVERTIME', 'right')}{th('GROSS', 'right')}{th('PF', 'right')}
                  {th('TDS', 'right')}{th('ADVANCE', 'right')}{th('LOP', 'right')}{th('NET PAY', 'right')}
                  {th('BANK')}{th('PAY DATE')}{th('STATUS')}{th('')}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && <tr><td colSpan={20} className="ap-salary-page-93">
                    No payroll generated for {selMonth} yet. Use "Go to Generate Payroll" above.
                  </td></tr>}
                {paginated.map((emp, i) => <tr key={emp.id} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                    {td(<div className="ap-salary-page-94">
                        <div style={{
                    background: emp.avatarBg,
                    color: emp.avatarCol
                  }} className="ap-salary-page-95">{emp.avatar}</div>
                        <div>
                          <div className="ap-salary-page-96">
                            <span className="ap-salary-page-97">{emp.name}</span>
                            <AttSourceBadge live={emp.attLive} />
                          </div>
                          <div className="ap-salary-page-98">{emp.empId}</div>
                        </div>
                      </div>)}
                    {td(<span className="ap-salary-page-99">{emp.role}</span>)}
                    {td(<div className="ap-salary-page-100">
                        <span className="ap-salary-page-101">{emp.daysWorked ?? '—'}</span>
                        {emp.totalDays != null && <span className="ap-salary-page-102">/{emp.totalDays}</span>}
                      </div>, {
                  textAlign: 'center'
                })}
                    {td(<span style={{
                  color: emp.absentDays > 0 ? "var(--danger-text)" : "var(--text-faint)"
                }} className="ap-salary-page-103">
                        {emp.absentDays > 0 ? emp.absentDays : '—'}
                      </span>, {
                  textAlign: 'center'
                })}
                    {td(<span className="ap-salary-page-104">{inr(emp.basic)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-105">{inr(emp.hra)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-106">{inr(emp.travel)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-107">{inr(emp.incentive)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<div className="ap-salary-page-108">
                        <span className="ap-salary-page-109">{inr((emp.uniformAllw || 0) + (emp.toolAllw || 0))}</span>
                        <div className="ap-salary-page-110">U:{inr(emp.uniformAllw)} T:{inr(emp.toolAllw)}</div>
                      </div>)}
                    {td(<span style={{
                  color: emp.overtime > 0 ? "var(--info-text)" : "var(--text-faint)",
                  fontWeight: emp.overtime > 0 ? "600" : "400"
                }} className="ap-salary-page-111">
                        {emp.overtime > 0 ? inr(emp.overtime) : '—'}
                      </span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-112">{inr(emp.gross)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-113">{inr(emp.pf)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span style={{
                  color: emp.tds > 0 ? "var(--danger-text)" : "var(--text-faint)"
                }} className="ap-salary-page-114">{emp.tds > 0 ? inr(emp.tds) : '—'}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span style={{
                  color: emp.advance > 0 ? "var(--danger-text)" : "var(--text-faint)"
                }} className="ap-salary-page-115">{emp.advance > 0 ? inr(emp.advance) : '—'}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span style={{
                  color: emp.lop > 0 ? "var(--danger-text)" : "var(--text-faint)",
                  fontWeight: emp.lop > 0 ? "600" : "400"
                }} className="ap-salary-page-116">
                        {emp.lop > 0 ? inr(emp.lop) : '—'}
                      </span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-117">{inr(emp.net)}</span>, {
                  textAlign: 'right'
                })}
                    {td(<span className="ap-salary-page-118">{emp.bank}</span>)}
                    {td(<span style={{
                  color: emp.payDate === '—' ? "var(--text-faint)" : "var(--text-muted)"
                }} className="ap-salary-page-119">{emp.payDate}</span>)}
                    {td(<StatusBadge status={emp.status} />)}
                    {td(<div onClick={e => e.stopPropagation()} className="ap-salary-page-120">
                        {emp.status !== 'paid' && <button onClick={() => openPayConfirm(emp)} className="ap-salary-page-121">Pay</button>}
                        <ActionDropdown onView={() => setPayslipRun(emp)} onEdit={() => openEdit(emp)} onDelete={() => openDeleteConfirm(emp)} />
                      </div>)}
                  </tr>)}
              </tbody>

              {paginated.length > 0 && <tfoot>
                  <tr className="ap-salary-page-122">
                    <td colSpan={10} className="ap-salary-page-123">
                      Totals ({filtered.length} technicians)
                    </td>
                    <td className="ap-salary-page-124">
                      {inr(filtered.reduce((s, e) => s + (e.gross || 0), 0))}
                    </td>
                    <td className="ap-salary-page-125">
                      {inr(filtered.reduce((s, e) => s + (e.pf || 0), 0))}
                    </td>
                    <td className="ap-salary-page-126">—</td>
                    <td className="ap-salary-page-127">
                      {inr(filtered.reduce((s, e) => s + (e.advance || 0), 0))}
                    </td>
                    <td className="ap-salary-page-128">
                      {inr(filtered.reduce((s, e) => s + (e.lop || 0), 0))}
                    </td>
                    <td className="ap-salary-page-129">
                      {inr(filtered.reduce((s, e) => s + (e.net || 0), 0))}
                    </td>
                    <td colSpan={4} className="ap-salary-page-130" />
                  </tr>
                </tfoot>}
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>
      </div>

      {payslipRun && <PayslipModal run={payslipRun} onClose={() => setPayslipRun(null)} onDownload={downloadOne} downloading={downloadingId === payslipRun.id} />}

      {payConfirmRun && <PayConfirmModal run={payConfirmRun} onClose={() => !payProcessing && setPayConfirmRun(null)} onConfirm={confirmPay} processing={payProcessing} error={payError} />}

      {editRun && <EditSalaryModal run={editRun} onClose={() => !savingEdit && setEditRun(null)} onSave={handleSaveEdit} saving={savingEdit} error={editError} />}

      {deleteTarget && <DeleteConfirmModal run={deleteTarget} onClose={() => !deletingRun && setDeleteTarget(null)} onConfirm={handleConfirmDelete} processing={deletingRun} error={deleteError} />}

      {toast && <div className="ap-salary-page-131">
          {toast}
        </div>}
    </>;
};
export default SalaryPage;
import { useState, useEffect, useCallback } from 'react';
import { technicianSalaryApi } from '../services/technicianPortalApi';

/* ── Design tokens — unchanged from the mock version ─────────────────── */
const COLORS = {
  brand: "var(--brand)",
  brandD: "var(--brand-d)",
  brandL: "var(--brand-l)",
  h1: "var(--h1)",
  h2: "var(--h2)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  border: "var(--border)",
  navy: "var(--navy2)"
};
const FONTS = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace"
};
const inr = n => n || n === 0 ? '₹' + Number(n).toLocaleString('en-IN') : '—';

/* ── Small building blocks (unchanged) ─────────────────────────────────── */

const KCard = ({
  label,
  value,
  sub,
  icon,
  iconBg,
  color
}) => <div className="tp-salary-page-1">
    <div>
      <div className="tp-salary-page-2">{label}</div>
      <div style={{
      color
    }} className="tp-salary-page-3">{value}</div>
      <div className="tp-salary-page-4">{sub}</div>
    </div>
    <div style={{
    background: iconBg
  }} className="tp-salary-page-5">{icon}</div>
  </div>;

// PayrollRun.status is 'draft' | 'generated' | 'paid' — three real states,
// not the two the mock version used. Draft = not finalized, can't download.
const STATUS_MAP = {
  paid: {
    label: '✓ Paid',
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    border: "var(--success-border)"
  },
  generated: {
    label: 'Processed',
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    border: "var(--info-border)"
  },
  draft: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning)",
    border: "var(--warning-border)"
  }
};
const StatusBadge = ({
  status
}) => {
  const m = STATUS_MAP[status] || STATUS_MAP.draft;
  return <span style={{
    background: m.bg,
    color: m.color,
    border: `1px solid ${m.border}`
  }} className="tp-salary-page-6">{m.label}</span>;
};
const AttSourceBadge = ({
  live
}) => <span style={{
  background: live ? "var(--success-bg)" : "var(--warning-bg)",
  color: live ? "var(--success-text)" : "var(--warning)",
  border: `1px solid ${live ? '#BBF7D0' : '#FDE68A'}`
}} className="tp-salary-page-7">{live ? '● Live' : '○ Static'}</span>;
const th = (label, align = 'left') => <th key={label} style={{
  textAlign: align
}} className="tp-salary-page-8">{label}</th>;
const td = (content, extra = {}) => <td style={{
  ...extra
}} className="tp-salary-page-9">{content}</td>;

/* ── Toast ──────────────────────────────────────────────────────────── */
const Toast = ({
  msg,
  error,
  onClose
}) => <div style={{
  background: error ? "var(--danger-strong-bg)" : "var(--h1)"
}} className="tp-salary-page-10">
    <span style={{
    color: error ? "var(--danger-border)" : "var(--success)"
  }} className="tp-salary-page-11">{error ? '⚠' : '✓'}</span>
    {msg}
    <button onClick={onClose} className="tp-salary-page-12">✕</button>
  </div>;

/* ── Payslip detail modal — now fed by GET /salary/:id ─────────────────── */
const PayslipModal = ({
  row,
  loading,
  onClose,
  onDownload,
  downloading
}) => {
  const line = (label, value, bold = false, color = '#111') => <tr key={label}>
      <td className="tp-salary-page-13">{label}</td>
      <td style={{
      fontWeight: bold ? "700" : "400",
      color,
      fontFamily: bold ? "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" : "inherit"
    }} className="tp-salary-page-14">{value}</td>
    </tr>;
  return <div onClick={onClose} className="tp-salary-page-15">
      <div onClick={e => e.stopPropagation()} className="tp-salary-page-16">
        <div className="tp-salary-page-17">
          <div>
            <div className="tp-salary-page-18">
              Payslip {row ? `— ${row.period}` : ''}
              {row?.attLive && <span className="tp-salary-page-19">
                  ● Live Attendance
                </span>}
            </div>
            {row && <div className="tp-salary-page-20">
                {row.technician.name} · {row.technician.techId}
              </div>}
          </div>
          <button onClick={onClose} className="tp-salary-page-21">✕</button>
        </div>

        {loading || !row ? <div className="tp-salary-page-22">Loading payslip…</div> : <div className="tp-salary-page-23">
            <div className="tp-salary-page-24">
              {[['Role', row.technician.role], ['Bank', row.technician.bankAccount || '—'], ['Days Worked', row.totalDays != null ? `${row.daysWorked ?? '—'} / ${row.totalDays}` : '—'], ['Absent Days', row.absentDays ?? 0], ['Payment Date', row.payDate ? new Date(row.payDate).toLocaleDateString('en-IN') : '—'], ['Status', <StatusBadge status={row.status} key="s" />]].map(([k, v]) => <div key={k} className="tp-salary-page-25">
                  <span className="tp-salary-page-26">{k}</span>
                  <span className="tp-salary-page-27">{v}</span>
                </div>)}
            </div>

            {row.attLive && <div className="tp-salary-page-28">
                ✓ Days worked & loss-of-pay auto-calculated from Attendance
              </div>}

            <div className="tp-salary-page-29">EARNINGS</div>
            <table className="tp-salary-page-30"><tbody>
              {line('Basic Salary', inr(row.basic))}
              {line('HRA (House Rent Allowance)', inr(row.hra))}
              {line('Travel Allowance', inr(row.travel))}
              {row.incentive > 0 && line('Performance Incentive', inr(row.incentive), false, '#D97706')}
              {row.uniformAllw > 0 && line('Uniform Allowance', inr(row.uniformAllw))}
              {row.toolAllw > 0 && line('Tool & Equipment Allowance', inr(row.toolAllw))}
              {row.overtime > 0 && line('Overtime Pay', inr(row.overtime), false, '#16A34A')}
              {line('Gross Earnings', inr(row.gross), true, COLORS.brand)}
            </tbody></table>

            <div className="tp-salary-page-31">DEDUCTIONS</div>
            <table className="tp-salary-page-32"><tbody>
              {line('Provident Fund (PF)', inr(row.pf), false, '#DC2626')}
              {row.tds > 0 && line('TDS (Tax Deducted at Source)', inr(row.tds), false, '#DC2626')}
              {row.advance > 0 && line('Advance Recovery', inr(row.advance), false, '#DC2626')}
              {row.lop > 0 && line(`LOP — ${row.absentDays ?? 0} absent day(s) × ${inr(row.dailyRate)}/day`, inr(row.lop), false, '#DC2626')}
              {line('Total Deductions', inr(row.totalDeductions), true, '#DC2626')}
            </tbody></table>

            <div className="tp-salary-page-33">
              <div>
                <div className="tp-salary-page-34">NET PAY (Take Home)</div>
                <div className="tp-salary-page-35">
                  {row.technician.bankAccount || '—'} · {row.payDate ? new Date(row.payDate).toLocaleDateString('en-IN') : 'Not yet paid'}
                </div>
              </div>
              <div className="tp-salary-page-36">
                {row.status !== 'draft' ? inr(row.net) : 'Processing…'}
              </div>
            </div>

            {row.technician.jobsCompleted != null && <div className="tp-salary-page-37">
                <div className="tp-salary-page-38">Performance</div>
                <div className="tp-salary-page-39">
                  <div><div className="tp-salary-page-40">Jobs Completed (all-time)</div><div className="tp-salary-page-41">{row.technician.jobsCompleted}</div></div>
                  <div><div className="tp-salary-page-42">Rating</div><div className="tp-salary-page-43">{row.technician.rating}⭐</div></div>
                </div>
              </div>}

            {row.advanceIncentiveRecords?.length > 0 && <div className="tp-salary-page-44">
                <div className="tp-salary-page-45">Related Requests</div>
                {row.advanceIncentiveRecords.map(r => <div key={r._id} className="tp-salary-page-46">
                    <span className="tp-salary-page-47">{r.type === 'advance' ? '↩' : '★'} {r.reason}</span>
                    <span style={{
              color: r.type === 'advance' ? "var(--danger-text)" : "var(--success-text)"
            }} className="tp-salary-page-48">{inr(r.amount)}</span>
                  </div>)}
              </div>}

            <div className="tp-salary-page-49">
              <button onClick={onClose} className="tp-salary-page-50">Close</button>
              {row.status !== 'draft' && <button onClick={() => onDownload(row.id, row.period)} disabled={downloading} style={{
            cursor: downloading ? "default" : "pointer",
            opacity: downloading ? "0.6" : "1"
          }} className="tp-salary-page-51">
                  {downloading ? 'Downloading…' : '⬇ Download Payslip'}
                </button>}
            </div>
          </div>}
      </div>
    </div>;
};

/* ── Page ───────────────────────────────────────────────────────────── */
const SalaryPage = () => {
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null); // { msg, error }

  const showToast = (msg, error = false) => {
    setToast({
      msg,
      error
    });
    setTimeout(() => setToast(null), 3200);
  };
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [listRes, summaryRes] = await Promise.all([technicianSalaryApi.list(), technicianSalaryApi.summary()]);
      setRows(listRes.data ?? []);
      setSummary(summaryRes ?? null);
    } catch (err) {
      setLoadError(err.message || 'Could not load salary data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const openPayslip = async id => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await technicianSalaryApi.detail(id);
      setSelectedDetail(res.data ?? res);
    } catch (err) {
      showToast(err.message || 'Could not load that payslip.', true);
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const closeModal = () => {
    setSelectedId(null);
    setSelectedDetail(null);
  };
  const download = async (id, period) => {
    setDownloadingId(id);
    try {
      const blob = await technicianSalaryApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${period.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Payslip for ${period} downloaded!`);
    } catch (err) {
      showToast(err.message || 'Download failed — please try again.', true);
    } finally {
      setDownloadingId(null);
    }
  };
  if (loading) {
    return <div className="tp-salary-page-52">
        Loading your salary details…
      </div>;
  }
  if (loadError) {
    return <div className="tp-salary-page-53">
        <div className="tp-salary-page-54">{loadError}</div>
        <button onClick={load} className="tp-salary-page-55">
          Try again
        </button>
      </div>;
  }
  return <div className="tp-salary-page-56">

      <div className="tp-salary-page-57">
        <div>
          <div className="tp-salary-page-58">My Salary</div>
          <div className="tp-salary-page-59">Payslips, incentives and earnings breakdown</div>
          {summary && <div className="tp-salary-page-60">
              <span className="tp-salary-page-61">
                ● Attendance-linked · {summary.liveCount}/{summary.totalMonths} months
              </span>
            </div>}
        </div>
      </div>

      {summary && <div className="tp-salary-page-62">
          <KCard label="Basic Salary" value={inr(summary.basicSalary)} sub="per month" icon="💵" iconBg={COLORS.brandL} color={COLORS.brand} />
          <KCard label="Avg Net Pay" value={inr(summary.avgNet)} sub={`last ${summary.monthsCounted} months`} icon="📈" iconBg="#F0FDF4" color="#16A34A" />
          <KCard label="Total Incentives" value={inr(summary.totalIncentive)} sub={`last ${summary.monthsCounted} months`} icon="⭐" iconBg="#FFFBEB" color="#D97706" />
          <KCard label="Total LOP" value={inr(summary.totalLOP)} sub="loss of pay" icon="📉" iconBg="#FEF2F2" color="#DC2626" />
          <KCard label="Next Salary" value={summary.nextPeriod || '—'} sub="pending" icon="📅" iconBg="#EFF6FF" color="#1D4ED8" />
        </div>}

      <div className="tp-salary-page-63">
        <div className="tp-salary-page-64">
          💵 Payslip History
        </div>
        <div className="tp-salary-page-65">
          <table className="tp-salary-page-66">
            <thead>
              <tr>
                {[th('MONTH'), th('DAYS', 'center'), th('ABSENT', 'center'), th('BASIC', 'right'), th('INCENTIVE', 'right'), th('OVERTIME', 'right'), th('GROSS', 'right'), th('LOP', 'right'), th('NET PAY', 'right'), th('STATUS'), th('')]}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={11} className="tp-salary-page-67">No payslips generated yet.</td></tr>}
              {rows.map((s, i) => <tr key={s.id} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  {td(<div className="tp-salary-page-68">
                      <span className="tp-salary-page-69">{s.period}</span>
                      <AttSourceBadge live={s.attLive} />
                    </div>)}
                  {td(<div className="tp-salary-page-70">
                      <span className="tp-salary-page-71">{s.daysWorked ?? '—'}</span>
                      {s.totalDays != null && <span className="tp-salary-page-72">/{s.totalDays}</span>}
                    </div>, {
                textAlign: 'center'
              })}
                  {td(<span style={{
                color: s.absentDays > 0 ? "var(--danger-text)" : "var(--faint)"
              }} className="tp-salary-page-73">
                      {s.absentDays > 0 ? s.absentDays : '—'}
                    </span>, {
                textAlign: 'center'
              })}
                  {td(<span className="tp-salary-page-74">{inr(s.basic)}</span>, {
                textAlign: 'right'
              })}
                  {td(<span style={{
                color: s.incentive ? "var(--warning)" : "var(--faint)"
              }} className="tp-salary-page-75">{s.incentive ? inr(s.incentive) : '—'}</span>, {
                textAlign: 'right'
              })}
                  {td(<span style={{
                color: s.overtime ? "var(--info-text)" : "var(--faint)"
              }} className="tp-salary-page-76">{s.overtime ? inr(s.overtime) : '—'}</span>, {
                textAlign: 'right'
              })}
                  {td(<span className="tp-salary-page-77">{inr(s.gross)}</span>, {
                textAlign: 'right'
              })}
                  {td(<span style={{
                color: s.lop ? "var(--danger-text)" : "var(--faint)"
              }} className="tp-salary-page-78">{s.lop ? inr(s.lop) : '—'}</span>, {
                textAlign: 'right'
              })}
                  {td(<span className="tp-salary-page-79">{s.status !== 'draft' ? inr(s.net) : '—'}</span>, {
                textAlign: 'right'
              })}
                  {td(<StatusBadge status={s.status} />)}
                  {td(<div className="tp-salary-page-80">
                      <button onClick={() => openPayslip(s.id)} className="tp-salary-page-81">View</button>
                      {s.status !== 'draft' && <button onClick={() => download(s.id, s.period)} disabled={downloadingId === s.id} style={{
                  cursor: downloadingId === s.id ? "default" : "pointer",
                  opacity: downloadingId === s.id ? "0.6" : "1"
                }} className="tp-salary-page-82">{downloadingId === s.id ? '…' : '⬇ Download'}</button>}
                    </div>)}
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && <PayslipModal row={selectedDetail} loading={detailLoading} onClose={closeModal} onDownload={download} downloading={downloadingId === selectedId} />}
      {toast && <Toast msg={toast.msg} error={toast.error} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes ct-toast-in { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>;
};
export default SalaryPage;
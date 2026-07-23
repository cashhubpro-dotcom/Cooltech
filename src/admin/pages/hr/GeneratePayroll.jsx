import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import PayrollSettingsPanel from "./PayrollSettingsPanel";
import { techsApi, payrollApi } from "../../services/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const AV_COLORS = [{
  bg: "#faeeda",
  col: "#854f0b"
}, {
  bg: "#e6f1fb",
  col: "#185fa5"
}, {
  bg: "#eaf3de",
  col: "#3b6d11"
}, {
  bg: "#faece7",
  col: "#993c1d"
}, {
  bg: "#eeedfe",
  col: "#534ab7"
}];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ALL_CYCLES = ["Monthly", "Weekly", "Bi-weekly", "Custom"];
const DEPARTMENTS = ["All departments", "Senior Technician", "Technician", "Junior Technician"];
const PAYMENT_MODES = ["Bank Transfer", "Cash", "Cheque", "UPI"];

// ── Dynamically generate years: from 2024 up to current year + 1 ─────────────
function getYears() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = 2024; y <= current + 1; y++) years.push(String(y));
  return years;
}

// ── Generate all months for a given year (up to current month if current year) ─
function getMonthsForYear(year) {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMon = now.getMonth(); // 0-indexed
  const months = [];
  const maxMon = Number(year) === curYear ? curMon : 11;
  for (let m = maxMon; m >= 0; m--) {
    months.push(`${MONTH_NAMES[m]} ${year}`);
  }
  return months;
}

// ── Generate week options for a year+month ────────────────────────────────────
function getWeeksForMonth(monthStr) {
  if (!monthStr) return [];
  const [mName, yr] = monthStr.split(" ");
  const mIdx = MONTH_NAMES.indexOf(mName);
  if (mIdx === -1 || !yr) return [];
  const year = Number(yr);
  const weeks = [];
  let weekNum = 1;
  let date = new Date(year, mIdx, 1);
  while (date.getMonth() === mIdx) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    if (end.getMonth() !== mIdx) end.setDate(new Date(year, mIdx + 1, 0).getDate());
    weeks.push({
      label: `Week ${weekNum} (${start.getDate()} – ${end.getDate()} ${mName})`,
      value: `W${weekNum}-${mName}-${yr}`
    });
    date.setDate(date.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

// ── Generate bi-weekly options for a year+month ───────────────────────────────
function getBiweeksForMonth(monthStr) {
  if (!monthStr) return [];
  const [mName, yr] = monthStr.split(" ");
  const mIdx = MONTH_NAMES.indexOf(mName);
  if (mIdx === -1 || !yr) return [];
  const year = Number(yr);
  const lastDay = new Date(year, mIdx + 1, 0).getDate();
  return [{
    label: `1st – 15th ${mName} ${yr}`,
    value: `BW1-${mName}-${yr}`
  }, {
    label: `16th – ${lastDay}th ${mName} ${yr}`,
    value: `BW2-${mName}-${yr}`
  }];
}

// ── Quarter options ───────────────────────────────────────────────────────────
function getQuartersForYear(year) {
  return [{
    label: `Q1 (Jan – Mar ${year})`,
    value: `Q1-${year}`
  }, {
    label: `Q2 (Apr – Jun ${year})`,
    value: `Q2-${year}`
  }, {
    label: `Q3 (Jul – Sep ${year})`,
    value: `Q3-${year}`
  }, {
    label: `Q4 (Oct – Dec ${year})`,
    value: `Q4-${year}`
  }];
}
function inr(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
function initials(name) {
  return (name || "").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

// ── Trigger a browser download from a Blob ────────────────────────────────────
function triggerDownload(blob, filename) {
  if (!blob) return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function OptCard({
  label,
  desc,
  checked,
  onChange
}) {
  return <label className={`gp-opt-card${checked ? " checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div>
        <div className="gp-opt-label">{label}</div>
        <div className="gp-opt-desc">{desc}</div>
      </div>
    </label>;
}
function SummaryCard({
  label,
  value,
  colorClass
}) {
  return <div className="gp-summary-card">
      <div className="gp-summary-label">{label}</div>
      <div className={`gp-summary-value${colorClass ? ` ${colorClass}` : ""}`}>{value}</div>
    </div>;
}

// ─── Period selector — changes based on active cycle ─────────────────────────
function PeriodSelector({
  cycle,
  year,
  selMonth,
  setSelMonth,
  selWeek,
  setSelWeek,
  selBiweek,
  setSelBiweek,
  selQuarter,
  setSelQuarter,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo
}) {
  const months = useMemo(() => getMonthsForYear(year), [year]);
  const weeks = useMemo(() => getWeeksForMonth(selMonth), [selMonth]);
  const biweeks = useMemo(() => getBiweeksForMonth(selMonth), [selMonth]);
  const quarters = useMemo(() => getQuartersForYear(year), [year]);
  if (cycle === "Monthly") {
    return <div className="gp-period-field">
        <label className="gp-label">Select month</label>
        <select className="gp-select" value={selMonth} onChange={e => setSelMonth(e.target.value)}>
          {months.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>;
  }
  if (cycle === "Weekly") {
    return <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">Select month</label>
          <select className="gp-select" value={selMonth} onChange={e => {
          setSelMonth(e.target.value);
          setSelWeek("");
        }}>
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="gp-period-field">
          <label className="gp-label">Select week</label>
          <select className="gp-select" value={selWeek} onChange={e => setSelWeek(e.target.value)}>
            <option value="">All weeks</option>
            {weeks.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
      </div>;
  }
  if (cycle === "Bi-weekly") {
    return <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">Select month</label>
          <select className="gp-select" value={selMonth} onChange={e => {
          setSelMonth(e.target.value);
          setSelBiweek("");
        }}>
            {months.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="gp-period-field">
          <label className="gp-label">Select period</label>
          <select className="gp-select" value={selBiweek} onChange={e => setSelBiweek(e.target.value)}>
            <option value="">Both periods</option>
            {biweeks.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      </div>;
  }
  if (cycle === "Quarterly") {
    return <div className="gp-period-field">
        <label className="gp-label">Select quarter</label>
        <select className="gp-select" value={selQuarter} onChange={e => setSelQuarter(e.target.value)}>
          {quarters.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
        </select>
      </div>;
  }
  if (cycle === "Custom") {
    return <div className="gp-period-fields">
        <div className="gp-period-field">
          <label className="gp-label">From date</label>
          <input type="date" className="gp-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
        </div>
        <div className="gp-period-field">
          <label className="gp-label">To date</label>
          <input type="date" className="gp-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
        </div>
      </div>;
  }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GeneratePayroll() {
  const YEARS = useMemo(() => getYears(), []);
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedCycle, setSelectedCycle] = useState("Monthly");

  // Period selectors per cycle
  const initialMonths = useMemo(() => getMonthsForYear(currentYear), [currentYear]);
  const [selMonth, setSelMonth] = useState(initialMonths[0] || "");
  const [selWeek, setSelWeek] = useState("");
  const [selBiweek, setSelBiweek] = useState("");
  const [selQuarter, setSelQuarter] = useState(`Q1-${currentYear}`);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Other form state
  const [selDept, setSelDept] = useState("");
  const [selEmp, setSelEmp] = useState("");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  const [cutoff, setCutoff] = useState(`${currentYear}-04-30`);
  const [opts, setOpts] = useState({
    expense: true,
    timelog: false,
    attendance: false,
    advances: false
  });
  const [selectAll, setSelectAll] = useState(true);
  const [rowChecks, setRowChecks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false);

  // Download format for the Generate button (pdf | excel)
  const [downloadFormat, setDownloadFormat] = useState("pdf");
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // Technicians — fetched from backend
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [techLoadError, setTechLoadError] = useState("");

  // Preview rows — computed on the backend from Technician + AdvanceIncentive + PayrollSettings
  const [previewRows, setPreviewRows] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Load technicians once ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingTechs(true);
      setTechLoadError("");
      try {
        const {
          data
        } = await techsApi.list({
          limit: 200
        });
        setTechnicians((data || []).map(t => ({
          _id: t._id,
          name: t.name,
          role: t.role
        })));
      } catch (err) {
        setTechLoadError(err.message);
      } finally {
        setLoadingTechs(false);
      }
    })();
  }, []);

  // When year changes (tab or dropdown) — reset period fields for that year
  const handleYearChange = year => {
    setSelectedYear(year);
    const months = getMonthsForYear(year);
    setSelMonth(months[0] || "");
    setSelWeek("");
    setSelBiweek("");
    setSelQuarter(`Q1-${year}`);
    setCustomFrom("");
    setCustomTo("");
  };

  // When cycle changes — keep selMonth but reset sub-selectors
  const handleCycleChange = cycle => {
    setSelectedCycle(cycle);
    setSelWeek("");
    setSelBiweek("");
  };

  // Filtered technicians (by department / individual selection)
  const filtered = technicians.filter(t => {
    if (selDept && t.role !== selDept) return false;
    if (selEmp && t.name !== selEmp) return false;
    return true;
  });
  useEffect(() => {
    setRowChecks(filtered.map(() => true));
    setSelectAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selDept, selEmp, technicians.length]);
  const checkedTechs = filtered.filter((_, i) => rowChecks[i]);

  // Human-readable period label for toast + month tag + backend "period" field
  const periodLabel = useMemo(() => {
    if (selectedCycle === "Monthly") return selMonth;
    if (selectedCycle === "Weekly") return selWeek || selMonth;
    if (selectedCycle === "Bi-weekly") return selBiweek || selMonth;
    if (selectedCycle === "Quarterly") return selQuarter;
    if (selectedCycle === "Custom") return customFrom && customTo ? `${customFrom} → ${customTo}` : "Custom range";
    return "";
  }, [selectedCycle, selMonth, selWeek, selBiweek, selQuarter, customFrom, customTo]);
  const monthTag = selMonth ? selMonth.split(" ")[0].substring(0, 3) + " " + (selMonth.split(" ")[1] || selectedYear) : selectedYear;

  // ── Fetch live preview (basic/hra/travel/expense/overtime/pf/lop/incentive/advance/gross/net) ──
  const refreshPreview = useCallback(async () => {
    if (!checkedTechs.length || !periodLabel) {
      setPreviewRows([]);
      return;
    }
    setLoadingPreview(true);
    try {
      const {
        data
      } = await payrollApi.preview({
        technicianIds: checkedTechs.map(t => t._id),
        period: periodLabel,
        options: opts
      });
      setPreviewRows(data || []);
    } catch (err) {
      setToastMsg(err.message);
      setToastError(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setLoadingPreview(false);
    }
  }, [checkedTechs, periodLabel, opts]);

  // Re-run preview whenever the relevant inputs change — now includes ALL
  // four option checkboxes, not just opts.advances, so toggling expense /
  // timelog / attendance actually refreshes the preview table.
  useEffect(() => {
    refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowChecks.join(","), periodLabel, opts.expense, opts.timelog, opts.attendance, opts.advances, selDept, selEmp]);
  const toggleRow = i => {
    const next = [...rowChecks];
    next[i] = !next[i];
    setRowChecks(next);
    setSelectAll(next.every(Boolean));
  };
  const toggleAll = v => {
    setSelectAll(v);
    setRowChecks(filtered.map(() => v));
  };

  // Totals from live preview data (server-computed, not hardcoded)
  const totalGross = previewRows.reduce((s, r) => s + (r.gross || 0), 0);
  const totalDed = previewRows.reduce((s, r) => s + (r.pf || 0) + (r.advance || 0) + (r.lop || 0), 0);
  const totalNet = previewRows.reduce((s, r) => s + (r.net || 0), 0);
  const totalPF = previewRows.reduce((s, r) => s + (r.pf || 0), 0);
  const totalAdv = previewRows.reduce((s, r) => s + (r.advance || 0), 0);
  const totalExpense = previewRows.reduce((s, r) => s + (r.expense || 0), 0);
  const totalOvertime = previewRows.reduce((s, r) => s + (r.overtime || 0), 0);
  const totalLOP = previewRows.reduce((s, r) => s + (r.lop || 0), 0);

  const handleGenerate = useCallback(async () => {
    if (!checkedTechs.length || !periodLabel) return;
    setGenerating(true);
    setProgress(20);
    setShowToast(false);
    setToastError(false);
    try {
      const result = await payrollApi.generate({
        technicianIds: checkedTechs.map(t => t._id),
        period: periodLabel,
        cycle: selectedCycle,
        paymentMode,
        cutoffDate: cutoff,
        options: opts
      });
      setProgress(60);

      const runIds = (result.data || []).map(r => r._id);
      if (runIds.length) {
        if (downloadFormat === "excel") {
          const blob = await payrollApi.downloadExcel(runIds);
          triggerDownload(blob, `payroll-${periodLabel.replace(/\s+/g, '-')}.xlsx`);
        } else if (runIds.length === 1) {
          // Single technician → plain PDF, not zipped
          const blob = await payrollApi.downloadOne(runIds[0]);
          const techName = (result.data[0].techName || "technician").replace(/\s+/g, '-');
          triggerDownload(blob, `payslip-${techName}-${periodLabel.replace(/\s+/g, '-')}.pdf`);
        } else {
          // Multiple technicians → zip of PDFs
          const blob = await payrollApi.downloadPayslips(runIds);
          triggerDownload(blob, `payslips-${periodLabel.replace(/\s+/g, '-')}.zip`);
        }
      }

      setProgress(100);
      setToastMsg(`${result.count} technician${result.count !== 1 ? "s" : ""} processed for ${periodLabel}.`);
      setShowToast(true);
      refreshPreview();
    } catch (err) {
      setToastMsg(err.message);
      setToastError(true);
      setShowToast(true);
    } finally {
      setGenerating(false);
      setProgress(0);
      setTimeout(() => setShowToast(false), 5000);
    }
  }, [checkedTechs, periodLabel, selectedCycle, paymentMode, cutoff, opts, refreshPreview, downloadFormat]);

  return <div className="gp-page">

      {/* ── Page Header ── */}
      <div className="gp-page-header">
        <div>
          <div className="gp-page-title">Generate Payroll</div>
          <div className="gp-page-sub">Configure and process monthly salaries for your team</div>
        </div>
        <div className="gp-year-tabs">
          {YEARS.map(y => <button key={y} className={`gp-year-tab${selectedYear === y ? " active" : ""}`} onClick={() => handleYearChange(y)}>
              {y}
            </button>)}
        </div>
      </div>

      {/* ── Configuration Card ── */}
      <div className="gp-card">
        <div className="gp-card-title-row">
          <div className="gp-card-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#e85d26" strokeWidth="1.4">
              <rect x="1" y="3" width="14" height="10" rx="1.5" />
              <path d="M1 7h14M5 7v6M11 7v6" />
            </svg>
            Payroll configuration
          </div>
          <button className="gp-btn-sec" onClick={() => setShowSettings(true)}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="8" cy="8" r="2" />
              <path d="M8 1v2M8 13v2M2.5 4.5l1.4 1.4M12.1 10.1l1.4 1.4M1 8h2M13 8h2M2.5 11.5l1.4-1.4M12.1 5.9l1.4-1.4" />
            </svg>
            Formula settings
          </button>
        </div>
        <div className="gp-card-sub">Set the cycle, period, and inclusion options before generating</div>

        {/* ── Salary cycle tabs ── */}
        <div className="gp-section-label">Salary cycle</div>
        <div className="gp-cycle-row">
          {ALL_CYCLES.map(c => <button key={c} className={`gp-cycle-btn${selectedCycle === c ? " active" : ""}`} onClick={() => handleCycleChange(c)}>
              {c}
            </button>)}
        </div>

        {/* ── Form grid ── */}
        <div className="gp-form-grid">
          <PeriodSelector cycle={selectedCycle} year={selectedYear} selMonth={selMonth} setSelMonth={setSelMonth} selWeek={selWeek} setSelWeek={setSelWeek} selBiweek={selBiweek} setSelBiweek={setSelBiweek} selQuarter={selQuarter} setSelQuarter={setSelQuarter} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} />

          <div>
            <label className="gp-label">Department</label>
            <select className="gp-select" value={selDept} onChange={e => setSelDept(e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d} value={d === "All departments" ? "" : d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="gp-label">Select technician</label>
            <select className="gp-select" value={selEmp} onChange={e => setSelEmp(e.target.value)}>
              <option value="">All technicians</option>
              {technicians.map(t => <option key={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="gp-label">Payment mode</label>
            <select className="gp-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="gp-label">Cut-off date</label>
            <input type="date" className="gp-input" value={cutoff} onChange={e => setCutoff(e.target.value)} />
          </div>
        </div>

        <div className="gp-divider" />

        <div className="gp-section-label">Include in payroll</div>
        <div className="gp-opts-row">
          <OptCard label="Expense claims" desc="Approved reimbursements" checked={opts.expense} onChange={() => setOpts(p => ({
          ...p,
          expense: !p.expense
        }))} />
          <OptCard label="Add timelogs to salary" desc="Overtime & extra hours" checked={opts.timelog} onChange={() => setOpts(p => ({
          ...p,
          timelog: !p.timelog
        }))} />
          <OptCard label="Use attendance" desc="Deduct absent days" checked={opts.attendance} onChange={() => setOpts(p => ({
          ...p,
          attendance: !p.attendance
        }))} />
          <OptCard label="Include advances" desc="Recover given advances" checked={opts.advances} onChange={() => setOpts(p => ({
          ...p,
          advances: !p.advances
        }))} />
        </div>
      </div>

      {/* ── Preview Card ── */}
      <div className="gp-card">
        <div className="gp-preview-header">
          <div>
            <div className="gp-preview-title">Payroll preview</div>
            <div className="gp-preview-sub">
              {checkedTechs.length} technician{checkedTechs.length !== 1 ? "s" : ""} selected
              {periodLabel && <span className="gp-period-badge">{periodLabel}</span>}
            </div>
          </div>
          <button className="gp-btn-sec" onClick={refreshPreview} disabled={loadingPreview}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 8a6 6 0 1 1 10.4-4.4M14 2v4h-4" />
            </svg>
            {loadingPreview ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="gp-summary-grid">
          <SummaryCard label="Total gross" value={inr(totalGross)} colorClass="orange" />
          <SummaryCard label="Total deductions" value={inr(totalDed)} colorClass="red" />
          <SummaryCard label="Total net pay" value={inr(totalNet)} colorClass="green" />
          <SummaryCard label="Technicians" value={checkedTechs.length} />
        </div>

        {generating && <div className="gp-progress-wrap">
            <div className="gp-progress-bar" style={{
          width: `${progress}%`
        }} />
          </div>}

        {showToast && <div className={`gp-toast${toastError ? " gp-toast-error" : ""}`}>
            {toastError ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b91c1c" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" /><path d="M8 5v4M8 11v.5" />
              </svg> : <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3b6d11" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" />
              </svg>}
            {toastError ? toastMsg : <>Payroll generated successfully! {toastMsg}</>}
          </div>}

        {loadingTechs ? <div className="gp-empty">Loading technicians...</div> : techLoadError ? <div className="gp-empty gp-error-text">{techLoadError}</div> : filtered.length === 0 ? <div className="gp-empty">
            <div className="gp-empty-icon">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#9ca3af" strokeWidth="1.3">
                <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11v.5" />
              </svg>
            </div>
            No technicians match the selected filters
          </div> : <div className="gp-table-wrap">
            <table className="gp-table">
              <thead>
                <tr>
                  <th className="gp-th ap-generate-payroll-1">
                    <input type="checkbox" checked={selectAll} onChange={e => toggleAll(e.target.checked)} className="ap-generate-payroll-2" />
                  </th>
                  {["Technician", "Role", "Basic", "HRA", "Travel", "Incentive", "Expense", "Overtime", "Gross", "PF", "LOP", "Advance", "Net pay", "Period"].map(h => <th key={h} className="gp-th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tech, i) => {
              const ci = i % AV_COLORS.length;
              const {
                bg,
                col
              } = AV_COLORS[ci];
              const checked = rowChecks[i] ?? true;
              const row = previewRows.find(r => r.technician === tech._id) || {};
              return <tr key={tech._id} className={checked ? "gp-row-checked" : "gp-row-unchecked"}>
                      <td className="gp-td">
                        <input type="checkbox" checked={checked} onChange={() => toggleRow(i)} className="ap-generate-payroll-3" />
                      </td>
                      <td className="gp-td">
                        <div className="gp-name-cell">
                          <div className="gp-avatar" style={{
                      background: bg,
                      color: col
                    }}>{initials(tech.name)}</div>
                          <span className="gp-emp-name">{tech.name}</span>
                        </div>
                      </td>
                      <td className="gp-td muted">{tech.role}</td>
                      <td className="gp-td">{checked ? inr(row.basic) : "—"}</td>
                      <td className="gp-td">{checked ? inr(row.hra) : "—"}</td>
                      <td className="gp-td">{checked ? inr(row.travel) : "—"}</td>
                      <td className="gp-td">{checked ? inr(row.incentive) : "—"}</td>
                      <td className="gp-td">{checked ? inr(row.expense) : "—"}</td>
                      <td className="gp-td">{checked ? inr(row.overtime) : "—"}</td>
                      <td className="gp-td orange">{checked ? inr(row.gross) : "—"}</td>
                      <td className="gp-td red">{checked ? inr(row.pf) : "—"}</td>
                      <td className={`gp-td${row.lop ? " red" : " faint"}`}>{checked ? (row.lop ? inr(row.lop) : "—") : "—"}</td>
                      <td className={`gp-td${row.advance ? " red" : " faint"}`}>{checked ? (row.advance ? inr(row.advance) : "—") : "—"}</td>
                      <td className="gp-td green">{checked ? inr(row.net) : "—"}</td>
                      <td className="gp-td"><span className="gp-month-tag">{monthTag}</span></td>
                    </tr>;
            })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="gp-tfoot-td">Total</td>
                  <td className="gp-tfoot-td">{inr(totalExpense)}</td>
                  <td className="gp-tfoot-td">{inr(totalOvertime)}</td>
                  <td className="gp-tfoot-td orange">{inr(totalGross)}</td>
                  <td className="gp-tfoot-td red">{inr(totalPF)}</td>
                  <td className="gp-tfoot-td red">{inr(totalLOP)}</td>
                  <td className="gp-tfoot-td red">{inr(totalAdv)}</td>
                  <td className="gp-tfoot-td green">{inr(totalNet)}</td>
                  <td className="gp-tfoot-td" />
                </tr>
              </tfoot>
            </table>
          </div>}

        <div className="gp-divider" />
        <div className="gp-btn-row">
          <button className="gp-btn-sec">Save as draft</button>
          <button className="gp-btn-sec" onClick={refreshPreview} disabled={loadingPreview}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 8a6 6 0 1 1 10.4-4.4M14 2v4h-4" />
            </svg>
            Preview
          </button>

          {/* ── Split Generate button: main click generates + downloads in
                the currently-selected format; caret opens PDF/Excel choice ── */}
          <div className="gp-split-btn">
            <button className="gp-btn-prim gp-split-btn-main" onClick={handleGenerate} disabled={generating || checkedTechs.length === 0}>
              {generating ? <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.5" className="gp-spin">
                    <path d="M8 2a6 6 0 1 1-4.24 1.76" />
                  </svg>
                  Generating...
                </> : <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13 7H9V3H7v4H3v2h4v4h2V9h4V7z" />
                  </svg>
                  Generate &amp; download {downloadFormat === "excel" ? "Excel" : "PDF"}
                </>}
            </button>
            <button className="gp-btn-prim gp-split-btn-caret" disabled={generating} onClick={() => setShowFormatMenu(v => !v)} aria-label="Choose download format">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" /></svg>
            </button>
            {showFormatMenu && <div className="gp-format-menu">
                <button className={`gp-format-opt${downloadFormat === "pdf" ? " active" : ""}`} onClick={() => {
              setDownloadFormat("pdf");
              setShowFormatMenu(false);
            }}>
                  PDF
                </button>
                <button className={`gp-format-opt${downloadFormat === "excel" ? " active" : ""}`} onClick={() => {
              setDownloadFormat("excel");
              setShowFormatMenu(false);
            }}>
                  Excel
                </button>
              </div>}
          </div>
        </div>
      </div>

      {/* ── Formula settings modal ── */}
      {showSettings && createPortal(<div className="gp-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="gp-modal" onClick={e => e.stopPropagation()}>
            <PayrollSettingsPanel onClose={() => setShowSettings(false)} onSaved={() => refreshPreview()} />
          </div>
        </div>, document.body)}
    </div>;
}
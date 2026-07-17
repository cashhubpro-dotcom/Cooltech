import { useState, useEffect } from 'react';
import { customersApi, techsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard } from '../components/ui/Cards';
import { CustomReportModal } from '../components/modals/Modals';

// ─── RevenueChart ─────────────────────────────────────────────────────────────

const RevenueChart = ({
  data
}) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue ?? d.value ?? 0));
  const chartH = 80;
  return <div className="ap-reports-page-1">
      {data.map((d, i) => {
      const val = d.revenue ?? d.value ?? 0;
      const barH = max > 0 ? val / max * chartH : 0;
      return <div key={i} className="ap-reports-page-2">
            <div title={`₹${val.toLocaleString()}`} style={{
          height: barH
        }} className="ap-reports-page-3" />
          </div>;
    })}
    </div>;
};

// ─── LiveBar ──────────────────────────────────────────────────────────────────

const LiveBar = ({
  label,
  value,
  max,
  color,
  prefix = ""
}) => {
  const pct = max > 0 ? value / max * 100 : 0;
  return <div className="ap-reports-page-4">
      <div className="ap-reports-page-5">
        <span>{label}</span>
        <span className="ap-reports-page-6">{prefix}{value?.toLocaleString()}</span>
      </div>
      <div className="ap-reports-page-7">
        <div style={{
        width: `${pct}%`,
        background: color
      }} className="ap-reports-page-8" />
      </div>
    </div>;
};

// ─── Download Helpers ──────────────────────────────────────────────────────────

const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], {
    type: mime
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
};
const printAsPDF = (title, htmlBody) => {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${title}</title>
    <style>
      body { font-family: sans-serif; padding: 32px; color: #111; }
      h1   { font-size: 20px; margin-bottom: 16px; }
      table{ border-collapse: collapse; width: 100%; font-size: 13px; }
      th,td{ border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      th   { background: #f4f4f4; font-weight: 700; }
    </style></head>
    <body><h1>${title}</h1>${htmlBody}</body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
};

// ─── ReportsPage ──────────────────────────────────────────────────────────────

const ReportsPage = ({
  openModal
}) => {
  const [activeChart, setActiveChart] = useState("revenue");
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [showCustomReport, setShowCustomReport] = useState(false);
  useEffect(() => {
    customersApi.list().then(res => setCustomers(res?.data || res || [])).catch(() => {});
    techsApi.list().then(res => setTechnicians(res?.data || res || [])).catch(() => {});
    // If revenueData comes from an API, fetch it similarly.
    // Otherwise set static fallback data:
    setRevenueData([{
      m: "Jul",
      revenue: 120000
    }, {
      m: "Aug",
      revenue: 95000
    }, {
      m: "Sep",
      revenue: 140000
    }, {
      m: "Oct",
      revenue: 160000
    }, {
      m: "Nov",
      revenue: 175000
    }, {
      m: "Dec",
      revenue: 195000
    }]);
  }, []);
  const topCustomers = customers.slice().sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const techPerf = technicians.map(t => ({
    name: t.name.split(" ")[0],
    jobs: t.completed,
    rating: t.rating
  })).sort((a, b) => b.jobs - a.jobs);
  const handleDownload = (title, format) => {
    const ts = new Date().toISOString().slice(0, 10);
    const slug = title.replace(/\s+/g, '_');

    // ── build data per report ──────────────────────────────────────────────────
    let headers = [],
      rows = [],
      tableHTML = '';
    if (title === 'Revenue Report') {
      headers = ['Month', 'Revenue (₹)'];
      rows = revenueData.map(d => [d.m, d.revenue ?? d.value ?? 0]);
    } else if (title === 'Top Customers by Revenue' || title === 'Customer Report') {
      headers = ['Name', 'Phone', 'Total Spent (₹)'];
      rows = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).map(c => [c.name, c.phone ?? '-', c.totalSpent ?? 0]);
    } else if (title === 'Technician Performance') {
      headers = ['Name', 'Jobs Completed', 'Rating'];
      rows = technicians.map(t => [t.name, t.completed ?? 0, t.rating ?? '-']);
    } else if (title === 'Job Summary Report') {
      headers = ['Technician', 'Jobs', 'Rating'];
      rows = technicians.map(t => [t.name, t.completed ?? 0, t.rating ?? '-']);
    } else {
      // Generic fallback
      headers = ['Report', 'Generated'];
      rows = [[title, ts]];
    }

    // ── build HTML table for PDF ───────────────────────────────────────────────
    tableHTML = `<table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;

    // ── dispatch by format ─────────────────────────────────────────────────────
    if (format === 'CSV') {
      downloadBlob(toCSV(headers, rows), `${slug}_${ts}.csv`, 'text/csv');
    } else if (format === 'XLSX') {
      // Simple TSV works in Excel without SheetJS dependency
      const tsv = [headers, ...rows].map(r => r.join('\t')).join('\n');
      downloadBlob(tsv, `${slug}_${ts}.xls`, 'application/vnd.ms-excel');
    } else if (format === 'PDF') {
      printAsPDF(title, tableHTML);
    }
  };
  return <div className="fi ap-reports-page-9">
      <div className="ap-reports-page-10">
        <div>
          <div className="ap-reports-page-11">Reports & Analytics</div>
          <div className="ap-reports-page-12">Live business intelligence dashboard</div>
        </div>
        <div className="ap-reports-page-13">
          {/* <button className="btn" onClick={() => openModal("set_reminder")} style={{ padding: "9px 18px", borderRadius: 9, background: COLORS.white, border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 13, fontWeight: 600 }}>📅 Schedule Report</button> */}
          <button className="btn ap-reports-page-14" onClick={() => setShowCustomReport(true)}>+ Custom Report</button>
        </div>
      </div>
      {/* Live Charts row */}
      <div className="ap-reports-page-15">
        {/* Revenue chart */}
        <div className="ap-reports-page-16">
          <div className="ap-reports-page-17">Revenue Trend (6 months)</div>
          <RevenueChart data={revenueData} />
          <div className="ap-reports-page-18">
            {revenueData.map(d => <span key={d.m}>{d.m}</span>)}
          </div>
          <div className="ap-reports-page-19">
            <span className="ap-reports-page-20">Peak Month</span>
            <span className="ap-reports-page-21">Dec – ₹1.95L</span>
          </div>
        </div>

        {/* Top customers */}
        <div className="ap-reports-page-22">
          <div className="ap-reports-page-23">Top Customers by Revenue</div>
          {topCustomers.map(c => <LiveBar key={c._id || c.id} label={c.name} value={c.totalSpent} max={topCustomers[0].totalSpent} color={COLORS.brand} prefix="₹" />)}
        </div>

        {/* Technician jobs */}
        <div className="ap-reports-page-24">
          <div className="ap-reports-page-25">Technician Performance</div>
          {techPerf.map(t => <div key={t.name} className="ap-reports-page-26">
              <div className="ap-reports-page-27">
                <span>{t.name}</span>
                <span className="ap-reports-page-28">{t.jobs} jobs · ⭐{t.rating}</span>
              </div>
              <div className="ap-reports-page-29">
                <div style={{
              width: `${t.jobs / techPerf[0].jobs * 100}%`
            }} className="ap-reports-page-30" />
              </div>
            </div>)}
        </div>
      </div>

      {/* Quick stat row */}
      <div className="ap-reports-page-31">
        {[{
        label: "Total Revenue (6mo)",
        value: "₹9.77L",
        change: "+14%",
        up: true
      }, {
        label: "Jobs Completed",
        value: "110",
        change: "+8%",
        up: true
      }, {
        label: "Invoice Collection",
        value: "78%",
        change: "-2%",
        up: false
      }, {
        label: "Customer Satisfaction",
        value: "4.6★",
        change: "+0.2",
        up: true
      }].map(s => <div key={s.label} className="ap-reports-page-32">
            <div className="ap-reports-page-33">{s.label}</div>
            <div className="ap-reports-page-34">{s.value}</div>
            <div style={{
          color: s.up ? "var(--success-text)" : "var(--danger)"
        }} className="ap-reports-page-35">{s.up ? "↑" : "↓"} {s.change} vs last period</div>
          </div>)}
      </div>

      {/* Downloadable reports grid */}
      <div className="ap-reports-page-36">Downloadable Reports</div>
      <div className="ap-reports-page-37">
        {[{
        title: "Revenue Report",
        desc: "Monthly/yearly revenue, payment status, top customers",
        icon: "💰",
        color: "#F59E0B"
      }, {
        title: "Job Summary Report",
        desc: "Jobs by type, status, technician performance, completion rate",
        icon: "📋",
        color: "#3B82F6"
      }, {
        title: "Technician Performance",
        desc: "Jobs per tech, ratings, avg resolution time, efficiency",
        icon: "👷",
        color: "#10B981"
      }, {
        title: "AMC Analytics",
        desc: "Contract renewal rate, visit completion, AMC revenue",
        icon: "📄",
        color: "#8B5CF6"
      }, {
        title: "Customer Report",
        desc: "Customer growth, repeat jobs, LTV, churn analysis",
        icon: "👥",
        color: "#EC4899"
      }, {
        title: "Inventory Usage",
        desc: "Parts consumed, reorder frequency, cost per job, wastage",
        icon: "📦",
        color: "#06B6D4"
      }, {
        title: "Invoice Aging Report",
        desc: "Outstanding invoices, overdue analysis, collection efficiency",
        icon: "📊",
        color: "#EF4444"
      }, {
        title: "Salary & Payroll Report",
        desc: "Monthly salary disbursement, incentives, advances",
        icon: "💵",
        color: "#16A34A"
      }, {
        title: "Attendance Report",
        desc: "Monthly attendance summary, leaves, absenteeism trends",
        icon: "📅",
        color: "#7C3AED"
      }, {
        title: "Expense Report",
        desc: "Field expenses by category, tech, approval status",
        icon: "🧾",
        color: "#0369A1"
      }, {
        title: "Complaint Analysis",
        desc: "Complaint categories, resolution time, tech performance",
        icon: "💬",
        color: "#DC2626"
      }, {
        title: "Quotation Conversion",
        desc: "Quote approval rate, value converted, pending follow-ups",
        icon: "📝",
        color: "#F97316"
      }].map(r => <div key={r.title} className="card ap-reports-page-38">
            <div style={{
          background: `${r.color}15`
        }} className="ap-reports-page-39">{r.icon}</div>
            <div className="ap-reports-page-40">
              <div className="ap-reports-page-41">{r.title}</div>
              <div className="ap-reports-page-42">{r.desc}</div>
              <div className="ap-reports-page-43">
                <button className="btn ap-reports-page-44" onClick={() => handleDownload(r.title, 'CSV')}>CSV</button>
                <button className="btn ap-reports-page-45" onClick={() => handleDownload(r.title, 'XLSX')}>XLSX</button>
                <button className="btn ap-reports-page-46" onClick={() => handleDownload(r.title, 'PDF')} style={{
              background: `${r.color}15`,
              border: `1px solid ${r.color}30`,
              color: r.color
            }}>⬇ PDF</button>
              </div>
            </div>
          </div>)}
      </div>
       {/* Custom Report Modal */}
  {showCustomReport && <CustomReportModal open={showCustomReport} onClose={() => setShowCustomReport(false)} onSave={() => setShowCustomReport(false)} />}
    </div>;
};
export default ReportsPage;
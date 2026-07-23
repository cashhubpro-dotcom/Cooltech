import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Percent, Plus, Package, X } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { financeApi, expensesApi } from '../../services/api';
import { COLORS } from '../../constants/tokens';
import { fmtDateDMY } from '../../../shared/formatDate';

const PERIODS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year',  label: 'This Year' },
];

const DONUT_COLORS = ['#EA580C', '#3B82F6', '#F59E0B', '#8B5CF6', '#22C55E', '#EF4444'];
const CATEGORY_OPTIONS = ['Fuel', 'Tools', 'Miscellaneous', 'Training', 'Office', 'Other'];

const fmtINR = n => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = d => d ? fmtDateDMY(new Date(d)) : '—';

const IncomeExpenseTrendChart = ({ data }) => {
  if (!data?.length) return <div className="empty-chart-msg">No data yet</div>;
  return <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}k`} />
        <Tooltip formatter={(v, name) => [fmtINR(v), name]} contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={16} />
        <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
        <Line type="monotone" dataKey="profit" name="Net Profit" stroke={COLORS.brand} strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>;
};

const CategoryDonut = ({ data, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colored = data.map((d, i) => ({ ...d, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  return <div className="fin-donut-row">
      <div className="fin-donut-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={total ? colored : [{ label: 'None', value: 1, color: 'var(--border)' }]}
              dataKey="value" nameKey="label"
              innerRadius={46} outerRadius={64} stroke="none"
              startAngle={90} endAngle={-270}
            >
              {(total ? colored : [{ color: 'var(--border)' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            {total > 0 && <Tooltip content={<DonutTooltip total={total} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="fin-donut-center">
          <div className="fin-donut-value">{fmtINR(total)}</div>
          <div className="fin-donut-label">{centerLabel}</div>
        </div>
      </div>
      <div className="fin-donut-legend">
        {colored.map(d => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return <div key={d.key} className="fin-legend-row">
              <span className="fin-legend-dot" style={{ background: d.color }} />
              <span className="fin-legend-label">{d.label}</span>
              <span className="fin-legend-value">{fmtINR(d.value)} ({pct}%)</span>
            </div>;
        })}
      </div>
    </div>;
};

// Custom tooltip so it matches the legend format (name, amount, percent)
// instead of recharts' bare-number default.
const DonutTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const pct = total ? Math.round((d.value / total) * 100) : 0;
  return <div className="fin-donut-tooltip">
      <div className="fin-donut-tooltip-label">
        <span className="fin-donut-tooltip-dot" style={{ background: d.payload.color }} />
        {d.name}
      </div>
      <div className="fin-donut-tooltip-value">{fmtINR(d.value)} <span className="fin-donut-tooltip-pct">({pct}%)</span></div>
    </div>;
};

const MarginBar = ({ pct }) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct >= 40 ? '#22C55E' : pct >= 20 ? '#F59E0B' : '#EF4444';
  return <div className="fin-margin-bar"><div className="fin-margin-fill" style={{ width: `${clamped}%`, background: color }} /></div>;
};

const AddExpenseModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: CATEGORY_OPTIONS[0], amount: '', description: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSaving(true);
    try {
      await expensesApi.create({ ...form, amount: Number(form.amount) });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--narrow" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Expense</div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-field">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Technician overtime — 2 visits" required />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Amount (₹)</label>
                <input type="number" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" required />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>;
};

const FinancePage = () => {
  const [period, setPeriod] = useState('this_month');
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const load = () => {
  setLoading(true);
  setError(null);
  Promise.all([
    financeApi.summary(period),
    financeApi.trend(),
    financeApi.breakdown('expense', period),
    financeApi.breakdown('income', period),
    financeApi.jobs(period),
  ]).then(([s, t, eb, ib, j]) => {
    setSummary(s.data);
    setTrend(t.data);
    setExpenseBreakdown(eb.data);
    setIncomeBreakdown(ib.data);
    setJobs(j.data);
  }).catch(err => setError(err.message || 'Failed to load finance data'))
    .finally(() => setLoading(false));
};

  useEffect(load, [period]);

  if (loading && !summary) return <div className="loading-msg">Loading finance overview…</div>;
  if (error) return <div className="error-msg">Couldn't load finance data. {error}</div>;

  const KPI_CARDS = [
    { label: 'Total Income',    value: fmtINR(summary.totalIncome),  sub: PERIODS.find(p => p.value === period)?.label, Icon: TrendingUp,   bg: '#F0FDF4', color: '#16A34A' },
    { label: 'Total Expenses',  value: fmtINR(summary.totalExpense), sub: PERIODS.find(p => p.value === period)?.label, Icon: TrendingDown, bg: '#FEF2F2', color: '#DC2626' },
    { label: 'Net Profit',      value: fmtINR(summary.netProfit),    sub: summary.netProfit >= 0 ? 'Profitable' : 'At a loss', Icon: Wallet, bg: 'var(--brand-light)', color: COLORS.brand },
    { label: 'Profit Margin',   value: `${summary.marginPct}%`,      sub: 'of total income', Icon: Percent, bg: '#EFF6FF', color: '#3B82F6' },
  ];

  return <div className="finance-page">
      <div className="section-hdr">
        <div>
          <div className="section-title">Finance Overview</div>
          <div className="section-sub">Track what you spend on jobs vs. what you actually earn from them.</div>
        </div>
        <div className="section-actions">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="form-input form-select fin-period-select">
            {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      <div className="kpi-grid-4">
        {KPI_CARDS.map(k => <div key={k.label} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-label">{k.label.toUpperCase()}</div>
              <div className="stat-card-icon" style={{ background: k.bg }}><k.Icon size={16} color={k.color} /></div>
            </div>
            <div className="stat-card-value" style={{ color: k.color }}>{k.value}</div>
            <div className="stat-card-sub">{k.sub}</div>
          </div>)}
      </div>

      <div className="card">
        <div className="card-hdr"><div className="card-hdr-title">Income vs Expense Trend</div></div>
        <div className="card-body"><IncomeExpenseTrendChart data={trend} /></div>
      </div>

      <div className="fin-donuts-grid">
        <div className="card">
          <div className="card-hdr"><div className="card-hdr-title">Expense Breakdown</div></div>
          <div className="card-body"><CategoryDonut data={expenseBreakdown} centerLabel="Spent" /></div>
        </div>
        <div className="card">
          <div className="card-hdr"><div className="card-hdr-title">Income Breakdown</div></div>
          <div className="card-body"><CategoryDonut data={incomeBreakdown} centerLabel="Earned" /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-hdr">
          <div className="card-hdr-title">Job Profitability</div>
          <span className="fin-table-hint">Revenue billed vs. parts cost, per job</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Job ID</th><th>Client</th><th>Date</th><th>Revenue</th><th>Parts Cost</th><th>Profit</th><th>Margin</th></tr></thead>
            <tbody>
              {jobs.length === 0 ? <tr><td colSpan={7} className="fin-empty">No completed jobs this period</td></tr> : jobs.map(j => <tr key={j.jobId}>
                  <td className="fin-mono">{j.jobId}</td>
                  <td>{j.client}</td>
                  <td>{fmtDate(j.date)}</td>
                  <td className="fin-mono">{fmtINR(j.revenue)}</td>
                  <td className="fin-mono fin-cost">{fmtINR(j.partsCost)}</td>
                  <td className="fin-mono" style={{ color: j.profit >= 0 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{fmtINR(j.profit)}</td>
                  <td><div className="fin-margin-cell"><MarginBar pct={j.margin} /><span className="fin-margin-pct">{j.margin}%</span></div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} onSaved={() => { setShowAddExpense(false); load(); }} />}
    </div>;
};

export default FinancePage;
import { useState, useEffect } from 'react';
import { leadsApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';

// ─── Local constants ──────────────────────────────────────────────────────────
const TEMP_CFG = {
  hot: {
    label: "Hot",
    icon: "🔥",
    color: "var(--danger)",
    bg: "var(--danger-bg)"
  },
  warm: {
    label: "Warm",
    icon: "☀️",
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  cold: {
    label: "Cold",
    icon: "❄️",
    color: "var(--info)",
    bg: "var(--info-bg)"
  }
};

// ─── CrmBar ───────────────────────────────────────────────────────────────────
const CrmBar = ({
  label,
  value,
  max,
  color
}) => {
  const pct = max > 0 ? Math.round(value / max * 100) : 0;
  return <div className="ap-crm-analytics-page-1">
      <div className="ap-crm-analytics-page-2">
        <span className="ap-crm-analytics-page-3">{label}</span>
        <span style={{
        color
      }} className="ap-crm-analytics-page-4">{value.toLocaleString()}</span>
      </div>
      <div className="ap-crm-analytics-page-5">
        <div style={{
        width: `${pct}%`,
        background: color
      }} className="ap-crm-analytics-page-6" />
      </div>
    </div>;
};

// ─── CRMAnalyticsPage ─────────────────────────────────────────────────────────
const CRMAnalyticsPage = () => {
  const [leads, setLeads] = useState([]);
  useEffect(() => {
    leadsApi.list({ limit: 500 }).then(r => setLeads(r.data ?? [])).catch(() => {});
  }, []);

  const wonLeads = leads.filter(l => l.stage === "won");
  const lostLeads = leads.filter(l => l.stage === "lost");
  const activeLeads = leads.filter(l => !["won", "lost"].includes(l.stage));
  const totalPipeline = activeLeads.reduce((s, l) => s + (l.value || 0), 0);
  const wonValue = wonLeads.reduce((s, l) => s + (l.value || 0), 0);
  const winRate = Math.round(wonLeads.length / (wonLeads.length + lostLeads.length) * 100) || 0;

  // Source breakdown computed from real leads, not a fabricated fixed list —
  // any source with at least one lead shows up, in descending value order.
  const sourceData = Object.values(leads.reduce((acc, l) => {
    const src = l.source || "Other";
    if (!acc[src]) acc[src] = { src, count: 0, value: 0 };
    acc[src].count += 1;
    acc[src].value += l.value || 0;
    return acc;
  }, {})).sort((a, b) => b.value - a.value);

  const stageOrder = ["new", "follow_up", "proposal_sent", "negotiation", "won", "lost"];
  const stageData = stageOrder.map(s => ({
    stage: s,
    label: s === "follow_up" ? "Follow Up" : s === "proposal_sent" ? "Proposal Sent" : s.charAt(0).toUpperCase() + s.slice(1),
    count: leads.filter(l => l.stage === s).length,
    value: leads.filter(l => l.stage === s).reduce((a, l) => a + (l.value || 0), 0)
  }));

  // Rep leaderboard computed from whichever assignedTo values actually exist
  // in the data, instead of two hardcoded names — ranked by won value.
  const repData = Object.values(leads.reduce((acc, l) => {
    const name = l.assignedTo || "Unassigned";
    if (!acc[name]) acc[name] = { name, leads: 0, won: 0, value: 0 };
    acc[name].leads += 1;
    if (l.stage === "won") {
      acc[name].won += 1;
      acc[name].value += l.value || 0;
    }
    return acc;
  }, {})).sort((a, b) => b.value - a.value);

  const STAGE_COLORS = ["var(--info)", "var(--warning)", "var(--purple)", "var(--brand)", "var(--success)", "var(--danger)"];
  return <div className="fu">
      <div className="ap-crm-analytics-page-7">
        <div className="ap-crm-analytics-page-8">CRM Analytics</div>
        <div className="ap-crm-analytics-page-9">Sales funnel performance, win rates & revenue forecasting</div>
      </div>
      {/* KPIs */}
      <div className="ap-crm-analytics-page-10">
        {[{
        label: "Pipeline Value",
        value: `₹${(totalPipeline / 1000).toFixed(0)}K`,
        icon: "🎯",
        color: COLORS.brand,
        bg: COLORS.brandL,
        sub: `${activeLeads.length} active leads`
      }, {
        label: "Won This Month",
        value: `₹${(wonValue / 1000).toFixed(0)}K`,
        icon: "🏆",
        color: "#16A34A",
        bg: "#F0FDF4",
        sub: `${wonLeads.length} deals closed`
      }, {
        label: "Win Rate",
        value: `${winRate}%`,
        icon: "📈",
        color: "#8B5CF6",
        bg: "#F5F3FF",
        sub: "closed deals"
      }, {
        label: "Avg Deal Size",
        value: wonLeads.length ? `₹${Math.round(wonValue / wonLeads.length / 1000)}K` : "—",
        icon: "💰",
        color: "#3B82F6",
        bg: "#EFF6FF",
        sub: "per closed deal"
      }].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} sub={s.sub} />)}
      </div>
      <div className="ap-crm-analytics-page-11">
        {/* Funnel */}
        <div className="ap-crm-analytics-page-12">
          <div className="ap-crm-analytics-page-13">Pipeline Funnel</div>
          {stageData.map((s, i) => <CrmBar key={s.stage} label={s.label} value={s.count} max={Math.max(...stageData.map(d => d.count), 1)} color={STAGE_COLORS[i]} />)}
        </div>
        {/* Source performance */}
        <div className="ap-crm-analytics-page-14">
          <div className="ap-crm-analytics-page-15">Lead Sources by Value</div>
          {sourceData.map((s, i) => <CrmBar key={s.src} label={s.src} value={s.value} max={Math.max(...sourceData.map(d => d.value), 1)} color={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
          <div className="ap-crm-analytics-page-16">Values shown in ₹ · Total: ₹{leads.reduce((s, l) => s + (l.value || 0), 0).toLocaleString()}</div>
        </div>
      </div>
      <div className="ap-crm-analytics-page-17">
        {/* Rep leaderboard */}
        <div className="ap-crm-analytics-page-18">
          <div className="ap-crm-analytics-page-19">Sales Rep Performance</div>
          {repData.map((r, i) => <div key={r.name} style={{
          borderBottom: i < repData.length - 1 ? "1px solid var(--border)" : "none"
        }} className="ap-crm-analytics-page-20">
              <div style={{
            background: i === 0 ? "var(--xea580c18)" : "var(--bg)",
            color: i === 0 ? "var(--brand)" : "var(--text-muted)"
          }} className="ap-crm-analytics-page-21">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
              <div className="ap-crm-analytics-page-22">
                <div className="ap-crm-analytics-page-23">{r.name}</div>
                <div className="ap-crm-analytics-page-24">{r.leads} leads · {r.won} won</div>
              </div>
              <div className="ap-crm-analytics-page-25">
                <div className="ap-crm-analytics-page-26">₹{(r.value / 1000).toFixed(0)}K</div>
                <div className="ap-crm-analytics-page-27">won value</div>
              </div>
            </div>)}
        </div>
        {/* Forecast */}
        <div className="ap-crm-analytics-page-28">
          <div className="ap-crm-analytics-page-29">Revenue Forecast</div>
          {[{
          label: "Conservative (40% conv.)",
          value: Math.round(totalPipeline * 0.4),
          color: "#64748B"
        }, {
          label: "Expected (65% conv.)",
          value: Math.round(totalPipeline * 0.65),
          color: COLORS.brand
        }, {
          label: "Optimistic (85% conv.)",
          value: Math.round(totalPipeline * 0.85),
          color: "#22C55E"
        }].map(f => <div key={f.label} className="ap-crm-analytics-page-30">
              <div className="ap-crm-analytics-page-31">
                <span className="ap-crm-analytics-page-32">{f.label}</span>
                <span style={{
              color: f.color
            }} className="ap-crm-analytics-page-33">₹{(f.value / 1000).toFixed(0)}K</span>
              </div>
              <div className="ap-crm-analytics-page-34">
                <div style={{
              width: `${totalPipeline > 0 ? f.value / Math.round(totalPipeline * 0.85) * 100 : 0}%`,
              background: f.color
            }} className="ap-crm-analytics-page-35" />
              </div>
            </div>)}
          <div className="ap-crm-analytics-page-36">
            <div className="ap-crm-analytics-page-37">Already Won (Confirmed Revenue)</div>
            <div className="ap-crm-analytics-page-38">₹{(wonValue / 1000).toFixed(0)}K</div>
          </div>
        </div>
      </div>
      {/* Lead temperature breakdown */}
      <div className="ap-crm-analytics-page-39">
        <div className="ap-crm-analytics-page-40">Lead Temperature Overview</div>
        <div className="ap-crm-analytics-page-41">
          {Object.entries(TEMP_CFG).map(([k, cfg]) => {
          const count = leads.filter(l => l.temp === k).length;
          const val = leads.filter(l => l.temp === k).reduce((s, l) => s + (l.value || 0), 0);
          return <div key={k} style={{
            background: cfg.bg,
            border: `1px solid ${cfg.color}20`
          }} className="ap-crm-analytics-page-42">
                <div className="ap-crm-analytics-page-43">{cfg.icon}</div>
                <div style={{
              color: cfg.color
            }} className="ap-crm-analytics-page-44">{count} <span className="ap-crm-analytics-page-45">leads</span></div>
                <div className="ap-crm-analytics-page-46">{cfg.label}</div>
                <div className="ap-crm-analytics-page-47">₹{(val / 1000).toFixed(0)}K pipeline value</div>
              </div>;
        })}
          <div className="ap-crm-analytics-page-48">
            <div className="ap-crm-analytics-page-49">SCORING GUIDE</div>
            {[["80–100", "Hot 🔥", "Ready to close. Follow up within 24h.", "#FEF2F2", "#EF4444"], ["40–79", "Warm 🌤", "Actively engaged. Follow up weekly.", "#FFFBEB", "#F59E0B"], ["0–39", "Cold ❄", "Low engagement. Nurture with content.", "#EFF6FF", "#3B82F6"]].map(([r, t, d, bg, c]) => <div key={r} style={{
            background: bg
          }} className="ap-crm-analytics-page-50">
                <span style={{
              color: c
            }} className="ap-crm-analytics-page-51">{r}</span>
                <div><div style={{
                color: c
              }} className="ap-crm-analytics-page-52">{t}</div><div className="ap-crm-analytics-page-53">{d}</div></div>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};
export default CRMAnalyticsPage;
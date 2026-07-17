import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { COLORS, FONTS } from '../constants/tokens';

// ─── Bucket definitions shared by the donut + trend chart ──────────────────
// Keys MUST match the backend's JOB_STATUS_BUCKET output (requestsOverview /
// trend.series keys) in clientPortal_routes.js — change one, change both.
export const REQUEST_BUCKETS = [{
  key: 'inProgress',
  label: 'In Progress',
  color: '#3B82F6'
}, {
  key: 'pending',
  label: 'Pending',
  color: '#F59E0B'
}, {
  key: 'completed',
  label: 'Completed',
  color: '#22C55E'
}, {
  key: 'cancelled',
  label: 'Cancelled',
  color: '#EF4444'
}];

// ─── StarRating ──────────────────────────────────────────────────────────────
export const StarRating = ({
  value = 0,
  size = 14
}) => <div className="cp-dashboard-charts-1">
    {[1, 2, 3, 4, 5].map(i => {
    const fill = Math.max(0, Math.min(1, value - (i - 1))) * 100;
    return <span key={i} style={{
      width: size,
      height: size
    }} className="cp-dashboard-charts-2">
          <span style={{
        fontSize: size
      }} className="cp-dashboard-charts-3">★</span>
          <span style={{
        fontSize: size,
        width: `${fill}%`
      }} className="cp-dashboard-charts-4">★</span>
        </span>;
  })}
  </div>;

// ─── KpiSparkline ────────────────────────────────────────────────────────────
// DECORATIVE ONLY — this is a fixed illustrative wave, not plotted from real
// per-KPI daily history. We don't have that data yet (would need a new
// per-KPI time-series aggregation per card). This exists purely to match the
// reference design's visual texture. Say the word if you want it swapped for
// a real 7/30-day series per KPI — that's a small backend addition away.
const SPARK_PATH = 'M0,18 C8,10 14,22 22,14 C30,6 36,20 44,12 C52,4 58,16 66,10 C74,4 80,14 88,8 C96,2 100,10 110,6';
export const KpiSparkline = ({
  color = COLORS.brand,
  width = 96,
  height = 24
}) => <svg width={width} height={height} viewBox="0 0 110 24" fill="none" className="cp-dashboard-charts-5">
    <path d={SPARK_PATH} stroke={color} strokeWidth={1.75} strokeLinecap="round" fill="none" opacity={0.75} />
  </svg>;

// ─── RequestsDonut ───────────────────────────────────────────────────────────
export const RequestsDonut = ({
  overview
}) => {
  const pieData = REQUEST_BUCKETS.map(b => ({
    name: b.label,
    value: overview[b.key] || 0,
    color: b.color
  }));
  const hasData = overview.total > 0;
  return <div className="cp-dashboard-charts-6">
      <div className="cp-dashboard-charts-7">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={hasData ? pieData : [{
            name: 'None',
            value: 1,
            color: COLORS.border
          }]} dataKey="value" innerRadius={48} outerRadius={68} stroke="none" startAngle={90} endAngle={-270}>
              {(hasData ? pieData : [{
              color: COLORS.border
            }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="cp-dashboard-charts-8">
          <div className="cp-dashboard-charts-9">{overview.total || 0}</div>
          <div className="cp-dashboard-charts-10">Total</div>
        </div>
      </div>
      <div className="cp-dashboard-charts-11">
        {REQUEST_BUCKETS.map(b => {
        const count = overview[b.key] || 0;
        const pct = overview.total ? Math.round(count / overview.total * 100) : 0;
        return <div key={b.key} className="cp-dashboard-charts-12">
              <span style={{
            background: b.color
          }} className="cp-dashboard-charts-13" />
              <span className="cp-dashboard-charts-14">{b.label}</span>
              <span className="cp-dashboard-charts-15">{count} ({pct}%)</span>
            </div>;
      })}
      </div>
    </div>;
};

// ─── TrendLegend ─────────────────────────────────────────────────────────────
const TREND_LINES = [{
  key: 'inProgress',
  label: 'In Progress',
  color: '#3B82F6'
}, {
  key: 'completed',
  label: 'Completed',
  color: '#22C55E'
}, {
  key: 'cancelled',
  label: 'Cancelled',
  color: '#EF4444'
}];
const TrendLegend = () => <div className="cp-dashboard-charts-16">
    {TREND_LINES.map(l => <div key={l.key} className="cp-dashboard-charts-17">
        <span style={{
      background: l.color
    }} className="cp-dashboard-charts-18" />
        <span className="cp-dashboard-charts-19">{l.label}</span>
      </div>)}
  </div>;

// ─── Custom tooltip ──────────────────────────────────────────────────────────
const TrendTooltip = ({
  active,
  payload,
  label
}) => {
  if (!active || !payload?.length) return null;
  return <div className="cp-dashboard-charts-20">
      <div className="cp-dashboard-charts-21">{label}</div>
      {payload.map(p => <div key={p.dataKey} className="cp-dashboard-charts-22">
          <span style={{
        background: p.color
      }} className="cp-dashboard-charts-23" />
          <span className="cp-dashboard-charts-24">{p.name}:</span>
          <span className="cp-dashboard-charts-25">{p.value}</span>
        </div>)}
    </div>;
};

// ─── RequestTrendChart ───────────────────────────────────────────────────────
// `trend` = { days: [<label>, ...], series: { pending: [], inProgress: [], completed: [], cancelled: [] } }
// `days` entries are pre-formatted display labels (e.g. "1 Jul", "Jan") —
// formatting by period happens in Dashboard.jsx before this receives them.
export const RequestTrendChart = ({
  trend
}) => {
  const days = trend?.days || [];
  const data = days.map((day, i) => ({
    day,
    inProgress: trend.series.inProgress[i] ?? 0,
    completed: trend.series.completed[i] ?? 0,
    cancelled: trend.series.cancelled[i] ?? 0
  }));
  if (data.length === 0) {
    return <div className="cp-dashboard-charts-26">
        No activity yet this period
      </div>;
  }

  // Show at most ~5 x-axis ticks regardless of how many days/months are plotted
  const tickInterval = Math.max(0, Math.ceil(data.length / 5) - 1);
  return <div>
      <TrendLegend />
      <div className="cp-dashboard-charts-27">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{
          top: 8,
          right: 12,
          left: -20,
          bottom: 0
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
            <XAxis dataKey="day" tick={{
            fontSize: 11,
            fill: COLORS.faint
          }} axisLine={false} tickLine={false} interval={tickInterval} />
            <YAxis allowDecimals={false} tick={{
            fontSize: 11,
            fill: COLORS.faint
          }} axisLine={false} tickLine={false} />
            <Tooltip content={<TrendTooltip />} />
            <Line type="monotone" dataKey="inProgress" name="In Progress" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{
            r: 4
          }} />
            <Line type="monotone" dataKey="completed" name="Completed" stroke="#22C55E" strokeWidth={2.5} dot={false} activeDot={{
            r: 4
          }} />
            <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#EF4444" strokeWidth={2.5} dot={false} activeDot={{
            r: 4
          }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>;
};
export const BannerCityscape = ({
  width = 230,
  height = 110
}) => {
  // Each building: x position, width, height (drawn bottom-anchored), fill.
  const buildings = [{
    x: 0,
    w: 22,
    h: 46,
    fill: '#4C4A82'
  }, {
    x: 20,
    w: 16,
    h: 62,
    fill: '#6462A8'
  }, {
    x: 34,
    w: 26,
    h: 84,
    fill: '#8482C4',
    windows: true
  }, {
    x: 58,
    w: 18,
    h: 58,
    fill: '#4C4A82'
  }, {
    x: 74,
    w: 30,
    h: 96,
    fill: '#9694D6',
    windows: true
  }, {
    x: 102,
    w: 20,
    h: 70,
    fill: '#6462A8'
  }, {
    x: 120,
    w: 24,
    h: 88,
    fill: '#8482C4',
    windows: true
  }, {
    x: 142,
    w: 16,
    h: 54,
    fill: '#4C4A82'
  }, {
    x: 156,
    w: 22,
    h: 74,
    fill: '#9694D6',
    windows: true
  }, {
    x: 176,
    w: 18,
    h: 50,
    fill: '#6462A8'
  }, {
    x: 192,
    w: 20,
    h: 66,
    fill: '#4C4A82'
  }];
  const windowRows = (bx, bw, bh, by) => {
    const cols = Math.max(2, Math.floor((bw - 6) / 7));
    const rows = Math.max(2, Math.floor((bh - 10) / 10));
    const cells = [];
    let seed = bx * 7 + bh;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.42) {
          cells.push(<rect key={`${bx}-${r}-${c}`} x={bx + 4 + c * 7} y={by + 6 + r * 10} width={3.2} height={4.5} rx={0.6} fill="#FDE68A" opacity={0.55 + rand() * 0.45} />);
        }
      }
    }
    return cells;
  };
  const baseline = height - 4;
  return <svg width={width} height={height} viewBox="0 0 230 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stars */}
      {[[14, 10], [50, 6], [96, 4], [150, 8], [206, 12], [180, 22], [30, 20]].map(([sx, sy], i) => <circle key={i} cx={sx} cy={sy} r={i % 3 === 0 ? 1.1 : 0.7} fill="#C7D2FE" opacity={0.8} />)}
 
      {/* Buildings */}
      {buildings.map((b, i) => {
      const by = baseline - b.h;
      return <g key={i}>
            <rect x={b.x} y={by} width={b.w} height={b.h} rx={1.5} fill={b.fill} />
            {b.windows && windowRows(b.x, b.w, b.h, by)}
          </g>;
    })}
 
      {/* Ground line */}
      <rect x={0} y={baseline} width={230} height={4} fill="#2A2954" />
 
      {/* Trees */}
      {[[10, 0.9], [66, 0.7], [166, 0.8]].map(([tx, scale], i) => <g key={i} transform={`translate(${tx},${baseline}) scale(${scale})`}>
          <rect x={-1.5} y={-10} width={3} height={10} fill="#1F2937" />
          <circle cx={0} cy={-16} r={7} fill="#0F766E" />
          <circle cx={-4} cy={-12} r={5} fill="#0F766E" />
          <circle cx={4} cy={-12} r={5} fill="#0F766E" />
        </g>)}
 
      {/* Bird */}
      <path d="M198 30 q3 -3 6 0 q3 -3 6 0" stroke="#A5B4FC" strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </svg>;
};

// Friendly technician mascot — orange cap + uniform, tablet in hand, framed
// chest-up (matches the reference "Need a service?" banner illustration).
// Used at TechnicianAvatar size={52} in that CTA banner.
// Friendly technician mascot — full standing figure: orange cap, orange
// shirt with a darker-orange bib-overalls front panel and shoulder straps,
// both hands holding a clipboard centered at the waist. Matches the
// reference "Need a service?" banner illustration (head-to-thigh, not a
// chest-up bust). Aspect isn't square (the art is taller than wide), so the
// rendered height is derived from `size` to keep proportions correct rather
// than squashing the figure into a literal size×size box.
export const TechnicianAvatar = ({
  size = 52
}) => {
  const w = size;
  const h = size * (104 / 90);
  return <svg width={w} height={h} viewBox="0 0 90 104" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Legs / lower overalls, cropped at bottom of frame */}
      <path d="M27 104 L28 78 L62 78 L63 104 Z" fill="#C2410C" />
      <rect x="43" y="78" width="4" height="26" fill="#A93A0E" opacity={0.5} />
 
      {/* Bib overalls front panel + shoulder straps + rivets */}
      <path d="M33 60 L33 90 L57 90 L57 60 Q45 56 33 60 Z" fill="#C2410C" />
      <path d="M36 60 L33 42 L38 42 L40 60 Z" fill="#C2410C" />
      <path d="M54 60 L57 42 L52 42 L50 60 Z" fill="#C2410C" />
      <circle cx="35.5" cy="43" r="1.6" fill="#FDE68A" />
      <circle cx="54.5" cy="43" r="1.6" fill="#FDE68A" />
      <circle cx="38" cy="64" r="1.6" fill="#FDE68A" />
      <circle cx="52" cy="64" r="1.6" fill="#FDE68A" />
 
      {/* Shirt / torso with V-neck */}
      <path d="M22 90 L24 62 Q26 46 40 43 L50 43 Q64 46 66 62 L68 90 Z" fill="#EA580C" />
      <path d="M38 43 L45 52 L52 43" fill="#FFF7ED" />
 
      {/* Far arm, resting slightly back */}
      <path d="M60 45 Q73 50 74 66 Q74 71 70 71 Q67 71 67 67 L67 60 Q66 53 57 47 Z" fill="#EA580C" />
 
      {/* Near arm bent forward, gripping the clipboard */}
      <path d="M30 47 Q17 52 16 66 L16 74 Q16 78 20 78 L24 78 Q27 78 27 74 L27 64 Q28 55 39 48 Z" fill="#EA580C" />
      <circle cx="21" cy="75" r="4.6" fill="#F4A984" />
 
      {/* Other hand also gripping the clipboard from the right */}
      <circle cx="55" cy="76" r="4.4" fill="#F4A984" />
      <path d="M50 48 Q60 53 58 66 L58 72 Q58 76 54 76 L51 76 Q49 76 49 73 L49 64 Q49 55 42 49 Z" fill="#EA580C" />
 
      {/* Clipboard — cream board, amber edge, grey ruled lines, grey clip */}
      <rect x="27" y="63" width="20" height="26" rx="2" fill="#FDF6EC" stroke="#D97706" strokeWidth={1.1} />
      <rect x="32" y="60" width="10" height="4.2" rx="1.4" fill="#9CA3AF" />
      <rect x="30" y="70" width="14" height="1.7" rx="0.5" fill="#D6D3D1" />
      <rect x="30" y="75" width="14" height="1.7" rx="0.5" fill="#D6D3D1" />
      <rect x="30" y="80" width="9" height="1.7" rx="0.5" fill="#D6D3D1" />
 
      {/* Neck */}
      <rect x="39" y="36" width="12" height="9" fill="#E19478" />
 
      {/* Head */}
      <circle cx="45" cy="21" r="15.5" fill="#F4A984" />
      <circle cx="29.5" cy="22" r="2.9" fill="#F4A984" />
      <circle cx="60.5" cy="22" r="2.9" fill="#F4A984" />
 
      {/* Eyes */}
      <circle cx="38.5" cy="18" r="1.6" fill="#1F2937" />
      <circle cx="51.5" cy="18" r="1.6" fill="#1F2937" />
 
      {/* Mustache + smile */}
      <path d="M35 27 Q40 30.2 45 27.3 Q50 30.2 55 27 Q50 24.6 45 26 Q40 24.6 35 27 Z" fill="#4B3621" />
      <path d="M39 30.3 Q45 33.5 51 30.3" stroke="#B45309" strokeWidth={1.4} fill="none" strokeLinecap="round" />
 
      {/* Cap */}
      <path d="M26 13 Q26 -3 45 -3 Q64 -3 64 13 L64 16 L26 16 Z" fill="#EA580C" />
      <path d="M23 16 L67 16 Q68.5 16 68.5 18 Q68.5 20 67 20 L23 20 Q21.5 20 21.5 18 Q21.5 16 23 16 Z" fill="#C2410C" />
      <circle cx="45" cy="3" r="2.1" fill="#FDF6EC" />
      <path d="M37 0 Q45 -3 53 0" stroke="#C2410C" strokeWidth={1.3} fill="none" opacity={0.6} />
    </svg>;
};
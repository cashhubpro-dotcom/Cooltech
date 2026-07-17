// ─── SVG Charts ──────────────────────────────────────────────────────────────
import { COLORS, FONTS } from '../../constants/tokens';

// Small shared empty-state — used by all three charts below so a fetch that
// hasn't resolved yet (or genuinely has no data) renders a message instead
// of crashing on array-index math that assumes at least one data point.
const ChartEmptyState = ({
  height,
  label = 'No data yet'
}) => <div style={{
  height
}} className="ap-charts-1">
    {label}
  </div>;

// ─── Revenue Overview: area/line chart with grid + peak tooltip ──────────────
export const RevenueChart = ({
  data,
  color = '#16A34A',
  height = 190
}) => {
  // Guard: with no points, `pts` below is empty and pts[pts.length - 1].x
  // (used to close the area path) throws on undefined. This is exactly
  // what happens for a moment on every mount that fetches data async —
  // not just a "bad data" edge case.
  if (!data || data.length === 0) {
    return <ChartEmptyState height={height} label="No revenue data yet" />;
  }
  const W = 400,
    H = height;
  const padL = 34,
    padR = 12,
    padT = 30,
    padB = 24;
  const iw = W - padL - padR,
    ih = H - padT - padB;
  const max = Math.max(...data.map(d => d.v)) * 1.15 || 1;
  const stepX = data.length > 1 ? iw / (data.length - 1) : iw;
  const pts = data.map((d, i) => ({
    ...d,
    x: padL + i * stepX,
    y: padT + ih - d.v / max * ih
  }));
  const peak = pts.reduce((a, b) => b.v > a.v ? b : a, pts[0]);
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padT + ih} L ${pts[0].x} ${padT + ih} Z`;
  const gridSteps = 4;
  const gridId = 'revFill';
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="ap-charts-2">
      <defs>
        <linearGradient id={gridId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal grid + y-axis labels */}
      {Array.from({
      length: gridSteps + 1
    }).map((_, i) => {
      const val = max / gridSteps * (gridSteps - i);
      const y = padT + ih / gridSteps * i;
      return <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={COLORS.border} strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={8} fill={COLORS.faint} fontFamily={FONTS.sans}>
              {val >= 1000 ? `₹${Math.round(val / 1000)}K` : Math.round(val)}
            </text>
          </g>;
    })}

      {/* area fill + line */}
      <path d={areaPath} fill={`url(#${gridId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* point markers */}
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p === peak ? 4 : 2.5} fill="#fff" stroke={color} strokeWidth={p === peak ? 2.5 : 1.75} />)}

      {/* floating peak tooltip */}
      <g transform={`translate(${Math.min(Math.max(peak.x, padL + 30), W - padR - 30)},${Math.max(padT - 4, peak.y - 30)})`}>
        <rect x={-28} y={-20} width={56} height={26} rx={7} fill={COLORS.h1} />
        <polygon points="-4,6 4,6 0,12" fill={COLORS.h1} />
        <text x={0} y={-8} textAnchor="middle" fontSize={9} fontWeight="800" fill="#fff" fontFamily={FONTS.sans}>
          {peak.v >= 1000 ? `₹${(peak.v / 1000).toFixed(1)}K` : `₹${peak.v}`}
        </text>
        <text x={0} y={2} textAnchor="middle" fontSize={7.5} fill="#D1D5DB" fontFamily={FONTS.sans}>
          {peak.m}
        </text>
      </g>

      {/* x-axis labels */}
      {pts.map((p, i) => <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize={9} fill={COLORS.faint} fontFamily={FONTS.sans}>
          {p.m}
        </text>)}
    </svg>;
};

// ─── Generic vertical bar chart with grid lines (Jobs by Category, etc.) ─────
export const BarChart = ({
  data,
  color = '#3B82F6',
  height = 160
}) => {
  // Same guard as RevenueChart — `gap = iw / data.length` is Infinity/NaN
  // on an empty array, and every bar position downstream inherits that.
  if (!data || data.length === 0) {
    return <ChartEmptyState height={height} label="No data yet" />;
  }
  const W = 400,
    H = height;
  const padL = 24,
    padR = 10,
    padT = 20,
    padB = 26;
  const iw = W - padL - padR,
    ih = H - padT - padB;
  const rawMax = Math.max(...data.map(d => d.value), 1);
  const gridSteps = 4;
  const niceMax = Math.ceil(rawMax / gridSteps) * gridSteps || gridSteps;
  const gap = iw / data.length;
  const bw = gap * 0.5;
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="ap-charts-3">
      {Array.from({
      length: gridSteps + 1
    }).map((_, i) => {
      const val = niceMax / gridSteps * i;
      const y = padT + ih - val / niceMax * ih;
      return <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={COLORS.border} strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={8} fill={COLORS.faint} fontFamily={FONTS.sans}>{val}</text>
          </g>;
    })}
      {data.map((d, i) => {
      const bh = d.value / niceMax * ih;
      const x = padL + i * gap + (gap - bw) / 2;
      const y = padT + ih - bh;
      return <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(2, bh)} rx={4} fill={color} />
            <text x={x + bw / 2} y={y - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill={COLORS.h2} fontFamily={FONTS.sans}>
              {d.value}
            </text>
            <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={8} fill={COLORS.faint} fontFamily={FONTS.sans}>
              {d.label}
            </text>
          </g>;
    })}
    </svg>;
};

// ─── Donut (status/category ring chart) ───────────────────────────────────────
export const Donut = ({
  data,
  size = 120,
  centerLabel,
  centerSub
}) => {
  const cx = size / 2,
    cy = size / 2,
    r = size / 2 - 15;

  // Guard: `tot` is the sum of pct across all segments. With no data, tot
  // is 0 and every arc's `pct/tot` becomes NaN — the ring silently renders
  // broken/invisible arcs instead of throwing, which is easy to miss in
  // testing but still wrong. Render an empty ring + center label instead.
  const tot = data.reduce((s, d) => s + d.pct, 0);
  if (!data || data.length === 0 || tot === 0) {
    const label = centerLabel !== undefined ? centerLabel : 0;
    const sub = centerSub !== undefined ? centerSub : 'this month';
    return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ap-charts-4">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.border} strokeWidth={15} />
        <text x={cx} y={cy - 3} textAnchor="middle" fill={COLORS.h1} fontSize={20} fontWeight="800" fontFamily={FONTS.sans}>{label}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.muted} fontSize={9} fontFamily={FONTS.sans}>{sub}</text>
      </svg>;
  }
  let c = 0;
  const summedCount = data.reduce((s, d) => s + (d.count || 0), 0);
  const label = centerLabel !== undefined ? centerLabel : summedCount || 110;
  const sub = centerSub !== undefined ? centerSub : 'this month';
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ap-charts-5">
      {data.map((d, i) => {
      const s1 = (c / tot * 360 - 90) * Math.PI / 180,
        e = c += d.pct,
        s2 = (e / tot * 360 - 90) * Math.PI / 180;
      const x1 = cx + r * Math.cos(s1 + .04),
        y1 = cy + r * Math.sin(s1 + .04),
        x2 = cx + r * Math.cos(s2 - .04),
        y2 = cy + r * Math.sin(s2 - .04);
      return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${d.pct / tot > .5 ? 1 : 0} 1 ${x2} ${y2}`} fill="none" stroke={d.color} strokeWidth={15} strokeLinecap="round" />;
    })}
      <text x={cx} y={cy - 3} textAnchor="middle" fill={COLORS.h1} fontSize={20} fontWeight="800" fontFamily={FONTS.sans}>{label}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={COLORS.muted} fontSize={9} fontFamily={FONTS.sans}>{sub}</text>
    </svg>;
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: DASHBOARD  (upgraded)
══════════════════════════════════════════════════════════════════════════ */
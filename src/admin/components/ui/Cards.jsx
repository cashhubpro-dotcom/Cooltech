import { COLORS } from '../../constants/tokens';

// ─── KCard ────────────────────────────────────────────────────────────────────
// KPI stat card — used in the responsive kpi-grid-N grids.
export const KCard = ({
  label,
  value,
  sub,
  icon,
  color,
  iconBg,
  delay = ''
}) => <div className={`stat-card animate-fade-up${delay}`}>
    <div className="stat-card-header">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-icon" style={{
      background: iconBg
    }}>{icon}</div>
    </div>
    <div className="stat-card-value" style={{
    color
  }}>{value}</div>
    {sub && <div className="stat-card-sub">{sub}</div>}
  </div>;

// ─── SectionHdr ───────────────────────────────────────────────────────────────
// Responsive page header with optional CTA button.
export const SectionHdr = ({
  title,
  sub,
  action,
  onAction
}) => <div className="section-hdr">
    <div>
      <div className="section-title">{title}</div>
      {sub && <div className="section-sub">{sub}</div>}
    </div>
    {action && <div className="section-actions">
        <button className="btn btn-primary" onClick={onAction}>{action}</button>
      </div>}
  </div>;

// ─── BackBtn ──────────────────────────────────────────────────────────────────
export const BackBtn = ({
  onClick
}) => <button className="back-btn" onClick={onClick}>←</button>;

// ─── Thead ────────────────────────────────────────────────────────────────────
// Renders a <thead> row from an array of column name strings.
export const Thead = ({
  cols
}) => <thead>
    <tr>
      {cols.map((col, i) => <th key={i} className="ap-cards-1">
          {col}
        </th>)}
    </tr>
  </thead>;

// Generic card wrapper — used wherever children need a card container.
export const Panel = ({
  children,
  style = {}
}) => <div style={{
  ...style
}} className="ap-cards-2">
    {children}
  </div>;
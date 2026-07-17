import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
const getPortalTarget = () => document.getElementById('client-portal-root') || document.body;

// ─── SBadge ───────────────────────────────────────────────────────────────────
export const SBadge = ({
  s,
  map
}) => {
  const m = map?.[s] || {
    label: s,
    bg: '#F3F4F6',
    color: '#374151'
  };
  return <span className="badge" style={{
    background: m.bg,
    color: m.color
  }}>
      {m.dot && <span className="badge-dot" style={{
      background: m.dot
    }} />}
      {m.label}
    </span>;
};

// ─── TypeTag ──────────────────────────────────────────────────────────────────
export const TypeTag = ({
  type
}) => {
  const palette = {
    Service: "var(--info)",
    Repair: "var(--danger)",
    Installation: "var(--success)",
    'AMC Visit': "var(--purple)",
    AMC: "var(--purple)"
  };
  const c = palette[type] || '#64748B';
  return <span style={{
    background: `${c}15`,
    color: c
  }} className="cp-components-1">
      {type}
    </span>;
};

// ─── PBadge ───────────────────────────────────────────────────────────────────
export const PBadge = ({
  p
}) => {
  const m = {
    critical: {
      label: 'Critical',
      bg: '#FEF2F2',
      color: '#991B1B'
    },
    high: {
      label: 'High',
      bg: '#FEF2F2',
      color: '#DC2626'
    },
    normal: {
      label: 'Normal',
      bg: '#F0F9FF',
      color: '#0369A1'
    },
    low: {
      label: 'Low',
      bg: '#F8FAFC',
      color: '#64748B'
    }
  }[p] || {
    label: p,
    bg: '#F3F4F6',
    color: '#374151'
  };
  return <span className="badge" style={{
    background: m.bg,
    color: m.color
  }}>{m.label}</span>;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
export const Avatar = ({
  name = '',
  size = 36,
  color = COLORS.brand
}) => <div style={{
  width: size,
  height: size,
  borderRadius: size / 3,
  background: `${color}18`,
  border: `1.5px solid ${color}30`,
  fontSize: size * 0.33,
  color
}} className="cp-components-2">
    {name.split(' ').map(x => x[0]).join('').slice(0, 2)}
  </div>;

// ─── Toast ────────────────────────────────────────────────────────────────────
// export const Toast = ({ msg, onClose }) => {
//   return (
//     <div className="toast">
//       <span>✅</span>
//       <span>{msg}</span>
//       <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', marginLeft: 8 }}>✕</button>
//     </div>
//   );
// };

export const Toast = ({
  msg,
  onClose
}) => {
  return createPortal(<div className="toast">
      <span>✅</span><span>{msg}</span>
      <button onClick={onClose} className="cp-components-3">✕</button>
    </div>, getPortalTarget() // Toast wasn't portaled before at all — this also fixes it being clipped/misplaced
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer
}) => {
  if (!open) return null;
  return createPortal(<div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
  // document.body
  getPortalTarget());
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({
  icon,
  title,
  sub
}) => <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-title">{title}</div>
    <div className="empty-state-sub">{sub}</div>
  </div>;

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({
  value,
  max,
  color = COLORS.brand
}) => <div className="progress-bar">
    <div className="progress-fill" style={{
    width: `${Math.min(100, value / max * 100)}%`,
    background: color
  }} />
  </div>;

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export const InfoRow = ({
  label,
  value
}) => <div className="cp-components-4">
    <span className="cp-components-5">{label}</span>
    <span className="cp-components-6">{value}</span>
  </div>;
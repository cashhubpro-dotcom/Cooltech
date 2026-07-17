import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/token';

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
    'Service': "var(--info)",
    'Repair': "var(--danger)",
    'Installation': "var(--success)",
    'AMC Visit': "var(--purple)",
    'Break': "var(--faint)"
  };
  const c = palette[type] || '#64748B';
  return <span style={{
    background: `${c}18`,
    color: c
  }} className="tp-components-1">
      {type}
    </span>;
};

// ─── PBadge (priority) ────────────────────────────────────────────────────────
export const PBadge = ({
  p
}) => {
  const m = {
    urgent: {
      label: 'Urgent',
      bg: '#F5F3FF',
      color: '#6D28D9'
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
}} className="tp-components-2">
    {name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}
  </div>;

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
    </div>, document.getElementById('tech-portal-root') || document.body);
};

// ─── Toast ────────────────────────────────────────────────────────────────────
export const Toast = ({
  msg,
  icon = '✅',
  onClose
}) => <div className="toast">
    <span>{icon}</span>
    <span>{msg}</span>
    <button onClick={onClose} className="tp-components-3">✕</button>
  </div>;

// ─── InfoRow ──────────────────────────────────────────────────────────────────
export const InfoRow = ({
  label,
  value,
  mono
}) => <div className="tp-components-4">
    <span className="tp-components-5">{label}</span>
    <span style={{
    fontFamily: mono ? FONTS.mono : undefined
  }} className="tp-components-6">{value}</span>
  </div>;

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({
  value,
  max,
  color = COLORS.brand
}) => <div className="progress-bar">
    <div className="progress-fill" style={{
    width: `${Math.min(100, value / (max || 1) * 100)}%`,
    background: color
  }} />
  </div>;

// ─── SectionHdr ───────────────────────────────────────────────────────────────
export const SectionHdr = ({
  title,
  sub,
  action,
  onAction
}) => <div className="sec-hdr">
    <div>
      <div className="sec-title">{title}</div>
      {sub && <div className="sec-sub">{sub}</div>}
    </div>
    {action && <button className="btn btn-primary" onClick={onAction}>{action}</button>}
  </div>;

// ─── EmptyState ───────────────────────────────────────────────────────────────
export const EmptyState = ({
  icon,
  title,
  sub
}) => <div className="tp-components-7">
    <div className="tp-components-8">{icon}</div>
    <div className="tp-components-9">{title}</div>
    <div className="tp-components-10">{sub}</div>
  </div>;

// ─── StripCard (colored left-border job card) ─────────────────────────────────
export const StripCard = ({
  color = COLORS.brand,
  children,
  onClick,
  style = {}
}) => <div onClick={onClick} style={{
  borderLeft: `4px solid ${color}`,
  cursor: onClick ? "pointer" : "default",
  ...style
}} onMouseEnter={e => {
  if (onClick) {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,.09)';
  }
}} onMouseLeave={e => {
  e.currentTarget.style.transform = '';
  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.05)';
}} className="tp-components-11">
    {children}
  </div>;
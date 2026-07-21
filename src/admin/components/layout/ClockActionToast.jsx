import { useEffect, useRef, useState } from 'react';

const AUTO_CLOSE_MS = 3200;

// action: 'in' | 'break' | 'out'
const ACTION_META = {
  in: {
    label: 'Clocked In',
    verb: 'has clocked in',
    color: '#16A34A',
    bg: 'var(--success-bg)',
    border: 'var(--success-border)',
    icon: (
      <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  break: {
    label: 'On a Break',
    verb: 'has started a break',
    color: '#D97706',
    bg: 'var(--warning-bg)',
    border: '#FDE68A',
    icon: (
      <>
        <rect x="6" y="5" width="4" height="14" rx="1" fill="#fff" />
        <rect x="14" y="5" width="4" height="14" rx="1" fill="#fff" />
      </>
    )
  },
  out: {
    label: 'Clocked Out',
    verb: 'has clocked out',
    color: '#DC2626',
    bg: 'var(--danger-bg)',
    border: '#FECACA',
    icon: (
      <rect x="6" y="6" width="12" height="12" rx="2" fill="#fff" />
    )
  }
};

const ClockActionToast = ({
  action = 'in',        // 'in' | 'break' | 'out'
  userName = 'Admin',
  time,                 // Date instance — defaults to now
  onClose
}) => {
  const meta = ACTION_META[action] || ACTION_META.in;
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const startRef = useRef(Date.now());
  const stamp = (time || new Date()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / AUTO_CLOSE_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setClosing(true);
        setTimeout(() => onCloseRef.current?.(), 220);
      }
    }, 80);
    return () => clearInterval(id);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onCloseRef.current?.(), 180);
  };

  return (
    <div className="cat-overlay" style={{ opacity: closing ? 0 : mounted ? 1 : 0 }}>
      <div
        className="cat-card"
        style={{
          transform: closing
            ? 'scale(.96) translateY(-6px)'
            : mounted
            ? 'scale(1) translateY(0)'
            : 'scale(.94) translateY(10px)',
          opacity: closing ? 0 : mounted ? 1 : 0
        }}
      >
        <button onClick={handleClose} aria-label="Close" className="cat-close-btn">✕</button>

        <div className="cat-icon-wrap">
          <div
            style={{
              background: `radial-gradient(circle, ${meta.color}30 0%, transparent 70%)`
            }}
            className="cat-icon-glow"
          />
          <div style={{ background: meta.color, boxShadow: `0 8px 24px ${meta.color}55` }} className="cat-icon-circle">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              {meta.icon}
            </svg>
          </div>
        </div>

        <div className="cat-title">{userName} {meta.verb}!</div>
        <div className="cat-subtitle">at {stamp}</div>

        <div style={{ background: meta.bg, borderColor: meta.border }} className="cat-status-pill">
          <span style={{ background: meta.color }} className="cat-status-dot" />
          <span style={{ color: meta.color }} className="cat-status-text">{meta.label}</span>
        </div>

        <div className="cat-progress-track">
          <div style={{ width: `${progress}%`, background: meta.color }} className="cat-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default ClockActionToast;
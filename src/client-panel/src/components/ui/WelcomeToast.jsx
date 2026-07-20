import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtDateDMY } from '../../../../shared/formatDate';
const TOTAL_DURATION = 10000; // 10s
const TICK_MS = 100;

// ── constants ────────────────────────────────────────────────────────────
const BLACK = '#0A0E14';
const GREEN_DARK = '#15803D'; // deeper edge of the gradient
const GREEN_LIGHT = '#22C55E'; // brighter edge of the gradient

function lerpColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = a >> 16 & 255,
    ag = a >> 8 & 255,
    ab = a & 255;
  const br = b >> 16 & 255,
    bg = b >> 8 & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

// ── progress → card background ──────────────────────────────────────────
function cardBackground(pct) {
  if (pct < 50) return BLACK;
  const t = Math.min((pct - 50) / 50, 1); // 50→100 maps to 0→1
  const from = lerpColor(BLACK, GREEN_DARK, t);
  const to = lerpColor(BLACK, GREEN_LIGHT, t);
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}
function useCountUp(target, start) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / 1100, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [target, start]);
  return value;
}
function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return {
    label: 'Good Morning!',
    icon: '☀️'
  };
  if (h < 17) return {
    label: 'Good Afternoon!',
    icon: '🌤️'
  };
  return {
    label: 'Good Evening!',
    icon: '🌙'
  };
}

// ── StatCard ───────────────────────────────────────────────────────────────
// Accepts a generic { icon, label, value, loading } shape. `value` can be a
// number (animated with count-up) or a pre-formatted string (e.g. "₹2.03L") —
// strings are rendered as-is, no animation.
const StatCard = ({
  icon,
  label,
  value,
  start,
  isGreen,
  loading
}) => {
  const isNumeric = typeof value === 'number';
  const animated = useCountUp(isNumeric ? value : 0, start && isNumeric);
  return <div style={{
    background: isGreen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
    borderColor: isGreen ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"
  }} className="cp-welcome-toast-1">
      <div className="cp-welcome-toast-2">{icon}</div>
      <div style={{
      color: isGreen ? "var(--success-border)" : "var(--text-faint)"
    }} className="cp-welcome-toast-3">{label}</div>
      <div className="cp-welcome-toast-4">
        {loading ? '—' : isNumeric ? animated : value}
      </div>
    </div>;
};

// ── WelcomeToast ─────────────────────────────────────────────────────────
// `stats`: array of up to 4 { icon, label, value } entries, supplied by the
// panel that renders this component. If omitted/empty, the stats grid is
// skipped entirely rather than showing stale hardcoded numbers.
// `statsLoading`: true while the panel is still fetching real numbers —
// shows a "—" placeholder in each card instead of 0, so it doesn't look like
// the account genuinely has zero jobs/tickets/etc. while data is in flight.
const WelcomeToast = ({
  name = 'Admin',
  panelLabel = 'CoolTech AC Services Platform',
  stats = [],
  statsLoading = false,
  onClose
}) => {
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const startRef = useRef(Date.now());
  const now = useMemo(() => new Date(), []);
  const {
    label: greetingLabel,
    icon: greetingIcon
  } = greetingFor(now);
  const dateLabel =fmtDateDMY(now);
  const particles = useMemo(() => {
    const count = 7;
    return Array.from({
      length: count
    }, (_, i) => {
      const angle = i / count * Math.PI * 2 + Math.random() * 0.4;
      const radius = 46 + Math.random() * 14;
      return {
        id: i,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        size: 3 + Math.random() * 3,
        delay: Math.random() * 1.6,
        duration: 2.2 + Math.random() * 1.6
      };
    });
  }, []);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / TOTAL_DURATION * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        setClosing(true);
        setTimeout(() => onCloseRef.current?.(), 250);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onCloseRef.current?.(), 200);
  };
  const cardColor = cardBackground(progress);
  const isGreenPhase = progress >= 50;
  const secondsLeft = Math.max(0, Math.ceil((100 - progress) / 100 * (TOTAL_DURATION / 1000)));
  return <div style={{
    opacity: closing ? 0 : mounted ? 1 : 0
  }} className="cp-welcome-toast-5">
      <div style={{
      background: cardColor,
      transform: closing ? 'scale(.97) translateY(-6px)' : mounted ? 'scale(1) translateY(0)' : 'scale(.94) translateY(10px)',
      opacity: closing ? 0 : mounted ? 1 : 0
    }} className="cp-welcome-toast-6">
        <button onClick={handleClose} aria-label="Close" className="cp-welcome-toast-7">✕</button>

        <div className="cp-welcome-toast-8">
          <div style={{
          background: `radial-gradient(circle,
  ${isGreenPhase ? GREEN_LIGHT : '#334155'}30 0%,
  transparent 70%)`
        }} className="cp-welcome-toast-9" />
          <svg viewBox="0 0 100 100" className="cp-welcome-toast-10">
            {particles.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={isGreenPhase ? GREEN_LIGHT : '#475569'} style={{
            animation: `wt-twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`
          }} className="cp-welcome-toast-11" />)}
          </svg>
          <div style={{
          background: isGreenPhase ? "var(--success)" : "var(--text-h2)",
          boxShadow: isGreenPhase ? "0 8px 28px var(--success-overlay-strong), 0 0 0 6px var(--success-overlay-soft)" : "0 8px 24px rgba(0,0,0,.4)"
        }} className="cp-welcome-toast-12">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="cp-welcome-toast-13">Welcome Back, {name}!</div>
        <div className="cp-welcome-toast-14">{panelLabel}</div>

        {stats.length > 0 && <div className="cp-welcome-toast-15">
            {stats.slice(0, 4).map((s, i) => <StatCard key={s.label ?? i} icon={s.icon} label={s.label} value={s.value} start={mounted} isGreen={isGreenPhase} loading={statsLoading} />)}
          </div>}

        <div style={{
        background: isGreenPhase ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        borderColor: isGreenPhase ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"
      }} className="cp-welcome-toast-16">
          <div className="cp-welcome-toast-17">
            <span className="cp-welcome-toast-18">{greetingIcon}</span>
            <span className="cp-welcome-toast-19">{greetingLabel}</span>
          </div>
          <div style={{
          color: isGreenPhase ? "var(--success-border)" : "var(--text-faint)"
        }} className="cp-welcome-toast-20">
            {dateLabel}
          </div>
          <div style={{
          color: isGreenPhase ? "var(--success-bg)" : "var(--disabled)"
        }} className="cp-welcome-toast-21">
            Everything looks good.<br />
            Have a productive and successful day ahead! 🚀
          </div>
        </div>

        <div className="cp-welcome-toast-22">
          <span style={{
          color: isGreenPhase ? "var(--success-border)" : "var(--text-muted)"
        }} className="cp-welcome-toast-23">
            Loading your dashboard…
          </span>
          <span style={{
          color: isGreenPhase ? "var(--success-border)" : "var(--text-muted)"
        }} className="cp-welcome-toast-24">
            {secondsLeft}s
          </span>
        </div>
        <div className="cp-welcome-toast-25">
          <div style={{
          width: `${progress}%`,
          background: isGreenPhase ? "var(--success)" : "var(--text-body)"
        }} className="cp-welcome-toast-26" />
        </div>
      </div>

      <style>{`
        @keyframes wt-twinkle {
          0%, 100% { opacity: .35; transform: scale(1); }
          50%      { opacity: .9;  transform: scale(1.4); }
        }
      `}</style>
    </div>;
};
const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100000,
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity .25s ease',
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  },
  card: {
    position: 'relative',
    width: 460,
    maxWidth: 'calc(100vw - 32px)',
    borderRadius: 20,
    padding: '36px 28px 26px',
    boxShadow: '0 24px 60px rgba(0,0,0,.5)',
    transition: 'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s ease, background-color .4s linear',
    textAlign: 'center'
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    cursor: 'pointer',
    lineHeight: 1
  },
  iconWrap: {
    position: 'relative',
    width: 100,
    height: 100,
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconGlow: {
    position: 'absolute',
    inset: -30,
    borderRadius: '50%'
  },
  particleLayer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'visible'
  },
  iconCircle: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--white)"
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    marginBottom: 22
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    marginBottom: 18
  },
  statCard: {
    borderRadius: 12,
    padding: '12px 6px',
    border: '1px solid',
    transition: 'background-color .4s ease, border-color .4s ease'
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: 600,
    marginBottom: 4,
    transition: 'color .4s ease'
  },
  statValue: {
    fontSize: 15,
    fontWeight: 800
  },
  greetingBox: {
    borderRadius: 14,
    padding: '16px 18px',
    marginBottom: 20,
    position: 'relative',
    border: '1px solid',
    transition: 'background-color .4s ease, border-color .4s ease'
  },
  greetingHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  greetingLabel: {
    fontSize: 14,
    fontWeight: 700
  },
  greetingDate: {
    fontSize: 11.5,
    marginTop: 2,
    transition: 'color .4s ease'
  },
  greetingMsg: {
    fontSize: 12,
    marginTop: 10,
    lineHeight: 1.5,
    transition: 'color .4s ease'
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  progressLabel: {
    fontSize: 10.5,
    fontWeight: 600,
    transition: 'color .4s ease'
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden'
  }
};
export default WelcomeToast;
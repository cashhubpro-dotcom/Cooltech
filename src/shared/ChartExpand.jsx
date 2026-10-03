// src/shared/ChartExpand.jsx
// ─────────────────────────────────────────────────────────────────────────────
// One reusable "expand / zoom" control for dashboard charts. Used by the admin,
// client and technician panels so they all behave the same.
//
// Usage — drop it in a card header and pass the BIG version of the chart:
//
//   <ChartExpand title="Revenue Overview">
//     <MyChart data={data} height={420} />
//   </ChartExpand>
//
// It renders a small ⤢ button. Clicking it opens a large overlay (portal to
// <body>) showing `children`. Close with ✕, the Close button, a click on the
// dark backdrop, or the Esc key.
//
// Only CSS variables are used for colours, so it follows light/dark theme.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ChartExpand = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  // Esc closes; page behind doesn't scroll while the overlay is open.
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Expand chart"
        aria-label={`Expand ${title || 'chart'}`}
        style={{
          width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, lineHeight: 1, cursor: 'pointer', flexShrink: 0,
          color: 'var(--text-muted, var(--muted, #64748b))', background: 'var(--bg, #f8fafc)',
          border: '1px solid var(--border, #e5e7eb)', borderRadius: 6,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--brand, #ea580c)'; e.currentTarget.style.borderColor = 'var(--brand, #ea580c)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted, var(--muted, #64748b))'; e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)'; }}
      >
        ⤢
      </button>

      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--white, #ffffff)', color: 'var(--text-body, var(--body, #374151))',
              width: 'min(1000px, 100%)', maxHeight: '92vh', overflow: 'auto',
              borderRadius: 16, padding: '18px 22px', boxShadow: '0 20px 60px rgba(0,0,0,.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-h1, var(--h1, #0f172a))' }}>{title}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  width: 30, height: 30, fontSize: 18, lineHeight: 1, cursor: 'pointer',
                  color: 'var(--text-muted, var(--muted, #64748b))', background: 'var(--bg, #f8fafc)',
                  border: '1px solid var(--border, #e5e7eb)', borderRadius: 8,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ width: '100%' }}>{children}</div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChartExpand;
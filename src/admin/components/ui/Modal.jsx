import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS } from '../../constants/tokens';

// ─── Modal ────────────────────────────────────────────────────────────────────
// Base overlay dialog. Closes on Escape key or backdrop click.
// Rendered via a portal straight to document.body so the fixed-position overlay
// always covers the full viewport, even when this component is mounted deep
// inside a scrollable ancestor (e.g. .page-content) which would otherwise clip it.
const Modal = ({
  open,
  onClose,
  title,
  children,
  width = 520
}) => {
  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(<div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{
      maxWidth: width
    }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>, document.body);
};
export default Modal;
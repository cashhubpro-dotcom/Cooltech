import { useEffect } from 'react';

// ─── Toast ────────────────────────────────────────────────────────────────────
// Auto-dismisses after 2.6 s.
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast">
      <span className="toast-check">✓</span>
      {msg}
    </div>
  );
};

export default Toast;

  import { COLORS } from '../../constants/tokens';

  // ─── FRow ─────────────────────────────────────────────────────────────────────
  export const FRow = ({ label, children }) => (
    <div className="form-row">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );

  // ─── FInput ───────────────────────────────────────────────────────────────────
  export const FInput = ({ placeholder, defaultValue, type = 'text', value, onChange, ...rest }) => {
    // Controlled vs uncontrolled — never pass both value and defaultValue
    const props = value !== undefined
      ? { value, onChange }
      : { defaultValue };

    return (
      <input
        type={type}
        placeholder={placeholder}
        className="form-input"
        {...props}
        {...rest}
      />
    );
  };

  // ─── FSelect ──────────────────────────────────────────────────────────────────
  export const FSelect = ({ children, defaultValue, value, onChange, ...rest }) => {
    // Controlled vs uncontrolled — never pass both
    const props = value !== undefined
      ? { value, onChange: onChange || (() => {}) }
      : { defaultValue };

    return (
      <select
        className="form-select"
        {...props}
        {...rest}
      >
        {children}
      </select>
    );
  };

  // ─── FTextarea ────────────────────────────────────────────────────────────────
  export const FTextarea = ({ placeholder, defaultValue, value, onChange, rows = 3, ...rest }) => {
    const props = value !== undefined
      ? { value, onChange: onChange || (() => {}) }
      : { defaultValue };

    return (
      <textarea
        placeholder={placeholder}
        rows={rows}
        className="form-textarea"
        {...props}
        {...rest}
      />
    );
  };

  // ─── FBtn ─────────────────────────────────────────────────────────────────────
  export const FBtn = ({ children, color = COLORS.brand, onClick, secondary = false }) => (
    <button
      className="btn"
      onClick={onClick}
      style={
        secondary
          ? {
              padding: '10px 22px', borderRadius: 9,
              background: '#F3F4F6', color: COLORS.muted,
              fontSize: 13, fontWeight: 700, border: 'none',
            }
          : {
              padding: '10px 22px', borderRadius: 9,
              background: `linear-gradient(135deg,${color},${color === COLORS.brand ? COLORS.brandD : color})`,
              color: 'white', fontSize: 13, fontWeight: 700,
              border: 'none', boxShadow: `0 3px 10px ${color}40`,
            }
      }
    >
      {children}
    </button>
  );
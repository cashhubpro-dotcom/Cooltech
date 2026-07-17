// Design Tokens
// Use CSS classes from main.css for STATIC styles.
// Use these constants ONLY for dynamic/conditional values that can't be static classes.
// e.g.  style={{ background: isActive ? COLORS.brand : COLORS.bg }}

export const COLORS = {
  brand: "var(--brand)",
  brandL: "var(--brand-light)",
  brandD: "var(--brand-dark)",
  h1: "var(--text-h1)",
  h2: "var(--text-h2)",
  body: "var(--text-body)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
  border: "var(--border)",
  bg: "var(--bg)",
  white: "var(--white)"
};
export const FONTS = {
  sans: 'Plus Jakarta Sans, sans-serif',
  mono: 'Fira Code, monospace'
};
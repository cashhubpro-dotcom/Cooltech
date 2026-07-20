// Central date formatter used across admin, client-panel and tech-panel.
// Always renders dd/mm/yyyy so the date format is consistent everywhere.

export function fmtDateDMY(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Same as fmtDateDMY but also appends a 24-hour HH:MM time, e.g. 19/07/2026, 17:52
export function fmtDateTimeDMY(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return fallback;
  const datePart = fmtDateDMY(d, fallback);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hh}:${min}`;
}

export default fmtDateDMY;

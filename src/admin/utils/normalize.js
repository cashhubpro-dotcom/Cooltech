// src/admin/utils/normalize.js
// ─────────────────────────────────────────────────────────────────────────────
// MongoDB "populate()" returns nested objects instead of plain strings/IDs.
// e.g. { customer: { _id, name, phone, email, address, tags, ... } }
// React crashes with "Objects are not valid as a React child" when you try
// to render these directly.
//
// Use these helpers to safely extract primitive values from any API response.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely extract a string from a value that might be:
 *   - a plain string: "Sharma Residency"
 *   - a populated Mongoose object: { _id, name, phone, ... }
 *   - null / undefined
 *
 * @param {any}    val       - The raw field value from the API
 * @param {string} nameKey   - Which key to read from the object (default: 'name')
 * @param {string} fallback  - What to return if nothing found
 */
export const safeStr = (val, nameKey = 'name', fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    return String(val[nameKey] ?? val.label ?? val.title ?? val._id ?? fallback);
  }
  return fallback;
};

/**
 * Normalize a raw API reminder record into the flat shape the UI expects.
 * Handles both the mock data shape and the MongoDB-populated shape.
 */
export const normalizeReminder = (r) => ({
  id:          r.id ?? r._id ?? '',
  customer:    safeStr(r.customer, 'name', '—'),
  phone:       typeof r.customer === 'object' && r.customer !== null
                 ? (r.customer.phone ?? r.phone ?? '')
                 : (r.phone ?? ''),
  ac:          r.ac ?? r.unit ?? r.acUnit ?? '—',
  type:        r.type ?? '',
  lastService: r.lastService ?? r.lastServiceDate ?? '—',
  dueDate:     r.dueDate ?? r.due ?? '—',
  sent:        Boolean(r.sent ?? r.smsSent ?? false),
  status:      r.status ?? 'upcoming',
});

/**
 * Normalize a raw API job/invoice/quotation/complaint record.
 * The `customer` field is commonly populated in these.
 */
export const normalizeJob = (j) => ({
  id:          j.id ?? j._id ?? '',
  customer:    safeStr(j.customer, 'name', j.customerName ?? '—'),
  phone:       typeof j.customer === 'object' ? (j.customer?.phone ?? j.phone ?? '') : (j.phone ?? ''),
  address:     typeof j.customer === 'object' ? (j.customer?.address ?? j.address ?? '') : (j.address ?? ''),
  tech:        safeStr(j.tech, 'name', j.techName ?? 'Unassigned'),
  type:        j.type ?? '',
  status:      j.status ?? 'new',
  date:        j.date ?? j.createdAt ?? '',
  time:        j.time ?? '',
  notes:       j.notes ?? '',
  // pass through everything else as-is
  ...j,
  // override the fields we just normalized (don't let spread overwrite them)
  customer:    safeStr(j.customer, 'name', j.customerName ?? '—'),
  tech:        safeStr(j.tech, 'name', j.techName ?? 'Unassigned'),
});

/**
 * Generic normalizer — converts any object field that is itself an object
 * into its `name` string. Use for records with arbitrary populated fields.
 *
 * @param {object}   record     - Raw API record
 * @param {string[]} objectKeys - List of field names that might be populated objects
 */
export const normalizeRecord = (record, objectKeys = []) => {
  const result = { ...record };
  // Always flatten _id to id for consistent key usage
  if (!result.id && result._id) result.id = String(result._id);

  for (const key of objectKeys) {
    if (result[key] !== null && typeof result[key] === 'object') {
      result[key] = safeStr(result[key], 'name');
    }
  }
  return result;
};
// src/admin/utils/mergeOptions.js
// Combines the admin-managed list (Settings → option sets) with values that are
// already used in the data on screen, without duplicates and keeping the managed
// order first. Use it for filters and edit dropdowns:
//
//   const { activeItems: jobTypes } = useJobTypes();
//   const typeOptions = mergeOptions(jobTypes, jobs.map(j => j.type));
//
// Why merge instead of using only the managed list?
//   • a type that was later deactivated/deleted must still be filterable, and
//   • editing an old record must never silently change its value.
export const mergeOptions = (...lists) =>
  [...new Set(lists.flat().filter(v => v !== undefined && v !== null && v !== ''))];
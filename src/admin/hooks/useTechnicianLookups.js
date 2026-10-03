// src/admin/hooks/useTechnicianLookups.js
// Feeds AddTechnicianModal with the options managed on the
// "Technician Lookups" page (/api/technician-lookups).
import { useState, useEffect, useCallback, useMemo } from 'react';
import { technicianLookupsApi } from '../services/api';
import { useDataVersion } from '../../shared/dataSync';

// modal list key  ->  category stored in the DB
const KEY_TO_CATEGORY = {
  roles: 'role',
  departments: 'department',
  employmentTypes: 'employmentType',
  reportingTo: 'reportingTo',
  vehicleTypes: 'vehicleType',
  banks: 'bank',
};

export function useTechnicianLookups() {
  const [grouped, setGrouped] = useState({});

  // Goes up whenever anything writes to /technician-lookups (e.g. the Lookups
  // page), so the modal's dropdowns refresh without a page reload.
  const version = useDataVersion(['technician-lookups']);

  useEffect(() => {
    let cancelled = false;
    technicianLookupsApi
      .list()
      .then(res => { if (!cancelled) setGrouped(res?.grouped || {}); })
      .catch(() => { /* keep whatever we have */ });
    return () => { cancelled = true; };
  }, [version]);

  // { roles: ['Technician'], departments: [...], ... }  — active options only
  const lookups = useMemo(() => {
    const out = {};
    Object.entries(KEY_TO_CATEGORY).forEach(([listKey, category]) => {
      out[listKey] = (grouped[category] || [])
        .filter(i => i.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(i => i.value);
    });
    return out;
  }, [grouped]);

  // Called by the modal's "+" buttons: onAddLookup('roles', 'Master Technician')
  const addLookup = useCallback(async (listKey, value) => {
    const category = KEY_TO_CATEGORY[listKey];
    const name = value?.trim();
    if (!category || !name) return;

    const existing = grouped[category] || [];
    // Avoid a duplicate-key error if the option is already there.
    if (existing.some(i => i.value.toLowerCase() === name.toLowerCase())) return;

    // Optimistic: show it in the dropdown immediately.
    const temp = { _id: `tmp-${Date.now()}`, value: name, isActive: true, order: existing.length + 1 };
    setGrouped(prev => ({ ...prev, [category]: [...(prev[category] || []), temp] }));

    try {
      await technicianLookupsApi.create({
        category,
        value: name,
        order: existing.length + 1,
        isActive: true,
      });
      // The fetch-sync in dataSync.js will bump `version` and reload the real list.
    } catch (err) {
      console.error('Failed to add lookup:', err);
      setGrouped(prev => ({
        ...prev,
        [category]: (prev[category] || []).filter(i => i._id !== temp._id),
      }));
    }
  }, [grouped]);

  return { lookups, addLookup };
}
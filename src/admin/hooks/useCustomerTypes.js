// src/admin/hooks/useCustomerTypes.js
// API-backed customer types hook
import { useState, useEffect } from 'react';
import { customerTypesApi } from '../services/api';

const INIT_TYPES = [
  { name: 'Residential', active: true },
  { name: 'Commercial',  active: true },
  { name: 'Industrial',  active: true },
  { name: 'Institution', active: true },
  { name: 'AMC Client',  active: true },
];

export function useCustomerTypes() {
  const [types, setTypes] = useState(INIT_TYPES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerTypesApi.list({ limit: 200 })
      .then(res => {
        const raw = res?.data || res || [];
        if (raw.length > 0) {
          setTypes(raw.map(t => ({ ...t, name: t.name, active: t.isActive !== false })));
        }
      })
      .catch(() => { /* fall back to defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const addType = async (name) => {
    if (!name?.trim()) return;
    try {
      const created = await customerTypesApi.create({ name: name.trim(), isActive: true });
      setTypes(prev => [...prev, { ...created, name: created.name, active: true }]);
    } catch {
      // optimistic fallback
      setTypes(prev => [...prev, { name: name.trim(), active: true }]);
    }
  };

  const deleteType = async (name) => {
    const found = types.find(t => t.name === name);
    setTypes(prev => prev.filter(t => t.name !== name));
    if (found?._id) {
      await customerTypesApi.remove(found._id).catch(() => {});
    }
  };

  const toggleType = async (name) => {
    const found = types.find(t => t.name === name);
    setTypes(prev => prev.map(t => t.name === name ? { ...t, active: !t.active } : t));
    if (found?._id) {
      await customerTypesApi.update(found._id, { isActive: !found.active }).catch(() => {});
    }
  };

  return { types, loading, addType, deleteType, toggleType };
}
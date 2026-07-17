// src/admin/hooks/useLeadSources.js
// API-backed lead sources hook
import { useState, useEffect } from 'react';
import { leadSourcesApi } from '../services/api';

const DEFAULT_SOURCES = [
  { name: 'Referral',  active: true },
  { name: 'Google Ad', active: true },
  { name: 'Walk-in',   active: true },
  { name: 'Instagram', active: true },
  { name: 'LinkedIn',  active: true },
  { name: 'Cold Call', active: true },
];

export function useLeadSources() {
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leadSourcesApi.list({ limit: 200 })
      .then(res => {
        const raw = res?.data || res || [];
        if (raw.length > 0) {
          setSources(raw.map(s => ({ ...s, name: s.name, active: s.isActive !== false })));
        }
      })
      .catch(() => { /* fall back to defaults */ })
      .finally(() => setLoading(false));
  }, []);

  const addSource = async (name) => {
    if (!name?.trim()) return;
    try {
      const created = await leadSourcesApi.create({ name: name.trim(), isActive: true, channel: 'Other' });
      setSources(prev => [...prev, { ...created, name: created.name, active: true }]);
    } catch {
      setSources(prev => [...prev, { name: name.trim(), active: true }]);
    }
  };

  const deleteSource = async (name) => {
    const found = sources.find(s => s.name === name);
    setSources(prev => prev.filter(s => s.name !== name));
    if (found?._id) {
      await leadSourcesApi.remove(found._id).catch(() => {});
    }
  };

  const toggleSource = async (name) => {
    const found = sources.find(s => s.name === name);
    setSources(prev => prev.map(s => s.name === name ? { ...s, active: !s.active } : s));
    if (found?._id) {
      await leadSourcesApi.update(found._id, { isActive: !found.active }).catch(() => {});
    }
  };

  const activeSources = sources.filter(s => s.active).map(s => s.name);

  return { sources, loading, activeSources, addSource, deleteSource, toggleSource };
}
import { useState, useEffect } from 'react';

const normalize = (arr) =>
  arr.map(item => (typeof item === 'string' ? { name: item, active: true } : item));

export function useOptionSet(api, defaults = []) {
  const [items, setItems] = useState(() => normalize(defaults));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.list({ limit: 200 })
      .then(res => {
        const raw = res?.data || res || [];
        if (raw.length > 0) {
          setItems(raw.map(s => ({ ...s, name: s.name, active: s.isActive !== false })));
        }
      })
      .catch(() => { /* keep defaults on failure — same as useLeadSources */ })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = async (name) => {
    if (!name?.trim()) return;
    try {
      const created = await api.create({ name: name.trim(), isActive: true });
      setItems(prev => [...prev, { ...created, name: created.name, active: true }]);
    } catch {
      setItems(prev => [...prev, { name: name.trim(), active: true }]);
    }
  };

  const remove = async (name) => {
    const found = items.find(s => s.name === name);
    setItems(prev => prev.filter(s => s.name !== name));
    if (found?._id) {
      await api.remove(found._id).catch(() => {});
    }
  };

  const toggle = async (name) => {
    const found = items.find(s => s.name === name);
    setItems(prev => prev.map(s => s.name === name ? { ...s, active: !s.active } : s));
    if (found?._id) {
      await api.update(found._id, { isActive: !found.active }).catch(() => {});
    }
  };

  const activeItems = items.filter(s => s.active).map(s => s.name);

  return { items, loading, activeItems, add, remove, toggle };
}
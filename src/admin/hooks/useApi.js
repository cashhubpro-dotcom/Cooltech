// ─── useApi hook ──────────────────────────────────────────────────────────────
// Provides: data, loading, error, reload, create, update, remove
import { useState, useEffect, useCallback } from 'react';

export function useApi(apiFn, params = {}) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiFn(params);
      setData(res.data ?? res);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  return { data, setData, loading, error, reload: load };
}

export function useApiCrud(apiModule, initialParams = {}) {
  const { data, setData, loading, error, reload } = useApi(
    (p) => apiModule.list(p), initialParams
  );

  const create = async (body) => {
    const doc = await apiModule.create(body);
    setData(prev => [doc, ...prev]);
    return doc;
  };

  const update = async (id, body) => {
    const doc = await apiModule.update(id, body);
    setData(prev => prev.map(d => (d._id === id ? doc : d)));
    return doc;
  };

  const remove = async (id) => {
    await apiModule.remove(id);
    setData(prev => prev.filter(d => d._id !== id));
  };

  return { data, setData, loading, error, reload, create, update, remove };
}

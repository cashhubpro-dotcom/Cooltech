import { useState, useEffect, useCallback } from 'react';

const BASE = 'http://localhost:5000' ?? '';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${BASE}/api/ad-campaigns${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'API error');
  // createCRUD returns { data: [...] } for list, or the doc directly
  return json.data ?? json;
}

export function useAdCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/');
      // normalise: expose _id as id so UI stays consistent
      setCampaigns(
        (Array.isArray(data) ? data : []).map(c => ({ ...c, id: c._id }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createCampaign = async (payload) => {
    const created = await apiFetch('/', { method: 'POST', body: JSON.stringify(payload) });
    setCampaigns(prev => [{ ...created, id: created._id }, ...prev]);
    return created;
  };

  const updateCampaign = async (id, payload) => {
    const updated = await apiFetch(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    setCampaigns(prev => prev.map(c => c.id === id ? { ...updated, id: updated._id } : c));
    return updated;
  };

  const deleteCampaign = async (id) => {
    await apiFetch(`/${id}`, { method: 'DELETE' });
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  return { campaigns, setCampaigns, loading, error, refetch: fetchAll, createCampaign, updateCampaign, deleteCampaign };
}
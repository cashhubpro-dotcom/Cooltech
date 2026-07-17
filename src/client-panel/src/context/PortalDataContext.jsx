import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clientDashboardApi } from '../services/clientPortalApi';

const PortalDataContext = createContext(null);

export function PortalDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return clientDashboardApi.summary()
      .then(res => { setData(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <PortalDataContext.Provider value={{ data, loading, error, refresh }}>
      {children}
    </PortalDataContext.Provider>
  );
}

// Throws loudly if a component tries to use this outside the provider —
// better than silently returning undefined and failing deep in a render.
export function usePortalData() {
  const ctx = useContext(PortalDataContext);
  if (!ctx) throw new Error('usePortalData must be used inside <PortalDataProvider>');
  return ctx;
}
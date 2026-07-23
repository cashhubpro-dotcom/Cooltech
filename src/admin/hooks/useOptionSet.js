import { useCallback, useEffect, useSyncExternalStore } from 'react';

const normalize = (arr) =>
  arr.map(item => (typeof item === 'string' ? { name: item, active: true } : item));

// ─── Shared store, one per `api` object ───────────────────────────────────
// api.js exports singletons (recoveryPlansApi, jobTypesApi, ...), so the
// SAME api reference is passed in every time useRecoveryPlans() / useJobTypes()
// / etc. is called, from anywhere in the app. Keying a WeakMap by that
// reference means every component sharing a resource shares one list, one
// fetch, and one set of mutators — instead of each call to useOptionSet()
// getting its own private useState() that never learns about writes made by
// other instances (which was the bug: adding a Recovery Plan from the modal
// updated App.jsx's private copy but never told OptionSetsPage's private
// copy, and vice versa).
const stores = new WeakMap();

function getStore(api, defaults) {
  let store = stores.get(api);
  if (store) {
    // console.log('[useOptionSet] reusing store — items:', store.snapshot.items.length, 'loading:', store.snapshot.loading, 'names:', store.snapshot.items.map(i => i.name));
    return store;
  }
  // console.log('[useOptionSet] creating NEW store for api', api);

  const items = normalize(defaults);
  store = {
    listeners: new Set(),
    fetchStarted: false,
    // `snapshot` is what useSyncExternalStore compares between renders —
    // it must only get a NEW reference when state actually changes, or
    // React won't know to re-render subscribers.
    snapshot: { items, loading: true },
  };
  stores.set(api, store);
  return store;
}

function setStoreState(store, patch) {
  store.snapshot = { ...store.snapshot, ...patch };
  // console.log('[useOptionSet] NOTIFY → listeners:', store.listeners.size, 'new item count:', store.snapshot.items.length, 'names:', store.snapshot.items.map(i => i.name));
  store.listeners.forEach(l => l());
}

function ensureFetched(api, store) {
  if (store.fetchStarted) return;
  store.fetchStarted = true;

  api.list({ limit: 200 })
    .then(res => {
      const raw = res?.data || res || [];
      if (raw.length > 0) {
        const items = raw.map(s => ({ ...s, name: s.name, active: s.isActive !== false }));
        setStoreState(store, { items, loading: false });
      } else {
        setStoreState(store, { loading: false });
      }
    })
    .catch(() => {
      // keep defaults on failure — same behavior as before
      setStoreState(store, { loading: false });
    });
}

export function useOptionSet(api, defaults = []) {
  const store = getStore(api, defaults);

  useEffect(() => {
    ensureFetched(api, store);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const subscribe = useCallback(cb => {
    store.listeners.add(cb);
    return () => store.listeners.delete(cb);
  }, [store]);

  const getSnapshot = useCallback(() => store.snapshot, [store]);

  const { items, loading } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const add = async (name) => {
    if (!name?.trim()) return;
    try {
      const created = await api.create({ name: name.trim(), isActive: true });
      setStoreState(store, {
        items: [...store.snapshot.items, { ...created, name: created.name, active: true }],
      });
    } catch {
      setStoreState(store, {
        items: [...store.snapshot.items, { name: name.trim(), active: true }],
      });
    }
  };

  const remove = async (name) => {
    const found = store.snapshot.items.find(s => s.name === name);
    setStoreState(store, {
      items: store.snapshot.items.filter(s => s.name !== name),
    });
    if (found?._id) {
      await api.remove(found._id).catch(() => {});
    }
  };

  const toggle = async (name) => {
    const found = store.snapshot.items.find(s => s.name === name);
    setStoreState(store, {
      items: store.snapshot.items.map(s => s.name === name ? { ...s, active: !s.active } : s),
    });
    if (found?._id) {
      await api.update(found._id, { isActive: !found.active }).catch(() => {});
    }
  };

  const activeItems = items.filter(s => s.active).map(s => s.name);

  return { items, loading, activeItems, add, remove, toggle };
}
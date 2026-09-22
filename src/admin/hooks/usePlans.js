// src/admin/hooks/usePlans.js
import { useOptionSet } from './useOptionSet';
import { contractPlansApi } from '../services/api';

export function usePlans() {
  const { items, loading, activeItems, add, remove, toggle } =
    useOptionSet(contractPlansApi);

  return {
    plans: items,
    loading,
    activePlans: activeItems,
    addPlan: add,
    deletePlan: remove,
    togglePlan: toggle,
  };
}
// src/admin/hooks/usePlans.js
import { useOptionSet } from './useOptionSet';
import { contractPlansApi } from '../services/api';

const DEFAULT_PLANS = ['Basic', 'Comprehensive', 'Premium', 'Custom']
  .map(name => ({ name, active: true }));

export function usePlans() {
  const { items, loading, activeItems, add, remove, toggle } =
    useOptionSet(contractPlansApi, DEFAULT_PLANS);

  return {
    plans: items,
    loading,
    activePlans: activeItems,
    addPlan: add,
    deletePlan: remove,
    togglePlan: toggle,
  };
}
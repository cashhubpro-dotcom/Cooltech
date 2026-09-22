// src/admin/hooks/useContractTypes.js
import { useOptionSet } from './useOptionSet';
import { contractTypesApi } from '../services/api';

export function useContractTypes() {
  const { items, loading, activeItems, add, remove, toggle } =
    useOptionSet(contractTypesApi);

  return {
    types: items,
    loading,
    activeTypes: activeItems,
    addType: add,
    deleteType: remove,
    toggleType: toggle,
  };
}
// src/admin/hooks/useContractTypes.js
import { useOptionSet } from './useOptionSet';
import { contractTypesApi } from '../services/api';

const DEFAULT_TYPES = [
  'AMC – Basic',
  'AMC – Comprehensive',
  'AMC – Premium',
  'Installation',
  'Service Agreement',
  'Rental / Lease',
  'Warranty Extension',
  'One-time Repair',
].map(name => ({ name, active: true }));

export function useContractTypes() {
  const { items, loading, activeItems, add, remove, toggle } =
    useOptionSet(contractTypesApi, DEFAULT_TYPES);

  return {
    types: items,
    loading,
    activeTypes: activeItems,
    addType: add,
    deleteType: remove,
    toggleType: toggle,
  };
}
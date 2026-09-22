// src/hooks/useOptionSets.js
// ─────────────────────────────────────────────────────────────────────────────
// One thin useOptionSet(...) wrapper per admin-editable dropdown list, matching
// the existing useContractTypes / usePlans / useLeadSources pattern. Grouped by
// area.
//
// Each list starts empty and is populated entirely by the API response — there
// are no hardcoded fallback options here. useOptionSet() itself ignores a
// defaults array as a second argument by design; don't pass one expecting it
// to pre-seed the dropdown.
//
// IMPORTANT — these are intentionally SHARED across multiple modals in a few
// cases (see comments below and services/api.js). Don't split them back into
// one hook per modal; that's the exact duplication this refactor removes.
// ─────────────────────────────────────────────────────────────────────────────
import { useOptionSet } from './useOptionSet';
import {
  jobTypesApi, itemCategoriesApi, inventoryUnitsApi, expenseCategoriesApi,
  poTypesApi, vehicleSubtypesApi, equipmentSubtypesApi, partTypesApi,
  acTypesApi, unitWarrantyTypesApi, partWarrantyTypesApi, noticeCategoriesApi,
  ticketIssueTypesApi, ticketChannelsApi, adminRolesApi, paymentMethodsApi,
  priceItemCategoriesApi, priceItemUnitsApi, reminderTypesApi, leaveTypesApi,
  gasTypesApi, gasReasonsApi, gasRegulationRefsApi, gasDisposalMethodsApi,
  taskCategoriesApi, taskLabelsApi, activityTypesApi, recoveryPlansApi, incentiveTypesApi
} from '../services/api';

// ── Jobs / Quotations / Ops ────────────────────────────────────────────────
// Shared by NewJobModal, ConvertToJobModal, NewQuotationModal (Type field).
export const useJobTypes = () => useOptionSet(jobTypesApi);

export const useExpenseCategories = () => useOptionSet(expenseCategoriesApi);

export const useNoticeCategories = () => useOptionSet(noticeCategoriesApi);

export const useTicketIssueTypes = () => useOptionSet(ticketIssueTypesApi);

export const useTicketChannels = () => useOptionSet(ticketChannelsApi);

// ── Inventory / Purchasing / Sales ─────────────────────────────────────────
// Shared by AddInventoryModal, NewPOModal, NewSOModal, NewSupplierModal.
export const useItemCategories = () => useOptionSet(itemCategoriesApi);

export const useInventoryUnits = () => useOptionSet(inventoryUnitsApi);

export const usePoTypes = () => useOptionSet(poTypesApi);

// ── Assets & Warranty ───────────────────────────────────────────────────────
export const useVehicleSubtypes = () => useOptionSet(vehicleSubtypesApi);

export const useEquipmentSubtypes = () => useOptionSet(equipmentSubtypesApi);

export const usePartTypes = () => useOptionSet(partTypesApi);

export const useAcTypes = () => useOptionSet(acTypesApi);

export const useUnitWarrantyTypes = () => useOptionSet(unitWarrantyTypesApi);

export const usePartWarrantyTypes = () => useOptionSet(partWarrantyTypesApi);

// ── Admin ────────────────────────────────────────────────────────────────
export const useAdminRoles = () => useOptionSet(adminRolesApi);

// ── HR ───────────────────────────────────────────────────────────────────
export const usePaymentMethods = () => useOptionSet(paymentMethodsApi);

export const usePriceItemCategories = () => useOptionSet(priceItemCategoriesApi);

export const usePriceItemUnits = () => useOptionSet(priceItemUnitsApi);

export const useReminderTypes = () => useOptionSet(reminderTypesApi);

export const useLeaveTypes = () => useOptionSet(leaveTypesApi);

export const useGasTypes = () => useOptionSet(gasTypesApi);

export const useGasReasons = () => useOptionSet(gasReasonsApi);

export const useGasRegulationRefs = () => useOptionSet(gasRegulationRefsApi);

export const useGasDisposalMethods = () => useOptionSet(gasDisposalMethodsApi);

export const useTaskCategories = () => useOptionSet(taskCategoriesApi);

export const useTaskLabels = () => useOptionSet(taskLabelsApi);

export const useActivityTypes = () => useOptionSet(activityTypesApi);

export const useRecoveryPlans = () => useOptionSet(recoveryPlansApi);

export const useIncentiveTypes = () => useOptionSet(incentiveTypesApi);
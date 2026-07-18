// src/hooks/useOptionSets.js
// ─────────────────────────────────────────────────────────────────────────────
// One thin useOptionSet(...) wrapper per admin-editable dropdown list, matching
// the existing useContractTypes / usePlans / useLeadSources pattern. Grouped by
// area. Defaults mirror what was previously hardcoded in each modal so nothing
// changes visually until the API actually has data.
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
export const useJobTypes = () =>
  useOptionSet(jobTypesApi, ['Service', 'Repair', 'Installation', 'AMC Visit', 'Inspection', 'AMC']);

export const useExpenseCategories = () =>
  useOptionSet(expenseCategoriesApi, ['Fuel', 'Tools', 'Parts', 'Training', 'Office', 'Miscellaneous', 'Other']);

export const useNoticeCategories = () =>
  useOptionSet(noticeCategoriesApi, ['Operations', 'Policy', 'Holiday', 'Training', 'Achievement', 'General', 'HR', 'Finance', 'Safety', 'Urgent']);

export const useTicketIssueTypes = () =>
  useOptionSet(ticketIssueTypesApi, [
    'Not Cooling', 'Water Leakage', 'Strange Noise', 'Not Turning On',
    'Remote / Controls Issue', 'Gas Leak / Smell', 'Error Code on Display',
    'AMC Scheduled Visit', 'Installation Request', 'Other',
  ]);

export const useTicketChannels = () =>
  useOptionSet(ticketChannelsApi, ['Phone Call', 'WhatsApp', 'Email', 'Walk-in', 'App / Portal']);

// ── Inventory / Purchasing / Sales ─────────────────────────────────────────
// Shared by AddInventoryModal, NewPOModal, NewSOModal, NewSupplierModal.
export const useItemCategories = () =>
  useOptionSet(itemCategoriesApi, [
    'Refrigerant', 'Compressor', 'Electrical / PCB', 'Filter', 'Capacitor',
    'Copper Pipe', 'Drain Pipe', 'Gas Valve', 'Fan Motor', 'Remote / Sensor',
    'Lubricant', 'Tools', 'Split AC', 'Window AC', 'Cassette AC', 'Portable AC',
    'Duct AC', 'Installation Kit', 'Stabilizer', 'AMC Package', 'Extended Warranty',
    'Spare Part', 'Other',
  ]);

export const useInventoryUnits = () =>
  useOptionSet(inventoryUnitsApi, ['Cylinder', 'Piece', 'Meter', 'Litre', 'Set']);

export const usePoTypes = () =>
  useOptionSet(poTypesApi, [
    'Refrigerant Restock', 'Spare Parts', 'Tools & Equipment', 'Consumables',
    'Compressor Unit', 'PCB / Electrical', 'Piping & Fittings', 'Miscellaneous',
  ]);

// ── Assets & Warranty ───────────────────────────────────────────────────────
export const useVehicleSubtypes = () =>
  useOptionSet(vehicleSubtypesApi, ['Service Van', 'Bike (Company)', 'Bike (Own)', 'Pickup Truck', 'Three-Wheeler', 'Other']);

export const useEquipmentSubtypes = () =>
  useOptionSet(equipmentSubtypesApi, ['Vacuum Pump', 'Recovery Machine', 'Nitrogen Cylinder', 'Manifold Gauge Set', 'Brazing Kit', 'Testing Tool', 'Leak Detector', 'Other']);

export const usePartTypes = () =>
  useOptionSet(partTypesApi, ['Compressor', 'PCB Board', 'Capacitor', 'Fan Motor', 'Gas Charge', 'IDU/ODU Coil', 'Remote', 'Sensor', 'Other']);

export const useAcTypes = () =>
  useOptionSet(acTypesApi, ['Split AC', 'Window AC', 'Cassette AC', 'Ductable', 'VRF', 'Other']);

export const useUnitWarrantyTypes = () =>
  useOptionSet(unitWarrantyTypesApi, ['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only']);

export const usePartWarrantyTypes = () =>
  useOptionSet(partWarrantyTypesApi, ['Manufacturer', 'Dealer', 'AMC covered', 'Extended']);

// ── Admin ────────────────────────────────────────────────────────────────
export const useAdminRoles = () =>
  useOptionSet(adminRolesApi, ['Manager', 'Accountant', 'Dispatcher', 'Super Admin']);

// ── HR ───────────────────────────────────────────────────────────────────
export const usePaymentMethods = () =>
  useOptionSet(paymentMethodsApi, ['Bank Transfer / NEFT', 'UPI', 'Cash', 'Cheque', 'Credit Card']);

export const usePriceItemCategories = () =>
  useOptionSet(priceItemCategoriesApi, ['Service', 'Gas Refill', 'Installation', 'Repair', 'AMC']);

export const usePriceItemUnits = () =>
  useOptionSet(priceItemUnitsApi, ['per visit', 'per unit', 'per cylinder', 'per year', 'per month', 'per day', 'per job']);

export const useReminderTypes = () =>
  useOptionSet(reminderTypesApi, ['Annual Service', 'AMC Service Due', 'Gas Refill Check', 'AMC Renewal', 'Filter Cleaning']);

export const useLeaveTypes = () =>
  useOptionSet(leaveTypesApi, ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave']);

export const useGasTypes = () =>
  useOptionSet(gasTypesApi, ['R-32', 'R-410A', 'R-22', 'R-134a', 'R-407C', 'R-404A']);

export const useGasReasons = () =>
  useOptionSet(gasReasonsApi, ['New installation', 'Gas leak – refill', 'Annual refill', 'Compressor replacement', 'Routine refill', 'Top-up service', 'Recovery only']);

export const useGasRegulationRefs = () =>
  useOptionSet(gasRegulationRefsApi, ['EU F-Gas Reg 517/2014', 'BEE India Guidelines', 'ASHRAE 15', 'Other / Local']);

export const useGasDisposalMethods = () =>
  useOptionSet(gasDisposalMethodsApi, ['N/A – No recovery', 'Reclaimed – reuse', 'Returned to supplier', 'Destroyed / certified disposal']);

export const useTaskCategories = () =>
  useOptionSet(taskCategoriesApi, ['Service', 'Installation', 'Repair', 'AMC', 'Sales', 'Finance', 'HR', 'Operations', 'Admin']);

export const useTaskLabels = () =>
  useOptionSet(taskLabelsApi, ['Urgent Follow-up', 'Customer Complaint', 'AMC Related', 'Internal', 'Revenue Critical']);

export const useActivityTypes = () =>
  useOptionSet(activityTypesApi, ['Service', 'Installation', 'Repair', 'AMC', 'Gas Refill', 'Training', 'Admin', 'Travel', 'Other']);

export const useRecoveryPlans = () =>
  useOptionSet(recoveryPlansApi, ['1 month (full)', '2 months (split)', '3 months (split)']);

export const useIncentiveTypes = () =>
  useOptionSet(incentiveTypesApi, ['Performance Bonus', 'Referral Bonus', 'Festival Bonus', 'Overtime Incentive', 'Other']);
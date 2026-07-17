import mongoose from 'mongoose';

// ── Option Sets ────────────────────────────────────────────────────────────────
// Every model below is the exact same shape as the existing ContractType /
// ContractPlan / CustomerType / LeadSource collections in extendedModels.js:
// a name, an isActive toggle, soft-delete, and an auto-generated short ID.
//
// Rather than copy-paste that schema 26 times (one per Tier-1 dropdown that
// used to be a hardcoded array on the frontend — see Modals.jsx / HRModals.jsx
// DynamicSelect conversion), we generate it once from a factory. If you need
// to add a field to every option set later (e.g. an admin "sortOrder"), this
// is the one place to do it.
//
// Frontend contract (see src/services/api.js): each of these is exposed as
// `crud('<slug>')`, and the useOptionSet hook expects .list()/.create()/
// .update()/.remove() with { name, isActive } — which createCRUD + this shape
// already provide, same as the existing ContractType router.
function makeOptionSetSchema(idPrefix, padLength = 3) {
  const schema = new mongoose.Schema({
    typeId:      { type: String, unique: true },
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    isActive:    { type: Boolean, default: true },
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date, default: null },
  }, { timestamps: true });

  schema.pre('save', async function (next) {
    if (!this.typeId) {
      const count = await this.constructor.countDocuments();
      this.typeId = `${idPrefix}-${String(count + 1).padStart(padLength, '0')}`;
    }
    next();
  });

  return schema;
}

// Each entry: [ exportedModelName, mongooseCollectionModelName, idPrefix ]
const OPTION_SET_DEFS = [
  ['JobType',             'JobType',             'JBT'],
  ['ItemCategory',        'ItemCategory',        'ITC'],
  ['InventoryUnit',       'InventoryUnit',       'IVU'],
  ['ExpenseCategory',     'ExpenseCategory',     'EXC'],
  ['PoType',              'PoType',              'POT'],
  ['VehicleSubtype',      'VehicleSubtype',      'VST'],
  ['EquipmentSubtype',    'EquipmentSubtype',    'EST'],
  ['PartType',            'PartType',            'PTT'],
  ['AcType',              'AcType',              'ACT'],
  ['UnitWarrantyType',    'UnitWarrantyType',    'UWT'],
  ['PartWarrantyType',    'PartWarrantyType',    'PWT'],
  ['NoticeCategory',      'NoticeCategory',      'NTC'],
  ['TicketIssueType',     'TicketIssueType',     'TIT'],
  ['TicketChannel',       'TicketChannel',       'TCH'],
  ['AdminRole',           'AdminRole',           'ADR'],
  ['PaymentMethod',       'PaymentMethod',       'PMT'],
  ['PriceItemCategory',   'PriceItemCategory',   'PIC'],
  ['PriceItemUnit',       'PriceItemUnit',       'PIU'],
  ['ReminderType',        'ReminderType',        'RMT'],
  ['LeaveType',           'LeaveType',           'LVT'],
  ['GasType',             'GasType',             'GST'],
  ['GasReason',           'GasReason',           'GRS'],
  ['GasRegulationRef',    'GasRegulationRef',    'GRR'],
  ['GasDisposalMethod',   'GasDisposalMethod',   'GDM'],
  ['TaskCategory',        'TaskCategory',        'TSC'],
  ['TaskLabel',           'TaskLabel',           'TSL'],
  ['ActivityType',        'ActivityType',        'ACV'],
  ['RecoveryPlan',        'RecoveryPlan',         'RCP'],
];

const models = {};
for (const [exportName, collectionModelName, prefix] of OPTION_SET_DEFS) {
  models[exportName] = mongoose.model(collectionModelName, makeOptionSetSchema(prefix));
}

export const {
  JobType, ItemCategory, InventoryUnit, ExpenseCategory, PoType,
  VehicleSubtype, EquipmentSubtype, PartType, AcType, UnitWarrantyType,
  PartWarrantyType, NoticeCategory, TicketIssueType, TicketChannel, AdminRole,
  PaymentMethod, PriceItemCategory, PriceItemUnit, ReminderType, LeaveType,
  GasType, GasReason, GasRegulationRef, GasDisposalMethod, TaskCategory,
  TaskLabel, ActivityType, RecoveryPlan,
} = models;
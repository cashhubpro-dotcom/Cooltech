// src/pages/settings/OptionSetsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// One page, tabbed by domain, hosting every Tier-1 admin-editable option set
// added in this pass. Each tab is just OptionListPanel wired to a useOptionSet
// hook — the same pattern ContractSettingsPage already uses for Contract
// Types / Plans. Placed in the sidebar under Settings → Option Sets, rather
// than as ~20 separate top-level nav items, since these all serve the same
// "manage a dropdown list" job — see navigation.js for the entry.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import OptionListPanel from '../../components/settings/OptionListPanel';
import { useJobTypes, useExpenseCategories, useNoticeCategories, useTicketIssueTypes, useTicketChannels, useItemCategories, useInventoryUnits, usePoTypes, useVehicleSubtypes, useEquipmentSubtypes, usePartTypes, useAcTypes, useUnitWarrantyTypes, usePartWarrantyTypes, useAdminRoles, usePaymentMethods, usePriceItemCategories, usePriceItemUnits, useReminderTypes, useLeaveTypes, useGasTypes, useGasReasons, useGasRegulationRefs, useGasDisposalMethods, useTaskCategories, useTaskLabels, useActivityTypes, useRecoveryPlans, useIncentiveTypes } from '../../hooks/useOptionSets';

// Groups mirror how the option sets are actually used across the app, so an
// admin looking for "Job Type" finds it under Jobs & Service, not buried in
// an alphabetical list of 26 unrelated things.
const GROUPS = [{
  id: 'jobs',
  label: 'Jobs & Service',
  icon: '🔧',
  sets: [{
    key: 'jobTypes',
    label: 'Job / Service Types',
    addLabel: 'Job Type',
    icon: '🔧',
    hook: useJobTypes,
    note: 'Shared by New Job, Convert-to-Job, and New Quotation — one list keeps all three in sync.'
  }, {
    key: 'ticketIssueTypes',
    label: 'Ticket Issue Types',
    addLabel: 'Issue Type',
    icon: '🎫',
    hook: useTicketIssueTypes
  }, {
    key: 'ticketChannels',
    label: 'Ticket Channels',
    addLabel: 'Channel',
    icon: '📞',
    hook: useTicketChannels
  }]
}, {
  id: 'inventory',
  label: 'Inventory & Purchasing',
  icon: '📦',
  sets: [{
    key: 'itemCategories',
    label: 'Item / Product Categories',
    addLabel: 'Item Category',
    icon: '📦',
    hook: useItemCategories,
    note: 'Shared by Inventory, Purchase Orders, Sales Orders, and Suppliers — one list keeps all four in sync.'
  }, {
    key: 'inventoryUnits',
    label: 'Inventory Units',
    addLabel: 'Unit',
    icon: '📏',
    hook: useInventoryUnits
  }, {
    key: 'poTypes',
    label: 'PO Types',
    addLabel: 'PO Type',
    icon: '🛒',
    hook: usePoTypes
  }]
}, {
  id: 'assets',
  label: 'Assets & Warranty',
  icon: '🚗',
  sets: [{
    key: 'vehicleSubtypes',
    label: 'Vehicle Sub-Types',
    addLabel: 'Vehicle Sub-Type',
    icon: '🚐',
    hook: useVehicleSubtypes
  }, {
    key: 'equipmentSubtypes',
    label: 'Equipment Sub-Types',
    addLabel: 'Equipment Sub-Type',
    icon: '🧰',
    hook: useEquipmentSubtypes
  }, {
    key: 'partTypes',
    label: 'Part Types',
    addLabel: 'Part Type',
    icon: '⚙️',
    hook: usePartTypes
  }, {
    key: 'acTypes',
    label: 'AC Types',
    addLabel: 'AC Type',
    icon: '❄️',
    hook: useAcTypes
  }, {
    key: 'unitWarrantyTypes',
    label: 'Unit Warranty Types',
    addLabel: 'Warranty Type',
    icon: '🛡',
    hook: useUnitWarrantyTypes
  }, {
    key: 'partWarrantyTypes',
    label: 'Part Warranty Types',
    addLabel: 'Warranty Type',
    icon: '🛡',
    hook: usePartWarrantyTypes
  }]
}, {
  id: 'finance',
  label: 'Finance & Admin',
  icon: '💰',
  sets: [{
    key: 'expenseCategories',
    label: 'Expense Categories',
    addLabel: 'Expense Category',
    icon: '🧾',
    hook: useExpenseCategories
  }, {
    key: 'paymentMethods',
    label: 'Payment Methods',
    addLabel: 'Payment Method',
    icon: '💳',
    hook: usePaymentMethods
  }, {
    key: 'priceItemCategories',
    label: 'Price List Categories',
    addLabel: 'Price Item Category',
    icon: '🏷',
    hook: usePriceItemCategories
  }, {
    key: 'priceItemUnits',
    label: 'Price List Units',
    addLabel: 'Unit',
    icon: '📏',
    hook: usePriceItemUnits
  }, {
    key: 'adminRoles',
    label: 'Admin Roles',
    addLabel: 'Role',
    icon: '👤',
    hook: useAdminRoles
  }, {
    key: 'noticeCategories',
    label: 'Notice Categories',
    addLabel: 'Notice Category',
    icon: '📢',
    hook: useNoticeCategories
  }]
}, {
  id: 'hr',
  label: 'HR & Field Ops',
  icon: '👷',
  sets: [{
    key: 'reminderTypes',
    label: 'Reminder Types',
    addLabel: 'Reminder Type',
    icon: '🔔',
    hook: useReminderTypes
  }, {
    key: 'leaveTypes',
    label: 'Leave Types',
    addLabel: 'Leave Type',
    icon: '🌴',
    hook: useLeaveTypes
  }, {
    key: 'recoveryPlans',                    // ← add this block
    label: 'Recovery Plans',
    addLabel: 'Recovery Plan',
    icon: '💵',
    hook: useRecoveryPlans,
    note: 'Used by Advance Requests to set how a technician\u2019s advance is recovered from payroll.'
  },{
    key: 'incentiveTypes',
    label: 'Incentive Types',
    addLabel: 'Incentive Type',
    icon: '🎁',
    hook: useIncentiveTypes,
    note: 'Used by Advance Requests to categorize the type of incentive being requested.'
  },{
    key: 'taskCategories',
    label: 'Task Categories',
    addLabel: 'Task Category',
    icon: '✅',
    hook: useTaskCategories
  }, {
    key: 'taskLabels',
    label: 'Task Labels',
    addLabel: 'Label',
    icon: '🏷',
    hook: useTaskLabels
  }, {
    key: 'activityTypes',
    label: 'Time-Log Activity Types',
    addLabel: 'Activity Type',
    icon: '⏱',
    hook: useActivityTypes
  }, {
    key: 'gasTypes',
    label: 'Gas Types',
    addLabel: 'Gas Type',
    icon: '🧪',
    hook: useGasTypes
  }, {
    key: 'gasReasons',
    label: 'Gas Log Reasons',
    addLabel: 'Reason / Purpose',
    icon: '🧪',
    hook: useGasReasons
  }, {
    key: 'gasRegulationRefs',
    label: 'Gas Regulation References',
    addLabel: 'Regulation Reference',
    icon: '📜',
    hook: useGasRegulationRefs
  }, {
    key: 'gasDisposalMethods',
    label: 'Gas Disposal Methods',
    addLabel: 'Disposal Method',
    icon: '♻️',
    hook: useGasDisposalMethods
  }]
}];

// NOTE: "Lead Type" (Residential/Commercial/Industrial) and "Customer Type"
// intentionally have no tab here — NewLeadModal reuses the existing Customer
// Type option set (see its own settings page) rather than a duplicate list.

function OptionSetTab({
  set
}) {
  const {
    items,
    loading,
    add,
    remove,
    toggle
  } = set.hook();
  return <div>
      {set.note && <div className="ap-option-sets-page-1">
          ℹ️ {set.note}
        </div>}
      <OptionListPanel title={set.label} items={items} loading={loading} onAdd={add} onDelete={remove} onToggle={toggle} addLabel={set.addLabel} itemIcon={set.icon} />
    </div>;
}
export default function OptionSetsPage() {
  const [groupId, setGroupId] = useState(GROUPS[0].id);
  const group = GROUPS.find(g => g.id === groupId) || GROUPS[0];
  const [setKey, setSetKey] = useState(group.sets[0].key);
  const activeSet = group.sets.find(s => s.key === setKey) || group.sets[0];
  const selectGroup = g => {
    setGroupId(g.id);
    setSetKey(g.sets[0].key);
  };
  return <div className="ap-option-sets-page-2">
      <div>
        <div className="ap-option-sets-page-3">Option Sets</div>
        <div className="ap-option-sets-page-4">
          Manage every admin-editable dropdown list used across Jobs, Inventory, HR, and more — in one place.
        </div>
      </div>

      {/* Group tabs */}
      <div className="ap-option-sets-page-5">
        {GROUPS.map(g => <button key={g.id} onClick={() => selectGroup(g)} style={{
        borderBottom: g.id === groupId ? "2px solid var(--brand)" : "2px solid transparent",
        color: g.id === groupId ? "var(--brand)" : "var(--text-muted)"
      }} className="ap-option-sets-page-6">
            <span>{g.icon}</span>{g.label}
          </button>)}
      </div>

      {/* Sub-tabs for the sets within a group */}
      <div className="ap-option-sets-page-7">
        {group.sets.map(s => <button key={s.key} onClick={() => setSetKey(s.key)} style={{
        background: s.key === setKey ? "var(--brand)" : "var(--bg)",
        color: s.key === setKey ? "white" : "var(--text-muted)",
        border: `1px solid ${s.key === setKey ? COLORS.brand : COLORS.border}`
      }} className="ap-option-sets-page-8">
            {s.icon} {s.label}
          </button>)}
      </div>

      <OptionSetTab key={activeSet.key} set={activeSet} />
    </div>;
}
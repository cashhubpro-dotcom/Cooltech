// src/admin/pages/productivity/ContractSettingsPage.jsx
import { useState } from 'react';
import { SectionHdr } from '../../components/ui/Cards';
import OptionListPanel from '../../components/settings/OptionListPanel';
import { useContractTypes } from '../../hooks/useContractTypes';
import { usePlans } from '../../hooks/usePlans';
import { COLORS } from '../../constants/tokens';

// To add another tab later (e.g. "Payment Terms"), add one entry here and
// one matching hook + <OptionListPanel> block below — nothing else changes.
const TABS = [{
  key: 'types',
  label: 'Contract Types'
}, {
  key: 'plans',
  label: 'Plans'
}];
const ContractSettingsPage = () => {
  const [tab, setTab] = useState('types');
  const ct = useContractTypes();
  const pl = usePlans();
  return <div className="fi ap-contract-settings-page-1">
      <SectionHdr title="Contract Settings" sub="Manage the Contract Type and Plan options used when creating a contract or AMC" />

      {/* ── Info banner — mirrors LeadSourcesPage's banner ── */}
      <div className="ap-contract-settings-page-2">
        ℹ️ Options added here appear in the <strong>Contract Type</strong> and <strong>Plan</strong> dropdowns
        on the New Contract / New AMC form. Only <strong>Active</strong> options show in those dropdowns —
        Inactive ones are hidden but not deleted.
      </div>

      {/* ── Tabs ── */}
      <div className="ap-contract-settings-page-3">
        {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} style={{
        background: tab === t.key ? "var(--white)" : "transparent",
        color: tab === t.key ? "var(--text-h1)" : "var(--text-muted)",
        border: `1px solid ${tab === t.key ? COLORS.border : 'transparent'}`
      }} className="ap-contract-settings-page-4">
            {t.label}
          </button>)}
      </div>

      {/* ── Panels ── */}
      {tab === 'types' && <OptionListPanel title="Contract Types" items={ct.types} loading={ct.loading} onAdd={ct.addType} onDelete={ct.deleteType} onToggle={ct.toggleType} addLabel="Contract Type" addPlaceholder="e.g. Warranty Extension, Rental / Lease…" itemIcon="📄" />}
      {tab === 'plans' && <OptionListPanel title="Plans" items={pl.plans} loading={pl.loading} onAdd={pl.addPlan} onDelete={pl.deletePlan} onToggle={pl.togglePlan} addLabel="Plan" addPlaceholder="e.g. Enterprise, Starter…" itemIcon="🏷️" />}
    </div>;
};
export default ContractSettingsPage;
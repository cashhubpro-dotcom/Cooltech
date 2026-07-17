import { useState, useEffect } from "react";
import { payrollSettingsApi } from "../../services/api";

export default function PayrollSettingsPanel({ onClose, onSaved }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    payrollSettingsApi.get()
      .then((res) => setSettings(res.data))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await payrollSettingsApi.update(settings);
      setSettings(data);
      onSaved?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="gp-modal-body">
      <div className="gp-modal-header">
        <div className="gp-modal-title">Payroll formula settings</div>
        <button className="gp-modal-close" onClick={onClose}>×</button>
      </div>

      {loading && <div className="gp-modal-loading">Loading...</div>}

      {!loading && settings && (
        <>
          <div className="gp-form-grid">
            <div>
              <label className="gp-label">HRA (% of basic)</label>
              <input
                type="number"
                className="gp-input"
                value={settings.hraPercent}
                onChange={(e) => setSettings({ ...settings, hraPercent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="gp-label">Travel allowance (flat ₹)</label>
              <input
                type="number"
                className="gp-input"
                value={settings.travelDefault}
                onChange={(e) => setSettings({ ...settings, travelDefault: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="gp-label">PF (% of basic)</label>
              <input
                type="number"
                className="gp-input"
                value={settings.pfPercent}
                onChange={(e) => setSettings({ ...settings, pfPercent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="gp-label">Advance recovery</label>
              <select
                className="gp-select"
                value={settings.advanceRecoveryMode}
                onChange={(e) => setSettings({ ...settings, advanceRecoveryMode: e.target.value })}
              >
                <option value="full">Deduct full advance each cycle</option>
                <option value="percent_cap">Cap recovery at % of gross</option>
              </select>
            </div>
            {settings.advanceRecoveryMode === "percent_cap" && (
              <div>
                <label className="gp-label">Recovery cap (% of gross)</label>
                <input
                  type="number"
                  className="gp-input"
                  value={settings.advanceRecoveryCapPercent}
                  onChange={(e) => setSettings({ ...settings, advanceRecoveryCapPercent: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          {error && <div className="gp-error-text">{error}</div>}

          <div className="gp-modal-footer">
            <button className="gp-btn-sec" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="gp-btn-prim" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
/**
 * EditableDetailView — universal edit-mode wrapper
 *
 * Usage (fields mode — standard):
 *   <EditableDetailView id="LD-088" fields={fields} data={lead} onSave={...} />
 *
 * Usage (children render-prop — custom layout):
 *   <EditableDetailView id="CU-001" data={cust} fields={fields} onSave={...}>
 *     {({ editMode, editData, setEditData }) => <YourCustomLayout ... />}
 *   </EditableDetailView>
 *
 * When children is a function, the main card / sidebar / extra / field grid are
 * NOT rendered — only the top bar, edit banner, delete modal, and children output.
 */

import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { BackBtn } from '../../components/ui/Cards';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

// ─── Internal helpers ─────────────────────────────────────────────────────────

const FieldLabel = ({
  children
}) => <div className="ap-editable-detail-view-1">
    {children}
  </div>;
const inputBase = {
  padding: "7px 10px",
  borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: "100%",
  outline: "none",
  transition: "border-color .15s",
  boxSizing: "border-box"
};
const EditInput = ({
  field,
  value,
  onChange
}) => {
  const style = {
    ...inputBase,
    fontFamily: field.mono ? FONTS.mono : FONTS.sans,
    fontSize: field.hero ? 18 : field.large ? 15 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 400
  };
  if (field.type === "select") {
    return <select value={value} onChange={onChange} style={{
      ...inputBase,
      fontFamily: field.mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif",
      fontSize: field.hero ? 18 : field.large ? 15 : 13,
      fontWeight: field.hero ? 800 : field.large ? 700 : 400
    }} className="ap-editable-detail-view-2">
        {(field.options || []).map(opt => <option key={typeof opt === "object" ? opt.value : opt} value={typeof opt === "object" ? opt.value : opt}>
            {typeof opt === "object" ? opt.label : opt}
          </option>)}
      </select>;
  }
  if (field.type === "textarea") {
    return <textarea value={value} onChange={onChange} rows={3} style={{
      ...inputBase,
      fontFamily: field.mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif",
      fontSize: field.hero ? 18 : field.large ? 15 : 13,
      fontWeight: field.hero ? 800 : field.large ? 700 : 400
    }} className="ap-editable-detail-view-3" />;
  }
  return <input type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"} value={value} onChange={onChange} style={{
    fontFamily: field.mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif",
    fontSize: field.hero ? 18 : field.large ? 15 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 400
  }} className="ap-editable-detail-view-4" />;
};
const ReadValue = ({
  field,
  value,
  data
}) => {
  if (field.render) return field.render(value, data);
  if (field.type === "badge" && field.badgeMap) {
    return <SBadge s={value} map={field.badgeMap} />;
  }
  const style = {
    fontSize: field.hero ? 20 : field.large ? 16 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 500,
    color: field.valueRight ? COLORS.brand : COLORS.h2,
    fontFamily: field.mono ? FONTS.mono : FONTS.sans
  };
  return <div style={{
    fontSize: field.hero ? 20 : field.large ? 16 : 13,
    fontWeight: field.hero ? 800 : field.large ? 700 : 500,
    color: field.valueRight ? "var(--brand)" : "var(--text-h2)",
    fontFamily: field.mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
  }}>{value}</div>;
};

// ─── EditableDetailView ───────────────────────────────────────────────────────

const EditableDetailView = ({
  id,
  breadcrumb = "Records",
  onBack,
  fields = [],
  data,
  initialEditMode = false,
  onSave,
  onDelete,
  actions,
  sidebar,
  sidebarEdit,
  extra,
  extraEdit,
  extraEditHidden = true,
  children // render prop: ({ editMode, editData, setEditData }) => JSX
}) => {
  const seedData = () => {
    const s = {};
    fields.forEach(f => {
      if (f.key) s[f.key] = data[f.key] ?? "";
    });
    return s;
  };
  const [editMode, setEditMode] = useState(initialEditMode);
  const [editData, setEditData] = useState(initialEditMode ? seedData() : {});
  const [showDelete, setShowDelete] = useState(false);
  useEffect(() => {
    if (initialEditMode) {
      setEditData(seedData());
      setEditMode(true);
    } else {
      setEditMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, initialEditMode]);
  const enterEdit = () => {
    setEditData(seedData());
    setEditMode(true);
  };
  const handleSave = () => {
    onSave?.({
      ...data,
      ...editData
    });
    setEditMode(false);
  };
  const handleCancel = () => setEditMode(false);
  const set = key => e => setEditData(prev => ({
    ...prev,
    [key]: e.target.value
  }));

  // ── Render-prop mode: children owns the entire body layout ────────────────
  const isRenderProp = typeof children === "function";
  const heroFields = fields.filter(f => f.hero);
  const gridFields = fields.filter(f => !f.hero);
  const currentSidebar = editMode ? sidebarEdit ?? sidebar : sidebar;
  return <div className="fi ap-editable-detail-view-5">

      {/* ── Top bar ── */}
      <div className="ap-editable-detail-view-6">
        <BackBtn onClick={onBack} />
        <span className="ap-editable-detail-view-7">{breadcrumb} /</span>
        <span className="ap-editable-detail-view-8">{id}</span>

        <div className="ap-editable-detail-view-9">
          {editMode ? <>
              <button onClick={handleCancel} className="ap-editable-detail-view-10">
                Cancel
              </button>
              <button onClick={handleSave} className="ap-editable-detail-view-11">
                ✓ Save Changes
              </button>
            </> : <div className="ap-editable-detail-view-12">
              <button onClick={enterEdit} className="ap-editable-detail-view-13">
                ✎ Edit
              </button>
              {onDelete && <button onClick={() => setShowDelete(true)} className="ap-editable-detail-view-14">
                  🗑
                </button>}
            </div>}
        </div>
      </div>

      {/* ── Edit mode banner ── */}
      {editMode && <div className="ap-editable-detail-view-15">
          ✏️ Editing <strong>{id}</strong> — changes won't be saved until you click <strong>Save Changes</strong>.
        </div>}

      {/* ── Body ── */}
      {isRenderProp
    // ── Render-prop mode: hand full layout control to the caller ──────────
    ? children({
      editMode,
      editData,
      setEditData
    })

    // ── Standard fields mode: original card + sidebar layout ──────────────
    : <div style={{
      gridTemplateColumns: currentSidebar ? "1fr 300px" : "1fr"
    }} className="ap-editable-detail-view-16">

            {/* Main card */}
            <div style={{
        border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
        boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
      }} className="ap-editable-detail-view-17">
              {heroFields.length > 0 && <div className="ap-editable-detail-view-18">
                  {heroFields.map(f => <div key={f.key} className="ap-editable-detail-view-19">
                      {editMode ? <EditInput field={f} value={editData[f.key] ?? ""} onChange={set(f.key)} /> : <ReadValue field={f} value={data[f.key]} data={data} />}
                    </div>)}
                </div>}

              {gridFields.length > 0 && <div className="ap-editable-detail-view-20">
                  {gridFields.map(f => <div key={f.key || f.label} style={{
            gridColumn: f.span === 2 ? "1 / -1" : undefined
          }}>
                      <FieldLabel>{f.label}</FieldLabel>
                      {f.type === "readonly" ? <ReadValue field={f} value={data[f.key]} data={data} /> : editMode ? <EditInput field={f} value={editData[f.key] ?? ""} onChange={set(f.key)} /> : <ReadValue field={f} value={data[f.key]} data={data} />}
                    </div>)}
                </div>}

              {editMode ? extraEdit ? extraEdit : !extraEditHidden && extra : extra}

              {!editMode && actions && <div className="ap-editable-detail-view-21">{actions}</div>}

              {editMode && <div className="ap-editable-detail-view-22">
                  <button onClick={handleCancel} className="ap-editable-detail-view-23">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="ap-editable-detail-view-24">
                    ✓ Save Changes
                  </button>
                </div>}
            </div>

            {currentSidebar && <div className="ap-editable-detail-view-25">
                {currentSidebar}
              </div>}
          </div>}

      {/* Delete confirm */}
      {onDelete && <DeleteConfirmModal isOpen={showDelete} onConfirm={() => {
      onDelete();
      setShowDelete(false);
    }} onCancel={() => setShowDelete(false)} message="This record will be permanently removed and cannot be recovered." />}
    </div>;
};
export default EditableDetailView;
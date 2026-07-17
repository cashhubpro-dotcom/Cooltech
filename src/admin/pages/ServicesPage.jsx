import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard, SectionHdr, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PDFPreview from '../components/layout/PDFPreview';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { servicesApi } from '../services/api';

const mapService = s => ({
  id: s.serviceId,
  _id: s._id,
  name: s.name || '',
  category: s.category || 'Service',
  acType: s.acType || 'All Types',
  duration: s.duration || '',
  warranty: s.warranty || '',
  price: s.price ?? 0,
  gst: s.gstRate ?? 18,
  includes: s.includes || '',
  description: s.description || '',
  active: s.isActive !== false,
  popular: !!s.popular,
  checklist: s.checklist || [],
  tools: s.tools || [],
});

// ─── Mock data ────────────────────────────────────────────────────────────────
// const INITIAL_SERVICES = [{
//   id: "SVC-001",
//   name: "AC Installation",
//   category: "Installation",
//   acType: "Split AC",
//   duration: "4-6 hrs",
//   warranty: "1 Year",
//   price: 2500,
//   gst: 18,
//   includes: "Site visit, piping up to 3ft, stabilizer connection",
//   checklist: ["Measure & mark wall position", "Drill holes & fix brackets", "Mount indoor unit", "Run copper piping", "Connect refrigerant lines", "Electrical wiring", "Vacuum & gas charging", "Test run & demo"],
//   tools: ["Drill machine", "Pipe bender", "Vacuum pump", "Manifold gauge"],
//   active: true,
//   popular: true,
//   description: "Full split AC installation including brackets, piping, wiring and test run."
// }, {
//   id: "SVC-002",
//   name: "AC Service / Cleaning",
//   category: "Service",
//   acType: "All Types",
//   duration: "1-2 hrs",
//   warranty: "30 Days",
//   price: 699,
//   gst: 18,
//   includes: "Filter cleaning, coil wash, drain flush, check thermostat",
//   checklist: ["Check error codes", "Clean filters", "Wash indoor coil", "Flush drain pipe", "Check refrigerant level", "Inspect electrical connections", "Test cooling performance", "Customer sign-off"],
//   tools: ["Pressure washer", "Fin comb", "Multimeter"],
//   active: true,
//   popular: true,
//   description: "Complete AC servicing with deep clean, gas check and performance test."
// }, {
//   id: "SVC-003",
//   name: "Gas Refilling (R-32)",
//   category: "Repair",
//   acType: "Inverter Split",
//   duration: "1 hr",
//   warranty: "90 Days",
//   price: 1800,
//   gst: 18,
//   includes: "Gas top-up, leak check, pressure test",
//   checklist: ["Check for leaks with detector", "Purge old gas if required", "Connect manifold gauge", "Fill R-32 to specified pressure", "Check suction & discharge pressure", "Test cooling"],
//   tools: ["Manifold gauge set", "Leak detector", "R-32 cylinder", "Vacuum pump"],
//   active: true,
//   popular: false,
//   description: "R-32 refrigerant refill with leak detection and pressure testing."
// }, {
//   id: "SVC-004",
//   name: "AMC – Basic Plan",
//   category: "AMC",
//   acType: "All Types",
//   duration: "1 Year / 2 Visits",
//   warranty: "Contract Period",
//   price: 1499,
//   gst: 18,
//   includes: "2 service visits, filter cleaning, minor repairs, priority support",
//   checklist: ["Schedule visit 1 (summer)", "Full service & clean", "Schedule visit 2 (monsoon)", "Coil wash & drain check", "Minor repairs covered", "24hr support access"],
//   tools: ["Standard service kit"],
//   active: true,
//   popular: true,
//   description: "Annual maintenance contract with 2 service visits and priority support."
// }, {
//   id: "SVC-005",
//   name: "AMC – Comprehensive Plan",
//   category: "AMC",
//   acType: "All Types",
//   duration: "1 Year / 4 Visits",
//   warranty: "Contract Period",
//   price: 3499,
//   gst: 18,
//   includes: "4 service visits, gas top-up covered, parts discount 20%, emergency calls",
//   checklist: ["Quarterly scheduled visits", "Deep service each visit", "Gas top-up if needed", "20% off on spare parts", "Emergency response <4hrs", "End-of-year report"],
//   tools: ["Full service kit", "Manifold gauge"],
//   active: true,
//   popular: false,
//   description: "Premium AMC with quarterly visits, gas coverage and emergency support."
// }, {
//   id: "SVC-006",
//   name: "Compressor Replacement",
//   category: "Repair",
//   acType: "Split / Cassette",
//   duration: "3-5 hrs",
//   warranty: "1 Year",
//   price: 8500,
//   gst: 18,
//   includes: "Labour only — compressor cost extra, gas refill included",
//   checklist: ["Diagnose compressor failure", "Source compatible compressor", "Recover old refrigerant", "Remove & install new compressor", "Vacuum & leak test", "Gas charge", "Run test & handover"],
//   tools: ["Manifold gauge", "Vacuum pump", "Spanner set", "Refrigerant recovery unit"],
//   active: true,
//   popular: false,
//   description: "Full compressor swap with gas recovery, vacuum and re-charge."
// }];
const CATEGORIES = ["Installation", "Service", "Repair", "AMC"];
const CAT_COLOR = {
  Installation: {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  Service: {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  Repair: {
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  AMC: {
    bg: "var(--brand-light)",
    color: "var(--brand-dark)"
  }
};
const SERVICE_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: 'Service Name',
  key: 'name',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Category',
  key: 'category',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'AC Type',
  key: 'acType',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Duration',
  key: 'duration',
  width: 12,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Warranty',
  key: 'warranty',
  width: 12,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Price (ex-GST)',
  key: 'price',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: COLORS.brand
  }
}, {
  label: 'GST %',
  key: 'gst',
  width: 8,
  format: v => `${v}%`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total (incl-GST)',
  key: 'totalAmt',
  width: 14,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800,
    color: COLORS.brand
  }
}, {
  label: 'Status',
  key: 'active',
  width: 8,
  format: v => v ? 'Active' : 'Inactive',
  tdStyle: {
    fontSize: 12
  }
}];
const BLANK = {
  id: "",
  name: "",
  category: "Service",
  acType: "All Types",
  duration: "",
  warranty: "",
  price: "",
  gst: 18,
  includes: "",
  description: "",
  active: true,
  popular: false,
  checklist: [],
  tools: []
};

// ─── Shared input style ───────────────────────────────────────────────────────
const iStyle = (extra = {}) => ({
  padding: "7px 10px",
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: "#FAFAFA",
  fontFamily: FONTS.sans,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  ...extra
});
const FieldLabel = ({
  children
}) => <div className="ap-services-page-1">{children}</div>;

// ─── ServiceCard ──────────────────────────────────────────────────────────────
const ServiceCard = ({
  svc,
  onView,
  onEdit,
  onDelete
}) => {
  const cat = CAT_COLOR[svc.category] || CAT_COLOR.Service;
  const total = Math.round(svc.price * (1 + svc.gst / 100));
  return <div onClick={onView} onMouseEnter={e => {
    e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,.1)";
    e.currentTarget.style.transform = "translateY(-2px)";
  }} onMouseLeave={e => {
    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.05)";
    e.currentTarget.style.transform = "translateY(0)";
  }} className="ap-services-page-2">
      <div className="ap-services-page-3">
        <div className="ap-services-page-4">
          <span style={{
          background: cat.bg,
          color: cat.color
        }} className="ap-services-page-5">{svc.category}</span>
          {svc.popular && <span className="ap-services-page-6">⭐ Popular</span>}
          {!svc.active && <span className="ap-services-page-7">Inactive</span>}
        </div>
        <div onClick={e => e.stopPropagation()}>
          <ActionDropdown onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <div className="ap-services-page-8">{svc.name}</div>
      <div className="ap-services-page-9">{svc.id}</div>
      <div className="ap-services-page-10">{svc.description}</div>
      <div className="ap-services-page-11">
        <div className="ap-services-page-12">❄️ <strong className="ap-services-page-13">{svc.acType}</strong></div>
        <div className="ap-services-page-14">⏱ <strong className="ap-services-page-15">{svc.duration}</strong></div>
        <div className="ap-services-page-16">🛡 <strong className="ap-services-page-17">{svc.warranty}</strong></div>
      </div>
      <div className="ap-services-page-18">
        <div>
          <div className="ap-services-page-19">Base price</div>
          <div className="ap-services-page-20">₹{Number(svc.price).toLocaleString()}</div>
          <div className="ap-services-page-21">+{svc.gst}% GST = ₹{total.toLocaleString()}</div>
        </div>
        <button onClick={e => {
        e.stopPropagation();
        onEdit();
      }} className="ap-services-page-22">Edit</button>
      </div>
    </div>;
};

// ─── Add New Service Modal (used ONLY for new services) ───────────────────────
const ServiceFormModal = ({
  onSave,
  onClose
}) => {
  const [form, setForm] = useState({
    ...BLANK
  });
  const [checklistInput, setCI] = useState("");
  const [toolInput, setTI] = useState("");
  const [tab, setTab] = useState("basic");
  const set = key => e => setForm(p => ({
    ...p,
    [key]: e.target.value
  }));
  const toggle = key => () => setForm(p => ({
    ...p,
    [key]: !p[key]
  }));
  const addChecklist = () => {
    if (!checklistInput.trim()) return;
    setForm(p => ({
      ...p,
      checklist: [...p.checklist, checklistInput.trim()]
    }));
    setCI("");
  };
  const removeChecklist = i => setForm(p => ({
    ...p,
    checklist: p.checklist.filter((_, j) => j !== i)
  }));
  const addTool = () => {
    if (!toolInput.trim()) return;
    setForm(p => ({
      ...p,
      tools: [...p.tools, toolInput.trim()]
    }));
    setTI("");
  };
  const removeTool = i => setForm(p => ({
    ...p,
    tools: p.tools.filter((_, j) => j !== i)
  }));
  const fStyle = iStyle();
  const label = txt => <div className="ap-services-page-23">{txt}</div>;
  const tabBtn = (key, txt) => <button type="button" onClick={() => setTab(key)} style={{
    background: tab === key ? "var(--brand)" : "transparent",
    color: tab === key ? "white" : "var(--text-muted)",
    border: `1px solid ${tab === key ? COLORS.brand : COLORS.border}`
  }} className="ap-services-page-24">{txt}</button>;
  const total = form.price ? Math.round(Number(form.price) * (1 + Number(form.gst) / 100)) : 0;
  const suggestedSteps = {
    Installation: ["Site inspection", "Bracket installation", "Pipe routing", "Electrical connection", "Vacuum & leak test", "Gas charging", "Test run", "Customer demo & sign-off"],
    Service: ["Check error codes", "Clean air filter", "Wash indoor coil", "Flush drain pipe", "Check refrigerant pressure", "Inspect wiring", "Test thermostat", "Performance test"],
    Repair: ["Diagnose fault", "Quote customer", "Source parts", "Repair / replace", "Test operation", "Log parts used", "Customer sign-off"],
    AMC: ["Schedule visit", "Full service", "Check all units", "Log readings", "Update AMC card", "Next visit date"]
  };
  const commonTools = ["Manifold gauge set", "Vacuum pump", "Leak detector", "Digital thermometer", "Clamp meter", "Drill machine", "Pipe bender", "Fin comb", "Pressure washer", "R-32 cylinder", "R-410A cylinder", "Wire stripper", "Torque wrench", "Spanner set", "Insulation tape"];
  return <div className="ap-services-page-25">
      <div className="ap-services-page-26">
        {/* Modal header */}
        <div className="ap-services-page-27">
          <div>
            <div className="ap-services-page-28">Add New Service</div>
            <div className="ap-services-page-29">Fill in the service details for your catalogue</div>
          </div>
          <button type="button" onClick={onClose} className="ap-services-page-30">✕</button>
        </div>
        {/* Tabs */}
        <div className="ap-services-page-31">
          {tabBtn("basic", "📋 Basic Info")}
          {tabBtn("checklist", `✅ Checklist (${form.checklist.length})`)}
          {tabBtn("tools", `🔧 Tools (${form.tools.length})`)}
        </div>
        {/* Body */}
        <div className="ap-services-page-32">
          {tab === "basic" && <div className="ap-services-page-33">
              <div className="ap-services-page-34">
                <div>{label("Service Name *")}<input value={form.name} onChange={set("name")} placeholder="e.g. AC Installation – Split" style={fStyle} /></div>
                <div>{label("Service ID")}<input value={form.id} onChange={set("id")} placeholder="Auto / SVC-007" style={fStyle} /></div>
              </div>
              <div className="ap-services-page-35">
                <div>{label("Category *")}<select value={form.category} onChange={set("category")} style={fStyle}>{["Installation", "Service", "Repair", "AMC"].map(c => <option key={c}>{c}</option>)}</select></div>
                <div>{label("AC Type")}<select value={form.acType} onChange={set("acType")} style={fStyle}>{["All Types", "Split AC", "Cassette AC", "Window AC", "Inverter Split", "Ductable AC", "Tower AC"].map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
              <div>{label("Description")}<textarea value={form.description} onChange={set("description")} rows={3} placeholder="Brief description..." style={{
              ...fStyle
            }} className="ap-services-page-36" /></div>
              <div className="ap-services-page-37">
                <div>{label("Base Price (₹) *")}<input type="number" value={form.price} onChange={set("price")} placeholder="2500" style={fStyle} /></div>
                <div>{label("GST %")}<select value={form.gst} onChange={set("gst")} style={fStyle}>{[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}</select></div>
                <div>{label("Total (incl. GST)")}<div className="ap-services-page-38">₹{total.toLocaleString()}</div></div>
              </div>
              <div className="ap-services-page-39">
                <div>{label("Duration")}<input value={form.duration} onChange={set("duration")} placeholder="e.g. 2-3 hrs" style={fStyle} /></div>
                <div>{label("Warranty / Validity")}<input value={form.warranty} onChange={set("warranty")} placeholder="e.g. 90 Days" style={fStyle} /></div>
              </div>
              <div>{label("What's Included")}<textarea value={form.includes} onChange={set("includes")} rows={2} placeholder="Filter cleaning, coil wash..." style={{
              ...fStyle
            }} className="ap-services-page-40" /></div>
              <div className="ap-services-page-41">
                {[["active", "Active (visible)"], ["popular", "Mark as Popular ⭐"]].map(([key, lbl]) => <label key={key} className="ap-services-page-42">
                    <div onClick={toggle(key)} style={{
                background: form[key] ? "var(--brand)" : "var(--xcbd5e1)"
              }} className="ap-services-page-43">
                      <div style={{
                  left: form[key] ? "18px" : "2px"
                }} className="ap-services-page-44" />
                    </div>
                    {lbl}
                  </label>)}
              </div>
            </div>}

          {tab === "checklist" && <div>
              <div className="ap-services-page-45">Define the step-by-step checklist technicians must complete.</div>
              <div className="ap-services-page-46">
                <input value={checklistInput} onChange={e => setCI(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addChecklist();
              }
            }} placeholder="Add checklist step… (press Enter)" style={{
              ...fStyle
            }} className="ap-services-page-47" />
                <button type="button" onClick={addChecklist} className="ap-services-page-48">+ Add</button>
              </div>
              {form.checklist.length === 0 && <div className="ap-services-page-49">No steps yet.</div>}
              {form.checklist.map((step, i) => <div key={i} style={{
            background: i % 2 === 0 ? "var(--bg)" : "var(--white)"
          }} className="ap-services-page-50">
                  <span className="ap-services-page-51">{i + 1}</span>
                  <span className="ap-services-page-52">{step}</span>
                  <button type="button" onClick={() => removeChecklist(i)} className="ap-services-page-53">✕</button>
                </div>)}
              <div className="ap-services-page-54">
                <div className="ap-services-page-55">✅ Suggested steps for {form.category}</div>
                <div className="ap-services-page-56">
                  {(suggestedSteps[form.category] || []).map(s => <button type="button" key={s} onClick={() => setForm(p => ({
                ...p,
                checklist: p.checklist.includes(s) ? p.checklist : [...p.checklist, s]
              }))} style={{
                background: form.checklist.includes(s) ? "var(--success-border)" : "white",
                fontWeight: form.checklist.includes(s) ? "700" : "400"
              }} className="ap-services-page-57">
                      {form.checklist.includes(s) ? "✓ " : "+ "}{s}
                    </button>)}
                </div>
              </div>
            </div>}

          {tab === "tools" && <div>
              <div className="ap-services-page-58">List the tools and equipment required for this service.</div>
              <div className="ap-services-page-59">
                <input value={toolInput} onChange={e => setTI(e.target.value)} onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTool();
              }
            }} placeholder="Add tool… (press Enter)" style={{
              ...fStyle
            }} className="ap-services-page-60" />
                <button type="button" onClick={addTool} className="ap-services-page-61">+ Add</button>
              </div>
              {form.tools.length === 0 && <div className="ap-services-page-62">No tools added yet.</div>}
              <div className="ap-services-page-63">
                {form.tools.map((tool, i) => <span key={i} className="ap-services-page-64">
                    🔧 {tool}
                    <button type="button" onClick={() => removeTool(i)} className="ap-services-page-65">×</button>
                  </span>)}
              </div>
              <div className="ap-services-page-66">
                <div className="ap-services-page-67">🔧 Common AC service tools</div>
                <div className="ap-services-page-68">
                  {commonTools.map(t => <button type="button" key={t} onClick={() => setForm(p => ({
                ...p,
                tools: p.tools.includes(t) ? p.tools : [...p.tools, t]
              }))} style={{
                background: form.tools.includes(t) ? "var(--xfed7aa)" : "white",
                fontWeight: form.tools.includes(t) ? "700" : "400"
              }} className="ap-services-page-69">
                      {form.tools.includes(t) ? "✓ " : "+ "}{t}
                    </button>)}
                </div>
              </div>
            </div>}
        </div>
        {/* Footer */}
        <div className="ap-services-page-70">
          <button type="button" onClick={onClose} className="ap-services-page-71">Cancel</button>
          <button type="button" onClick={() => onSave(form)} className="ap-services-page-72">
            ✓ Add Service
          </button>
        </div>
      </div>
    </div>;
};

// ─── ServiceEditView — inline edit (used when Edit is clicked) ────────────────
const ServiceEditView = ({
  svc,
  onBack,
  onSave,
  onDelete
}) => {
  const [form, setForm] = useState({
    ...svc
  });
  const [checklistInput, setCI] = useState("");
  const [toolInput, setTI] = useState("");
  const [showJobSheet, setShowJobSheet] = useState(false);
  const set = key => e => setForm(p => ({
    ...p,
    [key]: e.target.value
  }));
  const toggle = key => () => setForm(p => ({
    ...p,
    [key]: !p[key]
  }));

  // ── Checklist handlers (fixed: type="button" prevents any form submit, explicit state update) ──
  const addChecklist = () => {
    const val = checklistInput.trim();
    if (!val) return;
    setForm(p => ({
      ...p,
      checklist: [...p.checklist, val]
    }));
    setCI("");
  };
  const removeChecklist = i => setForm(p => ({
    ...p,
    checklist: p.checklist.filter((_, j) => j !== i)
  }));

  // ── Tool handlers ─────────────────────────────────────────────────────────
  const addTool = () => {
    const val = toolInput.trim();
    if (!val) return;
    setForm(p => ({
      ...p,
      tools: [...p.tools, val]
    }));
    setTI("");
  };
  const removeTool = i => setForm(p => ({
    ...p,
    tools: p.tools.filter((_, j) => j !== i)
  }));
  const cat = CAT_COLOR[form.category] || CAT_COLOR.Service;
  const total = form.price ? Math.round(Number(form.price) * (1 + Number(form.gst) / 100)) : 0;
  const fStyle = iStyle();
  const suggestedSteps = {
    Installation: ["Site inspection", "Bracket installation", "Pipe routing", "Electrical connection", "Vacuum & leak test", "Gas charging", "Test run", "Customer demo & sign-off"],
    Service: ["Check error codes", "Clean air filter", "Wash indoor coil", "Flush drain pipe", "Check refrigerant pressure", "Inspect wiring", "Test thermostat", "Performance test"],
    Repair: ["Diagnose fault", "Quote customer", "Source parts", "Repair / replace", "Test operation", "Log parts used", "Customer sign-off"],
    AMC: ["Schedule visit", "Full service", "Check all units", "Log readings", "Update AMC card", "Next visit date"]
  };
  const commonTools = ["Manifold gauge set", "Vacuum pump", "Leak detector", "Digital thermometer", "Clamp meter", "Drill machine", "Pipe bender", "Fin comb", "Pressure washer", "R-32 cylinder", "R-410A cylinder", "Wire stripper", "Torque wrench", "Spanner set", "Insulation tape"];
  return <>
      <div className="fi ap-services-page-73">
        {/* Top bar */}
        <div className="ap-services-page-74">
          <button type="button" onClick={onBack} className="ap-services-page-75">←</button>
          <span className="ap-services-page-76">Services /</span>
          <span className="ap-services-page-77">{svc.id}</span>
          <div className="ap-services-page-78">
            <button type="button" onClick={onBack} className="ap-services-page-79">Cancel</button>
            <button type="button" onClick={() => onDelete(svc.id)} className="ap-services-page-80">🗑</button>
            <button type="button" onClick={() => onSave(form)} className="ap-services-page-81">✓ Save Changes</button>
          </div>
        </div>

        {/* Edit banner */}
        <div className="ap-services-page-82">
          ✏️ Editing <strong>{svc.name}</strong> — changes won't be saved until you click <strong>Save Changes</strong>.
        </div>

        <div className="ap-services-page-83">
          {/* ── Left column ── */}
          <div className="ap-services-page-84">

            {/* Main info card */}
            <div className="ap-services-page-85">
              {/* Badges row */}
              <div className="ap-services-page-86">
                <select value={form.category} onChange={set("category")} style={{
                ...fStyle
              }} className="ap-services-page-87">
                  {["Installation", "Service", "Repair", "AMC"].map(c => <option key={c}>{c}</option>)}
                </select>
                {[["active", "Active"], ["popular", "⭐ Popular"]].map(([key, lbl]) => <label key={key} className="ap-services-page-88">
                    <div onClick={toggle(key)} style={{
                  background: form[key] ? "var(--brand)" : "var(--xcbd5e1)"
                }} className="ap-services-page-89">
                      <div style={{
                    left: form[key] ? "16px" : "2px"
                  }} className="ap-services-page-90" />
                    </div>
                    {lbl}
                  </label>)}
              </div>

              {/* Name */}
              <div className="ap-services-page-91">
                <FieldLabel>Service Name</FieldLabel>
                <input value={form.name} onChange={set("name")} style={{
                ...fStyle
              }} className="ap-services-page-92" />
              </div>

              {/* Description */}
              <div className="ap-services-page-93">
                <FieldLabel>Description</FieldLabel>
                <textarea value={form.description} onChange={set("description")} rows={3} style={{
                ...fStyle
              }} className="ap-services-page-94" />
              </div>

              {/* AC Type / Duration / Warranty */}
              <div className="ap-services-page-95">
                <div>
                  <FieldLabel>AC Type</FieldLabel>
                  <select value={form.acType} onChange={set("acType")} style={fStyle}>
                    {["All Types", "Split AC", "Cassette AC", "Window AC", "Inverter Split", "Ductable AC", "Tower AC"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Duration</FieldLabel>
                  <input value={form.duration} onChange={set("duration")} style={fStyle} />
                </div>
                <div>
                  <FieldLabel>Warranty</FieldLabel>
                  <input value={form.warranty} onChange={set("warranty")} style={fStyle} />
                </div>
              </div>

              {/* What's Included */}
              <div>
                <FieldLabel>What's Included</FieldLabel>
                <textarea value={form.includes} onChange={set("includes")} rows={2} style={{
                ...fStyle
              }} className="ap-services-page-96" />
              </div>
            </div>

            {/* ── Checklist card ── */}
            <div className="ap-services-page-97">
              <div className="ap-services-page-98">
                ✅ Service Checklist <span className="ap-services-page-99">({form.checklist.length} steps)</span>
              </div>

              {/* Add step row */}
              <div className="ap-services-page-100">
                <input value={checklistInput} onChange={e => setCI(e.target.value)} onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addChecklist();
                }
              }} placeholder="Add step… (press Enter)" style={{
                ...fStyle
              }} className="ap-services-page-101" />
                <button type="button" onClick={addChecklist} className="ap-services-page-102">
                  + Add
                </button>
              </div>

              {form.checklist.length === 0 && <div className="ap-services-page-103">No steps yet. Add one above.</div>}

              {form.checklist.map((step, i) => <div key={i} className="ap-services-page-104">
                  <span className="ap-services-page-105">{i + 1}</span>
                  <span className="ap-services-page-106">{step}</span>
                  <button type="button" onClick={() => removeChecklist(i)} className="ap-services-page-107">✕</button>
                </div>)}

              {/* Suggested steps */}
              {(suggestedSteps[form.category] || []).length > 0 && <div className="ap-services-page-108">
                  <div className="ap-services-page-109">✅ Suggested for {form.category}</div>
                  <div className="ap-services-page-110">
                    {(suggestedSteps[form.category] || []).map(s => <button type="button" key={s} onClick={() => setForm(p => ({
                  ...p,
                  checklist: p.checklist.includes(s) ? p.checklist : [...p.checklist, s]
                }))} style={{
                  background: form.checklist.includes(s) ? "var(--success-border)" : "white",
                  fontWeight: form.checklist.includes(s) ? "700" : "400"
                }} className="ap-services-page-111">
                        {form.checklist.includes(s) ? "✓ " : "+ "}{s}
                      </button>)}
                  </div>
                </div>}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="ap-services-page-112">

            {/* Pricing card */}
            <div className="ap-services-page-113">
              <div className="ap-services-page-114">Pricing</div>
              <div className="ap-services-page-115">
                <div>
                  <FieldLabel>Base Price (₹)</FieldLabel>
                  <input type="number" value={form.price} onChange={set("price")} style={{
                  ...fStyle
                }} className="ap-services-page-116" />
                </div>
                <div>
                  <FieldLabel>GST %</FieldLabel>
                  <select value={form.gst} onChange={set("gst")} style={fStyle}>
                    {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <div className="ap-services-page-117">
                  <div className="ap-services-page-118">Total (incl. GST)</div>
                  <div className="ap-services-page-119">₹{total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tools card */}
            <div className="ap-services-page-120">
              <div className="ap-services-page-121">🔧 Required Tools</div>

              {/* Add tool row */}
              <div className="ap-services-page-122">
                <input value={toolInput} onChange={e => setTI(e.target.value)} onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTool();
                }
              }} placeholder="Add tool… (Enter)" style={{
                ...fStyle
              }} className="ap-services-page-123" />
                <button type="button" onClick={addTool} className="ap-services-page-124">
                  +
                </button>
              </div>

              {form.tools.length === 0 && <div className="ap-services-page-125">No tools added.</div>}
              <div style={{
              marginBottom: form.tools.length ? "10px" : "0"
            }} className="ap-services-page-126">
                {form.tools.map((t, i) => <span key={i} className="ap-services-page-127">
                    {t}
                    <button type="button" onClick={() => removeTool(i)} className="ap-services-page-128">×</button>
                  </span>)}
              </div>

              {/* Common tools suggestions */}
              <div className="ap-services-page-129">
                <div className="ap-services-page-130">Quick add:</div>
                <div className="ap-services-page-131">
                  {commonTools.map(t => <button type="button" key={t} onClick={() => setForm(p => ({
                  ...p,
                  tools: p.tools.includes(t) ? p.tools : [...p.tools, t]
                }))} style={{
                  background: form.tools.includes(t) ? "var(--xfed7aa)" : "white",
                  fontWeight: form.tools.includes(t) ? "700" : "400"
                }} className="ap-services-page-132">
                      {form.tools.includes(t) ? "✓" : "+"} {t}
                    </button>)}
                </div>
              </div>
            </div>

            {/* Save shortcut */}
            <button type="button" onClick={() => onSave(form)} className="ap-services-page-133">
              ✓ Save Changes
            </button>
            <button type="button" onClick={onBack} className="ap-services-page-134">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <PDFPreview open={showJobSheet} onClose={() => setShowJobSheet(false)} title={`Job Sheet — ${svc.name}`} filename={`job-sheet-${svc.id}`} template="service_job_sheet" data={svc} />
    </>;
};

// ─── ServiceDetail — view-only (no edit mode) ─────────────────────────────────
const ServiceDetail = ({
  svc,
  onBack,
  onEdit,
  openModal
}) => {
  const [showJobSheet, setShowJobSheet] = useState(false);
  const cat = CAT_COLOR[svc.category] || CAT_COLOR.Service;
  const total = Math.round(svc.price * (1 + svc.gst / 100));
  return <>
      <div className="fi ap-services-page-135">
        <div className="ap-services-page-136">
          <button type="button" onClick={onBack} className="ap-services-page-137">←</button>
          <span className="ap-services-page-138">Services /</span>
          <span className="ap-services-page-139">{svc.name}</span>
          <div className="ap-services-page-140">
            <button type="button" onClick={onEdit} className="ap-services-page-141">✎ Edit</button>
          </div>
        </div>

        <div className="ap-services-page-142">
          <div className="ap-services-page-143">
            <div className="ap-services-page-144">
              <div className="ap-services-page-145">
                <span style={{
                background: cat.bg,
                color: cat.color
              }} className="ap-services-page-146">{svc.category}</span>
                {svc.popular && <span className="ap-services-page-147">⭐ Popular</span>}
                <span style={{
                background: svc.active ? "var(--success-bg)" : "var(--bg)",
                color: svc.active ? "var(--success-text)" : "var(--text-muted)"
              }} className="ap-services-page-148">● {svc.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="ap-services-page-149">{svc.name}</div>
              <div className="ap-services-page-150">{svc.id}</div>
              <div className="ap-services-page-151">{svc.description}</div>
              <div className="ap-services-page-152">
                {[["❄️ AC Type", svc.acType], ["⏱ Duration", svc.duration], ["🛡 Warranty", svc.warranty]].map(([k, v]) => <div key={k} className="ap-services-page-153">
                    <div className="ap-services-page-154">{k}</div>
                    <div className="ap-services-page-155">{v}</div>
                  </div>)}
              </div>
              <div>
                <div className="ap-services-page-156">What's Included</div>
                <div className="ap-services-page-157">{svc.includes}</div>
              </div>
            </div>

            {svc.checklist.length > 0 && <div className="ap-services-page-158">
                <div className="ap-services-page-159">✅ Service Checklist ({svc.checklist.length} steps)</div>
                {svc.checklist.map((step, i) => <div key={i} className="ap-services-page-160">
                    <span className="ap-services-page-161">{i + 1}</span>
                    <span className="ap-services-page-162">{step}</span>
                  </div>)}
              </div>}
          </div>

          {/* Sidebar */}
          <div className="ap-services-page-163">
            <div className="ap-services-page-164">
              <div className="ap-services-page-165">Pricing</div>
              <div className="ap-services-page-166">₹{Number(svc.price).toLocaleString()}</div>
              <div className="ap-services-page-167">Base price (ex-GST)</div>
              {[["GST", `${svc.gst}%`, `+₹${Math.round(svc.price * svc.gst / 100).toLocaleString()}`], ["Total", "", `₹${total.toLocaleString()}`]].map(([k, pct, v]) => <div key={k} className="ap-services-page-168">
                  <span className="ap-services-page-169">{k} {pct}</span>
                  <span style={{
                color: k === "Total" ? "var(--brand)" : "var(--text-h2)"
              }} className="ap-services-page-170">{v}</span>
                </div>)}
            </div>

            {svc.tools.length > 0 && <div className="ap-services-page-171">
                <div className="ap-services-page-172">🔧 Required Tools</div>
                <div className="ap-services-page-173">
                  {svc.tools.map(t => <span key={t} className="ap-services-page-174">{t}</span>)}
                </div>
              </div>}

            <div className="ap-services-page-175">
              <div className="ap-services-page-176">Quick Actions</div>
              <div className="ap-services-page-177">
<button type="button" onClick={() => openModal('new_quotation', { preselect: svc })} className="ap-services-page-178">📄 Use in Quotation</button>
<button type="button" onClick={() => openModal('new_job', { fromService: {
  issue: `${svc.name}${svc.description ? ' — ' + svc.description : ''}`,
  ac: svc.acType,
  type: svc.category,
  priority: 'normal',
} })} className="ap-services-page-179">🔧 Create Job from Service</button>
                <button type="button" onClick={() => setShowJobSheet(true)} className="ap-services-page-180">📋 Print Job Sheet</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PDFPreview open={showJobSheet} onClose={() => setShowJobSheet(false)} title={`Job Sheet — ${svc.name}`} filename={`job-sheet-${svc.id}`} template="service_job_sheet" data={svc} />
    </>;
};

// ─── ServicesPage ─────────────────────────────────────────────────────────────
const ServicesPage = ({
  openModal
}) => {
  const [services, setServices] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false); // Add modal only
  const [viewTarget, setViewTarget] = useState(null); // { svc, mode: "view"|"edit" }
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
  servicesApi.list({ limit: 200 })
    .then(r => setServices((r.data ?? []).map(mapService)))
    .catch(() => {});
}, []);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredBySearch
  } = useTableSearch(services, ['id', 'name', 'category', 'acType', 'description'], {
    category: ''
  });
  const filtered = statusFilter ? filteredBySearch.filter(s => statusFilter === 'Active' === s.active) : filteredBySearch;
  const rowsForExport = filtered.map(s => ({
    ...s,
    totalAmt: Math.round(s.price * (1 + s.gst / 100))
  }));
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(filtered, 12);
  const {
    exportProps
  } = useExport({
    title: "Services Catalogue",
    filename: "cooltech-services",
    template: "generic_list",
    subtitle: `AC Services Platform · Services · ${filtered.length} records`,
    docId: "SVC-EXPORT",
    columns: SERVICE_COLUMNS,
    rows: rowsForExport,
    showTotals: true,
    totalColumns: ["price", "totalAmt"]
  });

  const buildPayload = form => ({
  name: form.name,
  category: form.category,
  acType: form.acType,
  duration: form.duration,
  warranty: form.warranty,
  price: Number(form.price) || 0,
  gstRate: Number(form.gst) || 0,
  includes: form.includes,
  description: form.description,
  isActive: form.active,
  popular: form.popular,
  checklist: form.checklist,
  tools: form.tools,
});

const handleAddSave = async (form) => {
  try {
    const res = await servicesApi.create(buildPayload(form));
    const created = res.data ?? res;
    setServices(prev => [...prev, mapService(created)]);
    setShowAddModal(false);
  } catch (e) {
    alert(e.message || 'Failed to add service.');
  }
};

const handleEditSave = async (updated) => {
  try {
    const res = await servicesApi.update(updated._id, buildPayload(updated));
    const saved = res.data ?? res;
    setServices(prev => prev.map(s => s._id === updated._id ? mapService(saved) : s));
    setViewTarget(null);
  } catch (e) {
    alert(e.message || 'Failed to save changes.');
  }
};

const handleDelete = async (id) => {
  const target = services.find(s => s.id === id || s._id === id);
  if (!target) return;
  try {
    await servicesApi.remove(target._id);
    setServices(prev => prev.filter(s => s._id !== target._id));
    setDeleteTarget(null);
    if (viewTarget?.svc?._id === target._id) setViewTarget(null);
  } catch (e) {
    alert(e.message || 'Failed to delete service.');
  }
};

  const active = services.filter(s => s.active).length;
  const avgPrice = Math.round(services.reduce((s, x) => s + Number(x.price), 0) / services.length);
  const popular = services.filter(s => s.popular).length;

  // ── Detail / Edit views ───────────────────────────────────────────────────
  if (viewTarget?.mode === "edit") {
    return <ServiceEditView svc={viewTarget.svc} onBack={() => setViewTarget(null)} onSave={handleEditSave} onDelete={id => {
      setDeleteTarget(id);
    }} />;
  }
  if (viewTarget?.mode === "view") {
  return <ServiceDetail svc={viewTarget.svc} onBack={() => setViewTarget(null)} onEdit={() => setViewTarget({
    svc: viewTarget.svc,
    mode: "edit"
  })} openModal={openModal} />;
}

  // ── List view ─────────────────────────────────────────────────────────────
  return <div className="fi ap-services-page-181">

      <div className="ap-services-page-182">
        <SectionHdr title="Services Catalogue" sub={`${services.length} services · manage your AC service offerings`} />
        <button type="button" onClick={() => setShowAddModal(true)} className="ap-services-page-183">
          + Add Service
        </button>
      </div>

      <div className="ap-services-page-184">
        <KCard label="Total Services" value={services.length} sub="in catalogue" icon="🗂" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Active" value={active} sub="visible to staff" icon="✅" iconBg="#F0FDF4" color="#15803D" delay="1" />
        <KCard label="Popular" value={popular} sub="marked as popular" icon="⭐" iconBg="#FEFCE8" color="#B45309" delay="2" />
        <KCard label="Avg Price" value={`₹${avgPrice.toLocaleString()}`} sub="ex-GST" icon="💰" iconBg="#EFF6FF" color="#1D4ED8" delay="3" />
      </div>

      {/* Toolbar */}
      <div className="ap-services-page-185">
        <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, category, AC type…" />
        <FilterSelect value={activeFilters.category} onChange={val => setFilter("category", val)} options={CATEGORIES} allLabel="All Categories" />
        <FilterSelect value={statusFilter} onChange={val => setStatusFilter(val)} options={["Active", "Inactive"]} allLabel="All Statuses" />
        <div className="ap-services-page-186">
            <ExportDropdown {...exportProps} />
          </div>
        <div className="ap-services-page-187">
          {[["grid", "⊞ Grid"], ["table", "≡ Table"]].map(([k, l]) => <button key={k} type="button" onClick={() => setViewMode(k)} style={{
          background: viewMode === k ? "var(--white)" : "transparent",
          color: viewMode === k ? "var(--text-h1)" : "var(--text-muted)",
          border: `1px solid ${viewMode === k ? COLORS.border : "transparent"}`
        }} className="ap-services-page-188">{l}</button>)}
        </div>
      </div>

      {filtered.length === 0 && <div className="ap-services-page-189">
          <div className="ap-services-page-190">🔍</div>No services match your search.
        </div>}

      {/* Grid view */}
      {viewMode === "grid" && filtered.length > 0 && <>
          <div className="ap-services-page-191">
            {paginated.map(svc => <ServiceCard key={svc.id} svc={svc} onView={() => setViewTarget({
          svc,
          mode: "view"
        })} onEdit={() => setViewTarget({
          svc,
          mode: "edit"
        })} onDelete={() => setDeleteTarget(svc.id)} />)}
          </div>
          {totalPages > 1 && <div className="ap-services-page-192">
              <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
            </div>}
        </>}

      {/* Table view */}
      {viewMode === "table" && filtered.length > 0 && <div className="ap-services-page-193">
          <div className="ap-services-page-194">
            <table className="ap-services-page-195">
              <Thead cols={["ID", "Service Name", "Category", "AC Type", "Duration", "Warranty", "Price (ex-GST)", "GST", "Total", "Status", ""]} />
              <tbody>
                {paginated.map((s, i) => {
              const cat = CAT_COLOR[s.category] || CAT_COLOR.Service;
              const tot = Math.round(s.price * (1 + s.gst / 100));
              return <tr key={s.id} className="row ap-services-page-196" onClick={() => setViewTarget({
                svc: s,
                mode: "view"
              })} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                      <td className="ap-services-page-197"><span className="ap-services-page-198">{s.id}</span></td>
                      <td className="ap-services-page-199">
                        <div className="ap-services-page-200">{s.name}</div>
                        {s.popular && <div className="ap-services-page-201">⭐ Popular</div>}
                      </td>
                      <td className="ap-services-page-202"><span style={{
                    background: cat.bg,
                    color: cat.color
                  }} className="ap-services-page-203">{s.category}</span></td>
                      <td className="ap-services-page-204">{s.acType}</td>
                      <td className="ap-services-page-205">{s.duration}</td>
                      <td className="ap-services-page-206">{s.warranty}</td>
                      <td className="ap-services-page-207"><span className="ap-services-page-208">₹{Number(s.price).toLocaleString()}</span></td>
                      <td className="ap-services-page-209"><span className="ap-services-page-210">{s.gst}%</span></td>
                      <td className="ap-services-page-211"><span className="ap-services-page-212">₹{tot.toLocaleString()}</span></td>
                      <td className="ap-services-page-213"><span style={{
                    background: s.active ? "var(--success-bg)" : "var(--bg)",
                    color: s.active ? "var(--success-text)" : "var(--text-muted)"
                  }} className="ap-services-page-214">● {s.active ? "Active" : "Inactive"}</span></td>
                      <td onClick={e => e.stopPropagation()} className="ap-services-page-215">
                        <ActionDropdown onView={() => setViewTarget({
                    svc: s,
                    mode: "view"
                  })} onEdit={() => setViewTarget({
                    svc: s,
                    mode: "edit"
                  })} onDelete={() => setDeleteTarget(s.id)} />
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>}

      {/* Add modal — only for new services */}
      {showAddModal && <ServiceFormModal onSave={handleAddSave} onClose={() => setShowAddModal(false)} />}

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This service will be permanently removed from your catalogue." />
    </div>;
};
export default ServicesPage;
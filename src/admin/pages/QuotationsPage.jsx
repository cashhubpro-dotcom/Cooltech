// ─── QuotationsPage.jsx — fully responsive for mobile & tablet ───────────────

import { useState, useEffect } from 'react';
import { QUOT_STATUS } from '../constants/statusMaps';
import { quotationsApi } from '../services/api';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
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
import useMagicImport from '../hooks/useMagicImport';
import MagicImportPanel from '../components/layout/MagicImportPanel';
import { UpdateStatusModal, SendEmailModal, ConvertToJobModal } from '../components/ui/QuotationModals';
import logoImg from '../assets/logo.png';
import signatureImg from '../assets/signature.png';
import { fmtDateDMY } from '../../shared/formatDate';
const VENDOR = {
  company: "Alisha Engineering",
  address: "L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415",
  contact: "Vakil Yadav",
  phone: "9724763909",
  email: "alishaengineering@gmail.com"
};
const QUOT_COLUMNS = [{
  label: "Quote ID",
  key: "id",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: "Customer",
  key: "customer",
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Contact",
  key: "contact",
  width: 16,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Phone",
  key: "phone",
  width: 14,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  }
}, {
  label: "Type",
  key: "type",
  width: 14,
  render: val => <TypeTag type={val} />,
  format: val => val
}, {
  label: "Status",
  key: "status",
  width: 10,
  render: val => <SBadge s={val} map={QUOT_STATUS} />,
  format: val => val
}, {
  label: "Subtotal",
  key: "subtotal",
  width: 12,
  excelKey: "Subtotal (₹)",
  render: val => <span className="ap-quotations-page-1">₹{Number(val).toLocaleString()}</span>,
  format: val => val
}, {
  label: "GST",
  key: "gst",
  width: 10,
  excelKey: "GST (₹)",
  render: val => <span className="ap-quotations-page-2">₹{Number(val).toLocaleString()}</span>,
  format: val => val
}, {
  label: "Total",
  key: "total",
  width: 12,
  excelKey: "Total (₹)",
  render: val => <span className="ap-quotations-page-3">₹{Number(val).toLocaleString()}</span>,
  format: val => val
}, {
  label: "Valid Till",
  key: "valid",
  width: 12,
  tdStyle: {
    fontSize: 12,
    color: COLORS.muted
  }
}];
const Logo = () => <img src={logoImg} alt="Alisha Engineering" className="ap-quotations-page-4" />;
const Signature = () => <img src={signatureImg} alt="Signature" className="ap-quotations-page-5" />;

// ─── QuotationDocView ─────────────────────────────────────────────────────────
const QuotationDocView = ({
  quot,
  editMode,
  editData,
  setEditData,
  editItems,
  setEditItems
}) => {
  const NAVY = "#1a2e5c";
  const fm = FONTS.mono;
  const set = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value
  }));
  const setItem = (i, key) => e => setEditItems(prev => prev.map((x, j) => j === i ? {
    ...x,
    [key]: e.target.value
  } : x));
  const addItem = () => setEditItems(prev => [...prev, {
    desc: "",
    qty: "",
    rate: ""
  }]);
  const removeItem = i => setEditItems(prev => prev.filter((_, j) => j !== i));
  const items = editMode ? editItems : quot.items;
  const subtotal = editMode ? editItems.reduce((s, x) => s + (parseFloat(x.qty) || 0) * (parseFloat(x.rate) || 0), 0) : quot.subtotal;
  const total = editMode ? subtotal : quot.total;
  // const MIN_ROWS    = 3;
  // const fillerCount = Math.max(0, MIN_ROWS - items.length);
  const cell = (extra = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: "5px 8px",
    fontSize: 12,
    color: "#111",
    verticalAlign: "top",
    ...extra
  });
  const eIn = (extra = {}) => ({
    width: "100%",
    padding: "3px 6px",
    border: "1.5px solid #94a3b8",
    borderRadius: 4,
    fontSize: 12,
    fontFamily: FONTS.sans,
    outline: "none",
    background: "#FAFAFA",
    boxSizing: "border-box",
    ...extra
  });
  return <div style={{
    border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`,
    boxShadow: editMode ? "0 0 0 3px var(--xea580c18)" : "0 2px 12px rgba(0,0,0,.08)"
  }} className="ap-quotations-page-6">
      <div className="ap-quotations-page-7">

        {/* ── Header: logo + company info ── */}
        <div className="ap-quotations-page-8">
          <div className="ap-quotations-page-9">
            <div className="ap-quotations-page-10">
              Installation Maintenance &amp; Repair of Air Conditioning,<br />Electronics Appliance, Fabrication &amp; Insulation Works.
            </div>
            <div className="ap-quotations-page-11">{VENDOR.address}</div>
          </div>
          <div className="ap-quotations-page-12"><Logo /></div>
        </div>

        {/* ── Subject row ── */}
        <div className="ap-quotations-page-13">
          <div className="ap-quotations-page-14">
            <strong>Date: -</strong>&nbsp;
            {editMode ? <input value={editData.created || ""} onChange={set("created")} style={{
            ...eIn()
          }} className="ap-quotations-page-15" /> : <span>{quot.created}</span>}
          </div>
          <br />
          <span className="ap-quotations-page-16">SUBJECT: QUOTATION FOR&nbsp;</span>
          {editMode ? <input value={editData.type || ""} onChange={set("type")} style={{
          ...eIn()
        }} className="ap-quotations-page-17" /> : <span className="ap-quotations-page-18">{quot.type}</span>}
        </div>

        {/* ── Vendor / Client table ── */}
        <table className="ap-quotations-page-19">
          <tbody>
            <tr>
              <td style={{
              ...cell({
                background: NAVY,
                color: "white",
                fontWeight: 700,
                textAlign: "center",
                width: "50%",
                fontSize: 12
              })
            }}>Vendor Details:</td>
              <td style={{
              ...cell({
                background: NAVY,
                color: "white",
                fontWeight: 700,
                textAlign: "center",
                fontSize: 12
              })
            }}>Client Details:</td>
            </tr>
            <tr>
              <td style={cell()}><span className="ap-quotations-page-20">Company Name: </span>{VENDOR.company}</td>
              <td style={cell()}><span className="ap-quotations-page-21">Company Name: </span>{editMode ? <input value={editData.customer || ""} onChange={set("customer")} style={eIn()} /> : quot.customer}</td>
            </tr>
            <tr>
              <td style={cell()}><span className="ap-quotations-page-22">Address: </span>{VENDOR.address}</td>
              <td style={cell()}><span className="ap-quotations-page-23">Address: </span>{editMode ? <input value={editData.address || ""} onChange={set("address")} style={eIn()} /> : quot.address || "—"}</td>
            </tr>
            <tr>
              <td style={cell()}><span className="ap-quotations-page-24">Contact Person: </span>{VENDOR.contact}</td>
              <td style={cell()}><span className="ap-quotations-page-25">Contact Person: </span>{editMode ? <input value={editData.contact || ""} onChange={set("contact")} style={eIn()} /> : quot.contact}</td>
            </tr>
            <tr>
              <td style={cell()}><span className="ap-quotations-page-26">Phone No: </span>{VENDOR.phone}</td>
              <td style={cell()}><span className="ap-quotations-page-27">Phone No: </span>{editMode ? <input value={editData.phone || ""} onChange={set("phone")} style={{
                ...eIn()
              }} className="ap-quotations-page-28" /> : quot.phone}</td>
            </tr>
            <tr>
              <td style={cell()}><span className="ap-quotations-page-29">Email: </span>{VENDOR.email}</td>
              <td style={cell()}><span className="ap-quotations-page-30">Email: </span>{editMode ? <input value={editData.email || ""} onChange={set("email")} style={eIn()} /> : quot.email || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* ── Line items table ── */}
        <table className="ap-quotations-page-31">
          <thead>
            <tr className="ap-quotations-page-32">
              {[{
              label: "SR. NO",
              w: "9%",
              align: "center"
            }, {
              label: "DESCRIPTION",
              w: "42%",
              align: "center"
            }, {
              label: "QTY",
              w: "10%",
              align: "center"
            }, {
              label: "RATE",
              w: "17%",
              align: "center"
            }, {
              label: "TOTAL",
              w: "22%",
              align: "center"
            }].map(col => <th key={col.label} style={{
              textAlign: col.align,
              width: col.w
            }} className="ap-quotations-page-33">{col.label}</th>)}
              {editMode && <th className="ap-quotations-page-34" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => <tr key={i}>
                <td style={{
              ...cell({
                textAlign: "center",
                fontFamily: fm
              })
            }}>{i + 1}</td>
                <td style={cell()}>{editMode ? <input value={item.desc} onChange={setItem(i, "desc")} style={eIn()} /> : item.desc}</td>
                <td style={{
              ...cell({
                textAlign: "center",
                fontFamily: fm
              })
            }}>{editMode ? <input value={item.qty} onChange={setItem(i, "qty")} style={{
                ...eIn({
                  textAlign: "center"
                })
              }} /> : item.qty}</td>
                <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm
              })
            }}>{editMode ? <input value={item.rate} onChange={setItem(i, "rate")} style={{
                ...eIn({
                  textAlign: "right"
                })
              }} /> : item.rate ? `₹${Number(item.rate).toLocaleString()}` : ""}</td>
                <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm,
                fontWeight: 700
              })
            }}>{item.qty && item.rate ? `₹${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}` : ""}</td>
                {editMode && <td className="ap-quotations-page-35"><button onClick={() => removeItem(i)} className="ap-quotations-page-36">✕</button></td>}
              </tr>)}
            {/* {Array.from({ length: fillerCount }).map((_, i) => (
              <tr key={`filler-${i}`}>
                <td style={{ ...cell({ textAlign:"center", color:"#aaa", fontFamily:fm }) }}>{items.length+i+1}</td>
                <td style={cell()}>&nbsp;</td><td style={cell()}/><td style={cell()}/><td style={cell()}/>
                {editMode && <td style={{ border:"none" }} />}
              </tr>
             ))} */}
            <tr>
              <td colSpan={3} className="ap-quotations-page-37" />
              <td style={{
              ...cell({
                textAlign: "right",
                fontWeight: 700,
                fontSize: 12
              })
            }}>SUBTOTAL</td>
              <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm,
                fontWeight: 600
              })
            }}>{subtotal ? `₹${subtotal.toLocaleString()}` : ""}</td>
              {editMode && <td className="ap-quotations-page-38" />}
            </tr>
            <tr>
              <td colSpan={3} className="ap-quotations-page-39" />
              <td style={{
              ...cell({
                textAlign: "right",
                fontWeight: 700,
                fontSize: 12
              })
            }}>DISCOUNT</td>
              <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm
              })
            }}>—</td>
              {editMode && <td className="ap-quotations-page-40" />}
            </tr>
            <tr>
              <td colSpan={3} className="ap-quotations-page-41" />
              <td style={{
              ...cell({
                textAlign: "right",
                fontWeight: 700,
                fontSize: 12
              })
            }}>TOTAL</td>
              <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm,
                fontWeight: 800,
                fontSize: 13
              })
            }}>{total ? `₹${total.toLocaleString()}` : ""}</td>
              {editMode && <td className="ap-quotations-page-42" />}
            </tr>
            <tr>
              <td colSpan={5} className="ap-quotations-page-43">
                * If you have any questions about this quotation, feel free to contact us.
              </td>
            </tr>
          </tbody>
        </table>

        {editMode && <div className="ap-quotations-page-44">
            <button onClick={addItem} className="ap-quotations-page-45">+ Add Line Item</button>
          </div>}
        {editMode && <div className="ap-quotations-page-46">
            <div>
              <label className="ap-quotations-page-47">NOTES (optional)</label>
              <textarea value={editData.notes || ""} onChange={e => setEditData(p => ({
            ...p,
            notes: e.target.value
          }))} placeholder="Add any notes for the customer…" rows={2} className="ap-quotations-page-48" />
            </div>
            <div>
              <label className="ap-quotations-page-49">TERMS &amp; CONDITIONS (optional)</label>
              <textarea value={editData.terms || ""} onChange={e => setEditData(p => ({
            ...p,
            terms: e.target.value
          }))} placeholder="Enter terms &amp; conditions…" rows={3} className="ap-quotations-page-50" />
            </div>
          </div>}
        {!editMode && (quot.notes || quot.terms) && <div className="ap-quotations-page-51">
            {quot.notes && <div className="ap-quotations-page-52"><div className="ap-quotations-page-53">NOTES</div><div className="ap-quotations-page-54">{quot.notes}</div></div>}
            {quot.terms && <div className="ap-quotations-page-55"><div className="ap-quotations-page-56">TERMS &amp; CONDITIONS</div><div className="ap-quotations-page-57">{quot.terms}</div></div>}
          </div>}
        <div className="ap-quotations-page-58">
          <div className="ap-quotations-page-59">
            <div>Thanking You,</div>
            <div className="ap-quotations-page-60">Mr. VAKIL YADAV</div>
            <div>{VENDOR.phone}</div>
            <div>From: {VENDOR.company}</div>
          </div>
          <div className="ap-quotations-page-61"><Signature /></div>
          <div className="ap-quotations-page-62">[Authorized Signatory]</div>
        </div>

      </div>
    </div>;
};

// ─── GenericQuotationDocView ─────────────────────────────────────────────────────────
const GenericQuotationDocView = ({
  quot,
  editMode,
  editData,
  setEditData,
  editItems,
  setEditItems
}) => {
  const fm = FONTS.mono;
  const set = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value
  }));
  const setItem = (i, key) => e => setEditItems(prev => prev.map((x, j) => j === i ? {
    ...x,
    [key]: e.target.value
  } : x));
  const addItem = () => setEditItems(prev => [...prev, {
    desc: "",
    qty: "",
    rate: ""
  }]);
  const removeItem = i => setEditItems(prev => prev.filter((_, j) => j !== i));
  const items = editMode ? editItems : quot.items;
  const subtotal = editMode ? editItems.reduce((s, x) => s + (parseFloat(x.qty) || 0) * (parseFloat(x.rate) || 0), 0) : quot.subtotal;
  const taxPercent = editMode ? editData.taxPercent ?? "" : quot.taxPercent ?? "";
  const taxAmount = taxPercent ? Math.round(subtotal * (parseFloat(taxPercent) || 0) / 100) : quot.gst || 0;
  const total = editMode ? subtotal + taxAmount : quot.total;
  const cell = (extra = {}) => ({
    border: `1px solid ${COLORS.border}`,
    padding: "8px 10px",
    fontSize: 13,
    color: COLORS.body,
    verticalAlign: "top",
    ...extra
  });
  const eIn = (extra = {}) => ({
    width: "100%",
    padding: "3px 6px",
    border: "1.5px solid #94a3b8",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: FONTS.sans,
    outline: "none",
    background: "#FAFAFA",
    boxSizing: "border-box",
    ...extra
  });
  const label = {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4
  };
  const fields = editMode ? editData.fields || [] : quot.fields || [];
  const setFieldValue = i => e => setEditData(p => ({
    ...p,
    fields: (p.fields || []).map((f, j) => j === i ? {
      ...f,
      value: e.target.value
    } : f)
  }));
  const setFieldLabel = i => e => setEditData(p => ({
    ...p,
    fields: (p.fields || []).map((f, j) => j === i ? {
      ...f,
      label: e.target.value
    } : f)
  }));
  const addField = () => setEditData(p => ({
    ...p,
    fields: [...(p.fields || []), {
      label: '',
      value: ''
    }]
  }));
  const removeField = i => setEditData(p => ({
    ...p,
    fields: (p.fields || []).filter((_, j) => j !== i)
  }));
  return <div style={{
    border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`,
    boxShadow: editMode ? "0 0 0 3px var(--xea580c18)" : "0 2px 12px rgba(0,0,0,.06)"
  }} className="ap-quotations-page-63">
      <div className="ap-quotations-page-64">

        {/* Header: Company + Logo */}
        <div className="ap-quotations-page-65">
          <div>
            <div className="ap-quotations-page-66">CoolTech AC Services</div>
            <div className="ap-quotations-page-67">Quotation</div>
          </div>
          <div className="ap-quotations-page-68">{quot.id}</div>
        </div>

        {/* Meta grid: Date / Quote# / Valid Till / Delivery / Payment Terms */}
        {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", padding: "16px 0", borderBottom: `1px solid ${COLORS.border}` }}>
          <div>
            <div style={label}>Date</div>
            {editMode ? <input value={editData.created||""} onChange={set("created")} style={eIn()} /> : <div style={{ fontSize: 13, fontWeight: 600 }}>{quot.created}</div>}
          </div>
          <div>
            <div style={label}>Valid Till</div>
            {editMode ? <input value={editData.valid||""} onChange={set("valid")} style={eIn()} /> : <div style={{ fontSize: 13, fontWeight: 600 }}>{quot.valid}</div>}
          </div>
          <div>
            <div style={label}>Delivery Within</div>
            {editMode ? <input value={editData.deliveryWithin||""} onChange={set("deliveryWithin")} placeholder="e.g. 5 Days" style={eIn()} /> : <div style={{ fontSize: 13, fontWeight: 600 }}>{quot.deliveryWithin || "—"}</div>}
          </div>
          <div>
            <div style={label}>Payment Terms</div>
            {editMode ? <input value={editData.paymentTerms||""} onChange={set("paymentTerms")} placeholder="e.g. 30 Days Net" style={eIn()} /> : <div style={{ fontSize: 13, fontWeight: 600 }}>{quot.paymentTerms || "—"}</div>}
          </div>
         </div> */}

        {/* Meta grid: Date / Valid Till are fixed; everything else came off the actual document */}
        <div className="ap-quotations-page-69">
          <div>
            <div className="ap-quotations-page-70">Date</div>
            {editMode ? <input value={editData.created || ""} onChange={set("created")} style={eIn()} /> : <div className="ap-quotations-page-71">{quot.created}</div>}
          </div>
          {/* <div>
            <div style={label}>Valid Till</div>
            {editMode ? <input value={editData.valid||""} onChange={set("valid")} style={eIn()} /> : <div style={{ fontSize: 13, fontWeight: 600 }}>{quot.valid}</div>}
           </div> */}
          {!fields.some(f => f.label?.toLowerCase().includes('valid')) && <div>
    <div className="ap-quotations-page-70">Valid Till</div>
    {editMode ? <input value={editData.valid || ""} onChange={set("valid")} style={eIn()} /> : <div className="ap-quotations-page-72">{quot.valid}</div>}
  </div>}
          {fields.map((f, i) => <div key={i} className="ap-quotations-page-73">
              {editMode ? <>
                  <input value={f.label} onChange={setFieldLabel(i)} placeholder="Field label" style={{
              ...eIn()
            }} className="ap-quotations-page-74" />
                  <div className="ap-quotations-page-75">
                    <input value={f.value} onChange={setFieldValue(i)} style={eIn()} />
                    <button onClick={() => removeField(i)} className="ap-quotations-page-76">✕</button>
                  </div>
                </> : <>
                  <div className="ap-quotations-page-70">{f.label}</div>
                  <div className="ap-quotations-page-77">{f.value}</div>
                </>}
            </div>)}
        </div>
        {editMode && <button onClick={addField} className="ap-quotations-page-78">+ Add Field</button>}

        {/* For: client */}
        <div className="ap-quotations-page-79">
          <div className="ap-quotations-page-70">For</div>
          {editMode ? <>
              <input value={editData.customer || ""} onChange={set("customer")} placeholder="Customer name" style={{
            ...eIn()
          }} className="ap-quotations-page-80" />
              <input value={editData.address || ""} onChange={set("address")} placeholder="Address" style={{
            ...eIn()
          }} className="ap-quotations-page-81" />
            </> : <>
              <div className="ap-quotations-page-82">{quot.customer}</div>
              <div className="ap-quotations-page-83">{quot.address || "—"}</div>
            </>}
        </div>

        {/* Item table */}
        <table className="ap-quotations-page-84">
          <thead>
            <tr className="ap-quotations-page-85">
              {["Item Description", "Qty", "Price", "Amount"].map(h => <th key={h} style={{
              textAlign: h === "Item Description" ? "left" : "right"
            }} className="ap-quotations-page-86">{h}</th>)}
              {editMode && <th className="ap-quotations-page-87" />}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => <tr key={i}>
                <td style={cell()}>{editMode ? <input value={item.desc} onChange={setItem(i, "desc")} style={eIn()} /> : item.desc}</td>
                <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm
              })
            }}>{editMode ? <input value={item.qty} onChange={setItem(i, "qty")} style={{
                ...eIn({
                  textAlign: "right"
                })
              }} /> : item.qty}</td>
                <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm
              })
            }}>{editMode ? <input value={item.rate} onChange={setItem(i, "rate")} style={{
                ...eIn({
                  textAlign: "right"
                })
              }} /> : item.rate ? `₹${Number(item.rate).toLocaleString()}` : ""}</td>
                <td style={{
              ...cell({
                textAlign: "right",
                fontFamily: fm,
                fontWeight: 700
              })
            }}>{item.qty && item.rate ? `₹${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}` : ""}</td>
                {editMode && <td className="ap-quotations-page-88"><button onClick={() => removeItem(i)} className="ap-quotations-page-89">✕</button></td>}
              </tr>)}
          </tbody>
        </table>
        {editMode && <button onClick={addItem} className="ap-quotations-page-90">+ Add Line Item</button>}

        {/* Terms + Totals row */}
        <div className="ap-quotations-page-91">
          <div className="ap-quotations-page-92">
            <div className="ap-quotations-page-70">Terms &amp; Conditions</div>
            {editMode ? <textarea value={editData.terms || ""} onChange={e => setEditData(p => ({
            ...p,
            terms: e.target.value
          }))} rows={4} placeholder="1) ...&#10;2) ..." style={{
            ...eIn()
          }} className="ap-quotations-page-93" /> : <div className="ap-quotations-page-94">{quot.terms || "—"}</div>}
          </div>
          <div className="ap-quotations-page-95">
            {[["Subtotal", subtotal ? `₹${subtotal.toLocaleString()}` : "₹0"], ["Tax %", editMode ? <input value={editData.taxPercent || ""} onChange={set("taxPercent")} placeholder="0" style={{
            ...eIn({
              textAlign: "right",
              width: 70
            })
          }} /> : quot.taxPercent ? `${quot.taxPercent}%` : "—"], ["Tax Amount", `₹${taxAmount.toLocaleString()}`]].map(([k, v]) => <div key={k} className="ap-quotations-page-96">
                <span className="ap-quotations-page-97">{k}</span>
                <span className="ap-quotations-page-98">{v}</span>
              </div>)}
            <div className="ap-quotations-page-99">
              <span className="ap-quotations-page-100">Total</span>
              <span className="ap-quotations-page-101">₹{(total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer signatures */}
        <div className="ap-quotations-page-102">
          <div className="ap-quotations-page-103">Prepared By</div>
          <div className="ap-quotations-page-104">Customer Signature</div>
        </div>
      </div>
    </div>;
};

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
}

// ─── QuotationsPage ───────────────────────────────────────────────────────────
const QuotationsPage = ({
  openModal
}) => {
  const {
    isMobile,
    isTablet,
    isDesktop
  } = useBreakpoint();
  const [open, setOpen] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const normaliseQuot = q => ({
    ...q,
    id: q.quotId || q._id,
    customer: typeof q.customer === 'object' ? q.customer?.name : q.customerName || q.customer || '',
    contact: q.contact || '',
    phone: q.phone || '',
    type: q.type || 'Service',
    items: Array.isArray(q.items) ? q.items : [],
    subtotal: q.subtotal ?? 0,
    gst: q.gst ?? 0,
    total: q.total ?? 0,
    validTill: q.validUntil ?fmtDateDMY(new Date(q.validUntil)) : q.validTill || '—',
    created: q.createdAt ?fmtDateDMY(new Date(q.createdAt)) : q.created || '',
    valid: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : q.valid || '',
    template: q.template || 'alisha',
    taxPercent: q.taxPercent ?? '',
    fields: Array.isArray(q.fields) ? q.fields : [],
    deliveryWithin: q.deliveryWithin || '',
    paymentTerms: q.paymentTerms || ''
  });
  useEffect(() => {
    quotationsApi.list({
      limit: 200
    }).then(r => setQuotations((r.data ?? []).map(normaliseQuot))).catch(() => {});
  }, []);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [editItems, setEditItems] = useState([]);
  const [showPDF, setShowPDF] = useState(false);
  const [showExportPDF, setShowExportPDF] = useState(false);

  // ── New modal states ──────────────────────────────────────────────────────
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const quot = open ? quotations.find(q => q.id === open || q._id === open) : null;
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredQuots
  } = useTableSearch(quotations, ['id', 'customer', 'contact', 'phone', 'type', 'status'], {
    type: '',
    status: ''
  });
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
  } = usePagination(filteredQuots, 10);
  const {
    exportProps
  } = useExport({
    title: "Quotations",
    filename: "cooltech-quotations",
    template: "generic_list",
    subtitle: `AC Services Platform · Quotations · ${filteredQuots.length} records`,
    docId: "QT-EXPORT",
    columns: QUOT_COLUMNS,
    rows: filteredQuots,
    showTotals: true,
    totalColumns: ["subtotal", "gst", "total"]
  });
  const seedEdit = (data, items) => {
    setEditData(data);
    setEditItems(items);
    setEditMode(true);
  };
  const discardIfTemp = id => {
    if (typeof id === 'string' && id.startsWith('TEMP-')) {
      setQuotations(prev => prev.filter(x => x.id !== id && x._id !== id));
    }
  };

  // const handleMagicFill = (data, items) => { seedEdit(data, items); };
  const handleMagicFill = (data, items) => {
    const tempId = `TEMP-${Date.now()}`;
    const calcTotal = items.reduce((s, x) => s + (parseFloat(x.qty) || 0) * (parseFloat(x.rate) || 0), 0);
    const draftQuot = normaliseQuot({
      _id: tempId,
      quotId: tempId,
      customerName: data.customer,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      address: data.address,
      type: data.type || 'Service',
      status: 'draft',
      items,
      subtotal: calcTotal,
      gst: 0,
      taxPercent: data.taxPercent || '',
      deliveryWithin: data.deliveryWithin || '',
      paymentTerms: data.paymentTerms || '',
      total: calcTotal,
      notes: data.notes,
      terms: data.terms,
      validUntil: data.valid || null,
      template: data.template || 'generic',
      fields: data.fields || [],
      createdAt: new Date().toISOString()
    });
    setQuotations(prev => [draftQuot, ...prev]);
    seedEdit(data, items);
    setOpen(tempId);
  };
  const openView = id => {
    setEditMode(false);
    setEditData({});
    setEditItems([]);
    setOpen(id);
  };
  // const openEdit = (id) => {
  //   const q = quotations.find(x => x.id === id || x._id === id);
  //   if (q) seedEdit({ customer:q.customer, contact:q.contact, phone:q.phone, email:q.email||'', address:q.address||'', type:q.type, status:q.status, created:q.created, valid:q.valid, notes:q.notes||'', terms:q.terms||'' }, q.items.map(i => ({ ...i })));
  //   setOpen(id);
  // };

  const openEdit = id => {
    const q = quotations.find(x => x.id === id || x._id === id);
    if (q) seedEdit({
      customer: q.customer,
      contact: q.contact,
      phone: q.phone,
      email: q.email || '',
      address: q.address || '',
      type: q.type,
      status: q.status,
      created: q.created,
      valid: q.valid,
      notes: q.notes || '',
      terms: q.terms || '',
      taxPercent: q.taxPercent || '',
      deliveryWithin: q.deliveryWithin || '',
      paymentTerms: q.paymentTerms || '',
      template: q.template || 'alisha'
    }, q.items.map(i => ({
      ...i
    })));
    setOpen(id);
  };

  // const handleSave = async () => {
  //   try {
  //     const q = quotations.find(x => x.id === open || x._id === open);
  //     const mongoId = q?._id || open;
  //     const doc = await quotationsApi.update(mongoId, { ...editData, items: editItems });
  //     setQuotations(prev => prev.map(x => x._id === doc._id ? normaliseQuot(doc) : x));
  //     setEditMode(false);
  //   } catch(e) { alert(e.message); }
  // };
  const handleSave = async () => {
    try {
      const isTemp = typeof open === 'string' && open.startsWith('TEMP-');
      const {
        customer,
        ...rest
      } = editData;
      const calcSubtotal = editItems.reduce((s, x) => s + (parseFloat(x.qty) || 0) * (parseFloat(x.rate) || 0), 0);
      const calcTax = editData.taxPercent ? Math.round(calcSubtotal * (parseFloat(editData.taxPercent) || 0) / 100) : parseFloat(editData.gst) || 0;
      const calcTotal = calcSubtotal + calcTax;
      const payload = {
        ...rest,
        customerName: customer,
        items: editItems,
        subtotal: calcSubtotal,
        gst: calcTax,
        total: calcTotal
      };
      let doc;
      if (isTemp) {
        doc = await quotationsApi.create({
          ...payload,
          status: 'draft',
          template: editData.template || 'generic'
        });
      } else {
        const q = quotations.find(x => x.id === open || x._id === open);
        const mongoId = q?._id || open;
        doc = await quotationsApi.update(mongoId, payload);
      }
      const normalized = normaliseQuot(doc);
      setQuotations(prev => isTemp ? [normalized, ...prev.filter(x => x.id !== open && x._id !== open)] : prev.map(x => x._id === doc._id ? normalized : x));
      setOpen(normalized.id);
      setEditMode(false);
    } catch (e) {
      alert(e.message);
    }
  };

  // const handleBack   = () => { setOpen(null); setEditMode(false); setEditData({}); setEditItems([]); setShowPDF(false); };
  const handleBack = () => {
    discardIfTemp(open);
    setOpen(null);
    setEditMode(false);
    setEditData({});
    setEditItems([]);
    setShowPDF(false);
  };
  const handleDelete = async id => {
    try {
      const q = quotations.find(x => x.id === id || x._id === id);
      const mongoId = q?._id || id;
      await quotationsApi.remove(mongoId);
      setQuotations(prev => prev.filter(x => x.id !== id && x._id !== id));
    } catch (e) {
      alert(e.message);
    }
    setDeleteTarget(null);
  };
  const magicImport = useMagicImport({
    quotations: quotations,
    onFilled: handleMagicFill,
    onViewExisting: openView
  });

  // ── Detail view ───────────────────────────────────────────────────────────
  if (quot) return <>
      <div className="fi ap-quotations-page-105">

        {/* Top bar */}
        <div className="quot-top-bar">
          <BackBtn onClick={handleBack} />
          <span className="ap-quotations-page-106">Quotations /</span>
          <span className="ap-quotations-page-107">{quot.id}</span>
          <div className="quot-top-actions">
            {editMode ? <>
                {/* <button onClick={() => { setEditMode(false); setEditItems([]); }} style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${COLORS.border}`, fontSize:12, fontWeight:600, cursor:"pointer", background:COLORS.white, color:COLORS.body }}>Cancel</button> */}
                <button onClick={() => {
              discardIfTemp(open);
              setEditMode(false);
              setEditItems([]);
              if (open?.startsWith('TEMP-')) setOpen(null);
            }} className="ap-quotations-page-108">Cancel</button>
                <button onClick={handleSave} className="ap-quotations-page-109">✓ Save</button>
              </> : <>
                <button onClick={() => openEdit(quot.id)} className="ap-quotations-page-110">✎ Edit</button>
                <button onClick={() => setDeleteTarget(quot.id)} className="ap-quotations-page-111">🗑</button>
              </>}
          </div>
        </div>

        {editMode && <div className="ap-quotations-page-112">
            ✏️ Editing <strong>{quot.id}</strong> — click <strong>Save</strong> to confirm changes.
          </div>}

        {/* Main content: doc + sidebar */}
        <div className="quot-detail-grid">

          {/* Quotation document */}
          {/* <QuotationDocView
            quot={quot} editMode={editMode}
            editData={editData} setEditData={setEditData}
            editItems={editMode ? editItems : quot.items}
            setEditItems={setEditItems}
           /> */}

            {/* Quotation document */}
{quot.template === 'generic' ? <GenericQuotationDocView quot={quot} editMode={editMode} editData={editData} setEditData={setEditData} editItems={editMode ? editItems : quot.items} setEditItems={setEditItems} /> : <QuotationDocView quot={quot} editMode={editMode} editData={editData} setEditData={setEditData} editItems={editMode ? editItems : quot.items} setEditItems={setEditItems} />}

          {/* Sidebar */}
          <div className="quot-detail-sidebar">

            {/* ── Actions ── */}
            {!editMode && <div className="ap-quotations-page-113">
                <div className="ap-quotations-page-114">Actions</div>
                <div className="ap-quotations-page-115">
                  <button className="btn ap-quotations-page-116" onClick={() => setShowEmailModal(true)}>
                    📧 Send to Customer
                  </button>
                  <button className="btn ap-quotations-page-117" onClick={() => setShowPDF(true)}>
                    📥 Download PDF
                  </button>
                  <button className="btn ap-quotations-page-118" onClick={() => setShowConvertModal(true)}>
                    ✓ Convert to Job
                  </button>
                </div>
              </div>}

            {/* ── Update Status ── */}
            {!editMode && <div className="ap-quotations-page-119">
                <div className="ap-quotations-page-120">Update Status</div>
                {["draft", "sent", "approved", "rejected", "expired"].map(s => {
              const m = QUOT_STATUS[s];
              return <button key={s} className="btn ap-quotations-page-121" onClick={() => setShowStatusModal(true)} style={{
                background: quot.status === s ? m.bg : "#F9FAFB",
                color: quot.status === s ? m.color : COLORS.muted,
                fontWeight: quot.status === s ? "700" : "500",
                border: `1px solid ${quot.status === s ? m.color + "30" : COLORS.border}`
              }}>
                      {quot.status === s ? "● " : "→ "}{m.label}
                    </button>;
            })}
              </div>}

            {/* ── Quote Info ── */}
            <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
          }} className="ap-quotations-page-122">
              <div className="ap-quotations-page-123">
                Quote Info{editMode && <span className="ap-quotations-page-124">← edit in doc</span>}
              </div>
              {[["Quote ID", quot.id], ["Created", editMode ? editData.created || quot.created : quot.created], ["Valid Till", editMode ? editData.valid || quot.valid : quot.valid], ["Status", quot.status], ["Items", `${quot.items.length} line items`]].map(([k, v]) => <div key={k} className="ap-quotations-page-125">
                  <span className="ap-quotations-page-126">{k}</span>
                  <span style={{
                fontFamily: k === "Quote ID" ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
              }} className="ap-quotations-page-127">{v}</span>
                </div>)}
            </div>

            {editMode && <div className="ap-quotations-page-128">
                <button onClick={handleSave} className="ap-quotations-page-129">✓ Save Changes</button>
                <button onClick={() => {
              discardIfTemp(open);
              setEditMode(false);
              setEditItems([]);
              if (open?.startsWith('TEMP-')) setOpen(null);
            }} className="ap-quotations-page-130">Cancel</button>
              </div>}
          </div>
        </div>
      </div>

      {/* ── Existing modals ── */}
      <PDFPreview open={showPDF} onClose={() => setShowPDF(false)} title={quot.id} filename={`quotation-${quot.id}`} template="quotation" data={quot} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setOpen(null);
    }} onCancel={() => setDeleteTarget(null)} message="This quotation will be permanently removed and cannot be recovered!" />

      {/* ── New functional modals ── */}
      {showStatusModal && <UpdateStatusModal quot={quot} onClose={() => setShowStatusModal(false)} onUpdated={updated => {
      setQuotations(prev => prev.map(q => q._id === updated._id || q.id === updated.quotId ? normaliseQuot(updated) : q));
    }} />}

      {showEmailModal && <SendEmailModal quot={quot} onClose={() => setShowEmailModal(false)} onSent={() => {
      setQuotations(prev => prev.map(q => q._id === quot._id || q.id === quot.id ? {
        ...q,
        status: 'sent'
      } : q));
    }} />}

      {showConvertModal && <ConvertToJobModal quot={quot} onClose={() => setShowConvertModal(false)} onConverted={() => {
      setQuotations(prev => prev.map(q => q._id === quot._id || q.id === quot.id ? {
        ...q,
        status: 'approved'
      } : q));
    }} />}
    </>;

  // ── List view ─────────────────────────────────────────────────────────────
  const counts = {
    total: quotations.length,
    sent: quotations.filter(q => q.status === "sent").length,
    approved: quotations.filter(q => q.status === "approved").length,
    value: quotations.filter(q => q.status === "approved").reduce((s, q) => s + q.total, 0)
  };
  return <>
      <div className="fi ap-quotations-page-131">

        {/* Header */}
        <div className="ap-quotations-page-132">
          <SectionHdr title="Quotations" sub={`${total} of ${quotations.length} quotes`} />
          <div className="ap-quotations-page-133">
            <button onClick={() => magicImport.setPanelOpen(v => !v)} style={{
            background: magicImport.panelOpen ? "var(--xfff3e0)" : "var(--white)",
            border: `1.5px solid ${magicImport.panelOpen ? '#E65100' : COLORS.border}`,
            color: magicImport.panelOpen ? "var(--xe65100)" : "var(--text-body)"
          }} className="ap-quotations-page-134">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 5L8 2l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12h12v2H2z" fill="currentColor" opacity=".25" /></svg>
              Magic Import
              <span className="ap-quotations-page-135">AI</span>
            </button>
            <button onClick={() => openModal("new_quotation")} className="ap-quotations-page-136">
              + New Quotation
            </button>
          </div>
        </div>

        {magicImport.panelOpen && <MagicImportPanel {...magicImport} />}

        {/* KPI cards */}
        <div className="quot-kpi-grid">
          <KCard label="Total Quotes" value={counts.total} sub="all time" icon="📄" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
          <KCard label="Sent / Pending" value={counts.sent} sub="awaiting reply" icon="📤" iconBg="#EFF6FF" color="#3B82F6" delay="1" />
          <KCard label="Approved" value={counts.approved} sub="converted to jobs" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="2" />
          <KCard label="Total Value" value={`₹${(counts.value / 1000).toFixed(0)}K`} sub="approved quotes only" icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
        </div>

        {/* Table */}
        <div className="ap-quotations-page-137">
          <div className="ap-quotations-page-138">
            <div style={{
            width: isMobile ? "60%" : "auto"
          }}>
              <TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, contact, type…" />
            </div>
            <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)} options={["Service", "Repair", "Installation", "AMC"]} allLabel="All Types" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["draft", "sent", "approved", "rejected", "Expired"]} allLabel="All Status" />
            <div className="ap-quotations-page-139"><ExportDropdown {...exportProps} /></div>
          </div>
          <div className="ap-quotations-page-140">
            <table className="ap-quotations-page-141">
              <Thead cols={["Quote ID", "Customer", "Contact", "Type", "Items", "Subtotal", "GST", "Total", "Valid Till", "Status", ""]} />
              <tbody>
                {paginated.map((q, i) => <tr key={q.id} className="row ap-quotations-page-142" style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                    <td className="ap-quotations-page-143"><span className="ap-quotations-page-144">{q.id}</span></td>
                    <td className="ap-quotations-page-145">{q.customer}</td>
                    <td className="ap-quotations-page-146">
                      <div className="ap-quotations-page-147">{q.contact}</div>
                      <div className="ap-quotations-page-148">{q.phone}</div>
                    </td>
                    <td className="ap-quotations-page-149"><TypeTag type={q.type} /></td>
                    <td className="ap-quotations-page-150"><span className="ap-quotations-page-151">{q.items.length} items</span></td>
                    <td className="ap-quotations-page-152"><span className="ap-quotations-page-153">₹{q.subtotal.toLocaleString()}</span></td>
                    <td className="ap-quotations-page-154"><span className="ap-quotations-page-155">₹{q.gst.toLocaleString()}</span></td>
                    <td className="ap-quotations-page-156"><span className="ap-quotations-page-157">₹{q.total.toLocaleString()}</span></td>
                    <td style={{
                  color: q.status === "expired" ? "var(--danger-text)" : "var(--text-muted)"
                }} className="ap-quotations-page-158">{q.valid}</td>
                    <td className="ap-quotations-page-159"><SBadge s={q.status} map={QUOT_STATUS} /></td>
                    <td onClick={e => e.stopPropagation()} className="ap-quotations-page-160">
                      <ActionDropdown onView={() => openView(q.id)} onEdit={() => openEdit(q.id)} onDelete={() => setDeleteTarget(q.id)} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
        </div>
      </div>

      <PDFPreview open={showExportPDF} onClose={() => setShowExportPDF(false)} title="Quotations Export" filename="quotations-export" template="generic_list" data={{
      title: "Quotations",
      columns: QUOT_COLUMNS,
      rows: filteredQuots
    }} />
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This quotation will be permanently removed and cannot be recovered!" />
    </>;
};
export default QuotationsPage;
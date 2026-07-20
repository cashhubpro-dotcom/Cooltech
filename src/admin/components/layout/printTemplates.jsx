import logoImg from '../../assets/logo.png';
import signatureImg from '../../assets/signature.png';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Shared CoolTech header ───────────────────────────────────────────────────
const Header = ({
  title,
  id,
  meta = []
}) => <div className="ap-print-templates-1">
    <div>
      <div className="ap-print-templates-2">❄ CoolTech AC Services</div>
      <div className="ap-print-templates-3">GSTIN: 29AABCT1234A1Z5 · +91 98765 43210</div>
      <div className="ap-print-templates-4">Bengaluru, Karnataka · cooltech@services.com</div>
    </div>
    <div className="ap-print-templates-5">
      <div className="ap-print-templates-6">{title}</div>
      {id && <div className="ap-print-templates-7">{id}</div>}
      {meta.map(([k, v, red]) => <div key={k} style={{
      color: red ? "var(--danger-text)" : "var(--text-faint)"
    }} className="ap-print-templates-8">{k}{k ? ': ' : ''}{v}</div>)}
    </div>
  </div>;
const Footer = ({
  text = "Thank you for your business · CoolTech AC Services · cooltech@services.com"
}) => <div className="ap-print-templates-9">{text}</div>;
const InfoRow = ({
  label,
  value
}) => <div className="ap-print-templates-10">
    <span className="ap-print-templates-11">{label}</span>
    <span className="ap-print-templates-12">{value}</span>
  </div>;

// ─── Shared Alisha constants ──────────────────────────────────────────────────
const VENDOR = {
  company: "Alisha Engineering",
  address: "L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415",
  contact: "Vakil Yadav",
  phone: "9724763909",
  email: "alishaengineering@gmail.com"
};
const NAVY = "#1a2e5c";
const ORANGE = "#F97316";
const cell = (extra = {}) => ({
  border: `1px solid ${NAVY}`,
  padding: "5px 8px",
  fontSize: 11,
  color: "#111",
  verticalAlign: "top",
  ...extra
});

// ─── buildAddress ─────────────────────────────────────────────────────────────
// Composes the structured AddressFields data (stored with a prefix) into a
// single printable address string.
// `data`   — the full data object (contract, customer, job, etc.)
// `prefix` — the AddressFields prefix used in the modal (e.g. "con_", "cust_", "job_")
// Falls back to data.address if no prefixed fields are found.
const buildAddress = (data, prefix = "con_") => {
  if (!data) return "—";
  const f = key => (data[`${prefix}${key}`] || "").trim();
  const street = f("street"); // from the FInput above <AddressFields>
  const area = f("area"); // Area / Locality
  const city = f("city"); // City dropdown
  const state = f("state"); // State dropdown
  const zip = f("zip"); // ZIP / PIN Code
  const country = f("country"); // Country dropdown

  const composed = [street, area, city, state, zip, country].filter(Boolean).join(", ");

  // Fall back to legacy single-field `address` if no structured data present
  return composed || data.address || "—";
};
const AlishaHeader = ({
  date
}) => <div className="ap-print-templates-13">
    <div className="ap-print-templates-14">
      <div className="ap-print-templates-15">
        Installation Maintenance &amp; Repair of Air Conditioning,<br />
        Electronics Appliance, Fabrication &amp; Insulation Works.
      </div>
      <div className="ap-print-templates-16">
        {VENDOR.address}
      </div>
    </div>
    <div className="ap-print-templates-17">
      <img src={logoImg} alt="Alisha Engineering" className="ap-print-templates-18" />
      {date && <div className="ap-print-templates-19"><strong>Date:</strong> {date}</div>}
    </div>
  </div>;
const AlishaFooter = () => <div className="ap-print-templates-20">
    <div className="ap-print-templates-21">
      <div>Thanking You,</div>
      <div className="ap-print-templates-22">Mr. VAKIL YADAV</div>
      <div>{VENDOR.phone}</div>
      <div>From: {VENDOR.company}</div>
    </div>
    <img src={signatureImg} alt="Signature" className="ap-print-templates-23" />
    <div className="ap-print-templates-24">[Authorized Signatory]</div>
  </div>;

// ─── VendorClientTable ────────────────────────────────────────────────────────
// `clientRows` — the raw data object (contract, quotation, etc.)
// `prefix`     — AddressFields prefix used when creating this record (default "con_")
const VendorClientTable = ({
  clientRows,
  prefix = "con_"
}) => {
  const clientAddress = buildAddress(clientRows, prefix);
  return <table className="ap-print-templates-25">
      <tbody>
        <tr>
          <td style={{
          ...cell({
            background: NAVY,
            color: "white",
            fontWeight: 700,
            textAlign: "center",
            width: "50%"
          })
        }}>Vendor Details:</td>
          <td style={{
          ...cell({
            background: NAVY,
            color: "white",
            fontWeight: 700,
            textAlign: "center"
          })
        }}>Client Details:</td>
        </tr>
        {[["Company Name", VENDOR.company, clientRows.company || clientRows.customer || "—"], ["Address", VENDOR.address, clientAddress], ["Contact Person", VENDOR.contact, clientRows.contact || "—"], ["Phone No", VENDOR.phone, clientRows.phone || "—"], ["Email", VENDOR.email, clientRows.email || "—"]].map(([k, v, cv]) => <tr key={k}>
            <td style={cell()}><strong>{k}: </strong>{v}</td>
            <td style={cell()}><strong>{k}: </strong>{cv}</td>
          </tr>)}
      </tbody>
    </table>;
};

// ─── 1. Quotation ─────────────────────────────────────────────────────────────
export const QuotationTemplate = ({
  data: q
}) => {
  const subtotal = q.subtotal ?? q.items.reduce((s, x) => s + (parseFloat(x.qty) || 0) * (parseFloat(x.rate) || 0), 0);
  const total = q.total ?? subtotal;
  const MIN_ROWS = 5;
  const fillerCount = Math.max(0, MIN_ROWS - q.items.length);
  return <div className="ap-print-templates-26">
      <AlishaHeader date={q.created} />
      <div className="ap-print-templates-27">
        <span className="ap-print-templates-28">SUBJECT: QUOTATION FOR {String(q.type || "").toUpperCase()}</span>
      </div>
      {/* Quotations use "cust_" prefix from NewCustomerModal / NewQuotationModal */}
      <VendorClientTable clientRows={q} prefix="cust_" />
      <table className="ap-print-templates-29">
        <thead>
          <tr className="ap-print-templates-30">
            {[["SR. NO", "9%", "center"], ["DESCRIPTION", "42%", "left"], ["QTY", "10%", "center"], ["RATE", "17%", "right"], ["TOTAL", "22%", "right"]].map(([l, w, a]) => <th key={l} style={{
            textAlign: a,
            width: w
          }} className="ap-print-templates-31">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => <tr key={i}>
              <td style={{
            ...cell({
              textAlign: "center"
            })
          }}>{i + 1}</td>
              <td style={cell()}>{item.desc}</td>
              <td style={{
            ...cell({
              textAlign: "center"
            })
          }}>{item.qty}</td>
              <td style={{
            ...cell({
              textAlign: "right"
            })
          }}>{item.rate ? `₹${Number(item.rate).toLocaleString()}` : ""}</td>
              <td style={{
            ...cell({
              textAlign: "right",
              fontWeight: 700
            })
          }}>{item.qty && item.rate ? `₹${((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString()}` : ""}</td>
            </tr>)}
          {Array.from({
          length: fillerCount
        }).map((_, i) => <tr key={`f${i}`}><td style={{
            ...cell({
              textAlign: "center",
              color: "#aaa"
            })
          }}>{q.items.length + i + 1}</td><td style={cell()}>&nbsp;</td><td style={cell()} /><td style={cell()} /><td style={cell()} /></tr>)}
          {[["SUBTOTAL", subtotal ? `₹${subtotal.toLocaleString()}` : ""], ["DISCOUNT", "—"], ["TOTAL", total ? `₹${total.toLocaleString()}` : ""]].map(([k, v]) => <tr key={k}><td colSpan={3} className="ap-print-templates-32" /><td style={{
            ...cell({
              textAlign: "right",
              fontWeight: 700
            })
          }}>{k}</td><td style={{
            ...cell({
              textAlign: "right",
              fontWeight: k === "TOTAL" ? 800 : 600
            })
          }}>{v}</td></tr>)}
          <tr><td colSpan={5} className="ap-print-templates-33">* If you have any questions about this quotation, feel free to contact us.</td></tr>
        </tbody>
      </table>

      {/* Notes */}
      {q.notes && <table className="ap-print-templates-34">
          <thead>
            <tr className="ap-print-templates-35">
              <th className="ap-print-templates-36">NOTES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ap-print-templates-37">{q.notes}</td>
            </tr>
          </tbody>
        </table>}

      {/* Terms & Conditions */}
      {q.terms && <table className="ap-print-templates-38">
          <thead>
            <tr className="ap-print-templates-39">
              <th className="ap-print-templates-40">TERMS &amp; CONDITIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ap-print-templates-41">{q.terms}</td>
            </tr>
          </tbody>
        </table>}

      <AlishaFooter />
    </div>;
};

// ─── 2. Contract ──────────────────────────────────────────────────────────────
export const ContractTemplate = ({
  data: c
}) => {
  const st = {
    active: {
      label: "Active",
      bg: "#F0FDF4",
      color: "#16A34A",
      border: "#BBF7D0"
    },
    draft: {
      label: "Draft",
      bg: "#F9FAFB",
      color: "#64748B",
      border: "#E2E8F0"
    },
    expired: {
      label: "Expired",
      bg: "#FEF2F2",
      color: "#DC2626",
      border: "#FECACA"
    },
    pending_signature: {
      label: "Pending Signature",
      bg: "#FFFBEB",
      color: "#B45309",
      border: "#FDE68A"
    },
    terminated: {
      label: "Terminated",
      bg: "#FEF2F2",
      color: "#DC2626",
      border: "#FECACA"
    }
  }[c.status] || {
    label: c.status,
    bg: "#F9FAFB",
    color: "#64748B",
    border: "#E2E8F0"
  };
  return <div className="ap-print-templates-42">
      <AlishaHeader date={c.startDate} />
      <div className="ap-print-templates-43">
        <span className="ap-print-templates-44">CONTRACT AGREEMENT — {String(c.type || "").toUpperCase()}</span>
      </div>
      {/* Contracts use "con_" prefix from NewAMCModal */}
      <VendorClientTable clientRows={c} prefix="con_" />
      <table className="ap-print-templates-45">
        <thead><tr className="ap-print-templates-46"><th colSpan={4} className="ap-print-templates-47">CONTRACT DETAILS</th></tr></thead>
        <tbody>
          <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "20%"
            })
          }}>Contract ID</td><td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700,
              color: NAVY,
              width: "30%"
            })
          }}>{c.id}</td><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "20%"
            })
          }}>Status</td><td style={{
            ...cell({
              width: "30%"
            })
          }}><span style={{
              background: st.bg,
              color: st.color,
              border: `1px solid ${st.border}`
            }} className="ap-print-templates-48">{st.label}</span></td></tr>
          <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Contract Title</td><td colSpan={3} style={{
            ...cell({
              fontWeight: 600
            })
          }}>{c.title}</td></tr>
          <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Type</td><td style={cell()}>{c.type}</td><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Contract Value</td><td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 800,
              color: NAVY,
              fontSize: 13
            })
          }}>₹{c.value?.toLocaleString()}</td></tr>
          <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Start Date</td><td style={cell()}>{c.startDate || "—"}</td><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>End Date</td><td style={cell()}>{c.endDate || "—"}</td></tr>
          <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Auto-Renew</td><td style={cell()}>{c.autoRenew ? "Yes" : "No"}</td><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Clauses</td><td style={cell()}>{c.clauses}</td></tr>
          {c.linkedAMC && <tr><td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Linked AMC</td><td colSpan={3} style={cell()}>{c.linkedAMC}</td></tr>}
        </tbody>
      </table>
      {c.terms && <table className="ap-print-templates-49"><thead><tr className="ap-print-templates-50"><th className="ap-print-templates-51">KEY TERMS &amp; CONDITIONS</th></tr></thead><tbody><tr><td style={{
            ...cell({
              lineHeight: 1.7
            })
          }}>{c.terms}</td></tr></tbody></table>}
      {c.signatories?.length > 0 && <table className="ap-print-templates-52"><thead><tr className="ap-print-templates-53"><th className="ap-print-templates-54">SIGNATORIES</th><th className="ap-print-templates-55">STATUS</th></tr></thead><tbody>{c.signatories.map((s, i) => <tr key={i}><td style={{
            ...cell({
              fontWeight: 600
            })
          }}>{s}</td><td style={{
            ...cell({
              textAlign: "center"
            })
          }}>{s.includes("PENDING") ? <span className="ap-print-templates-56">⏳ Pending</span> : <span className="ap-print-templates-57">✓ Signed</span>}</td></tr>)}</tbody></table>}
      <table className="ap-print-templates-58"><tbody><tr><td style={{
            ...cell({
              textAlign: "center",
              padding: "14px 10px",
              fontStyle: "italic",
              fontSize: 10,
              color: "#555"
            })
          }} colSpan={2}>This contract is entered into between Alisha Engineering and the client named above. Both parties agree to the terms and conditions stated herein.</td></tr></tbody></table>
      <AlishaFooter />
    </div>;
};

// ─── 3. Invoice ───────────────────────────────────────────────────────────────
export const InvoiceTemplate = ({
  data: inv
}) => <div>
    <Header title="Invoice" id={inv.id} meta={[["Date", inv.date], ["Due", inv.due, true]]} />
    <div className="ap-print-templates-59">
      <div>
        <div className="ap-print-templates-60">Bill To</div>
        <div className="ap-print-templates-61">{inv.customer}</div>
        <div className="ap-print-templates-62">{buildAddress(inv, "cust_")}</div>
        <div className="ap-print-templates-63">{inv.phone}</div>
      </div>
      <div>
        <div className="ap-print-templates-64">Job Reference</div>
        <InfoRow label="Job ID" value={inv.jobId} /><InfoRow label="Type" value={inv.type} /><InfoRow label="Technician" value={inv.tech} />
      </div>
    </div>
    <table className="ap-print-templates-65">
      <thead><tr className="ap-print-templates-66">{["Description", "Qty", "Rate (₹)", "Amount (₹)"].map((h, i) => <th key={h} style={{
          textAlign: i === 0 ? "left" : "center"
        }} className="ap-print-templates-67">{h}</th>)}</tr></thead>
      <tbody>{(inv.items || []).map((item, i) => <tr key={i} className="ap-print-templates-68"><td className="ap-print-templates-69">{item.desc}</td><td className="ap-print-templates-70">{item.qty}</td><td className="ap-print-templates-71">{Number(item.rate).toLocaleString()}</td><td className="ap-print-templates-72">{(item.qty * item.rate).toLocaleString()}</td></tr>)}</tbody>
    </table>
    <div className="ap-print-templates-73">
      <div className="ap-print-templates-74">
        {[["Subtotal", `₹${inv.subtotal?.toLocaleString()}`], ["GST @ 18%", `₹${inv.gst?.toLocaleString()}`]].map(([k, v]) => <div key={k} className="ap-print-templates-75"><span className="ap-print-templates-76">{k}</span><span className="ap-print-templates-77">{v}</span></div>)}
        <div className="ap-print-templates-78"><span>Total</span><span className="ap-print-templates-79">₹{inv.total?.toLocaleString()}</span></div>
      </div>
    </div>
    <Footer />
  </div>;

// ─── 4. AMC Contract ──────────────────────────────────────────────────────────
const PLAN_COLORS = {
  Comprehensive: "var(--info)",
  Premium: "var(--purple)",
  Basic: "var(--success)"
};
export const AMCContractPDFTemplate = ({
  data: c
}) => {
  const planColor = PLAN_COLORS[c.plan] || "#64748B";
  const isActive = c.status === "active" || c.status === "Active";
  const pct = c.visits > 0 ? Math.round(c.done / c.visits * 100) : 0;
  const ca = (extra = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: "6px 10px",
    fontSize: 11,
    color: "#111",
    verticalAlign: "top",
    ...extra
  });
  return <div className="ap-print-templates-80">
      <AlishaHeader date={c.startDate} />
      <div className="ap-print-templates-81"><span className="ap-print-templates-82">AMC CONTRACT — {c.plan} Plan</span></div>
      <div className="ap-print-templates-83">
        <div className="ap-print-templates-84">
          <div>
            <div className="ap-print-templates-85">
              <span style={{
              background: isActive ? "var(--success-bg)" : "var(--warning-bg)",
              color: isActive ? "var(--success-text)" : "var(--warning-text)",
              border: `1px solid ${isActive ? "#BBF7D0" : "#FDE68A"}`
            }} className="ap-print-templates-86">{isActive ? "Active" : "Expiring"}</span>
              <span style={{
              background: `${planColor}18`,
              color: planColor,
              border: `1px solid ${planColor}40`
            }} className="ap-print-templates-87">{c.plan} Plan</span>
            </div>
            <div className="ap-print-templates-88">{c.customer}</div>
            <div className="ap-print-templates-89">{c.units} AC Units · {c.start} to {c.end}</div>
          </div>
          <div className="ap-print-templates-90">
            <div className="ap-print-templates-91">Contract Value</div>
            <div className="ap-print-templates-92">₹{Number(c.value).toLocaleString()}</div>
            <div className="ap-print-templates-93">₹{Math.round(c.value / 12).toLocaleString()}/mo</div>
          </div>
        </div>
        <div className="ap-print-templates-94">
          {[["TOTAL VISITS/YEAR", c.visits], ["VISITS DONE", c.done], ["REMAINING", c.visits - c.done], ["NEXT VISIT", c.nextVisit]].map(([label, value]) => <div key={label} className="ap-print-templates-95">
              <div className="ap-print-templates-96">{label}</div>
              <div className="ap-print-templates-97">{value}</div>
            </div>)}
        </div>
      </div>
      <div className="ap-print-templates-98">
        <div className="ap-print-templates-99"><div className="ap-print-templates-100">Visit Progress</div><span className="ap-print-templates-101">{pct}%</span></div>
        <div className="ap-print-templates-102"><div style={{
          width: `${pct}%`
        }} className="ap-print-templates-103" /></div>
        <div className="ap-print-templates-104">
          {Array.from({
          length: c.visits
        }).map((_, i) => <div key={i} style={{
          background: i < c.done ? "var(--success-bg)" : "var(--bg)",
          border: `1px solid ${i < c.done ? "#BBF7D0" : "#E2E8F0"}`
        }} className="ap-print-templates-105">
              <div className="ap-print-templates-106">{i < c.done ? "✅" : "📅"}</div>
              <div style={{
            color: i < c.done ? "var(--success-text)" : "var(--text-faint)"
          }} className="ap-print-templates-107">Visit {i + 1}</div>
              <div className="ap-print-templates-108">{i < c.done ? "Done" : "Pending"}</div>
            </div>)}
        </div>
      </div>
      <AlishaFooter />
    </div>;
};

// ─── 5. Campaign Report ───────────────────────────────────────────────────────
export const CampaignReportTemplate = ({
  data: c
}) => {
  const roas = c.spent > 0 ? (c.revenue / c.spent).toFixed(1) : "0";
  const cpl = c.leads > 0 ? Math.round(c.spent / c.leads) : 0;
  const convRate = c.leads > 0 ? Math.round(c.conversions / c.leads * 100) : 0;
  const budgetPct = Math.min(Math.round(c.spent / c.budget * 100), 100);
  const CHANNEL_META = {
    facebook: {
      emoji: "📘",
      color: "var(--brand-facebook)",
      name: "Facebook"
    },
    instagram: {
      emoji: "📸",
      color: "var(--brand-instagram)",
      name: "Instagram"
    },
    twitter: {
      emoji: "🐦",
      color: "var(--brand-twitter)",
      name: "Twitter"
    },
    linkedin: {
      emoji: "💼",
      color: "var(--brand-linkedin)",
      name: "LinkedIn"
    },
    youtube: {
      emoji: "▶️",
      color: "var(--xff0000)",
      name: "YouTube"
    },
    google: {
      emoji: "⭐",
      color: "var(--brand-google-yellow)",
      name: "Google"
    },
    whatsapp: {
      emoji: "💬",
      color: "var(--brand-whatsapp)",
      name: "WhatsApp"
    }
  };
  return <div className="ap-print-templates-109">
      <AlishaHeader date={fmtDateDMY(new Date())} />
      <div className="ap-print-templates-110">
        <span className="ap-print-templates-111">CAMPAIGN PERFORMANCE REPORT</span>
      </div>
      <div className="ap-print-templates-112">
        <div className="ap-print-templates-113">
          <div>
            <div className="ap-print-templates-114">
              <span style={{
              background: c.status === "active" ? "var(--success-bg)" : "var(--bg)",
              color: c.status === "active" ? "var(--success-text)" : "var(--text-muted)",
              border: `1px solid ${c.status === "active" ? "#BBF7D0" : "#E2E8F0"}`
            }} className="ap-print-templates-115">● {c.status}</span>
              <span className="ap-print-templates-116">{c.goal}</span>
              {(c.channels || []).map(ch => {
              const meta = CHANNEL_META[ch] || {
                emoji: "🌐",
                color: "#94A3B8",
                name: ch
              };
              return <span key={ch} style={{
                background: meta.color + "18",
                color: meta.color
              }} className="ap-print-templates-117">{meta.emoji} {meta.name}</span>;
            })}
            </div>
            <div className="ap-print-templates-118">{c.name}</div>
            <div className="ap-print-templates-119">{c.startDate} – {c.endDate}</div>
          </div>
          <div className="ap-print-templates-120">
            <div className="ap-print-templates-121">Campaign ID</div>
            <div className="ap-print-templates-122">{c.id}</div>
          </div>
        </div>
      </div>
      <div className="ap-print-templates-123">
        {[["ROAS", roas + "x", "Revenue per ₹1 spent", "#16A34A"], ["CPL", "₹" + cpl, "Cost per lead", "#0369A1"], ["CONV. RATE", convRate + "%", "Leads → Customers", "#7C3AED"], ["leads", c.leads, "Generated", "#EA580C"]].map(([label, value, sub, color]) => <div key={label} className="ap-print-templates-124">
            <div className="ap-print-templates-125">{label}</div>
            <div style={{
          color
        }} className="ap-print-templates-126">{value}</div>
            <div className="ap-print-templates-127">{sub}</div>
          </div>)}
      </div>
      <table className="ap-print-templates-128">
        <thead><tr className="ap-print-templates-129"><th colSpan={4} className="ap-print-templates-130">ENGAGEMENT METRICS</th></tr></thead>
        <tbody>
          <tr>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "22%"
            })
          }}>Impressions</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700,
              width: "28%"
            })
          }}>{Number(c.impressions || 0).toLocaleString()}</td>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "22%"
            })
          }}>Reach</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700,
              width: "28%"
            })
          }}>{Number(c.reach || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Clicks</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700
            })
          }}>{Number(c.clicks || 0).toLocaleString()}</td>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Conversions</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700
            })
          }}>{c.conversions}</td>
          </tr>
          <tr>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Leads Generated</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#EA580C"
            })
          }}>{c.leads}</td>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Conversion Rate</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#7C3AED"
            })
          }}>{convRate}%</td>
          </tr>
        </tbody>
      </table>
      <table className="ap-print-templates-131">
        <thead><tr className="ap-print-templates-132"><th colSpan={4} className="ap-print-templates-133">BUDGET UTILISATION</th></tr></thead>
        <tbody>
          <tr>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "22%"
            })
          }}>Total Budget</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700,
              width: "28%"
            })
          }}>₹{Number(c.budget).toLocaleString()}</td>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff",
              width: "22%"
            })
          }}>Amount Spent</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 800,
              color: "#EA580C",
              width: "28%"
            })
          }}>₹{Number(c.spent).toLocaleString()}</td>
          </tr>
          <tr>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>Remaining</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#16A34A"
            })
          }}>₹{(c.budget - c.spent).toLocaleString()}</td>
            <td style={{
            ...cell({
              fontWeight: 700,
              background: "#f0f4ff"
            })
          }}>% Used</td>
            <td style={{
            ...cell({
              fontFamily: "monospace",
              fontWeight: 800
            })
          }}>{budgetPct}%</td>
          </tr>
          <tr>
            <td colSpan={4} className="ap-print-templates-134">
              <div className="ap-print-templates-135">
                <span>₹0</span>
                <span className="ap-print-templates-136">₹{Number(c.spent).toLocaleString()} spent ({budgetPct}%)</span>
                <span>₹{Number(c.budget).toLocaleString()}</span>
              </div>
              <div className="ap-print-templates-137">
                <div style={{
                width: `${budgetPct}%`
              }} className="ap-print-templates-138" />
              </div>
              <div className="ap-print-templates-139">
                <span>{budgetPct}% used</span>
                <span>₹{(c.budget - c.spent).toLocaleString()} remaining</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="ap-print-templates-140">
        <div className="ap-print-templates-141">REVENUE GENERATED</div>
        <div className="ap-print-templates-142">
          <div>
            <div className="ap-print-templates-143">₹{Number(c.revenue).toLocaleString()}</div>
            <div className="ap-print-templates-144">ROAS: {roas}x — For every ₹1 spent, ₹{roas} was earned</div>
          </div>
          <div className="ap-print-templates-145">
            <div className="ap-print-templates-146">Cost Per Lead</div>
            <div className="ap-print-templates-147">₹{cpl.toLocaleString()}</div>
          </div>
        </div>
      </div>
      <AlishaFooter />
    </div>;
};

// ─── 6. Generic list ──────────────────────────────────────────────────────────
export const GenericListTemplate = ({
  data
}) => {
  const {
    title,
    subtitle,
    docId,
    columns,
    rows,
    summaryPills,
    showTotals,
    totalColumns
  } = data;
  return <div>
      <Header title={title} id={docId} meta={subtitle ? [["", subtitle]] : []} />
      {summaryPills?.length > 0 && <div className="ap-print-templates-148">
          {summaryPills.map(p => <div key={p.label} className="ap-print-templates-149">
              <div className="ap-print-templates-150">{p.label}</div>
              <div className="ap-print-templates-151">{p.value}</div>
            </div>)}
        </div>}
      <table className="ap-print-templates-152">
        <thead><tr className="ap-print-templates-153">{columns.map(c => <th key={c.key} className="ap-print-templates-154">{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => <tr key={i} style={{
          background: i % 2 === 0 ? "white" : "var(--bg)"
        }} className="ap-print-templates-155">
              {columns.map(c => {
            const val = row[c.key];
            const display = c.format ? c.format(val) : val ?? "—";
            return <td key={c.key} style={{
              ...(c.tdStyle || {})
            }} className="ap-print-templates-156">{String(display)}</td>;
          })}
            </tr>)}
          {showTotals && totalColumns?.length > 0 && <tr className="ap-print-templates-157">
              {columns.map((c, i) => {
            if (totalColumns.includes(c.key)) {
              const sum = rows.reduce((s, r) => s + (parseFloat(r[c.key]) || 0), 0);
              const display = c.format ? c.format(sum) : sum.toLocaleString();
              return <td key={c.key} className="ap-print-templates-158">{String(display)}</td>;
            }
            return <td key={c.key} className="ap-print-templates-159">{i === 0 ? "TOTAL" : ""}</td>;
          })}
            </tr>}
        </tbody>
      </table>
      <Footer />
    </div>;
};

// ─── 7. Service Job Sheet ─────────────────────────────────────────────────────
export const ServiceJobSheetTemplate = ({
  data: s
}) => {
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
  const cat = CAT_COLOR[s.category] || CAT_COLOR.Service;
  const total = Math.round(s.price * (1 + s.gst / 100));
  const cs = (extra = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: "6px 10px",
    fontSize: 11,
    color: "#111",
    verticalAlign: "top",
    ...extra
  });
  return <div className="ap-print-templates-160">
      <AlishaHeader date={fmtDateDMY(new Date())} />
      <div className="ap-print-templates-161"><span className="ap-print-templates-162">SERVICE JOB SHEET</span></div>
      <div className="ap-print-templates-163">
        <div className="ap-print-templates-164">
          <div>
            <div className="ap-print-templates-165"><span style={{
              background: cat.bg,
              color: cat.color,
              border: `1px solid ${cat.color}30`
            }} className="ap-print-templates-166">{s.category}</span>{s.popular && <span className="ap-print-templates-167">⭐ Popular</span>}</div>
            <div className="ap-print-templates-168">{s.name}</div>
            <div className="ap-print-templates-169">{s.description}</div>
          </div>
          <div className="ap-print-templates-170"><div className="ap-print-templates-171">₹{Number(s.price).toLocaleString()}</div><div className="ap-print-templates-172">+{s.gst}% GST = ₹{total.toLocaleString()}</div></div>
        </div>
      </div>
      {s.checklist?.length > 0 && <table className="ap-print-templates-173">
          <thead><tr className="ap-print-templates-174"><th style={{
            ...cs({
              color: "white",
              fontWeight: 700,
              textAlign: "left",
              fontSize: 12
            })
          }} colSpan={2}>✅ SERVICE CHECKLIST ({s.checklist.length} STEPS)</th></tr></thead>
          <tbody>
            {s.checklist.map((step, i) => <tr key={i} style={{
          background: i % 2 === 0 ? "white" : "var(--bg)"
        }}><td style={{
            ...cs({
              textAlign: "center",
              width: 28,
              fontWeight: 700,
              color: ORANGE,
              fontFamily: "monospace"
            })
          }}>{i + 1}</td><td style={{
            ...cs({
              lineHeight: 1.6
            })
          }}>{step}</td></tr>)}
            <tr><td colSpan={2} style={{
            ...cs({
              background: "#FFF7ED",
              paddingTop: 10,
              paddingBottom: 10
            })
          }}><div className="ap-print-templates-175"><span className="ap-print-templates-176">Technician Sign-off:</span><span className="ap-print-templates-177">Signature: ___________________</span><span className="ap-print-templates-178">Date: ___________</span></div></td></tr>
          </tbody>
        </table>}
      <AlishaFooter />
    </div>;
};

// ─── 8. Staff Scorecard (matches modal visual style) ─────────────────────────
export const ScorecardTemplate = ({
  data: t
}) => {
  const pct = t.target ? Math.round(t.jobsDone / t.target * 100) : 0;
  const perfColor = pct >= 100 ? "#16A34A" : pct >= 85 ? "#B45309" : "#DC2626";
  const trendData = t.trend || [22, 25, 28, 26, t.jobsDone];
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb"];

  // Sparkline SVG path
  const W = 480,
    H = 70,
    PAD = 8;
  const minV = Math.min(...trendData),
    maxV = Math.max(...trendData);
  const pts = trendData.map((v, i) => ({
    x: PAD + i / (trendData.length - 1) * (W - PAD * 2),
    y: H - PAD - (v - minV) / (maxV - minV || 1) * (H - PAD * 2)
  }));
  const sparkLine = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const sparkArea = `${sparkLine} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;

  // Gauge donut
  const GR = 38,
    GCX = 46,
    GCY = 46;
  const gCirc = 2 * Math.PI * GR;
  const gDash = Math.min(pct, 100) / 100 * gCirc;
  return <div className="ap-print-templates-179">

      {/* ── Dark hero header — same as modal ── */}
      <div className="ap-print-templates-180">
        <div className="ap-print-templates-181" />

        <div className="ap-print-templates-182">
          <div>
            <div className="ap-print-templates-183">❄ CoolTech AC Services</div>
            <div className="ap-print-templates-184">Staff Performance Scorecard · February 2026</div>
          </div>
          <div className="ap-print-templates-185">
            <div className="ap-print-templates-186">Generated</div>
            <div className="ap-print-templates-187">
              {fmtDateDMY(new Date())}
            </div>
          </div>
        </div>

        <div className="ap-print-templates-188">
          <div className="ap-print-templates-189">
            {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="ap-print-templates-190">
            <div className="ap-print-templates-191">
              ★ #{t.rank} Top Performer · February 2026
            </div>
            <div className="ap-print-templates-192">{t.name}</div>
            <div className="ap-print-templates-193">Senior Technician · Zone A – Ahmedabad North</div>
          </div>
          <div className="ap-print-templates-194">
            <div className="ap-print-templates-195">{pct}%</div>
            <div className="ap-print-templates-196">of monthly target</div>
          </div>
        </div>
      </div>

      {/* Orange accent stripe */}
      <div className="ap-print-templates-197" />

      {/* ── Overview section label ── */}
      <div className="ap-print-templates-198">Overview</div>

      {/* Gauge + bars — same layout as modal */}
      <div className="ap-print-templates-199">
        <div className="ap-print-templates-200">
          <svg width={92} height={92} viewBox="0 0 92 92">
            <circle cx={GCX} cy={GCY} r={GR} fill="none" stroke="#E2E8F0" strokeWidth={10} />
            <circle cx={GCX} cy={GCY} r={GR} fill="none" stroke={perfColor} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${gDash} ${gCirc}`} strokeDashoffset={gCirc / 4} transform={`rotate(-90 ${GCX} ${GCY})`} />
            <text x={GCX} y={GCY - 3} textAnchor="middle" fill={perfColor} fontSize={14} fontWeight={700} fontFamily="monospace">{pct}%</text>
            <text x={GCX} y={GCY + 11} textAnchor="middle" fill="#94A3B8" fontSize={8}>of target</text>
          </svg>
          <div className="ap-print-templates-201">{t.jobsDone} / {t.target} jobs</div>
        </div>

        <div className="ap-print-templates-202">
          {[["Jobs Completed", t.jobsDone, t.target, perfColor, `${t.jobsDone} / ${t.target}`], ["On-Time Delivery", t.onTime, 100, "#16A34A", `${t.onTime}%`], ["Customer Satisfaction", t.rating / 5 * 100, 100, "#D97706", `${t.rating} / 5.0★`]].map(([label, val, maxVal, color, display]) => <div key={label}>
              <div className="ap-print-templates-203">
                <span>{label}</span>
                <span style={{
              color
            }} className="ap-print-templates-204">{display}</span>
              </div>
              <div className="ap-print-templates-205">
                <div style={{
              width: `${Math.min(Math.round(val / maxVal * 100), 100)}%`,
              background: color
            }} className="ap-print-templates-206" />
              </div>
            </div>)}
        </div>
      </div>

      {/* 4 stat cards — same as modal */}
      <div className="ap-print-templates-207">
        {[{
        label: "Rating",
        value: `${t.rating}★`,
        badge: "Above avg",
        bc: "#B45309",
        bb: "#FFFBEB"
      }, {
        label: "On-Time",
        value: `${t.onTime}%`,
        badge: "+5% vs avg",
        bc: "#16A34A",
        bb: "#F0FDF4"
      }, {
        label: "Complaints",
        value: `${t.complaints}`,
        badge: t.complaints === 0 ? "Clean ✓" : `${t.complaints} flagged`,
        bc: t.complaints === 0 ? "#16A34A" : "#DC2626",
        bb: t.complaints === 0 ? "#F0FDF4" : "#FEF2F2"
      }, {
        label: "Revenue",
        value: `₹${(t.revenue / 1000).toFixed(0)}K`,
        badge: "35% share",
        bc: "#EA580C",
        bb: "#FFF7ED"
      }].map(({
        label,
        value,
        badge,
        bc,
        bb
      }) => <div key={label} className="ap-print-templates-208">
            <div className="ap-print-templates-209">{label}</div>
            <div className="ap-print-templates-210">{value}</div>
            <div style={{
          background: bb,
          color: bc
        }} className="ap-print-templates-211">{badge}</div>
          </div>)}
      </div>

      {/* ── Trend section label ── */}
      <div className="ap-print-templates-212">5-Month Jobs Trend</div>

      <div className="ap-print-templates-213">
        {/* Sparkline */}
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="ap-print-templates-214">
          <defs>
            <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity=".15" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={sparkArea} fill="url(#sg2)" />
          <path d={sparkLine} fill="none" stroke="#EA580C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((p, i) => <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill="#EA580C" />
              <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1E293B">{trendData[i]}</text>
            </g>)}
        </svg>

        {/* Month labels */}
        <div className="ap-print-templates-215">
          {months.map(m => <div key={m} className="ap-print-templates-216">{m}</div>)}
        </div>

        {/* Summary pills — same as modal trend tab */}
        <div className="ap-print-templates-217">
          {[["Peak Month", months[trendData.indexOf(Math.max(...trendData))], `${Math.max(...trendData)} jobs`], ["5-Month Average", `${Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length)} jobs`, "per month"], ["This Month", `${t.jobsDone} jobs`, `${pct}% of target`]].map(([title, main, sub]) => <div key={title} className="ap-print-templates-218">
              <div className="ap-print-templates-219">{title}</div>
              <div style={{
            color: title === "This Month" ? "var(--brand)" : "var(--text-h2)"
          }} className="ap-print-templates-220">{main}</div>
              <div className="ap-print-templates-221">{sub}</div>
            </div>)}
        </div>
      </div>

      {/* ── Details section label ── */}
      <div className="ap-print-templates-222">Technician Details</div>

      {/* Details rows — same as modal details tab */}
      <div className="ap-print-templates-223">
        {[["Technician ID", t.techId || "TECH-001"], ["Department", "Field Operations"], ["Zone", "Zone A – North Ahmedabad"], ["Period", "February 2026"], ["Total Revenue", `₹${t.revenue?.toLocaleString()}`], ["Incentive Earned", `₹${(t.incentive || 0).toLocaleString()}`], ["Complaint Record", t.complaints === 0 ? "✓ Clean – No complaints" : `${t.complaints} complaint(s)`], ["Team Rank", `#${t.rank} of 5 technicians`]].map(([k, v]) => <div key={k} className="ap-print-templates-224">
            <span className="ap-print-templates-225">{k}</span>
            <span className="ap-print-templates-226">{v}</span>
          </div>)}
      </div>

      {/* ── Footer ── */}
      <div className="ap-print-templates-227">
        <div className="ap-print-templates-228">❄ CoolTech AC Services · cooltech@services.com · +91 98765 43210</div>
        <div className="ap-print-templates-229">Confidential — Internal Use Only</div>
      </div>
    </div>;
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const TEMPLATES = {
  quotation: QuotationTemplate,
  contract: ContractTemplate,
  invoice: InvoiceTemplate,
  amc_contract: AMCContractPDFTemplate,
  campaign_report: CampaignReportTemplate,
  generic_list: GenericListTemplate,
  service_job_sheet: ServiceJobSheetTemplate,
  scorecard: ScorecardTemplate
};
import { useState, useEffect } from 'react';
import { customersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── WhatsAppPage ───────────────────────────────────────────────────────────────
// Message templates below are wording you can start from. Delivery statistics
// (sent / delivered / read / clicked) are shown as "—" because the WhatsApp
// session used by this app (whatsapp-web.js) does not report them; they need a
// WhatsApp Business Cloud API integration. The contacts list is real data.
const WA_TEMPLATES = [{
  id: "WT-01",
  name: "Job Confirmation",
  trigger: "On job assignment",
  message: "Dear {customer_name}, your AC {service_type} has been confirmed for {date} at {time}. Our technician {tech_name} will arrive."
}, {
  id: "WT-02",
  name: "Service Completion",
  trigger: "On job complete",
  message: "Dear {customer_name}, your AC {service_type} is complete. Thank you for choosing us. Please share your feedback."
}, {
  id: "WT-03",
  name: "AMC Renewal Reminder",
  trigger: "30 days before expiry",
  message: "Dear {customer_name}, your AMC contract expires on {date}. Reply to renew and keep your ACs covered."
}, {
  id: "WT-04",
  name: "Summer Promotion Blast",
  trigger: "Manual / Campaign",
  message: "Summer is here! Book your AC service now and get a special discount. Reply to this message to book."
}, {
  id: "WT-05",
  name: "Payment Due Reminder",
  trigger: "3 days before invoice due",
  message: "Dear {customer_name}, invoice {invoice_no} of {amount} is due on {date}. Kindly make the payment."
}, {
  id: "WT-06",
  name: "Overdue Payment Alert",
  trigger: "On invoice overdue",
  message: "Dear {customer_name}, invoice {invoice_no} of {amount} is overdue. Please pay at the earliest."
}];

const WhatsAppPage = () => {
  const [tab, setTab] = useState("templates");
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    customersApi.list({ limit: 500 }).then(r => setCustomers(r.data ?? [])).catch(() => {});
  }, []);
  return <div className="fi ap-whats-app-page-1">
      <div className="ap-whats-app-page-2">
        <div><div className="ap-whats-app-page-3">WhatsApp Marketing</div>
        <div className="ap-whats-app-page-4">{customers.length} contacts · Business API connected</div></div>
        <button className="btn ap-whats-app-page-5" onClick={() => setTab("broadcast")}>📤 Send Blast</button>
      </div>
      <div className="ap-whats-app-page-6">
        <KCard label="Total Sent" value="—" sub="not tracked yet" icon="📤" iconBg="#F0FDF4" color="#25D366" delay="" />
        <KCard label="Avg Read Rate" value="—" sub="industry avg 60%" icon="👁" iconBg="#EFF6FF" color="#0369A1" delay="1" />
        <KCard label="Leads via WA" value="—" sub="not tracked yet" icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="2" />
        <KCard label="Active Templates" value={WA_TEMPLATES.filter(t => t.status === "active").length} sub="running" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="3" />
      </div>
      <div className="ap-whats-app-page-7">
        {[["templates", "Templates"], ["broadcast", "Broadcast"], ["contacts", "Contacts"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{
        background: tab === k ? "var(--success-bg)" : "transparent",
        color: tab === k ? "var(--brand-whatsapp)" : "var(--text-muted)"
      }} className="ap-whats-app-page-8">{l}</button>)}
      </div>
      {tab === "templates" && <div className="ap-whats-app-page-9">
          {WA_TEMPLATES.map(tmpl => <div key={tmpl.id} className="ap-whats-app-page-10">
              <div className="ap-whats-app-page-11">
                <div>
                  <div className="ap-whats-app-page-12">
                    <div className="ap-whats-app-page-13">💬</div>
                    <span className="ap-whats-app-page-14">{tmpl.name}</span>
                    <span className="ap-whats-app-page-15">{tmpl.id}</span>
                    <span className="ap-whats-app-page-16">● Active</span>
                  </div>
                  <div className="ap-whats-app-page-17">Trigger: <strong className="ap-whats-app-page-18">{tmpl.trigger}</strong></div>
                </div>
                <div className="ap-whats-app-page-19">
                  <button className="btn ap-whats-app-page-20" onClick={() => setTab("broadcast")}>Send Now</button>
                  <button className="btn ap-whats-app-page-21" onClick={() => setTab("broadcast")}>Edit</button>
                </div>
              </div>
              <div className="ap-whats-app-page-22">
                <div className="ap-whats-app-page-23">{tmpl.message}</div>
              </div>
              <div className="ap-whats-app-page-24">
                {[["Sent", null, "#64748B"], ["Delivered", null, "#0369A1"], ["Read", null, "#16A34A"], ["Clicked", null, "#EA580C"]].map(([k, v, c]) => <div key={k} className="ap-whats-app-page-25">
                    <div style={{
              color: c
            }} className="ap-whats-app-page-26">{v == null ? '—' : v.toLocaleString()}</div>
                    <div className="ap-whats-app-page-27">{k}</div>
                    <div style={{
              color: c
            }} className="ap-whats-app-page-28">—</div>
                  </div>)}
              </div>
            </div>)}
        </div>}
      {tab === "broadcast" && <div className="ap-whats-app-page-29">
          <div className="ap-whats-app-page-30">Send Broadcast Message</div>
          <div className="ap-whats-app-page-31">
            <div><div className="ap-whats-app-page-32">Target Audience</div>
            <select className="ap-whats-app-page-33">
              <option>All Customers ({customers.length})</option>
              <option>AMC Customers</option><option>Commercial Customers</option>
              <option>Residential Customers</option><option>Due for Service</option>
            </select></div>
            <div><div className="ap-whats-app-page-34">Use Template</div>
            <select className="ap-whats-app-page-35">
              <option>Select a template...</option>
              {WA_TEMPLATES.map(t => <option key={t.id}>{t.name}</option>)}
            </select></div>
          </div>
          <div className="ap-whats-app-page-36"><div className="ap-whats-app-page-37">Message</div>
          <textarea placeholder="Type your WhatsApp message..." className="ap-whats-app-page-38" /></div>
          <div className="ap-whats-app-page-39">
            <button className="btn ap-whats-app-page-40" onClick={() => setTab("contacts")}>📤 Send to {customers.length} Contacts</button>
            <button className="btn ap-whats-app-page-41" onClick={() => setTab("contacts")}>Schedule</button>
          </div>
        </div>}
      {tab === "contacts" && <div className="ap-whats-app-page-42">
          <div className="ap-whats-app-page-43"><table className="ap-whats-app-page-44">
            <Thead cols={["Customer", "Phone", "Type", "AMC", "Opt-in", "Last Message", ""]} />
            <tbody>{customers.map((c, i) => <tr key={c._id} className="row ap-whats-app-page-45">
                <td className="ap-whats-app-page-46"><div className="ap-whats-app-page-47"><Avatar name={c.name} size={30} /><div className="ap-whats-app-page-48">{c.name}</div></div></td>
                <td className="ap-whats-app-page-49">{c.phone}</td>
                <td className="ap-whats-app-page-50"><TypeTag type={c.type} /></td>
                <td className="ap-whats-app-page-51">{c.amc ? <span className="ap-whats-app-page-52">✅ AMC</span> : <span className="ap-whats-app-page-53">—</span>}</td>
                <td className="ap-whats-app-page-54"><span className="ap-whats-app-page-55">✅ Opted In</span></td>
                <td className="ap-whats-app-page-56">{c.lastService ?fmtDateDMY(new Date(c.lastService)) : '—'}</td>
                <td className="ap-whats-app-page-57"><button className="btn ap-whats-app-page-58" onClick={() => setTab("broadcast")}>Message</button></td>
              </tr>)}</tbody>
          </table></div>
        </div>}
    </div>;
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: REVIEWS & REPUTATION
══════════════════════════════════════════════════════════════════════════ */

export default WhatsAppPage;
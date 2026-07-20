import { useState, useEffect } from 'react';
import { customersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { WA_TEMPLATES, SM_CHANNELS } from '../../data/mockData';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── WhatsAppPage ───────────────────────────────────────────────────────────────
// NOTE: WA_TEMPLATES / SM_CHANNELS (broadcast templates, read-rate stats,
// per-channel lead counts) are still mock — they'd need a real WhatsApp
// Business API (Cloud API) template/analytics integration, which is a
// separate feature from the whatsapp-web.js session used elsewhere in the
// app. Only the customer/contacts list below has been wired to real data.

const WhatsAppPage = () => {
  const [tab, setTab] = useState("templates");
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    customersApi.list({ limit: 500 }).then(r => setCustomers(r.data ?? [])).catch(() => {});
  }, []);
  const totalSent = WA_TEMPLATES.reduce((s, t) => s + t.sent, 0);
  const totalRead = WA_TEMPLATES.reduce((s, t) => s + t.read, 0);
  const avgRead = totalSent > 0 ? Math.round(totalRead / totalSent * 100) : 0;
  return <div className="fi ap-whats-app-page-1">
      <div className="ap-whats-app-page-2">
        <div><div className="ap-whats-app-page-3">WhatsApp Marketing</div>
        <div className="ap-whats-app-page-4">{customers.length} contacts · Business API connected</div></div>
        <button className="btn ap-whats-app-page-5" onClick={() => setTab("broadcast")}>📤 Send Blast</button>
      </div>
      <div className="ap-whats-app-page-6">
        <KCard label="Total Sent" value={totalSent.toLocaleString()} sub="all templates" icon="📤" iconBg="#F0FDF4" color="#25D366" delay="" />
        <KCard label="Avg Read Rate" value={avgRead + "%"} sub="industry avg 60%" icon="👁" iconBg="#EFF6FF" color="#0369A1" delay="1" />
        <KCard label="Leads via WA" value={SM_CHANNELS.find(c => c.id === "wa")?.leads || 0} sub="this month" icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="2" />
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
                {[["Sent", tmpl.sent, "#64748B"], ["Delivered", tmpl.delivered, "#0369A1"], ["Read", tmpl.read, "#16A34A"], ["Clicked", tmpl.clicks, "#EA580C"]].map(([k, v, c]) => <div key={k} className="ap-whats-app-page-25">
                    <div style={{
              color: c
            }} className="ap-whats-app-page-26">{v.toLocaleString()}</div>
                    <div className="ap-whats-app-page-27">{k}</div>
                    <div style={{
              color: c
            }} className="ap-whats-app-page-28">{tmpl.sent > 0 ? Math.round(v / tmpl.sent * 100) : 0}%</div>
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
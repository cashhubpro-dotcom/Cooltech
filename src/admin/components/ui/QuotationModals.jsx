// ─── QuotationModals.jsx ──────────────────────────────────────────────────────
// Drop this file into src/components/ui/ (or wherever your modals live)
// Then import and use in QuotationsPage.jsx as shown at the bottom.

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { quotationsApi } from '../../services/api';
import { QUOT_STATUS } from '../../constants/statusMaps';

// ─── Shared overlay ───────────────────────────────────────────────────────────
// Portaled straight to document.body: this file's modals are rendered deep
// inside QuotationsPage's scrollable detail view, and a plain nested
// position:fixed overlay gets clipped to that scrollable ancestor's visible
// area in Chrome instead of covering the full viewport.
const Overlay = ({
  onClose,
  children
}) => createPortal(<div onClick={onClose} className="ap-quotation-modals-1">
    <div onClick={e => e.stopPropagation()} className="ap-quotation-modals-2">
      {children}
    </div>
  </div>, document.body);
const ModalCard = ({
  children,
  style = {}
}) => <div style={{
  ...style
}} className="ap-quotation-modals-3">
    {children}
  </div>;
const ModalHeader = ({
  icon,
  title,
  sub,
  onClose
}) => <div className="ap-quotation-modals-4">
    <div className="ap-quotation-modals-5">{icon}</div>
    <div className="ap-quotation-modals-6">
      <div className="ap-quotation-modals-7">{title}</div>
      {sub && <div className="ap-quotation-modals-8">{sub}</div>}
    </div>
    <button onClick={onClose} className="ap-quotation-modals-9">✕</button>
  </div>;

// ─────────────────────────────────────────────────────────────────────────────
// 1. UPDATE STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const UpdateStatusModal = ({
  quot,
  onClose,
  onUpdated
}) => {
  const [selected, setSelected] = useState(quot?.status || 'draft');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const statuses = [{
    key: 'draft',
    icon: '📝',
    label: 'Draft',
    desc: 'Still being prepared',
    color: '#64748b',
    bg: '#f8fafc'
  }, {
    key: 'sent',
    icon: '📤',
    label: 'Sent',
    desc: 'Delivered to customer',
    color: '#2563eb',
    bg: '#eff6ff'
  }, {
    key: 'approved',
    icon: '✅',
    label: 'Approved',
    desc: 'Customer accepted the quote',
    color: '#16a34a',
    bg: '#f0fdf4'
  }, {
    key: 'rejected',
    icon: '❌',
    label: 'Rejected',
    desc: 'Customer declined',
    color: '#dc2626',
    bg: '#fef2f2'
  }, {
    key: 'expired',
    icon: '⏰',
    label: 'Expired',
    desc: 'Validity date passed',
    color: '#d97706',
    bg: '#fffbeb'
  }];
  const handleSave = async () => {
    if (selected === quot.status) {
      onClose();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const mongoId = quot._id || quot.id;
      // PATCH /quotations/:id/status
      const updated = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          } : {})
        },
        body: JSON.stringify({
          status: selected,
          note
        })
      });
      if (!updated.ok) {
        const d = await updated.json();
        throw new Error(d.message || 'Update failed');
      }
      const data = await updated.json();
      onUpdated(data);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  return <Overlay onClose={onClose}>
      <ModalCard>
        <ModalHeader icon="🔄" title="Update Quotation Status" sub={`Currently: ${QUOT_STATUS[quot?.status]?.label || quot?.status}`} onClose={onClose} />

        <div className="ap-quotation-modals-10">
          {statuses.map(s => <button key={s.key} onClick={() => setSelected(s.key)} style={{
          border: `2px solid ${selected === s.key ? s.color : '#e2e8f0'}`,
          background: selected === s.key ? s.bg : '#fff'
        }} className="ap-quotation-modals-11">
              <span className="ap-quotation-modals-12">{s.icon}</span>
              <div className="ap-quotation-modals-13">
                <div style={{
              color: selected === s.key ? s.color : '#1e293b'
            }} className="ap-quotation-modals-14">{s.label}</div>
                <div className="ap-quotation-modals-15">{s.desc}</div>
              </div>
              {selected === s.key && <div style={{
            background: s.color
          }} className="ap-quotation-modals-16">
                  <span className="ap-quotation-modals-17">✓</span>
                </div>}
              {quot?.status === s.key && selected !== s.key && <span className="ap-quotation-modals-18">current</span>}
            </button>)}
        </div>

        <div className="ap-quotation-modals-19">
          <label className="ap-quotation-modals-20">Internal note (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Customer called to confirm approval…" rows={2} className="ap-quotation-modals-21" />
        </div>

        {error && <div className="ap-quotation-modals-22">{error}</div>}

        <div className="ap-quotation-modals-23">
          <button onClick={onClose} className="ap-quotation-modals-24">Cancel</button>
          <button onClick={handleSave} disabled={loading || selected === quot?.status} style={{
          cursor: loading || selected === quot?.status ? "not-allowed" : "pointer",
          background: selected === quot?.status ? "var(--border)" : "linear-gradient(135deg,var(--x1a2e5c),var(--info-text))",
          color: selected === quot?.status ? "var(--text-faint)" : "white",
          boxShadow: selected !== quot?.status ? "0 4px 12px rgba(37,99,235,.35)" : "none"
        }} className="ap-quotation-modals-25">
            {loading ? '⏳ Saving…' : '✓ Update Status'}
          </button>
        </div>
      </ModalCard>
    </Overlay>;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SEND EMAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const SendEmailModal = ({
  quot,
  onClose,
  onSent
}) => {
  const [form, setForm] = useState({
    toEmail: quot?.email || '',
    toName: quot?.contact || quot?.customer || '',
    subject: `Quotation ${quot?.id} – Alisha Engineering`,
    message: `Thank you for your interest. Please find your quotation ${quot?.id} for ${quot?.type} services attached below. We look forward to serving you!`
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const set = key => e => setForm(p => ({
    ...p,
    [key]: e.target.value
  }));
  const handleSend = async () => {
    if (!form.toEmail.trim()) {
      setError('Recipient email is required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const mongoId = quot._id || quot.id;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          } : {})
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');
      setSent(true);
      if (onSent) onSent(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  if (sent) return <Overlay onClose={onClose}>
      <ModalCard>
        <div className="ap-quotation-modals-26">
          <div className="ap-quotation-modals-27">✅</div>
          <div className="ap-quotation-modals-28">Email Sent!</div>
          <div className="ap-quotation-modals-29">
            Quotation <strong>{quot?.id}</strong> has been sent to <strong>{form.toEmail}</strong>.<br />
            Status updated to <strong>Sent</strong>.
          </div>
          <button onClick={onClose} className="ap-quotation-modals-30">Done</button>
        </div>
      </ModalCard>
    </Overlay>;
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    background: "var(--bg)",
    boxSizing: 'border-box',
    transition: 'border-color .15s'
  };
  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted)",
    display: 'block',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: .5
  };
  return <Overlay onClose={onClose}>
      <ModalCard className="ap-quotation-modals-31">
        <ModalHeader icon="📧" title="Send Quotation to Customer" sub={`${quot?.id} · ₹${Number(quot?.total || 0).toLocaleString()}`} onClose={onClose} />

        {/* Preview strip */}
        <div className="ap-quotation-modals-32">
          {[['Items', `${quot?.items?.length || 0} line items`], ['Subtotal', `₹${Number(quot?.subtotal || 0).toLocaleString()}`], ['Total', `₹${Number(quot?.total || 0).toLocaleString()}`]].map(([k, v]) => <div key={k}>
              <div className="ap-quotation-modals-33">{k}</div>
              <div className="ap-quotation-modals-34">{v}</div>
            </div>)}
        </div>

        <div className="ap-quotation-modals-35">
          <div className="ap-quotation-modals-36">
            <div className="ap-quotation-modals-37">
              <label className="ap-quotation-modals-38">Recipient Email *</label>
              <input value={form.toEmail} onChange={set('toEmail')} placeholder="customer@email.com" type="email" className="ap-quotation-modals-39" />
            </div>
            <div className="ap-quotation-modals-40">
              <label className="ap-quotation-modals-38">Recipient Name</label>
              <input value={form.toName} onChange={set('toName')} placeholder="Contact name" className="ap-quotation-modals-39" />
            </div>
          </div>
          <div>
            <label className="ap-quotation-modals-38">Email Subject</label>
            <input value={form.subject} onChange={set('subject')} className="ap-quotation-modals-39" />
          </div>
          <div>
            <label className="ap-quotation-modals-38">Message / Body</label>
            <textarea value={form.message} onChange={set('message')} rows={4} className="ap-quotation-modals-41" />
          </div>
        </div>

        {error && <div className="ap-quotation-modals-42">{error}</div>}

        <div className="ap-quotation-modals-43">
          <button onClick={onClose} className="ap-quotation-modals-44">Cancel</button>
          <button onClick={handleSend} disabled={loading} style={{
          cursor: loading ? "not-allowed" : "pointer"
        }} className="ap-quotation-modals-45">
            {loading ? '⏳ Sending…' : '📧 Send Email'}
          </button>
        </div>
      </ModalCard>
    </Overlay>;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONVERT TO JOB MODAL
// ─────────────────────────────────────────────────────────────────────────────
export const ConvertToJobModal = ({
  quot,
  onClose,
  onConverted
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // holds created job

  const handleConvert = async () => {
    setLoading(true);
    setError('');
    try {
      const mongoId = quot._id || quot.id;
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${mongoId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          } : {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Conversion failed');
      setDone(data.job);
      if (onConverted) onConverted(data.job);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  if (done) return <Overlay onClose={onClose}>
      <ModalCard>
        <div className="ap-quotation-modals-46">
          <div className="ap-quotation-modals-47">🎉</div>
          <div className="ap-quotation-modals-48">Job Created!</div>
          <div className="ap-quotation-modals-49">
            Quotation <strong>{quot?.id}</strong> converted to work order
          </div>
          <div className="ap-quotation-modals-50">
            {done.jobId}
          </div>
          <div className="ap-quotation-modals-51">
            <button onClick={onClose} className="ap-quotation-modals-52">Close</button>
            <button onClick={() => {
            onClose();
            window.location.href = '/work-orders';
          }} className="ap-quotation-modals-53">
              → View in Work Orders
            </button>
          </div>
        </div>
      </ModalCard>
    </Overlay>;

  // map type for display
  const jobTypeMap = {
    Service: 'Service',
    Installation: 'Installation',
    Repair: 'Repair',
    AMC: 'AMC Visit',
    Other: 'Service'
  };
  return <Overlay onClose={onClose}>
      <ModalCard>
        <ModalHeader icon="⚙️" title="Convert to Work Order" sub="This will create a new job from this quotation" onClose={onClose} />

        {/* Preview of what will be created */}
        <div className="ap-quotation-modals-54">
          <div className="ap-quotation-modals-55">Job will be created with:</div>

          {[['Customer', quot?.customer], ['Job Type', jobTypeMap[quot?.type] || quot?.type], ['Amount', `₹${Number(quot?.total || 0).toLocaleString()}`], ['Line Items', `${quot?.items?.length || 0} items → stored as parts`], ['Issue Note', `From ${quot?.id}: ${quot?.type}`], ['Status', 'New (unassigned)']].map(([k, v]) => <div key={k} className="ap-quotation-modals-56">
              <span className="ap-quotation-modals-57">{k}</span>
              <span className="ap-quotation-modals-58">{v}</span>
            </div>)}
        </div>

        {/* Items breakdown */}
        {quot?.items?.length > 0 && <div className="ap-quotation-modals-59">
            <div className="ap-quotation-modals-60">Line Items → Parts</div>
            {quot.items.map((item, i) => <div key={i} className="ap-quotation-modals-61">
                <span className="ap-quotation-modals-62">{item.desc}</span>
                <span className="ap-quotation-modals-63">×{item.qty} · ₹{Number(item.rate || 0).toLocaleString()}</span>
              </div>)}
          </div>}

        <div className="ap-quotation-modals-64">
          <div className="ap-quotation-modals-65">
            ⚠️ Quotation status will be updated to <strong>Approved</strong>. This cannot be undone.
          </div>
        </div>

        {error && <div className="ap-quotation-modals-66">{error}</div>}

        <div className="ap-quotation-modals-67">
          <button onClick={onClose} className="ap-quotation-modals-68">Cancel</button>
          <button onClick={handleConvert} disabled={loading || quot?.status === 'approved'} style={{
          cursor: loading || quot?.status === 'approved' ? "not-allowed" : "pointer",
          background: quot?.status === 'approved' ? "var(--border)" : "linear-gradient(135deg,var(--success-text),var(--success-text))",
          color: quot?.status === 'approved' ? "var(--text-faint)" : "white",
          boxShadow: quot?.status !== 'approved' ? "0 4px 12px rgba(22,163,74,.35)" : "none"
        }} className="ap-quotation-modals-69">
            {loading ? '⏳ Converting…' : quot?.status === 'approved' ? 'Already Converted' : '✓ Convert to Work Order'}
          </button>
        </div>
      </ModalCard>
    </Overlay>;
};
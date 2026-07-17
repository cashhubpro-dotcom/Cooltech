import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../constants/tokens';
import { TypeTag, Avatar, Divider } from '../components/ui/Badges';
import { SectionHdr } from '../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea } from '../components/ui/Form';
import { feedbackApi, customersApi, jobsApi } from '../services/api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({
  msg,
  type = 'success',
  onClose
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const s = type === 'error' ? {
    bg: '#FEF2F2',
    color: '#DC2626',
    border: '#FECACA',
    icon: '⚠'
  } : {
    bg: '#F0FDF4',
    color: '#16A34A',
    border: '#BBF7D0',
    icon: '✅'
  };
  return <div style={{
    background: s.bg,
    border: `1px solid ${s.border}`,
    color: s.color
  }} className="ap-feedback-page-1">
      {s.icon} {msg}
      <button onClick={onClose} style={{
      color: s.color
    }} className="ap-feedback-page-2">
        ✕
      </button>
    </div>;
};

// ─── Request Feedback Modal (Email only) ──────────────────────────────────────
const DEFAULT_MSG = "Hi! We recently completed a service at your premises.\n\nWe'd love to hear your feedback — it helps us serve you better.\n\nPlease take 30 seconds to rate our service. Your opinion means a lot to our team!";
const TEMPLATES = [{
  label: 'Friendly',
  msg: DEFAULT_MSG
}, {
  label: 'Post-job',
  msg: "Your recent job has been completed by our team.\n\nCould you spare a moment to share your experience? Your feedback helps us improve our services."
}, {
  label: 'AMC',
  msg: "Thank you for being a valued AMC customer of CoolTech AC Services! 🙏\n\nYour recent AMC visit has been completed. We'd love to know how we did — please share your feedback!"
}];
const RequestModal = ({
  customers,
  onClose,
  onSent
}) => {
  const [form, setForm] = useState({
    customerId: '',
    jobId: '',
    subject: 'How was our service? — CoolTech AC Services',
    message: DEFAULT_MSG
  });
  const [customerEmail, setCustomerEmail] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load jobs when customer changes, show their email
  useEffect(() => {
    if (!form.customerId) {
      setJobs([]);
      setCustomerEmail('');
      return;
    }
    const cust = customers.find(c => (c._id || c.id) === form.customerId);
    setCustomerEmail(cust?.email || '');
    jobsApi.list({
      customer: form.customerId,
      limit: 50
    }).then(d => setJobs(Array.isArray(d) ? d : d.data ?? []));
  }, [form.customerId, customers]);
  const handle = e => setForm(f => ({
    ...f,
    [e.target.name]: e.target.value
  }));
  const send = async () => {
    if (!form.customerId) {
      setError('Please select a customer');
      return;
    }
    if (!customerEmail) {
      setError('This customer has no email on file');
      return;
    }
    if (!form.message.trim()) {
      setError('Message cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await feedbackApi.requestFeedback({
        customerId: form.customerId,
        jobId: form.jobId || undefined,
        message: form.message,
        subject: form.subject
      });
      if (res.success === false) {
        setError(res.message + (res.hint ? `\n\nHint: ${res.hint}` : ''));
      } else {
        onSent(`Feedback request emailed to ${customerEmail}`);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };
  return createPortal(<div className="modal-overlay" onClick={onClose}>
      <div className="modal-box ap-feedback-page-3" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">⭐ Request Customer Feedback</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="ap-feedback-page-4">⚠ {error}</div>}

          {/* Customer */}
          <FRow label="Customer">
            <FSelect name="customerId" value={form.customerId} onChange={handle}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
            </FSelect>
          </FRow>

          {/* Email preview pill */}
          {form.customerId && <div style={{
          background: customerEmail ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${customerEmail ? '#BBF7D0' : '#FECACA'}`
        }} className="ap-feedback-page-5">
              <span className="ap-feedback-page-6">📧</span>
              {customerEmail ? <span className="ap-feedback-page-7">Will be sent to <strong>{customerEmail}</strong></span> : <span className="ap-feedback-page-8">No email address found for this customer</span>}
            </div>}

          {/* Job reference */}
          <FRow label="Job Reference (optional)">
            <FSelect name="jobId" value={form.jobId} onChange={handle} disabled={!form.customerId}>
              <option value="">— No specific job —</option>
              {jobs.map(j => <option key={j._id || j.id} value={j._id || j.id}>
                  {j.jobId} — {j.type}
                </option>)}
            </FSelect>
          </FRow>

          {/* Subject */}
          <FRow label="Email Subject">
            <FInput name="subject" value={form.subject} onChange={handle} />
          </FRow>

          {/* Message */}
          <FRow label="Message">
            <FTextarea name="message" value={form.message} onChange={handle} rows={5} />
          </FRow>

          {/* Quick templates */}
          <div className="ap-feedback-page-9">
            {TEMPLATES.map(t => <span key={t.label} onClick={() => setForm(f => ({
            ...f,
            message: t.msg
          }))} className="ap-feedback-page-10">
                {t.label}
              </span>)}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={send} disabled={loading || !customerEmail}>
              {loading ? 'Sending…' : '📧 Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>, document.body);
};

// ─── Single feedback card ─────────────────────────────────────────────────────
const FeedbackCard = ({
  fb,
  onReply,
  onFollowUp
}) => {
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const isNegative = fb.rating <= 2;
  const submitReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await onReply(fb._id, replyText);
      setReplyText('');
    } finally {
      setReplying(false);
    }
  };
  const dateStr = fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : fb.date || '';
  return <div style={{
    border: `1px solid ${isNegative && !fb.resolved ? '#FECACA' : COLORS.border}`
  }} className="ap-feedback-page-11">
      {/* Header */}
      <div className="ap-feedback-page-12">
        <div className="ap-feedback-page-13">
          <Avatar name={fb.customerName || fb.customer || '?'} size={36} />
          <div>
            <div className="ap-feedback-page-14">
              {fb.customerName || fb.customer}
            </div>
            <div className="ap-feedback-page-15">
              <span className="ap-feedback-page-16">
                {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
              </span>
              <span className="ap-feedback-page-17">
                {fb.rating}.0
              </span>
              {fb.category && <TypeTag type={fb.category} />}
            </div>
          </div>
        </div>
        <div className="ap-feedback-page-18">
          <div className="ap-feedback-page-19">{dateStr}</div>
          <div className="ap-feedback-page-20">
            {(fb.jobRef || fb.techName) && <span className="ap-feedback-page-21">
                {fb.jobRef}{fb.jobRef && fb.techName ? ' · ' : ''}{fb.techName}
              </span>}
            {fb.recommend && <span className="ap-feedback-page-22">
                👍 Recommends
              </span>}
          </div>
        </div>
      </div>

      {/* Comment */}
      <p className="ap-feedback-page-23">
        "{fb.comment}"
      </p>

      {/* Negative follow-up banner */}
      {isNegative && !fb.resolved && <div className="ap-feedback-page-24">
          <span className="ap-feedback-page-25">
            ⚠ Negative feedback – needs follow-up
          </span>
          <button className="btn ap-feedback-page-26" onClick={() => onFollowUp(fb._id)}>
            Follow Up
          </button>
        </div>}
      {fb.resolved && fb.followUpNote && <div className="ap-feedback-page-27">
          ✅ Follow-up done: {fb.followUpNote}
        </div>}

      {/* Reply */}
      {fb.replied && fb.reply ? <div className="ap-feedback-page-28">
          <div className="ap-feedback-page-29">
            ✅ Your Reply (CoolTech AC Services)
          </div>
          <div className="ap-feedback-page-30">{fb.reply}</div>
        </div> : <div>
          <span className="ap-feedback-page-31">⏳ Reply Needed</span>

          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a professional reply..." className="ap-feedback-page-32" />

          {/* Quick reply templates */}
          <div className="ap-feedback-page-33">
            {['Thank you for the wonderful feedback! We look forward to serving you again.', 'We apologize for the inconvenience. Our team will contact you to resolve this.', "We're glad you chose CoolTech! Your satisfaction means everything to us."].map(t => <span key={t} onClick={() => setReplyText(t)} className="ap-feedback-page-34">
                {t.slice(0, 28)}…
              </span>)}
          </div>

          <button onClick={submitReply} disabled={replying || !replyText.trim()} style={{
        background: replying || !replyText.trim() ? "var(--border)" : "var(--brand)",
        color: replying || !replyText.trim() ? "var(--text-faint)" : "white",
        cursor: replying || !replyText.trim() ? "not-allowed" : "pointer"
      }} className="ap-feedback-page-35">
            {replying ? 'Posting…' : 'Post Reply'}
          </button>
        </div>}
    </div>;
};

// ─── FeedbackPage ─────────────────────────────────────────────────────────────
const FeedbackPage = ({
  openModal
}) => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fbData, statsData, custData] = await Promise.all([feedbackApi.list(), feedbackApi.stats(), customersApi.list()]);
      setFeedback(Array.isArray(fbData) ? fbData : fbData.data ?? []);
      setStats(statsData);
      setCustomers(Array.isArray(custData) ? custData : custData.data ?? []);
    } catch (err) {
      setToast({
        msg: 'Failed to load: ' + err.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleReply = async (id, reply) => {
    const updated = await feedbackApi.reply(id, reply);
    setFeedback(prev => prev.map(f => f._id === id ? updated : f));
    setToast({
      msg: 'Reply posted!'
    });
  };
  const handleFollowUp = async id => {
    const note = window.prompt('Follow-up note (optional):') ?? '';
    const updated = await feedbackApi.followUp(id, note);
    setFeedback(prev => prev.map(f => f._id === id ? updated : f));
    setToast({
      msg: 'Follow-up marked as done ✅'
    });
    if (openModal) openModal('set_reminder');
  };

  // ── Computed stats (fallback to local calc if API stats missing) ──
  const total = stats?.total ?? feedback.length;
  const avgRating = stats?.avgRating ?? (feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : '0.0');
  const recommend = stats?.recommend ?? feedback.filter(f => f.recommend).length;
  const avgRes = stats?.avgResolution ?? '2.3';
  const byRating = stats?.byRating ?? [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: feedback.filter(f => f.rating === s).length
  }));
  const unreplied = feedback.filter(f => !f.replied).length;
  const filtered = feedback.filter(f => {
    if (filter === 'unreplied') return !f.replied;
    if (filter === 'negative') return f.rating <= 2;
    return true;
  });
  return <div className="fi ap-feedback-page-36">

      {/* Header */}
      <div className="ap-feedback-page-37">
        <SectionHdr title="Feedback & Ratings" sub="Post-service customer reviews" action={null} />
        <div className="ap-feedback-page-38">
          {unreplied > 0 && <button className="btn ap-feedback-page-39" onClick={() => setFilter('unreplied')}>
              ⚠ {unreplied} Unreplied
            </button>}
          <button className="btn ap-feedback-page-40" onClick={() => setShowModal(true)}>
            ✉ Request Review
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ap-feedback-page-41">
        {[{
        key: 'all',
        label: `All (${feedback.length})`
      }, {
        key: 'unreplied',
        label: `Unreplied (${unreplied})`
      }, {
        key: 'negative',
        label: `Negative (${feedback.filter(f => f.rating <= 2).length})`
      }].map(f => <button key={f.key} onClick={() => setFilter(f.key)} style={{
        background: filter === f.key ? "var(--brand-light)" : "var(--bg)",
        color: filter === f.key ? "var(--brand)" : "var(--text-muted)",
        borderColor: filter === f.key ? "var(--brand)" : "var(--border)"
      }} className="ap-feedback-page-42">
            {f.label}
          </button>)}
      </div>

      {/* Main grid */}
      <div className="ap-feedback-page-43">

        {/* Stats sidebar */}
        <div className="ap-feedback-page-44">
          <div className="ap-feedback-page-45">
            {Number(avgRating).toFixed(1)}
          </div>
          <div className="ap-feedback-page-46">
            {'★'.repeat(Math.round(avgRating))}
          </div>
          <div className="ap-feedback-page-47">{total} reviews</div>

          {/* Rating bars */}
          <div className="ap-feedback-page-48">
            {byRating.map(({
            stars,
            count
          }) => <div key={stars} className="ap-feedback-page-49">
                <span className="ap-feedback-page-50">
                  {stars}
                </span>
                <span className="ap-feedback-page-51">★</span>
                <div className="ap-feedback-page-52">
                  <div style={{
                width: `${total ? count / total * 100 : 0}%`
              }} className="ap-feedback-page-53" />
                </div>
                <span className="ap-feedback-page-54">
                  {count}
                </span>
              </div>)}
          </div>

          <Divider />

          <div className="ap-feedback-page-55">
            {recommend}/{total}
          </div>
          <div className="ap-feedback-page-56">would recommend</div>

          <div className="ap-feedback-page-57">
            <div className="ap-feedback-page-58">
              {avgRes}
            </div>
            <div className="ap-feedback-page-59">days avg resolution</div>
          </div>
        </div>

        {/* Feedback cards */}
        <div className="ap-feedback-page-60">
          {loading && <div className="ap-feedback-page-61">
              Loading feedback…
            </div>}
          {!loading && filtered.length === 0 && <div className="ap-feedback-page-62">
              No feedback found.
            </div>}
          {!loading && filtered.map(fb => <FeedbackCard key={fb._id} fb={fb} onReply={handleReply} onFollowUp={handleFollowUp} />)}
        </div>
      </div>

      {/* Request Feedback Modal */}
      {showModal && <RequestModal customers={customers} onClose={() => setShowModal(false)} onSent={msg => setToast({
      msg
    })} />}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>;
};
export default FeedbackPage;
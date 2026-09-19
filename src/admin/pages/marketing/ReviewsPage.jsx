import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { reviewsApi } from '../../services/api';

// ─── Config ────────────────────────────────────────────────────────────────────
// Put your real Google review link in .env as VITE_GOOGLE_REVIEW_URL.
// (Google Business Profile → "Ask for reviews" → copy the short link.)
const REVIEW_LINK = import.meta.env.VITE_GOOGLE_REVIEW_URL || 'https://g.page/cooltech-ac-services/review';
const SHARE_TEXT = "Thank you for choosing CoolTech AC Services! We'd really appreciate your feedback — it takes less than a minute:";
const SHARE_MESSAGE = `${SHARE_TEXT} ${REVIEW_LINK}`;
const QUICK_REPLIES = ["Thank you for the review!", "We apologize for the inconvenience.", "We're glad you chose CoolTech!"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Backend Review → shape this page renders. There is no `replied` flag in the
// schema — a review counts as replied when `response` has text.
const toView = r => ({
  id: r._id || r.id,
  author: r.customerName || 'Anonymous',
  rating: r.rating,
  date: r.date || r.createdAt,
  text: r.reviewText || '',
  reply: r.response || '',
  replied: !!(r.response && r.response.trim()),
  platform: r.platform || 'Google'
});
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}) : '';
const copyText = async text => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {/* fall through to legacy path */}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

// ─── ShareReviewModal ──────────────────────────────────────────────────────────

const ShareReviewModal = ({
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  const enc = encodeURIComponent;
  const options = [{
    key: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    run: () => window.open(`https://wa.me/?text=${enc(SHARE_MESSAGE)}`, '_blank', 'noopener,noreferrer')
  }, {
    key: 'email',
    label: 'Email',
    icon: '✉️',
    run: () => {
      window.location.href = `mailto:?subject=${enc('How did we do? Leave us a review')}&body=${enc(SHARE_MESSAGE)}`;
    }
  }, {
    key: 'sms',
    label: 'SMS',
    icon: '📱',
    run: () => {
      window.location.href = `sms:?&body=${enc(SHARE_MESSAGE)}`;
    }
  }, ...(canNativeShare ? [{
    key: 'more',
    label: 'More…',
    icon: '↗',
    run: () => navigator.share({
      title: 'Review CoolTech AC Services',
      text: SHARE_TEXT,
      url: REVIEW_LINK
    }).catch(() => {})
  }] : [])];
  return <div role="dialog" aria-modal="true" aria-label="Share review link" onClick={e => {
    if (e.target === e.currentTarget) onClose();
  }} style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16
  }}>
      <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      width: '100%',
      maxWidth: 460,
      padding: 24,
      boxShadow: '0 20px 50px rgba(0,0,0,.25)'
    }}>
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6
      }}>
          <div style={{
          fontSize: 17,
          fontWeight: 800
        }}>Share Review Link</div>
          <button className="btn" onClick={onClose} aria-label="Close" style={{
          background: 'transparent',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          color: COLORS.muted
        }}>✕</button>
        </div>
        <div style={{
        fontSize: 13,
        color: COLORS.muted,
        marginBottom: 16
      }}>
          Send this link to customers so they can leave a Google review.
        </div>

        <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 18
      }}>
          <input readOnly value={REVIEW_LINK} onFocus={e => e.target.select()} aria-label="Review link" style={{
          flex: 1,
          minWidth: 0,
          padding: '9px 12px',
          borderRadius: 9,
          border: `1px solid ${COLORS.border}`,
          background: 'transparent',
          color: 'inherit',
          fontSize: 13
        }} />
          <button className="btn" onClick={async () => setCopied(await copyText(REVIEW_LINK))} style={{
          padding: '9px 16px',
          borderRadius: 9,
          border: 'none',
          background: COLORS.brand,
          color: '#fff',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>{copied ? '✓ Copied' : 'Copy'}</button>
        </div>

        <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.muted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '.04em'
      }}>Share via</div>
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))',
        gap: 10
      }}>
          {options.map(o => <button key={o.key} className="btn" onClick={o.run} style={{
          padding: '12px 8px',
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          background: 'transparent',
          color: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4
        }}>
              <span style={{
            fontSize: 20
          }}>{o.icon}</span>{o.label}
            </button>)}
        </div>
      </div>
    </div>;
};

// ─── ReviewsPage ───────────────────────────────────────────────────────────────

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [onlyUnreplied, setOnlyUnreplied] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [posting, setPosting] = useState({});
  const [postErrors, setPostErrors] = useState({});
  const [shareOpen, setShareOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    reviewsApi.list({
      limit: 500
    }).then(res => {
      if (!alive) return;
      const list = res?.data || res || [];
      setReviews((Array.isArray(list) ? list : []).map(toView).filter(r => r.platform === 'Google').sort((a, b) => new Date(b.date) - new Date(a.date)));
    }).catch(e => alive && setError(e.message || 'Could not load reviews.')).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  const total = reviews.length;
  const avgRating = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
  const unreplied = reviews.filter(r => !r.replied).length;
  const stars = [5, 4, 3, 2, 1].map(s => ({
    s,
    count: reviews.filter(r => r.rating === s).length
  }));
  const filtering = onlyUnreplied && unreplied > 0;
  const visible = filtering ? reviews.filter(r => !r.replied) : reviews;
  const addQuickReply = (id, t) => setDrafts(d => {
    const cur = d[id] || '';
    return {
      ...d,
      [id]: cur ? `${cur.trimEnd()} ${t}` : t
    };
  });
  const handlePost = async review => {
    const text = (drafts[review.id] || '').trim();
    if (!text) {
      setPostErrors(p => ({
        ...p,
        [review.id]: 'Write a reply first.'
      }));
      return;
    }
    setPosting(p => ({
      ...p,
      [review.id]: true
    }));
    setPostErrors(p => ({
      ...p,
      [review.id]: ''
    }));
    try {
      const res = await reviewsApi.respond(review.id, text);
      const saved = res?.data || res;
      setReviews(list => list.map(r => r.id === review.id ? {
        ...r,
        reply: saved?.response ?? text,
        replied: true
      } : r));
      setDrafts(d => {
        const {
          [review.id]: _drop,
          ...rest
        } = d;
        return rest;
      });
    } catch (e) {
      setPostErrors(p => ({
        ...p,
        [review.id]: e.message || 'Could not post reply.'
      }));
    } finally {
      setPosting(p => ({
        ...p,
        [review.id]: false
      }));
    }
  };
  return <div className="fi ap-reviews-page-1">
      <div className="ap-reviews-page-2">
        <div><div className="ap-reviews-page-3">Reviews & Reputation</div>
        <div className="ap-reviews-page-4">Google My Business · Monitor and respond to reviews</div></div>
        <div className="ap-reviews-page-5">
          {unreplied > 0 && <button className="btn ap-reviews-page-6" aria-pressed={filtering} title={filtering ? 'Click to show all reviews' : 'Show only unreplied reviews'} onClick={() => setOnlyUnreplied(v => !v)}>
              {filtering ? `✕ Showing ${unreplied} Unreplied` : `⚠ ${unreplied} Unreplied`}
            </button>}
          <button className="btn ap-reviews-page-7" onClick={() => setShareOpen(true)}>🔗 Share Review Link</button>
        </div>
      </div>
      <div className="ap-reviews-page-8">
        <div className="ap-reviews-page-9">
          <div className="ap-reviews-page-10">G</div>
          <div className="ap-reviews-page-11">Google Rating</div>
          <div className="ap-reviews-page-12">{avgRating}</div>
          <div className="ap-reviews-page-13">{"★".repeat(Math.round(avgRating))}</div>
          <div className="ap-reviews-page-14">{total} reviews</div>
          <div className="ap-reviews-page-15">
            {stars.map(({
            s,
            count
          }) => <div key={s} className="ap-reviews-page-16">
                <span className="ap-reviews-page-17">{s}</span>
                <span className="ap-reviews-page-18">★</span>
                <div className="ap-reviews-page-19"><div style={{
                width: `${total ? count / total * 100 : 0}%`
              }} className="ap-reviews-page-20" /></div>
                <span className="ap-reviews-page-21">{count}</span>
              </div>)}
          </div>
          <div className="ap-reviews-page-22">
            <div className="ap-reviews-page-23">
              <div className="ap-reviews-page-24"><div className="ap-reviews-page-25">{total - unreplied}</div><div className="ap-reviews-page-26">Replied</div></div>
              <div className="ap-reviews-page-27"><div className="ap-reviews-page-28">{unreplied}</div><div className="ap-reviews-page-29">Pending</div></div>
            </div>
          </div>
        </div>
        <div className="ap-reviews-page-30">
          {loading && <div className="ap-reviews-page-4">Loading reviews…</div>}
          {!loading && error && <div style={{
          color: 'var(--danger)'
        }} className="ap-reviews-page-4">{error}</div>}
          {!loading && !error && visible.length === 0 && <div className="ap-reviews-page-4">No reviews yet.</div>}
          {visible.map(review => <div key={review.id} style={{
          border: `1px solid ${!review.replied ? "#FDE68A" : "#E5E7EB"}`
        }} className="ap-reviews-page-31">
              <div className="ap-reviews-page-32">
                <div className="ap-reviews-page-33">
                  <Avatar name={review.author} size={36} color="#EA4335" />
                  <div>
                    <div className="ap-reviews-page-34">{review.author}</div>
                    <div className="ap-reviews-page-35">
                      <span className="ap-reviews-page-36">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                      <span className="ap-reviews-page-37">{fmtDate(review.date)}</span>
                    </div>
                  </div>
                </div>
                {!review.replied && <span className="ap-reviews-page-38">⏳ Reply Needed</span>}
              </div>
              {review.text && <p className="ap-reviews-page-39">"{review.text}"</p>}
              {review.replied ? <div className="ap-reviews-page-40">
                  <div className="ap-reviews-page-41">✅ Your Reply (CoolTech AC Services)</div>
                  <div className="ap-reviews-page-42">{review.reply}</div>
                </div> : <div>
                  <textarea placeholder="Write a professional reply..." className="ap-reviews-page-43" value={drafts[review.id] || ''} disabled={!!posting[review.id]} onChange={e => setDrafts(d => ({
              ...d,
              [review.id]: e.target.value
            }))} />
                  <div className="ap-reviews-page-44">
                    {QUICK_REPLIES.map(t => <span key={t} role="button" tabIndex={0} title={t} style={{
                  cursor: 'pointer'
                }} onClick={() => addQuickReply(review.id, t)} onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    addQuickReply(review.id, t);
                  }
                }} className="ap-reviews-page-45">{t.slice(0, 24)}...</span>)}
                  </div>
                  <button className="btn ap-reviews-page-46" disabled={!!posting[review.id]} onClick={() => handlePost(review)}>
                    {posting[review.id] ? 'Posting…' : 'Post Reply'}
                  </button>
                  {postErrors[review.id] && <div style={{
              color: 'var(--danger)',
              fontSize: 12,
              marginTop: 6
            }}>{postErrors[review.id]}</div>}
                </div>}
            </div>)}
        </div>
      </div>
      {shareOpen && <ShareReviewModal onClose={() => setShareOpen(false)} />}
    </div>;
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: CONTENT LIBRARY
══════════════════════════════════════════════════════════════════════════ */

export default ReviewsPage;
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { GOOGLE_REVIEWS } from '../../data/mockData';

// ─── ReviewsPage ───────────────────────────────────────────────────────────────

const ReviewsPage = () => {
  const avgRating = (GOOGLE_REVIEWS.reduce((s, r) => s + r.rating, 0) / GOOGLE_REVIEWS.length).toFixed(1);
  const unreplied = GOOGLE_REVIEWS.filter(r => !r.replied).length;
  const stars = [5, 4, 3, 2, 1].map(s => ({
    s,
    count: GOOGLE_REVIEWS.filter(r => r.rating === s).length
  }));
  return <div className="fi ap-reviews-page-1">
      <div className="ap-reviews-page-2">
        <div><div className="ap-reviews-page-3">Reviews & Reputation</div>
        <div className="ap-reviews-page-4">Google My Business · Monitor and respond to reviews</div></div>
        <div className="ap-reviews-page-5">
          {unreplied > 0 && <button className="btn ap-reviews-page-6" onClick={() => document.querySelector('[data-reply-needed]')?.scrollIntoView({
          behavior: 'smooth'
        })}>⚠ {unreplied} Unreplied</button>}
          <button className="btn ap-reviews-page-7" onClick={() => navigator.clipboard?.writeText('https://g.page/cooltech-ac-services/review').catch(() => {})}>🔗 Share Review Link</button>
        </div>
      </div>
      <div className="ap-reviews-page-8">
        <div className="ap-reviews-page-9">
          <div className="ap-reviews-page-10">G</div>
          <div className="ap-reviews-page-11">Google Rating</div>
          <div className="ap-reviews-page-12">{avgRating}</div>
          <div className="ap-reviews-page-13">{"★".repeat(Math.round(avgRating))}</div>
          <div className="ap-reviews-page-14">{GOOGLE_REVIEWS.length} reviews</div>
          <div className="ap-reviews-page-15">
            {stars.map(({
            s,
            count
          }) => <div key={s} className="ap-reviews-page-16">
                <span className="ap-reviews-page-17">{s}</span>
                <span className="ap-reviews-page-18">★</span>
                <div className="ap-reviews-page-19"><div style={{
                width: `${count / GOOGLE_REVIEWS.length * 100}%`
              }} className="ap-reviews-page-20" /></div>
                <span className="ap-reviews-page-21">{count}</span>
              </div>)}
          </div>
          <div className="ap-reviews-page-22">
            <div className="ap-reviews-page-23">
              <div className="ap-reviews-page-24"><div className="ap-reviews-page-25">{GOOGLE_REVIEWS.filter(r => r.replied).length}</div><div className="ap-reviews-page-26">Replied</div></div>
              <div className="ap-reviews-page-27"><div className="ap-reviews-page-28">{unreplied}</div><div className="ap-reviews-page-29">Pending</div></div>
            </div>
          </div>
        </div>
        <div className="ap-reviews-page-30">
          {GOOGLE_REVIEWS.map(review => <div key={review.id} style={{
          border: `1px solid ${!review.replied ? "#FDE68A" : "#E5E7EB"}`
        }} className="ap-reviews-page-31">
              <div className="ap-reviews-page-32">
                <div className="ap-reviews-page-33">
                  <Avatar name={review.author} size={36} color="#EA4335" />
                  <div>
                    <div className="ap-reviews-page-34">{review.author}</div>
                    <div className="ap-reviews-page-35">
                      <span className="ap-reviews-page-36">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                      <span className="ap-reviews-page-37">{review.date}</span>
                    </div>
                  </div>
                </div>
                {!review.replied && <span className="ap-reviews-page-38">⏳ Reply Needed</span>}
              </div>
              <p className="ap-reviews-page-39">"{review.text}"</p>
              {review.replied && review.reply ? <div className="ap-reviews-page-40">
                  <div className="ap-reviews-page-41">✅ Your Reply (CoolTech AC Services)</div>
                  <div className="ap-reviews-page-42">{review.reply}</div>
                </div> : <div>
                  <textarea placeholder="Write a professional reply..." className="ap-reviews-page-43" />
                  <div className="ap-reviews-page-44">
                    {["Thank you for the review!", "We apologize for the inconvenience.", "We're glad you chose CoolTech!"].map(t => <span key={t} className="ap-reviews-page-45">{t.slice(0, 24)}...</span>)}
                  </div>
                  <button className="btn ap-reviews-page-46" onClick={e => {
              const ta = e.target.closest('div').querySelector('textarea');
              if (ta && ta.value.trim()) {
                ta.closest('[data-review]')?.setAttribute('data-replied', 'true');
              }
            }}>Post Reply</button>
                </div>}
            </div>)}
        </div>
      </div>
    </div>;
};

/* ══════════════════════════════════════════════════════════════════════════
   PAGE: CONTENT LIBRARY
══════════════════════════════════════════════════════════════════════════ */

export default ReviewsPage;
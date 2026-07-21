import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/sm`;

// ─── ChannelIcon ───────────────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook: {
    emoji: "📘",
    color: "var(--brand-facebook)"
  },
  instagram: {
    emoji: "📸",
    color: "var(--brand-instagram)"
  },
  twitter: {
    emoji: "🐦",
    color: "var(--brand-twitter)"
  },
  linkedin: {
    emoji: "💼",
    color: "var(--brand-linkedin)"
  },
  youtube: {
    emoji: "▶️",
    color: "var(--xff0000)"
  },
  google: {
    emoji: "⭐",
    color: "var(--brand-google-yellow)"
  }
};
const ChannelIcon = ({
  id,
  size = 28
}) => {
  const meta = CHANNEL_META[id] || {
    emoji: "🌐",
    color: "#94A3B8"
  };
  return <div style={{
    width: size,
    height: size,
    background: meta.color + "22",
    fontSize: size * 0.5
  }} className="ap-social-dashboard-1">
      {meta.emoji}
    </div>;
};

// ─── ChannelChips ──────────────────────────────────────────────────────────────
const ChannelChips = ({
  channels = []
}) => <div className="ap-social-dashboard-2">
    {channels.map(ch => {
    const meta = CHANNEL_META[ch] || {
      emoji: "🌐",
      color: "#94A3B8"
    };
    return <span key={ch} style={{
      background: meta.color + "18",
      color: meta.color
    }} className="ap-social-dashboard-3">
          {meta.emoji} {ch}
        </span>;
  })}
  </div>;

// ─── SmBarChart ────────────────────────────────────────────────────────────────
const SmBarChart = ({
  data = [],
  field,
  color
}) => {
  const max = Math.max(...data.map(d => d[field]), 1);
  return <div className="ap-social-dashboard-4">
      {data.map((d, i) => <div key={i} className="ap-social-dashboard-5">
          <div style={{
        height: Math.max(4, d[field] / max * 50),
        background: color
      }} className="ap-social-dashboard-6" />
          <div className="ap-social-dashboard-7">{d.day}</div>
        </div>)}
    </div>;
};

// ─── SocialDashboard ───────────────────────────────────────────────────────────
// IMPORTANT (routing): the "Schedule Post" button calls setPage("sm_schedule").
// Make sure your router/page-switch in App.jsx has a case for "sm_schedule"
// that renders <PostSchedulerPage />. If your scheduler page uses a different
// key (e.g. "post_scheduler"), change the string below to match it exactly —
// that mismatch is the #1 reason the button looks like it "does nothing".
const SocialDashboard = ({
  setPage
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('admin_token'); // ⚠️ adjust key name if yours differs
    fetch(`${API_BASE}/dashboard`, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {},
      credentials: 'include' // remove this line if you're using JWT-only, not cookies
    }).then(res => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    }).then(json => setData(json)).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="ap-social-dashboard-8">Loading dashboard…</div>;
  if (error) return <div className="ap-social-dashboard-9">Failed to load dashboard: {error}</div>;
  if (!data) return null;
  const {
    kpis,
    channels,
    posts,
    campaigns,
    weekly
  } = data;
  return <div className="fi ap-social-dashboard-10">

      {/* ── Header ── */}
      <div className="ap-social-dashboard-11">
        <div>
          <div className="ap-social-dashboard-12">Social Media Hub</div>
          <div className="ap-social-dashboard-13">Manage all your channels, posts & campaigns from one place</div>
        </div>
        <div className="ap-social-dashboard-14">
          <button className="btn ap-social-dashboard-15" onClick={() => setPage("sm_posts")}>📅 Schedule Post</button>
          <button className="btn ap-social-dashboard-16" onClick={() => setPage("sm_campaign")}>+ New Campaign</button>
        </div>
      </div>

      {/* ── KPI row (all values come straight from kpis, computed server-side) ── */}
      <div className="ap-social-dashboard-17">
        {[{
        label: "Total Followers",
        value: kpis.totalFollowers.toLocaleString(),
        sub: "across all channels",
        icon: "👥",
        color: "#1877F2",
        bg: "#EFF6FF"
      }, {
        label: "Monthly Reach",
        value: kpis.totalReach.toLocaleString(),
        sub: "unique people reached",
        icon: "📡",
        color: "#E1306C",
        bg: "#FDF2F8"
      }, {
        label: "Social Leads",
        value: kpis.totalLeads,
        sub: "this month",
        icon: "🎯",
        color: "#EA580C",
        bg: "#FFF7ED"
      }, {
        label: "Posts Published",
        value: kpis.publishedPosts,
        sub: "this month",
        icon: "📝",
        color: "#16A34A",
        bg: "#F0FDF4"
      }, {
        label: "Active Campaigns",
        value: kpis.activeCampaigns,
        sub: "running now",
        icon: "🚀",
        color: "#7C3AED",
        bg: "#F5F3FF"
      }].map((k, i) => <div key={k.label} className={`${"stat-card card fu" + i} ap-social-dashboard-18`}>
            <div className="ap-social-dashboard-19">
              <div className="ap-social-dashboard-20">{k.label}</div>
              <div style={{
            background: k.bg
          }} className="ap-social-dashboard-21">{k.icon}</div>
            </div>
            <div style={{
          color: k.color
        }} className="ap-social-dashboard-22">{k.value}</div>
            <div className="ap-social-dashboard-23">{k.sub}</div>
          </div>)}
      </div>

      {/* ── Connected channels ── */}
      <div className="ap-social-dashboard-24">
        <div className="ap-social-dashboard-25">Connected Channels</div>
        <div className="ap-social-dashboard-26">
          {channels.map((ch, i) => <div key={ch.id || i} className="card ap-social-dashboard-27" style={{
          background: ch.connected ? ch.bg : "#F8FAFC"
        }}>
              {!ch.connected && <div className="ap-social-dashboard-28">
                  Not Connected
                </div>}
              <div className="ap-social-dashboard-29">
                <ChannelIcon id={ch.id} size={34} />
                <span style={{
              background: ch.connected ? "white" : "var(--bg)",
              color: ch.connected ? "var(--success-text)" : "var(--text-faint)",
              border: ch.connected ? "1px solid var(--success-border)" : "none"
            }} className="ap-social-dashboard-30">
                  {ch.connected ? "● Live" : "○ Off"}
                </span>
              </div>
              <div className="ap-social-dashboard-31">{ch.name}</div>
              <div className="ap-social-dashboard-32">{ch.handle}</div>
              <div className="ap-social-dashboard-33">
                {ch.followers > 0 && <div className="ap-social-dashboard-34"><div className="ap-social-dashboard-35">{ch.followers.toLocaleString()}</div><div className="ap-social-dashboard-36">Followers</div></div>}
                <div className="ap-social-dashboard-37"><div className="ap-social-dashboard-38">{ch.leads}</div><div className="ap-social-dashboard-39">Leads</div></div>
                {ch.rating > 0 && <div className="ap-social-dashboard-40"><div className="ap-social-dashboard-41">{ch.rating}★</div><div className="ap-social-dashboard-42">Rating</div></div>}
                {ch.reach > 0 && <div className="ap-social-dashboard-43"><div className="ap-social-dashboard-44">{(ch.reach / 1000).toFixed(1)}K</div><div className="ap-social-dashboard-45">Reach</div></div>}
              </div>
            </div>)}
        </div>
      </div>

      {/* ── Middle row ── */}
      <div className="ap-social-dashboard-46">

        {/* Recent posts performance */}
        <div className="ap-social-dashboard-47">
          <div className="ap-social-dashboard-48">
            <div className="ap-social-dashboard-49">Recent Post Performance</div>
            <button onClick={() => setPage("sm_posts")} className="ap-social-dashboard-50">View all →</button>
          </div>
          {posts.filter(p => p.status === "published").slice(0, 4).map(post => <div key={post.id} className="ap-social-dashboard-51">
              <div className="ap-social-dashboard-52">{post.image}</div>
              <div className="ap-social-dashboard-53">
                <div className="ap-social-dashboard-54">{post.title}</div>
                <div className="ap-social-dashboard-55">
                  <ChannelChips channels={post.channels} />
                  <span className="ap-social-dashboard-56">{post.scheduledAt.split(" · ")[0]}</span>
                </div>
              </div>
              <div className="ap-social-dashboard-57">
                {[["👁", post.reach.toLocaleString()], ["❤", post.likes], ["💬", post.comments], ["↗", post.shares], ["🎯", post.leads]].map(([icon, val]) => <div key={icon} className="ap-social-dashboard-58">
                    <div className="ap-social-dashboard-59">{icon}</div>
                    <div className="ap-social-dashboard-60">{val}</div>
                  </div>)}
              </div>
            </div>)}
        </div>

        {/* Weekly activity */}
        <div className="ap-social-dashboard-61">
          <div className="ap-social-dashboard-62">
            <div className="ap-social-dashboard-63">Weekly Reach</div>
            <SmBarChart data={weekly} field="reach" color="#1877F2" />
          </div>
          <div className="ap-social-dashboard-64">
            <div className="ap-social-dashboard-65">Leads from Social</div>
            <SmBarChart data={weekly} field="leads" color="#EA580C" />
            <div className="ap-social-dashboard-66">
              <span className="ap-social-dashboard-67">{weekly.reduce((s, d) => s + d.leads, 0)}</span> leads this week
            </div>
          </div>
        </div>
      </div>

      {/* ── Upcoming scheduled posts ── */}
      <div className="ap-social-dashboard-68">
        <div className="ap-social-dashboard-69">Upcoming Scheduled Posts</div>
        <div className="ap-social-dashboard-70">
          {posts.filter(p => p.status === "scheduled").map(post => <div key={post.id} className="ap-social-dashboard-71">
              <div className="ap-social-dashboard-72">{post.image}</div>
              <div className="ap-social-dashboard-73">
                <div className="ap-social-dashboard-74">{post.title}</div>
                <div className="ap-social-dashboard-75">
                  <ChannelChips channels={post.channels} />
                </div>
                <div className="ap-social-dashboard-76">📅 {post.scheduledAt}</div>
              </div>
            </div>)}
        </div>
      </div>

    </div>;
};
export default SocialDashboard;
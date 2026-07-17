import SocialChannel from "../models/SocialChannel.js";
import { PostSchedule } from "../models/extendedModels.js";
import { AdCampaign } from "../models/AdCampaign.model.js";

// Default emoji per post "type" since PostSchedule has no `image` field
const TYPE_EMOJI = {
  Promotion: "🌞",
  Tips: "🔧",
  Testimonial: "⭐",
  Reminder: "❄️",
  Announcement: "🪔",
  Update: "📝",
};

/**
 * GET /api/sm/dashboard
 * Returns { kpis, channels, posts, campaigns, weekly }
 *
 * ─── KPI FORMULAS ───────────────────────────────────────────────
 * totalFollowers  = Σ channel.followers          WHERE channel.connected = true
 * totalReach      = Σ post.reach                 WHERE post.status = "published"
 *                                                 AND post.platforms ⊆ connected channels
 *                                                 AND post.isDeleted = false
 * totalLeads      = Σ post.leads                 WHERE post.status = "published"
 * publishedPosts  = COUNT(posts)                 WHERE post.status = "published"
 * activeCampaigns = COUNT(campaigns)              WHERE campaign.status = "active"
 *                                                 AND campaign.isDeleted = false
 * ------------------------------------------------------------------
 */
export const getDashboard = async (req, res) => {
  try {
    const [channels, posts, campaigns] = await Promise.all([
      SocialChannel.find(),
      PostSchedule.find({ isDeleted: { $ne: true } }).sort({ scheduledAt: -1 }),
      AdCampaign.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }),
    ]);

    const connectedIds = channels.filter((c) => c.connected).map((c) => c.channelId);

    const publishedPosts = posts.filter((p) => p.status === "published");

    const relevantPublished = publishedPosts.filter((p) =>
      (p.platforms || []).some((ch) => connectedIds.includes(ch))
    );

    const totalFollowers = channels
      .filter((c) => c.connected)
      .reduce((sum, c) => sum + c.followers, 0);

    const totalReach = relevantPublished.reduce((sum, p) => sum + (p.reach || 0), 0);
    const totalLeads = relevantPublished.reduce((sum, p) => sum + (p.leads || 0), 0);

    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;

    // Per-channel reach/leads for the Connected Channels cards
    const channelStats = {};
    connectedIds.forEach((id) => (channelStats[id] = { reach: 0, leads: 0 }));
    relevantPublished.forEach((p) => {
      (p.platforms || []).forEach((ch) => {
        if (channelStats[ch]) {
          channelStats[ch].reach += p.reach || 0;
          channelStats[ch].leads += p.leads || 0;
        }
      });
    });

    const channelsWithStats = channels.map((c) => ({
      id: c.channelId,
      name: c.name,
      handle: c.handle,
      connected: c.connected,
      followers: c.followers,
      rating: c.rating,
      bg: c.bg,
      reach: channelStats[c.channelId]?.reach || 0,
      leads: channelStats[c.channelId]?.leads || 0,
    }));

    const weekly = buildWeeklySeries(publishedPosts);

    res.json({
      kpis: {
        totalFollowers,
        totalReach,
        totalLeads,
        publishedPosts: publishedPosts.length,
        activeCampaigns,
      },
      channels: channelsWithStats,
      posts: posts.map(formatPost),
      campaigns,
      weekly,
    });
  } catch (err) {
    console.error("getDashboard error:", err);
    res.status(500).json({ error: err.message });
  }
};

function formatPost(p) {
  return {
    id: p.postId,
    _id: p._id,
    title: p.title,
    image: TYPE_EMOJI[p.type] || "📝",
    channels: p.platforms,            // renamed to `channels` so SocialDashboard.jsx (ChannelChips) works unchanged
    status: p.status,
    scheduledAt: formatDateLabel(p.scheduledAt),
    reach: p.reach || 0,
    likes: p.likes || 0,
    comments: p.comments || 0,
    shares: p.shares || 0,
    leads: p.leads || 0,
  };
}

function formatDateLabel(date) {
  if (!date) return "";
  const d = new Date(date);
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

// Uses publishedAt when present (actual publish time), falls back to scheduledAt
function buildWeeklySeries(publishedPosts) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const dayIdx = (today.getDay() + 6) % 7; // Sun=0 → Mon=0 indexing
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayIdx);
  monday.setHours(0, 0, 0, 0);

  return days.map((day, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const postsThatDay = publishedPosts.filter((p) => {
      const ts = p.publishedAt || p.scheduledAt;
      if (!ts) return false;
      const t = new Date(ts).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });

    return {
      day,
      reach: postsThatDay.reduce((s, p) => s + (p.reach || 0), 0),
      leads: postsThatDay.reduce((s, p) => s + (p.leads || 0), 0),
    };
  });
}
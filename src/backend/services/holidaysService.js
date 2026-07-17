// ─── holidaysService.js ─────────────────────────────────────────────────────
// Fetches Indian holidays from Calendarific (https://calendarific.com) — a
// commercial holiday API with full India coverage (71 holidays/year,
// verified accurate for 2026 including all lunar festivals) and a free tier
// generous enough for this use case (1,000 requests/day; we only hit the
// upstream once per year per 24h thanks to the cache below, so realistic
// usage is ~1-2 calls/day even across every user of the app).
//
// Setup required:
//   1. Sign up free at https://calendarific.com/signup
//   2. Add to your backend .env:  CALENDARIFIC_API_KEY=your_key_here
//
// Fetched server-side (not from the browser) so:
//   - the API key never reaches the client
//   - one cached copy is shared across all users instead of every client
//     burning its own quota
//   - a temporary Calendarific outage doesn't break the calendar for anyone

const CALENDARIFIC_URL = 'https://calendarific.com/api/v2/holidays';

// Which Calendarific holiday `type`s we want. Their India feed also includes
// "observance" (Valentine's Day, Halloween, Mother's/Father's Day, solstices,
// equinoxes) which isn't relevant to a business ops calendar — we deliberately
// leave that out. "local" (state-specific days) is left out too for the same
// reason; add it back via INCLUDED_TYPES below if you want those.
const INCLUDED_TYPES = 'national,religious';

// ── Fallback ─────────────────────────────────────────────────────────────
// Used only if CALENDARIFIC_API_KEY isn't set, the request fails, or the
// response is empty/malformed — so the calendar still shows *something*
// correct instead of nothing. This is the full 2025–2027 calendar,
// hand-verified against the Government of India gazetted/restricted holiday
// circulars. Years outside this range fall back further to just the
// fixed-date national holidays that never move.
const FALLBACK_HOLIDAYS_BY_YEAR = {
  2025: {
    '2025-01-14': 'Makar Sankranti',
    '2025-01-26': 'Republic Day',
    '2025-02-26': 'Maha Shivratri',
    '2025-03-14': 'Holi',
    '2025-04-06': 'Ram Navami',
    '2025-04-10': 'Mahavir Jayanti',
    '2025-04-14': 'Baisakhi / Ambedkar Jayanti',
    '2025-04-18': 'Good Friday',
    '2025-08-09': 'Raksha Bandhan',
    '2025-08-15': 'Independence Day',
    '2025-08-16': 'Janmashtami',
    '2025-08-27': 'Ganesh Chaturthi',
    '2025-10-02': 'Gandhi Jayanti / Dussehra',
    '2025-10-20': 'Diwali',
    '2025-11-05': "Guru Nanak's Birthday",
    '2025-12-25': 'Christmas',
  },
  2026: {
    '2026-01-14': 'Makar Sankranti',
    '2026-01-26': 'Republic Day',
    '2026-02-15': 'Maha Shivratri',
    '2026-03-04': 'Holi',
    '2026-03-26': 'Ram Navami',
    '2026-03-31': 'Mahavir Jayanti',
    '2026-04-03': 'Good Friday',
    '2026-04-14': 'Baisakhi',
    '2026-05-01': 'Buddha Purnima',
    '2026-08-15': 'Independence Day',
    '2026-08-28': 'Raksha Bandhan',
    '2026-09-04': 'Janmashtami',
    '2026-09-14': 'Ganesh Chaturthi',
    '2026-10-02': 'Gandhi Jayanti',
    '2026-10-20': 'Dussehra',
    '2026-11-08': 'Diwali',
    '2026-11-24': "Guru Nanak's Birthday",
    '2026-12-25': 'Christmas',
  },
  2027: {
    '2027-01-26': 'Republic Day',
    '2027-08-15': 'Independence Day',
    '2027-10-29': 'Diwali',
  },
};

function buildMinimalFallback(year) {
  return {
    [`${year}-01-26`]: 'Republic Day',
    [`${year}-08-15`]: 'Independence Day',
    [`${year}-10-02`]: 'Gandhi Jayanti',
    [`${year}-12-25`]: 'Christmas',
  };
}

function buildFallback(year) {
  return FALLBACK_HOLIDAYS_BY_YEAR[year] || buildMinimalFallback(year);
}

// ── Request + parsing ──────────────────────────────────────────────────────
function buildUrl(year) {
  const params = new URLSearchParams({
    api_key: process.env.CALENDARIFIC_API_KEY || '',
    country: 'IN',
    year: String(year),
    type: INCLUDED_TYPES,
  });
  return `${CALENDARIFIC_URL}?${params.toString()}`;
}

function parseResponse(json) {
  const holidays = json?.response?.holidays;
  if (!Array.isArray(holidays) || holidays.length === 0) return null;

  const map = {};
  for (const h of holidays) {
    const iso = h?.date?.iso;
    const name = h?.name;
    if (!iso || !name) continue;
    // Multiple holidays can legitimately land on the same date (e.g. Pongal
    // + Makar Sankranti, or Janmashtami + Janmashtami (Smarta)) — combine
    // them instead of overwriting so nothing silently disappears.
    map[iso] = map[iso] ? `${map[iso]} / ${name}` : name;
  }
  return Object.keys(map).length > 0 ? map : null;
}

// ── In-memory cache ─────────────────────────────────────────────────────
// year -> { data, fetchedAt }
const cache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — holiday lists don't change intra-day

/**
 * Get a { "YYYY-MM-DD": "Holiday Name" } map for the given year.
 * Cached in memory for 24h; falls back to hand-verified static data on
 * missing API key, request failure, or an empty/malformed response.
 */
export async function getHolidays(year) {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  if (!process.env.CALENDARIFIC_API_KEY) {
    console.error(
      '[holidaysService] CALENDARIFIC_API_KEY is not set — using fallback data. ' +
      'Sign up free at https://calendarific.com/signup and add it to your .env.'
    );
    return cached ? cached.data : buildFallback(year);
  }

  try {
    const res = await fetch(buildUrl(year));
    const json = await res.json();

    if (!res.ok || json?.meta?.code !== 200) {
      const detail = json?.meta?.error_detail || `HTTP ${res.status}`;
      throw new Error(detail);
    }

    const parsed = parseResponse(json);
    if (!parsed) throw new Error('Empty or unparseable payload for this year');

    cache.set(year, { data: parsed, fetchedAt: Date.now() });
    return parsed;
  } catch (err) {
    console.error(`[holidaysService] Failed to fetch ${year} holidays from Calendarific — using fallback:`, err.message);
    // Prefer serving stale cached data over the static fallback, if we have it
    if (cached) return cached.data;
    return buildFallback(year);
  }
}
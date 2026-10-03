// src/shared/dataSync.js
// ─────────────────────────────────────────────────────────────────────────────
// Auto-refresh engine shared by the admin, client and technician panels.
//
// HOW IT WORKS
//   1. installFetchSync() wraps window.fetch ONCE. Whenever a POST / PUT /
//      PATCH / DELETE to your API succeeds (add, edit, delete, restore, import,
//      upload …) it records which resource changed (e.g. "customers").
//      Because it hooks fetch itself, it covers req(), crud(), the uploads and
//      every hand-written fetch() in pages — nothing has to be changed per page.
//   2. Changes are debounced (350 ms) so a burst of writes = ONE refresh.
//   3. Anything that cares subscribes:
//        • <AutoRefresh> (shared/AutoRefresh.jsx) re-mounts the current page so
//          it re-fetches its own data.
//        • useDataVersion([...resources]) — a counter hooks put in an effect's
//          dependency list so they re-fetch (dynamic categories, lookups…).
//        • onDataChanged(fn) — plain subscription for non-React code.
//
// SAFETY
//   • Chatty / non-data endpoints are ignored (see IGNORED).
//   • Circuit breaker: if a page saves something every time it loads, that
//     would loop forever. More than 8 refreshes in 10 s pauses auto-refresh for
//     30 s and prints a console warning naming the resource.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

const MUTATING    = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DEBOUNCE_MS = 350;

// Writes that must NOT trigger a refresh (paths are relative to the API base).
// Rule of thumb: ignore an action only if it changes no list the user is looking
// at, OR the user is inside an open detail/form that a reload would close.
// When unsure, leave it out — an extra refresh is harmless, a stale screen isn't.
// To exclude another action, add one line:  /(^|\/)your-word(\/|$|\?)/
const IGNORED = [
  // ── Login / session ──────────────────────────────────────────────────────
  /^\/(auth|login|logout)(\/|$|\?)/,

  // ── Chatty, real-time or per-user status (no list to reload) ─────────────
  /\/notifications?(\/|$|\?)/,
  /notification-prefs/,
  /^\/notices\/[^/]+\/read/,
  /^\/chat(\/|$|\?)/,
  /^\/whatsapp(\/|$|\?)/,
  /(^|\/)(clock|clock-in|clock-out|break|break-start|break-end)(\/|$|\?)/,
  /\/avatar(\/|$|\?)/,

  // ── Sends something out, saves nothing you'd see in a list ───────────────
  /(^|\/)send-email(\/|$|\?)/,          // e-mail a quotation / invoice
  /(^|\/)send-signature(\/|$|\?)/,      // ask a client to sign a contract
  /(^|\/)payment-link(\/|$|\?)/,        // generate a payment link

  // ── Only calculates or prepares; the real save comes later ───────────────
  /(^|\/)(calculate|preview)(\/|$|\?)/, // GST calculate, payroll preview
  /(^|\/)magic-import(\/|$|\?)/,        // reads a file to pre-fill a form
  /^\/upload(\/|$|\?)/,                 // file goes up first, form saves after
  /(^|\/)create-order(\/|$|\?)/,        // opens the Razorpay checkout; the
                                          // page must stay put until payment ends
                                          // (the later /verify DOES refresh)

  // ── Settings / profile: the screen already shows what you just saved ─────
  /^\/settings(\/|$|\?)/,
  /^\/(profile|account)(\/|$|\?)/,

  // ── Replies & sub-items inside an OPEN ticket / task / lead / job ────────
  // Refreshing would close the panel you're typing in.
  /(^|\/)(messages|comments|activities|attachments)(\/|$|\?)/,
  /(^|\/)(checklist|remark)(\/|$|\?)/,  // technician job & AMC checklists
];

const listeners = new Set();
const pending   = new Set();
let timer       = null;
let flushTimes  = [];
let pausedUntil = 0;

// "/customers/123?x=1" -> "customers"      "/client-portal/me/jobs/9" -> "jobs"
const resourceOf = (path) => {
  const segs = path.split('?')[0].split('/').filter(Boolean);
  if (segs[1] === 'me' && segs[2]) return segs[2];
  return segs[0] || '*';
};

function flush() {
  timer = null;
  const changed = [...pending];
  pending.clear();

  const now = Date.now();
  if (now < pausedUntil) return;

  flushTimes = flushTimes.filter((t) => now - t < 10000);
  flushTimes.push(now);
  if (flushTimes.length > 8) {
    pausedUntil = now + 30000;
    flushTimes = [];
    console.warn(
      `[autoRefresh] paused for 30s — "${changed.join(', ')}" was written 8+ times in 10s. ` +
      'A page is probably saving data every time it loads.'
    );
    return;
  }
  listeners.forEach((fn) => { try { fn(changed); } catch { /* one bad listener must not stop the rest */ } });
}

function queue(resource) {
  pending.add(resource);
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
}

// Manual trigger for anything that changes data without going through fetch.
// notifyDataChanged('customers')  or  notifyDataChanged() to refresh everything.
export const notifyDataChanged = (resource = '*') => queue(resource);

export const onDataChanged = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function installFetchSync() {
  if (typeof window === 'undefined' || window.__dataSyncInstalled) return;
  window.__dataSyncInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const res = await nativeFetch(input, init);
    try {
      const method = String(init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
      if (res.ok && MUTATING.has(method)) {
        const url = typeof input === 'string' ? input : (input?.url ?? String(input));
        if (url.startsWith(API_BASE)) {
          const path = url.slice(API_BASE.length) || '/';
          if (!IGNORED.some((re) => re.test(path))) queue(resourceOf(path));
        }
      }
    } catch { /* bookkeeping must never break a real request */ }
    return res;
  };
}

// A counter that goes up whenever data changed. Put it in an effect's
// dependency array to re-fetch:
//
//   const version = useDataVersion(['customer-types']);   // only that resource
//   useEffect(() => { load(); }, [version]);
//
// With no argument it reacts to every change ("*" notifications always count).
export function useDataVersion(resources) {
  const [version, setVersion] = useState(0);
  const key = resources ? [].concat(resources).join('|') : '';

  useEffect(() => {
    const wanted = key ? key.split('|') : null;
    return onDataChanged((changed) => {
      if (!wanted || changed.includes('*') || changed.some((r) => wanted.includes(r))) {
        setVersion((v) => v + 1);
      }
    });
  }, [key]);

  return version;
}
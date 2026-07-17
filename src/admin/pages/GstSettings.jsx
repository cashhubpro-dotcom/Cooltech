import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRight, Percent, FileText, AlertTriangle, Coins, Boxes, Bell, History, Pencil, Save, X, ChevronDown, Info, Wind, CalendarClock, CheckCircle2, Plus, Loader2, AlertCircle } from "lucide-react";
// Adjust this path to wherever services/api.js actually lives relative to this file
// e.g. src/pages/Settings/Gst/index.jsx -> "../../../services/api"
import { gstApi } from "../services/api";

/* ------------------------------------------------------------------
   COOLTECH · GST CONFIGURATION MODULE
   Restyled to match the CoolTech AC Services dashboard theme:
   light surface, white cards, orange accent, soft colored chips.
   Categories + history now load from /api/gst/* via services/api.js —
   no more local mock state for those two pieces.
-------------------------------------------------------------------- */

const CHART_COLORS = ["var(--info)", "var(--success)", "var(--warning)", "var(--purple)", "var(--danger)"];

// Mongo stores dates as ISO strings/Date objects — trim to YYYY-MM-DD for
// display and for <input type="date"> values, which require that exact shape.
const formatDate = d => d ? String(d).slice(0, 10) : "—";
const notificationsSeed = [{
  id: "n1",
  code: "GO",
  label: "CBIC 03/2025",
  desc: "Service rate revision",
  status: "Applied"
}, {
  id: "n2",
  code: "GO",
  label: "CBIC 07/2024",
  desc: "HSN reclassification",
  status: "Applied"
}, {
  id: "n3",
  code: "GO",
  label: "CBIC 11/2026",
  desc: "Draft — hardware slab",
  status: "Pending"
}];
const todayISO = () => new Date().toISOString().slice(0, 10);
function buildConic(segments) {
  let acc = 0;
  const parts = segments.map(s => {
    const start = acc;
    acc += s.pct;
    return `${s.color} ${start}% ${acc}%`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}
export default function GstSettings() {
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [calcCategoryId, setCalcCategoryId] = useState(null);
  const [baseAmount, setBaseAmount] = useState(5000);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newDraft, setNewDraft] = useState(null);
  const [highlightHistory, setHighlightHistory] = useState(false);
  const historyRef = useRef(null);
  const tableCardRef = useRef(null);
  async function loadData() {
    try {
      setLoadError("");
      const [catRes, histRes] = await Promise.all([gstApi.list(), gstApi.history()]);
      const cats = catRes.data || [];
      setCategories(cats);
      setHistory(histRes.data || []);
      // keep the calculator pointed at a valid category after every refresh
      setCalcCategoryId(prev => cats.some(c => c._id === prev) ? prev : cats[0]?._id ?? null);
    } catch (err) {
      setLoadError(err.message || "Failed to load GST data");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const calcCategory = categories.find(c => c._id === calcCategoryId) || categories[0];
  const breakdown = useMemo(() => {
    if (!calcCategory) return {
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0
    };
    const amt = Number(baseAmount) || 0;
    const rate = calcCategory.rate;
    if (calcCategory.supplyType === "inter") {
      const igst = amt * rate / 100;
      return {
        cgst: 0,
        sgst: 0,
        igst,
        total: amt + igst
      };
    }
    const half = amt * (rate / 2) / 100;
    return {
      cgst: half,
      sgst: half,
      igst: 0,
      total: amt + half * 2
    };
  }, [baseAmount, calcCategory]);
  const slabGroups = useMemo(() => {
    const map = {};
    categories.forEach(c => {
      map[c.rate] = (map[c.rate] || 0) + 1;
    });
    const entries = Object.entries(map).map(([rate, count], i) => ({
      label: `${rate}% slab`,
      count,
      pct: Math.round(count / categories.length * 100),
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));
    return entries;
  }, [categories]);
  const supplyGroups = useMemo(() => {
    const map = {
      intra: 0,
      inter: 0
    };
    categories.forEach(c => map[c.supplyType] += 1);
    return [{
      label: "Intra-state",
      count: map.intra,
      pct: Math.round(map.intra / categories.length * 100),
      color: "#3B82F6"
    }, {
      label: "Inter-state",
      count: map.inter,
      pct: Math.round(map.inter / categories.length * 100),
      color: "#F59E0B"
    }].filter(g => g.count > 0);
  }, [categories]);
  const topBySlab = useMemo(() => {
    const max = Math.max(...categories.map(c => c.rate));
    return [...categories].sort((a, b) => b.rate - a.rate).map(c => ({
      ...c,
      widthPct: Math.round(c.rate / max * 100)
    }));
  }, [categories]);
  function startEdit(cat) {
    setIsAddingCategory(false);
    setNewDraft(null);
    setFormError("");
    setEditingId(cat._id);
    setDraft({
      ...cat,
      effectiveFrom: formatDate(cat.effectiveFrom)
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
    setFormError("");
  }
  async function saveEdit() {
    setFormError("");
    setSaving(true);
    try {
      await gstApi.update(editingId, {
        hsn: draft.hsn,
        rate: Number(draft.rate),
        supplyType: draft.supplyType,
        effectiveFrom: draft.effectiveFrom,
        notification: draft.notification
      });
      await loadData();
      setEditingId(null);
      setDraft(null);
    } catch (err) {
      setFormError(err.message || "Failed to save rate");
    } finally {
      setSaving(false);
    }
  }
  function startAddCategory() {
    setEditingId(null);
    setDraft(null);
    setFormError("");
    setIsAddingCategory(true);
    setNewDraft({
      name: "",
      subtitle: "",
      hsn: "",
      rate: 18,
      supplyType: "intra",
      effectiveFrom: todayISO(),
      notification: ""
    });
    requestAnimationFrame(() => {
      tableCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }
  function cancelAddCategory() {
    setIsAddingCategory(false);
    setNewDraft(null);
    setFormError("");
  }
  async function saveNewCategory() {
    if (!newDraft.name.trim()) return;
    setFormError("");
    setSaving(true);
    try {
      await gstApi.create({
        name: newDraft.name.trim(),
        subtitle: newDraft.subtitle.trim() || "Custom service category",
        hsn: newDraft.hsn.trim(),
        rate: Number(newDraft.rate) || 0,
        supplyType: newDraft.supplyType,
        effectiveFrom: newDraft.effectiveFrom,
        notification: newDraft.notification.trim()
      });
      await loadData();
      setIsAddingCategory(false);
      setNewDraft(null);
    } catch (err) {
      setFormError(err.message || "Failed to add category");
    } finally {
      setSaving(false);
    }
  }
  function handleViewHistory() {
    historyRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    setHighlightHistory(true);
    setTimeout(() => setHighlightHistory(false), 1600);
  }
  const activeCount = categories.filter(c => c.status === "active").length;
  const standardRate = categories.find(c => c.supplyType === "intra")?.rate ?? categories[0]?.rate ?? 0;
  const peakSlab = categories.length ? Math.max(...categories.map(c => c.rate)) : 0;
  if (loading) {
    return <div className="gst-root ap-gst-settings-1">
        <div className="ap-gst-settings-2">
          <Loader2 size={18} className="gst-spin" />
          Loading GST rates…
        </div>
        <style>{`.gst-spin { animation: gstSpin 0.8s linear infinite; } @keyframes gstSpin { to { transform: rotate(360deg); } }`}</style>
      </div>;
  }
  if (loadError) {
    return <div className="gst-root ap-gst-settings-3">
        <div className="ap-gst-settings-4">
          <AlertCircle size={22} />
          <span>{loadError}</span>
          <button onClick={loadData} className="ap-gst-settings-5">
            Retry
          </button>
        </div>
      </div>;
  }
  return <div className="gst-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .gst-root {
          --page-bg: #F1F4F9;
          --card-bg: #FFFFFF;
          --card-border: #EBEEF3;
          --shadow-card: 0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04);
          --text-primary: #111827;
          --text-secondary: #6B7280;
          --text-muted: #9AA3B2;
          --orange: #EA5B2D;
          --orange-dark: #D8481B;
          --orange-soft: #FDECE3;
          --orange-soft-text: #C2410C;
          --navy: #12172B;
          --blue: #3B82F6;
          --blue-soft: #E8F0FE;
          --green: #16A34A;
          --green-soft: #DCFCE7;
          --amber: #F59E0B;
          --amber-soft: #FEF3C7;
          --amber-soft-text: #92400E;
          --purple: #8B5CF6;
          --purple-soft: #F1EAFE;
          --red: #EF4444;
          --red-soft: #FDE8E8;
          --radius-card: 16px;
          --radius-sm: 10px;

          font-family: 'Inter', sans-serif;
          background: var(--page-bg);
          color: var(--text-primary);
          padding: 24px;
          box-sizing: border-box;
          min-height: 100%;
        }
        .gst-root *, .gst-root *::before, .gst-root *::after { box-sizing: border-box; }

        .gst-wrap { max-width: 1180px; margin: 0 auto; }

        /* breadcrumb */
        .gst-crumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .gst-crumbs b { color: var(--text-primary); font-weight: 600; }

        /* welcome row */
        .gst-welcome {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 22px;
        }
        .gst-welcome h1 {
          font-size: 26px;
          font-weight: 800;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }
        .gst-welcome p {
          margin: 0;
          font-size: 13.5px;
          color: var(--text-secondary);
        }
        .gst-actions { display: flex; gap: 10px; }
        .gst-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: filter .12s ease, transform .1s ease, background .12s ease;
        }
        .gst-btn:active { transform: translateY(1px); }
        .gst-btn-navy { background: var(--navy); color: #fff; }
        .gst-btn-navy:hover { filter: brightness(1.15); }
        .gst-btn-orange { background: linear-gradient(180deg, #EF6B3E, var(--orange-dark)); color: #fff; }
        .gst-btn-orange:hover { filter: brightness(1.06); }
        .gst-btn-ghost { background: #fff; border-color: var(--card-border); color: var(--text-secondary); }
        .gst-btn-ghost:hover { border-color: #D7DBE3; color: var(--text-primary); }

        /* stat cards */
        .gst-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }
        .gst-stat-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          padding: 16px 16px 14px;
        }
        .gst-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .gst-stat-top span { font-size: 12.5px; color: var(--text-secondary); font-weight: 500; }
        .gst-stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gst-stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.01em; line-height: 1; }
        .gst-stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

        /* notice banner */
        .gst-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--orange-soft);
          border: 1px solid #F7D2BC;
          border-radius: var(--radius-card);
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .gst-banner-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--orange-dark);
          flex-shrink: 0;
        }
        .gst-banner-text { flex: 1; min-width: 200px; }
        .gst-banner-text b { display: block; font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .gst-banner-text span { font-size: 13px; color: #8A4A2C; }
        .gst-banner-right { display: flex; align-items: center; gap: 14px; }
        .gst-pill {
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 999px;
          background: #fff;
          color: #8A4A2C;
          border: 1px solid #F0C4A8;
        }
        .gst-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--orange-dark);
          text-decoration: none;
          white-space: nowrap;
        }

        /* generic card */
        .gst-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-card);
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }
        .gst-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 4px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .gst-card-head h3 { font-size: 15.5px; font-weight: 700; margin: 0; }
        .gst-card-head p { font-size: 12.5px; color: var(--text-muted); margin: 2px 0 0; }
        .gst-dropdown {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          background: #F7F8FA;
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 6px 10px;
        }
        .gst-viewall {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--orange);
          text-decoration: none;
          white-space: nowrap;
        }

        /* grid layout */
        .gst-grid-row1 {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .gst-grid-row2 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .gst-grid-row3 {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
        }

        /* rate table */
        .gst-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .gst-table thead th {
          text-align: left;
          font-size: 11px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 600;
          padding: 8px 20px;
          border-bottom: 1px solid var(--card-border);
        }
        .gst-table tbody td {
          padding: 13px 20px;
          border-bottom: 1px solid var(--card-border);
          font-size: 13.5px;
          vertical-align: middle;
        }
        .gst-table tbody tr:last-child td { border-bottom: none; }
        .gst-table tbody tr:hover { background: #FAFBFD; }
        .gst-cat-name { font-weight: 600; color: var(--text-primary); }
        .gst-cat-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .gst-hsn { font-size: 12.5px; color: var(--text-secondary); }
        .gst-rate-badge {
          font-weight: 700;
          font-size: 13px;
          color: var(--orange-dark);
          background: var(--orange-soft);
          padding: 3px 10px;
          border-radius: 999px;
          display: inline-block;
        }
        .gst-supply-tag {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary);
          background: #F1F3F7;
          border: 1px solid var(--card-border);
          padding: 3px 9px;
          border-radius: 999px;
        }
        .gst-icon-btn {
          border: 1px solid var(--card-border);
          background: #fff;
          color: var(--text-secondary);
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color .15s ease, color .15s ease;
        }
        .gst-icon-btn:hover { border-color: var(--orange); color: var(--orange); }

        .gst-edit-row td { background: #FFF8F4; padding: 16px 20px; }
        .gst-edit-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr) auto;
          gap: 12px;
          align-items: end;
        }
        .gst-field label {
          display: block;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        .gst-field input,
        .gst-field select {
          width: 100%;
          background: #fff;
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          padding: 9px 10px;
          border-radius: 8px;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .gst-field input:focus,
        .gst-field select:focus {
          border-color: var(--orange);
          box-shadow: 0 0 0 3px rgba(234,91,45,0.14);
        }
        .gst-edit-actions { display: flex; gap: 8px; }
        .gst-edit-actions.end { justify-content: flex-end; }

        .gst-add-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .gst-add-grid .span2 { grid-column: span 2; }
        .gst-add-grid .span4 { grid-column: 1 / -1; }

        .gst-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .gst-btn:disabled:hover { filter: none; }

        @keyframes gstHighlightPulse {
          0% { box-shadow: 0 0 0 0 rgba(234,91,45,0.45); }
          70% { box-shadow: 0 0 0 8px rgba(234,91,45,0); }
          100% { box-shadow: 0 0 0 0 rgba(234,91,45,0); }
        }
        .gst-card-highlight {
          border-color: var(--orange);
          animation: gstHighlightPulse 0.8s ease-out 2;
        }

        .gst-history-icon-blue { background: var(--blue-soft); color: var(--blue); }

        .gst-form-error {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--red);
          background: var(--red-soft);
          border: 1px solid #F7C9C4;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 12px;
        }

        /* donut cards */
        .gst-donut-body { padding: 6px 20px 20px; display: flex; align-items: center; gap: 18px; }
        .gst-donut {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }
        .gst-donut::after {
          content: '';
          position: absolute;
          inset: 14px;
          border-radius: 50%;
          background: var(--card-bg);
        }
        .gst-donut-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }
        .gst-donut-center b { font-size: 22px; font-weight: 800; line-height: 1; }
        .gst-donut-center span { font-size: 10px; color: var(--text-muted); margin-top: 3px; }
        .gst-legend { flex: 1; display: flex; flex-direction: column; gap: 9px; }
        .gst-legend-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
        .gst-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .gst-legend-label {
          flex: 1;
          color: var(--text-secondary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gst-legend-count { font-weight: 700; color: var(--text-primary); }
        .gst-legend-pct { color: var(--text-muted); font-size: 11.5px; margin-left: 4px; }

        /* notifications list */
        .gst-notif-list { padding: 4px 20px 18px; display: flex; flex-direction: column; gap: 4px; }
        .gst-notif-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--card-border); }
        .gst-notif-item:last-child { border-bottom: none; }
        .gst-notif-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: var(--blue-soft); color: var(--blue);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .gst-notif-main { flex: 1; min-width: 0; }
        .gst-notif-main .name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .gst-notif-main .zone { font-size: 11.5px; color: var(--text-muted); }
        .gst-status-pill {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .gst-status-applied { background: var(--green-soft); color: var(--green); }
        .gst-status-pending { background: var(--amber-soft); color: var(--amber-soft-text); }

        /* top categories bars */
        .gst-bars { padding: 4px 20px 18px; display: flex; flex-direction: column; gap: 14px; }
        .gst-bar-row .top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .gst-bar-row .top .name { font-weight: 600; color: var(--text-primary); }
        .gst-bar-row .top .val { font-weight: 700; color: var(--text-primary); }
        .gst-bar-track { height: 6px; background: #F1F3F7; border-radius: 999px; overflow: hidden; }
        .gst-bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #22C55E, #16A34A); }

        /* invoice calculator */
        .gst-calc-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 10px 20px 20px; }
        .gst-calc-form { display: flex; flex-direction: column; gap: 12px; }
        .gst-select-wrap { position: relative; }
        .gst-select-wrap svg { position: absolute; right: 12px; top: 38px; color: var(--text-muted); pointer-events: none; }
        .gst-select-wrap select { appearance: none; padding-right: 32px; }
        .gst-amount-input { position: relative; }
        .gst-amount-input span { position: absolute; left: 12px; top: 38px; color: var(--text-secondary); font-weight: 600; font-size: 13.5px; }
        .gst-amount-input input { padding-left: 26px; }

        .gst-invoice { background: #F8F9FB; border: 1px solid var(--card-border); border-radius: 12px; padding: 16px 18px; }
        .gst-invoice-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 7px 0; font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px dashed #E2E5EB;
        }
        .gst-invoice-row:last-of-type { border-bottom: none; }
        .gst-invoice-row .amt { font-weight: 600; color: var(--text-primary); }
        .gst-invoice-total {
          margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--card-border);
          display: flex; justify-content: space-between; align-items: baseline;
        }
        .gst-invoice-total .label { font-size: 13px; color: var(--text-secondary); font-weight: 600; }
        .gst-invoice-total .amt { font-size: 22px; font-weight: 800; color: var(--orange-dark); }

        /* history list */
        .gst-history-list { padding: 4px 20px 18px; }
        .gst-history-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid var(--card-border);
        }
        .gst-history-item:last-child { border-bottom: none; }
        .gst-history-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--purple-soft); color: var(--purple);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .gst-history-main { flex: 1; min-width: 0; }
        .gst-history-main .name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .gst-history-main .meta { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
        .gst-history-delta { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
        .gst-history-delta .old { color: var(--text-muted); text-decoration: line-through; font-weight: 500; }
        .gst-history-delta .new { color: var(--green); }

        .gst-footnote {
          display: flex; gap: 8px; align-items: flex-start;
          font-size: 12.5px; color: var(--text-secondary);
          margin-top: 16px;
        }
        .gst-footnote svg { flex-shrink: 0; margin-top: 1px; color: var(--orange); }

        @media (max-width: 1080px) {
          .gst-stats { grid-template-columns: repeat(3, 1fr); }
          .gst-grid-row1, .gst-grid-row3 { grid-template-columns: 1fr; }
          .gst-grid-row2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 620px) {
          .gst-stats { grid-template-columns: repeat(2, 1fr); }
          .gst-calc-body { grid-template-columns: 1fr; }
          .gst-edit-grid { grid-template-columns: 1fr 1fr; }
          .gst-table thead { display: none; }
          .gst-table, .gst-table tbody, .gst-table tr, .gst-table td { display: block; width: 100%; }
          .gst-table tbody tr { padding: 12px 18px; border-bottom: 1px solid var(--card-border); }
          .gst-table tbody td { padding: 3px 0; border-bottom: none; }
        }

        .gst-root button:focus-visible,
        .gst-root select:focus-visible,
        .gst-root input:focus-visible {
          outline: 2px solid var(--orange);
          outline-offset: 2px;
        }
      `}</style>

      <div className="gst-wrap">
        {/* <div className="gst-crumbs">
          <span>CoolTech</span>
          <ChevronRight size={13} />
          <b>GST Configuration</b>
         </div> */}

        <div className="gst-welcome">
          <div>
            <h1>Tax Rates &amp; GST Settings</h1>
            <p>Monday, 13 July 2026 · CoolTech AC Services</p>
          </div>
          <div className="gst-actions">
            <button className="gst-btn gst-btn-navy" onClick={handleViewHistory}>
              <History size={15} /> Rate History
            </button>
            <button className="gst-btn gst-btn-orange" onClick={startAddCategory}>
              <Plus size={15} /> Add Category
            </button>
          </div>
        </div>

        {/* stat cards */}
        <div className="gst-stats">
          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Active Categories</span>
              <div className="gst-stat-icon ap-gst-settings-6">
                <Boxes size={15} />
              </div>
            </div>
            <div className="gst-stat-value">{activeCount}</div>
            <div className="gst-stat-sub">in service</div>
          </div>

          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Standard Rate</span>
              <div className="gst-stat-icon ap-gst-settings-7">
                <Percent size={15} />
              </div>
            </div>
            <div className="gst-stat-value">{standardRate}%</div>
            <div className="gst-stat-sub">on services</div>
          </div>

          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Peak Slab</span>
              <div className="gst-stat-icon ap-gst-settings-8">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="gst-stat-value">{peakSlab}%</div>
            <div className="gst-stat-sub">hardware &amp; parts</div>
          </div>

          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Pending Reviews</span>
              <div className="gst-stat-icon ap-gst-settings-9">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="gst-stat-value">1</div>
            <div className="gst-stat-sub">awaiting confirmation</div>
          </div>

          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Notifications</span>
              <div className="gst-stat-icon ap-gst-settings-10">
                <Bell size={15} />
              </div>
            </div>
            <div className="gst-stat-value">{notificationsSeed.length}</div>
            <div className="gst-stat-sub">from CBIC</div>
          </div>

          <div className="gst-stat-card">
            <div className="gst-stat-top">
              <span>Tax Collected</span>
              <div className="gst-stat-icon ap-gst-settings-11">
                <Coins size={15} />
              </div>
            </div>
            <div className="gst-stat-value">₹42.6K</div>
            <div className="gst-stat-sub">this month</div>
          </div>
        </div>

        {/* notice banner */}
        <div className="gst-banner">
          <div className="gst-banner-icon">
            <CalendarClock size={18} />
          </div>
          <div className="gst-banner-text">
            <b>Annual GST review reminder</b>
            <span>Government slabs typically revise every April — confirm this year's notification before it's applied.</span>
          </div>
          <div className="gst-banner-right">
            <span className="gst-pill">Not Reviewed</span>
            <a className="gst-link" href="#">View →</a>
          </div>
        </div>

        {/* row 1: rate table + notifications */}
        <div className="gst-grid-row1">
          <div className="gst-card" ref={tableCardRef}>
            <div className="gst-card-head">
              <div>
                <h3>Service Tax Rates</h3>
                <p>Click the pencil to edit — changes are logged automatically.</p>
              </div>
              <span className="gst-dropdown">All Categories <ChevronDown size={13} /></span>
            </div>
            <table className="gst-table">
              <thead>
                <tr>
                  <th>Service category</th>
                  <th>HSN / SAC</th>
                  <th>Rate</th>
                  <th>Supply type</th>
                  <th>Effective from</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isAddingCategory && <tr className="gst-edit-row">
                    <td colSpan={6}>
                      {formError && <div className="gst-form-error">
                          <AlertCircle size={13} /> {formError}
                        </div>}
                      <div className="gst-add-grid">
                        <div className="gst-field span2">
                          <label>Category name</label>
                          <input autoFocus placeholder="e.g. Duct Cleaning" value={newDraft.name} onChange={e => setNewDraft({
                        ...newDraft,
                        name: e.target.value
                      })} />
                        </div>
                        <div className="gst-field span2">
                          <label>Subtitle</label>
                          <input placeholder="Short description" value={newDraft.subtitle} onChange={e => setNewDraft({
                        ...newDraft,
                        subtitle: e.target.value
                      })} />
                        </div>
                        <div className="gst-field">
                          <label>HSN / SAC</label>
                          <input placeholder="998716" value={newDraft.hsn} onChange={e => setNewDraft({
                        ...newDraft,
                        hsn: e.target.value
                      })} />
                        </div>
                        <div className="gst-field">
                          <label>Rate (%)</label>
                          <input type="number" step="0.5" min="0" max="28" value={newDraft.rate} onChange={e => setNewDraft({
                        ...newDraft,
                        rate: e.target.value
                      })} />
                        </div>
                        <div className="gst-field">
                          <label>Supply type</label>
                          <select value={newDraft.supplyType} onChange={e => setNewDraft({
                        ...newDraft,
                        supplyType: e.target.value
                      })}>
                            <option value="intra">Intra-state</option>
                            <option value="inter">Inter-state</option>
                          </select>
                        </div>
                        <div className="gst-field">
                          <label>Effective from</label>
                          <input type="date" value={newDraft.effectiveFrom} onChange={e => setNewDraft({
                        ...newDraft,
                        effectiveFrom: e.target.value
                      })} />
                        </div>
                        <div className="gst-field span2">
                          <label>Government notification reference</label>
                          <input placeholder="e.g. CBIC 07/2026" value={newDraft.notification} onChange={e => setNewDraft({
                        ...newDraft,
                        notification: e.target.value
                      })} />
                        </div>
                        <div className="gst-edit-actions span4 end">
                          <button className="gst-btn gst-btn-orange" onClick={saveNewCategory} disabled={!newDraft.name.trim() || saving}>
                            <Save size={14} /> {saving ? "Saving…" : "Save category"}
                          </button>
                          <button className="gst-btn gst-btn-ghost" onClick={cancelAddCategory} disabled={saving}>
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>}
                {categories.map(cat => editingId === cat._id ? <tr className="gst-edit-row" key={cat._id}>
                      <td colSpan={6}>
                        {formError && <div className="gst-form-error">
                            <AlertCircle size={13} /> {formError}
                          </div>}
                        <div className="gst-edit-grid">
                          <div className="gst-field">
                            <label>HSN / SAC</label>
                            <input value={draft.hsn} onChange={e => setDraft({
                        ...draft,
                        hsn: e.target.value
                      })} />
                          </div>
                          <div className="gst-field">
                            <label>Rate (%)</label>
                            <input type="number" step="0.5" min="0" max="28" value={draft.rate} onChange={e => setDraft({
                        ...draft,
                        rate: e.target.value
                      })} />
                          </div>
                          <div className="gst-field">
                            <label>Supply type</label>
                            <select value={draft.supplyType} onChange={e => setDraft({
                        ...draft,
                        supplyType: e.target.value
                      })}>
                              <option value="intra">Intra-state</option>
                              <option value="inter">Inter-state</option>
                            </select>
                          </div>
                          <div className="gst-field">
                            <label>Effective from</label>
                            <input type="date" value={draft.effectiveFrom} onChange={e => setDraft({
                        ...draft,
                        effectiveFrom: e.target.value
                      })} />
                          </div>
                          <div className="gst-edit-actions">
                            <button className="gst-btn gst-btn-orange" onClick={saveEdit} disabled={saving}>
                              <Save size={14} /> {saving ? "Saving…" : "Save"}
                            </button>
                            <button className="gst-btn gst-btn-ghost" onClick={cancelEdit} disabled={saving}>
                              <X size={14} /> Cancel
                            </button>
                          </div>
                          <div className="gst-field ap-gst-settings-12">
                            <label>Government notification reference</label>
                            <input value={draft.notification} onChange={e => setDraft({
                        ...draft,
                        notification: e.target.value
                      })} placeholder="e.g. CBIC 07/2026" />
                          </div>
                        </div>
                      </td>
                    </tr> : <tr key={cat._id}>
                      <td>
                        <div className="gst-cat-name">{cat.name}</div>
                        <div className="gst-cat-sub">{cat.subtitle}</div>
                      </td>
                      <td className="gst-hsn">{cat.hsn}</td>
                      <td><span className="gst-rate-badge">{cat.rate}%</span></td>
                      <td>
                        <span className="gst-supply-tag">
                          {cat.supplyType === "intra" ? "Intra-state" : "Inter-state"}
                        </span>
                      </td>
                      <td className="gst-hsn">{formatDate(cat.effectiveFrom)}</td>
                      <td>
                        <button className="gst-icon-btn" onClick={() => startEdit(cat)} aria-label="Edit rate">
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>)}
              </tbody>
            </table>
          </div>

          <div className="gst-card">
            <div className="gst-card-head">
              <div>
                <h3>Recent Notifications</h3>
                <p>CBIC circulars applied to your rates</p>
              </div>
              <a className="gst-viewall" href="#">View All →</a>
            </div>
            <div className="gst-notif-list">
              {notificationsSeed.map(n => <div className="gst-notif-item" key={n.id}>
                  <div className="gst-notif-avatar">{n.code}</div>
                  <div className="gst-notif-main">
                    <div className="name">{n.label}</div>
                    <div className="zone">{n.desc}</div>
                  </div>
                  <span className={`gst-status-pill ${n.status === "Applied" ? "gst-status-applied" : "gst-status-pending"}`}>
                    {n.status}
                  </span>
                </div>)}
            </div>
          </div>
        </div>

        {/* row 2: donuts + top categories */}
        <div className="gst-grid-row2">
          <div className="gst-card">
            <div className="gst-card-head">
              <div><h3>Rates by Slab</h3></div>
            </div>
            <div className="gst-donut-body">
              <div className="gst-donut" style={{
              backgroundImage: buildConic(slabGroups)
            }}>
                <div className="gst-donut-center">
                  <b>{categories.length}</b>
                  <span>Total</span>
                </div>
              </div>
              <div className="gst-legend">
                {slabGroups.map(g => <div className="gst-legend-row" key={g.label}>
                    <span className="gst-legend-dot" style={{
                  background: g.color
                }} />
                    <span className="gst-legend-label">{g.label}</span>
                    <span className="gst-legend-count">{g.count}</span>
                    <span className="gst-legend-pct">({g.pct}%)</span>
                  </div>)}
              </div>
            </div>
          </div>

          <div className="gst-card">
            <div className="gst-card-head">
              <div><h3>Rates by Supply Type</h3></div>
            </div>
            <div className="gst-donut-body">
              <div className="gst-donut" style={{
              backgroundImage: buildConic(supplyGroups)
            }}>
                <div className="gst-donut-center">
                  <b>{categories.length}</b>
                  <span>Total</span>
                </div>
              </div>
              <div className="gst-legend">
                {supplyGroups.map(g => <div className="gst-legend-row" key={g.label}>
                    <span className="gst-legend-dot" style={{
                  background: g.color
                }} />
                    <span className="gst-legend-label">{g.label}</span>
                    <span className="gst-legend-count">{g.count}</span>
                    <span className="gst-legend-pct">({g.pct}%)</span>
                  </div>)}
              </div>
            </div>
          </div>

          <div className="gst-card">
            <div className="gst-card-head">
              <div><h3>Highest Taxed Categories</h3></div>
            </div>
            <div className="gst-bars">
              {topBySlab.slice(0, 4).map(c => <div className="gst-bar-row" key={c._id}>
                  <div className="top">
                    <span className="name">{c.name}</span>
                    <span className="val">{c.rate}%</span>
                  </div>
                  <div className="gst-bar-track">
                    <div className="gst-bar-fill" style={{
                  width: `${c.widthPct}%`
                }} />
                  </div>
                </div>)}
            </div>
          </div>
        </div>

        {/* row 3: calculator + history */}
        <div className="gst-grid-row3">
          <div className="gst-card">
            <div className="gst-card-head">
              <div>
                <h3>Live Invoice Preview</h3>
                <p>See how a rate lands on a customer invoice</p>
              </div>
              <Wind size={18} color="var(--text-muted)" />
            </div>
            <div className="gst-calc-body">
              <div className="gst-calc-form">
                <div className="gst-field gst-select-wrap">
                  <label>Service category</label>
                  <select value={calcCategoryId || ""} onChange={e => setCalcCategoryId(e.target.value)}>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name} — {c.rate}%</option>)}
                  </select>
                  <ChevronDown size={15} />
                </div>
                <div className="gst-field gst-amount-input">
                  <label>Base amount</label>
                  <span>₹</span>
                  <input type="number" min="0" value={baseAmount} onChange={e => setBaseAmount(e.target.value)} />
                </div>
                <div className="gst-field">
                  <label>HSN / SAC applied</label>
                  <input value={calcCategory?.hsn || ""} readOnly />
                </div>
              </div>

              <div className="gst-invoice">
                <div className="gst-invoice-row">
                  <span>Base amount</span>
                  <span className="amt">₹{Number(baseAmount || 0).toFixed(2)}</span>
                </div>
                {calcCategory?.supplyType === "intra" ? <>
                    <div className="gst-invoice-row">
                      <span>CGST ({(calcCategory.rate / 2).toFixed(1)}%)</span>
                      <span className="amt">₹{breakdown.cgst.toFixed(2)}</span>
                    </div>
                    <div className="gst-invoice-row">
                      <span>SGST ({(calcCategory.rate / 2).toFixed(1)}%)</span>
                      <span className="amt">₹{breakdown.sgst.toFixed(2)}</span>
                    </div>
                  </> : calcCategory ? <div className="gst-invoice-row">
                    <span>IGST ({calcCategory.rate}%)</span>
                    <span className="amt">₹{breakdown.igst.toFixed(2)}</span>
                  </div> : null}
                <div className="gst-invoice-total">
                  <span className="label">Total payable</span>
                  <span className="amt">₹{breakdown.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`gst-card ${highlightHistory ? "gst-card-highlight" : ""}`} ref={historyRef}>
            <div className="gst-card-head">
              <div>
                <h3>Rate Change History</h3>
                <p>Full audit trail for compliance</p>
              </div>
            </div>
            {history.length === 0 ? <div className="ap-gst-settings-13">
                No rate changes recorded yet.
              </div> : <div className="gst-history-list">
                {history.map(h => <div className="gst-history-item" key={h._id}>
                    <div className={`gst-history-icon ${h.oldRate == null ? "gst-history-icon-blue" : ""}`}>
                      {h.oldRate == null ? <Plus size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                    <div className="gst-history-main">
                      <div className="name">{h.categoryName}</div>
                      <div className="meta">{h.notification || "—"} · effective {formatDate(h.effectiveFrom)}</div>
                    </div>
                    <div className="gst-history-delta">
                      {h.oldRate == null ? <span className="new">+ new · {h.newRate}%</span> : <>
                          <span className="old">{h.oldRate}%</span>
                          <span>→</span>
                          <span className="new">{h.newRate}%</span>
                        </>}
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>

        <div className="gst-footnote">
          <Info size={15} />
          <span>Rates are live — every save writes to MongoDB via /api/gst and is immediately available to your invoice/quotation modules through the same gstApi.calculate endpoint.</span>
        </div>
      </div>
    </div>;
}
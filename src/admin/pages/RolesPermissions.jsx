import { useState } from "react";
const ORANGE = "#E8622A";

// ─── PERMISSION OPTIONS ───────────────────────────────────────────────────────
const PERM_OPTIONS = ["None", "All", "Owned", "Added", "Added & Own"];

// ─── AC MANAGEMENT MODULE DEFINITIONS ────────────────────────────────────────
//
// ✅ KEPT    → actual pages in CoolTech (from navigation.js + routes.js)
// ❌ REMOVED → Worksuite-only generics not in this AC platform:
//              RestAPI, Biolinks, QR Code, Server Manager, Bank Account,
//              Letter, Webhooks, Knowledge Base, Products, Holidays,
//              Biometric, Purchase (renamed → Purchase Orders)
// ➕ ADDED   → AC-specific modules: Work Orders, Dispatch Board, AMC Contracts,
//              Service Reminders, Warranty Tracker, Gas/F-Gas Log, Customers,
//              Complaints, Price List, Staff Performance, Suppliers

const ALL_MODULES = [
// FIELD OPERATIONS — core AC service delivery
{
  name: "Work Orders",
  section: "FIELD OPERATIONS"
}, {
  name: "Dispatch Board",
  section: "FIELD OPERATIONS"
},
// view-only
{
  name: "Quotations",
  section: "FIELD OPERATIONS"
}, {
  name: "AMC Contracts",
  section: "FIELD OPERATIONS"
}, {
  name: "Service Reminders",
  section: "FIELD OPERATIONS"
}, {
  name: "Warranty Tracker",
  section: "FIELD OPERATIONS"
}, {
  name: "Gas / F-Gas Log",
  section: "FIELD OPERATIONS"
},
// CRM
{
  name: "Customers",
  section: "CRM"
}, {
  name: "Leads",
  section: "CRM"
}, {
  name: "Complaints",
  section: "CRM"
}, {
  name: "Feedback",
  section: "CRM"
}, {
  name: "CRM Analytics",
  section: "CRM"
},
// view-only

// FINANCE
{
  name: "Invoices",
  section: "FINANCE"
}, {
  name: "Payments",
  section: "FINANCE"
}, {
  name: "Expenses",
  section: "FINANCE"
}, {
  name: "Price List",
  section: "FINANCE"
},
// view-only

// HR & TEAM
{
  name: "Technicians",
  section: "HR & TEAM"
}, {
  name: "Attendance",
  section: "HR & TEAM"
}, {
  name: "Leave Management",
  section: "HR & TEAM"
}, {
  name: "Salary & Payroll",
  section: "HR & TEAM"
}, {
  name: "Recruitment",
  section: "HR & TEAM"
}, {
  name: "Staff Performance",
  section: "HR & TEAM"
},
// view-only

// OPERATIONS
{
  name: "Inventory",
  section: "OPERATIONS"
}, {
  name: "Purchase Orders",
  section: "OPERATIONS"
}, {
  name: "Suppliers",
  section: "OPERATIONS"
}, {
  name: "Assets & Vehicles",
  section: "OPERATIONS"
},
// PRODUCTIVITY
{
  name: "Tasks",
  section: "PRODUCTIVITY"
}, {
  name: "Projects",
  section: "PRODUCTIVITY"
}, {
  name: "Time Tracker",
  section: "PRODUCTIVITY"
}, {
  name: "Contracts",
  section: "PRODUCTIVITY"
}, {
  name: "Support Tickets",
  section: "PRODUCTIVITY"
}, {
  name: "Notice Board",
  section: "PRODUCTIVITY"
}, {
  name: "Calendar",
  section: "PRODUCTIVITY"
},
// MARKETING
{
  name: "Social Dashboard",
  section: "MARKETING"
},
// view-only
{
  name: "Post Scheduler",
  section: "MARKETING"
}, {
  name: "WhatsApp Marketing",
  section: "MARKETING"
}, {
  name: "Campaign Manager",
  section: "MARKETING"
},
// view-only
{
  name: "Reviews",
  section: "MARKETING"
}, {
  name: "Content Library",
  section: "MARKETING"
} // view-only
];

// Modules that are view-only analytics/dashboards — shown as "view only" row
const VIEW_ONLY = new Set(["Dispatch Board", "CRM Analytics", "Price List", "Staff Performance", "Social Dashboard", "Campaign Manager", "Content Library"]);

// Client portal — limited module set
const CLIENT_MODULE_NAMES = ["Work Orders", "Quotations", "AMC Contracts", "Invoices", "Payments", "Support Tickets", "Complaints", "Feedback"];

// ─── DEFAULT PERMISSION BUILDERS ─────────────────────────────────────────────

function makePerms(overrides = {}) {
  const result = {};
  ALL_MODULES.filter(({
    name
  }) => !VIEW_ONLY.has(name)).forEach(({
    name
  }) => {
    result[name] = overrides[name] || {
      add: "None",
      view: "None",
      update: "None",
      del: "None"
    };
  });
  return result;
}
function makeClientPerms(overrides = {}) {
  const result = {};
  CLIENT_MODULE_NAMES.forEach(name => {
    result[name] = overrides[name] || {
      add: "None",
      view: "None",
      update: "None",
      del: "None"
    };
  });
  return result;
}

// ─── DEFAULT ROLE PERMISSIONS ─────────────────────────────────────────────────

// Technician: field engineer — own jobs only, can log gas/time/expenses
const TECHNICIAN_OVERRIDES = {
  "Work Orders": {
    add: "None",
    view: "Owned",
    update: "Owned",
    del: "None"
  },
  "Quotations": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "AMC Contracts": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Service Reminders": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Warranty Tracker": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Gas / F-Gas Log": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Customers": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Complaints": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Feedback": {
    add: "Added",
    view: "Added & Own",
    update: "None",
    del: "None"
  },
  "Expenses": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Attendance": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Leave Management": {
    add: "Added",
    view: "Added & Own",
    update: "None",
    del: "None"
  },
  "Inventory": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Tasks": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Time Tracker": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Support Tickets": {
    add: "Added",
    view: "Added & Own",
    update: "Added & Own",
    del: "None"
  },
  "Notice Board": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Calendar": {
    add: "Added",
    view: "Owned",
    update: "Owned",
    del: "None"
  }
};

// Manager: full visibility, can manage most things, limited delete
const MANAGER_OVERRIDES = {
  "Work Orders": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Quotations": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "AMC Contracts": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Service Reminders": {
    add: "Added",
    view: "All",
    update: "All",
    del: "Added"
  },
  "Warranty Tracker": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Gas / F-Gas Log": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Customers": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Leads": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Complaints": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Feedback": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Invoices": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Payments": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Expenses": {
    add: "Added",
    view: "All",
    update: "All",
    del: "Added"
  },
  "Technicians": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Attendance": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Leave Management": {
    add: "None",
    view: "All",
    update: "All",
    del: "None"
  },
  "Inventory": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Purchase Orders": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Suppliers": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Assets & Vehicles": {
    add: "None",
    view: "All",
    update: "All",
    del: "None"
  },
  "Tasks": {
    add: "Added",
    view: "All",
    update: "All",
    del: "Added"
  },
  "Projects": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Time Tracker": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Contracts": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Support Tickets": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Notice Board": {
    add: "Added",
    view: "All",
    update: "All",
    del: "Added"
  },
  "Calendar": {
    add: "Added",
    view: "All",
    update: "All",
    del: "Added"
  },
  "Post Scheduler": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "WhatsApp Marketing": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Reviews": {
    add: "None",
    view: "All",
    update: "All",
    del: "None"
  }
};

// Accountant: finance focus only
const ACCOUNTANT_OVERRIDES = {
  "Invoices": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Payments": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Expenses": {
    add: "Added",
    view: "All",
    update: "All",
    del: "None"
  },
  "Quotations": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Salary & Payroll": {
    add: "None",
    view: "All",
    update: "All",
    del: "None"
  },
  "Purchase Orders": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  },
  "Customers": {
    add: "None",
    view: "All",
    update: "None",
    del: "None"
  }
};

// Client (portal): read-own + can raise tickets & complaints
const CLIENT_OVERRIDES = {
  "Work Orders": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Quotations": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "AMC Contracts": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Invoices": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Payments": {
    add: "None",
    view: "Owned",
    update: "None",
    del: "None"
  },
  "Support Tickets": {
    add: "Added",
    view: "Added & Own",
    update: "Added",
    del: "None"
  },
  "Complaints": {
    add: "Added",
    view: "Added & Own",
    update: "None",
    del: "None"
  },
  "Feedback": {
    add: "Added",
    view: "Added & Own",
    update: "None",
    del: "None"
  }
};
const INITIAL_ROLES = [{
  id: 1,
  name: "Super Admin",
  memberCount: 1,
  isDefault: true,
  isAdmin: true,
  isClient: false,
  perms: {}
}, {
  id: 2,
  name: "Manager",
  memberCount: 0,
  isDefault: true,
  isAdmin: false,
  isClient: false,
  perms: makePerms(MANAGER_OVERRIDES)
}, {
  id: 3,
  name: "Technician",
  memberCount: 0,
  isDefault: true,
  isAdmin: false,
  isClient: false,
  perms: makePerms(TECHNICIAN_OVERRIDES)
}, {
  id: 4,
  name: "Accountant",
  memberCount: 0,
  isDefault: true,
  isAdmin: false,
  isClient: false,
  perms: makePerms(ACCOUNTANT_OVERRIDES)
}, {
  id: 5,
  name: "Client",
  memberCount: 0,
  isDefault: true,
  isAdmin: false,
  isClient: true,
  perms: makeClientPerms(CLIENT_OVERRIDES)
}];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
    padding: "32px 40px",
    color: "var(--x1a1a1a)"
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "var(--x1a1a1a)",
    letterSpacing: "-0.3px"
  },
  pageSub: {
    fontSize: 13,
    color: "var(--text-faint)",
    marginTop: 2
  },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: ORANGE,
    color: "var(--white)",
    border: "none",
    padding: "9px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  btnOutline: {
    background: "transparent",
    border: "1px solid #e0ddd8",
    color: "var(--text-muted)",
    padding: "8px 18px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  card: {
    background: "var(--white)",
    border: "1px solid #e8e6e0",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden"
  },
  roleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px"
  },
  roleMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12
  },
  roleAvatar: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--x1a1a1a)"
  },
  roleSub: {
    fontSize: 12,
    color: "var(--x999)",
    marginTop: 2
  },
  adminNote: {
    fontSize: 12,
    color: "var(--border)",
    fontStyle: "italic"
  },
  permsBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid #e0ddd8",
    color: "var(--text-muted)",
    padding: "6px 14px",
    borderRadius: 7,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  sectionRow: {
    background: "var(--xf7f6f3)"
  },
  sectionCell: {
    padding: "6px 16px",
    fontSize: 10,
    fontWeight: 700,
    color: "var(--border)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    borderTop: "1px solid #eee"
  },
  th: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "10px 16px",
    textAlign: "left",
    background: "var(--xfaf9f7)",
    borderTop: "1px solid #eee"
  },
  td: {
    padding: "8px 16px",
    fontSize: 13,
    borderTop: "1px solid #f0ede8",
    color: "var(--x2a2a2a)"
  },
  viewOnly: {
    fontSize: 11,
    color: "var(--border)",
    fontStyle: "italic"
  },
  select: {
    fontSize: 12,
    padding: "4px 8px",
    border: "1px solid #e0ddd8",
    borderRadius: 6,
    background: "var(--white)",
    color: "var(--text-h2)",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    minWidth: 100,
    outline: "none"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999
  },
  modal: {
    background: "var(--white)",
    borderRadius: 14,
    border: "1px solid #e8e6e0",
    width: 640,
    maxWidth: "95vw",
    padding: 28,
    fontFamily: "'DM Sans', sans-serif"
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: "var(--x1a1a1a)"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 22,
    color: "var(--text-faint)",
    cursor: "pointer",
    lineHeight: 1
  },
  modalTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 4
  },
  modalTh: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    textAlign: "left",
    padding: "8px 12px",
    background: "var(--xfaf9f7)",
    borderBottom: "1px solid #eee"
  },
  modalTd: {
    padding: "11px 12px",
    fontSize: 13,
    borderTop: "1px solid #f0ede8",
    color: "var(--x2a2a2a)",
    verticalAlign: "middle"
  },
  badgeBlue: {
    fontSize: 11,
    background: "var(--xe6f1fb)",
    color: "var(--x185fa5)",
    borderRadius: 99,
    padding: "3px 10px",
    fontWeight: 500
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid #e0ddd8",
    color: "var(--text-faint)",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  deleteBtn: {
    background: "transparent",
    border: "1px solid #fcc",
    color: "var(--xe24b4a)",
    padding: "4px 12px",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  newRoleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    paddingTop: 16,
    borderTop: "1px solid #f0ede8"
  },
  label: {
    fontSize: 12,
    color: "var(--text-faint)",
    marginBottom: 6
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #e0ddd8",
    borderRadius: 7,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--x1a1a1a)",
    outline: "none",
    boxSizing: "border-box"
  },
  modalSelect: {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #e0ddd8",
    borderRadius: 7,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--x1a1a1a)",
    background: "var(--white)",
    outline: "none"
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20
  },
  confirmOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1100
  },
  confirmBox: {
    background: "var(--white)",
    borderRadius: 14,
    padding: "40px 36px",
    width: 420,
    maxWidth: "92vw",
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif"
  },
  confirmIcon: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    border: `3px solid ${ORANGE}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: 32,
    color: ORANGE,
    fontWeight: 700
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--x1a1a1a)",
    marginBottom: 10
  },
  confirmMsg: {
    fontSize: 13,
    color: "var(--text-faint)",
    marginBottom: 28,
    lineHeight: 1.6
  },
  confirmBtns: {
    display: "flex",
    gap: 12,
    justifyContent: "center"
  },
  btnBlue: {
    background: "var(--info-text)",
    color: "var(--white)",
    border: "none",
    padding: "10px 28px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  },
  btnCancel: {
    background: "transparent",
    border: "1px solid #e0ddd8",
    color: "var(--text-muted)",
    padding: "10px 24px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif"
  }
};

// Role avatar colors map
const AVATAR_COLORS = {
  "Super Admin": {
    bg: "var(--xfee9e0)",
    color: "var(--xe8622a)"
  },
  "Manager": {
    bg: "var(--xe3f9ee)",
    color: "var(--x1a7a4a)"
  },
  "Technician": {
    bg: "var(--xe0f0ff)",
    color: "var(--x1d6fb8)"
  },
  "Accountant": {
    bg: "var(--xfff4e0)",
    color: "var(--xc07800)"
  },
  "Client": {
    bg: "var(--xf0eeff)",
    color: "var(--x6b4ee8)"
  }
};
function avatarStyle(name) {
  return AVATAR_COLORS[name] || {
    bg: "#f0ede8",
    color: "#666"
  };
}
function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────

function ConfirmModal({
  type,
  onConfirm,
  onCancel
}) {
  const isReset = type === "reset";
  return <div onClick={onCancel} className="ap-roles-permissions-1">
      <div onClick={e => e.stopPropagation()} className="ap-roles-permissions-2">
        <div className="ap-roles-permissions-3">!</div>
        <div className="ap-roles-permissions-4">Are you sure?</div>
        <div className="ap-roles-permissions-5">
          {isReset ? "This will reset permissions for all users with this role. Do you want to reset?" : "You will not be able to recover the deleted record!"}
        </div>
        <div className="ap-roles-permissions-6">
          <button onClick={onConfirm} className="ap-roles-permissions-7">
            {isReset ? "Yes" : "Yes, Delete It!"}
          </button>
          <button onClick={onCancel} className="ap-roles-permissions-8">Cancel</button>
        </div>
      </div>
    </div>;
}

// ─── PERM SELECT ──────────────────────────────────────────────────────────────

function PermSelect({
  value,
  onChange
}) {
  return <select value={value} onChange={e => onChange(e.target.value)} className="ap-roles-permissions-9">
      {PERM_OPTIONS.map(o => <option key={o}>{o}</option>)}
    </select>;
}

// ─── PERM TABLE ───────────────────────────────────────────────────────────────

function PermTable({
  role,
  onPermChange
}) {
  if (role.isClient) {
    return <table className="ap-roles-permissions-10">
        <thead>
          <tr>
            <th className="ap-roles-permissions-11">Module</th>
            <th className="ap-roles-permissions-12">Add</th>
            <th className="ap-roles-permissions-12">View</th>
            <th className="ap-roles-permissions-12">Update</th>
            <th className="ap-roles-permissions-12">Delete</th>
          </tr>
        </thead>
        <tbody>
          {CLIENT_MODULE_NAMES.map(name => {
          const p = role.perms[name] || {
            add: "None",
            view: "None",
            update: "None",
            del: "None"
          };
          return <tr key={name} onMouseEnter={e => e.currentTarget.style.background = "#faf9f7"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td className="ap-roles-permissions-13">{name}</td>
                <td className="ap-roles-permissions-13"><PermSelect value={p.add} onChange={v => onPermChange(role.id, name, "add", v)} /></td>
                <td className="ap-roles-permissions-13"><PermSelect value={p.view} onChange={v => onPermChange(role.id, name, "view", v)} /></td>
                <td className="ap-roles-permissions-13"><PermSelect value={p.update} onChange={v => onPermChange(role.id, name, "update", v)} /></td>
                <td className="ap-roles-permissions-13"><PermSelect value={p.del} onChange={v => onPermChange(role.id, name, "del", v)} /></td>
              </tr>;
        })}
        </tbody>
      </table>;
  }
  let lastSection = null;
  const rows = [];
  ALL_MODULES.forEach(({
    name,
    section
  }) => {
    if (section !== lastSection) {
      rows.push(<tr key={`sec-${section}`} className="ap-roles-permissions-14">
          <td colSpan={5} className="ap-roles-permissions-15">{section}</td>
        </tr>);
      lastSection = section;
    }
    if (VIEW_ONLY.has(name)) {
      rows.push(<tr key={name} onMouseEnter={e => e.currentTarget.style.background = "#faf9f7"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td className="ap-roles-permissions-13">{name}</td>
          <td colSpan={4} className="ap-roles-permissions-16">view only</td>
        </tr>);
      return;
    }
    const p = role.perms[name] || {
      add: "None",
      view: "None",
      update: "None",
      del: "None"
    };
    rows.push(<tr key={name} onMouseEnter={e => e.currentTarget.style.background = "#faf9f7"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <td className="ap-roles-permissions-13">{name}</td>
        <td className="ap-roles-permissions-13"><PermSelect value={p.add} onChange={v => onPermChange(role.id, name, "add", v)} /></td>
        <td className="ap-roles-permissions-13"><PermSelect value={p.view} onChange={v => onPermChange(role.id, name, "view", v)} /></td>
        <td className="ap-roles-permissions-13"><PermSelect value={p.update} onChange={v => onPermChange(role.id, name, "update", v)} /></td>
        <td className="ap-roles-permissions-13"><PermSelect value={p.del} onChange={v => onPermChange(role.id, name, "del", v)} /></td>
      </tr>);
  });
  return <table className="ap-roles-permissions-10">
      <thead>
        <tr>
          <th className="ap-roles-permissions-17">Module</th>
          <th className="ap-roles-permissions-12">Add</th>
          <th className="ap-roles-permissions-12">View</th>
          <th className="ap-roles-permissions-12">Update</th>
          <th className="ap-roles-permissions-12">Delete</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>;
}

// ─── ROLE SECTION ─────────────────────────────────────────────────────────────

function RoleSection({
  role,
  onPermChange
}) {
  const [open, setOpen] = useState(false);
  const {
    bg,
    color
  } = avatarStyle(role.name);
  return <div className="ap-roles-permissions-18">
      <div className="ap-roles-permissions-19">
        <div className="ap-roles-permissions-20">
          <div style={{
          background: bg,
          color
        }} className="ap-roles-permissions-21">{initials(role.name)}</div>
          <div>
            <div className="ap-roles-permissions-22">{role.name}</div>
            <div className="ap-roles-permissions-23">{role.memberCount} Member{role.memberCount !== 1 ? "s" : ""}</div>
          </div>
        </div>
        {role.isAdmin ? <span className="ap-roles-permissions-24">Admin permissions can not be changed</span> : <button onClick={() => setOpen(v => !v)} className="ap-roles-permissions-25">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
            {open ? "Hide Permissions" : "Permissions"}
          </button>}
      </div>
      {open && !role.isAdmin && <PermTable role={role} onPermChange={onPermChange} />}
    </div>;
}

// ─── MANAGE ROLE MODAL ────────────────────────────────────────────────────────

function ManageRoleModal({
  roles,
  onClose,
  onDelete,
  onAdd,
  onReset
}) {
  const [newName, setNewName] = useState("");
  const [importFrom, setImportFrom] = useState("");
  const [confirm, setConfirm] = useState(null);
  const handleConfirm = () => {
    if (confirm.type === "reset") onReset(confirm.roleId);
    if (confirm.type === "delete") onDelete(confirm.roleId);
    setConfirm(null);
  };
  const handleSave = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), importFrom);
    setNewName("");
    setImportFrom("");
  };
  return <>
      <div onClick={onClose} className="ap-roles-permissions-26">
        <div onClick={e => e.stopPropagation()} className="ap-roles-permissions-27">
          <div className="ap-roles-permissions-28">
            <span className="ap-roles-permissions-29">Manage Role</span>
            <button onClick={onClose} className="ap-roles-permissions-30">×</button>
          </div>

          <table className="ap-roles-permissions-31">
            <thead>
              <tr>
                <th className="ap-roles-permissions-32">#</th>
                <th className="ap-roles-permissions-33">User Role</th>
                <th className="ap-roles-permissions-33"></th>
                <th className="ap-roles-permissions-33">Action</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r, i) => {
              const {
                bg,
                color
              } = avatarStyle(r.name);
              return <tr key={r.id}>
                    <td className="ap-roles-permissions-34">{i + 1}</td>
                    <td className="ap-roles-permissions-34">
                      <div className="ap-roles-permissions-35">
                        <div style={{
                      background: bg,
                      color
                    }} className="ap-roles-permissions-36">{initials(r.name)}</div>
                        {r.name}
                      </div>
                    </td>
                    <td className="ap-roles-permissions-34"><span className="ap-roles-permissions-37">0 Unsynced Users</span></td>
                    <td className="ap-roles-permissions-34">
                      {r.isAdmin ? <span className="ap-roles-permissions-38">Default role can not be deleted.</span> : r.isDefault ? <div className="ap-roles-permissions-39">
                          <span className="ap-roles-permissions-40">Default role can not be deleted.</span>
                          <button onClick={() => setConfirm({
                      type: "reset",
                      roleId: r.id
                    })} className="ap-roles-permissions-41">↺ Reset Permissions</button>
                        </div> : <button onClick={() => setConfirm({
                    type: "delete",
                    roleId: r.id
                  })} className="ap-roles-permissions-42">Delete</button>}
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>

          <div className="ap-roles-permissions-43">
            <div>
              <div className="ap-roles-permissions-44">Role Name <span className="ap-roles-permissions-45">*</span></div>
              <input placeholder="e.g. Sales Executive" value={newName} onChange={e => setNewName(e.target.value)} className="ap-roles-permissions-46" />
            </div>
            <div>
              <div className="ap-roles-permissions-44">Import from Role</div>
              <select value={importFrom} onChange={e => setImportFrom(e.target.value)} className="ap-roles-permissions-47">
                <option value="">-- Start from scratch --</option>
                {roles.filter(r => !r.isAdmin).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
          </div>

          <div className="ap-roles-permissions-48">
            <button onClick={onClose} className="ap-roles-permissions-49">Close</button>
            <button style={{
            opacity: newName.trim() ? "1" : "0.5"
          }} onClick={handleSave} className="ap-roles-permissions-50">Save</button>
          </div>
        </div>
      </div>

      {confirm && <ConfirmModal type={confirm.type} onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />}
    </>;
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function RolesPermissions() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [showModal, setShowModal] = useState(false);
  const handlePermChange = (roleId, moduleName, field, value) => {
    setRoles(prev => prev.map(r => r.id === roleId ? {
      ...r,
      perms: {
        ...r.perms,
        [moduleName]: {
          ...r.perms[moduleName],
          [field]: value
        }
      }
    } : r));
  };
  const handleDelete = roleId => setRoles(prev => prev.filter(r => r.id !== roleId));
  const handleReset = roleId => {
    const role = roles.find(r => r.id === roleId);
    setRoles(prev => prev.map(r => r.id === roleId ? {
      ...r,
      perms: role?.isClient ? makeClientPerms() : makePerms()
    } : r));
  };
  const handleAdd = (name, importFrom) => {
    const src = roles.find(r => r.name === importFrom);
    setRoles(prev => [...prev, {
      id: Date.now(),
      name,
      memberCount: 0,
      isDefault: false,
      isAdmin: false,
      isClient: false,
      perms: src ? {
        ...src.perms
      } : makePerms()
    }]);
    setShowModal(false);
  };
  return <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div className="ap-roles-permissions-51">
        <div className="ap-roles-permissions-52">
          <div>
            <div className="ap-roles-permissions-53">Roles &amp; Permissions</div>
            <div className="ap-roles-permissions-54">Control what each role can access across CoolTech AC Services</div>
          </div>
          <button onClick={() => setShowModal(true)} className="ap-roles-permissions-55">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 7H9V2a1 1 0 00-2 0v5H2a1 1 0 000 2h5v5a1 1 0 002 0V9h5a1 1 0 000-2z" />
            </svg>
            Manage Role
          </button>
        </div>

        {roles.map(role => <RoleSection key={role.id} role={role} onPermChange={handlePermChange} />)}
      </div>

      {showModal && <ManageRoleModal roles={roles} onClose={() => setShowModal(false)} onDelete={handleDelete} onAdd={handleAdd} onReset={handleReset} />}
    </>;
}
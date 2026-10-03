// Status label/colour maps — drive badge colours for each status key
export const JOB_STATUS = {
  new: {
    label: "New",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  assigned: {
    label: "Assigned",
    bg: "var(--success-bg)",
    color: "var(--x065f46)",
    dot: "var(--success)"
  },
  in_progress: {
    label: "In Progress",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  completed: {
    label: "Completed",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  invoiced: {
    label: "Invoiced",
    bg: "var(--purple-bg)",
    color: "var(--purple-text)",
    dot: "var(--purple)"
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  }
};
export const QUOT_STATUS = {
  draft: {
    label: "Draft",
    bg: "var(--bg)",
    color: "var(--text-body)"
  },
  sent: {
    label: "Sent",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  approved: {
    label: "Approved",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  rejected: {
    label: "Rejected",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  },
  expired: {
    label: "Expired",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
export const INV_STATUS = {
  paid: {
    label: "Paid",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  pending: {
    label: "Pending",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  overdue: {
    label: "Overdue",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  credited: {
    label: "Credited",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  }
};
export const TECH_STATUS = {
  available: {
    label: "Available",
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  busy: {
    label: "On Job",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  off: {
    label: "Off Duty",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  },
  on_leave: {
    label: "On Leave",
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  }
};
export const ATTEND_STATUS = {
  present: {
    label: "Present",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  absent: {
    label: "Absent",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  half: {
    label: "Half Day",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  holiday: {
    label: "Holiday",
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  leave: {
    label: "On Leave",
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  }
};
export const COMP_STATUS = {
  open: {
    label: "Open",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  },
  in_progress: {
    label: "In Progress",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  resolved: {
    label: "Resolved",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  closed: {
    label: "Closed",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
export const EXP_STATUS = {
  approved: {
    label: "Approved",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  pending: {
    label: "Pending",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  rejected: {
    label: "Rejected",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};

// src/constants/statusMaps.js

export const TKT_STATUS = {
  open: {
    label: "Open",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  in_progress: {
    label: "In Progress",
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  resolved: {
    label: "Resolved",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  closed: {
    label: "Closed",
    color: "var(--text-muted)",
    bg: "var(--border)"
  }
};
export const TKT_PRIORITY = {
  low: {
    label: "Low",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  medium: {
    label: "Medium",
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  high: {
    label: "High",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  urgent: {
    label: "Urgent",
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  }
};
export const TKT_CATEGORIES = {
  general: {
    label: "General",
    color: "var(--info)",
    bg: "var(--info-bg)"
  },
  breakdown: {
    label: "Breakdown",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  quality: {
    label: "Quality",
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  billing: {
    label: "Billing",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  scheduling: {
    label: "Scheduling",
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  }
};
export const PO_STATUS = {
  draft: {
    label: "Draft",
    color: "var(--text-muted)",
    bg: "var(--border)"
  },
  ordered: {
    label: "Ordered",
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  received: {
    label: "Received",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
/* ══════════════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════════════ */

// ── Moved here from data/mockData.js (they are style config, not sample data) ──
export const PAY_STATUS = {
  paid: {
    label: "Paid",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  pending: {
    label: "Pending",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  }
};

export const REMINDER_STATUS = {
  upcoming: {
    label: "Upcoming",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  due_soon: {
    label: "Due Soon",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  overdue: {
    label: "Overdue",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  }
};

export const LEAVE_STATUS = {
  approved: {
    label: "Approved",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  pending: {
    label: "Pending",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  rejected: {
    label: "Rejected",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};

export const NOTIF_TYPE_CFG = {
  urgent: {
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  ticket: {
    color: "var(--purple)",
    bg: "var(--purple-bg)"
  },
  payment: {
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  lead: {
    color: "#0EA5E9",
    bg: "#E0F2FE"
  },
  contract: {
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  amc: {
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  inventory: {
    color: "var(--x06b6d4)",
    bg: "var(--xecfeff)"
  },
  feedback: {
    color: "var(--xca8a04)",
    bg: "var(--xfefce8)"
  },
  complaint: {
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  salary: {
    color: "var(--text-muted)",
    bg: "var(--bg)"
  }
};

// Purchase-order status as the Suppliers page shows it (has a coloured dot and a
// different "draft" colour than PO_STATUS above). Kept separate so that page
// looks exactly as before.
export const PO_STATUS_WITH_DOT = {
  draft: {
    label: "Draft",
    bg: "var(--bg)",
    color: "var(--text-body)"
  },
  ordered: {
    label: "Ordered",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  received: {
    label: "Received",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};
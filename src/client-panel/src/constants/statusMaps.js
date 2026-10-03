// Status label/colour maps for the client portal badges.
// (Moved here from data/mockData.js — this is style config, not sample data.)
export const STATUS_MAPS = {
  job: {
    new: {
      label: 'New',
      bg: "var(--info-bg)",
      color: "var(--info-text)",
      dot: "var(--info)"
    },
    assigned: {
      label: 'Assigned',
      bg: "var(--warning-bg)",
      color: "var(--warning-text)",
      dot: "var(--warning)"
    },
    in_progress: {
      label: 'In Progress',
      bg: "var(--brand-light)",
      color: "var(--brand-dark)",
      dot: "var(--brand)"
    },
    completed: {
      label: 'Completed',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    cancelled: {
      label: 'Cancelled',
      bg: "var(--bg)",
      color: "var(--text-body)"
    },
    invoiced: {
      label: 'Invoiced',
      bg: "var(--purple-bg)",
      color: "var(--purple-text)",
      dot: "var(--purple)"
    }
  },
  invoice: {
    pending: {
      label: 'Pending',
      bg: "var(--warning-bg)",
      color: "var(--warning-text)",
      dot: "var(--warning)"
    },
    paid: {
      label: 'Paid',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    overdue: {
      label: 'Overdue',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)",
      dot: "var(--danger)"
    },
    draft: {
      label: 'Draft',
      bg: "var(--bg)",
      color: "var(--text-body)"
    }
  },
  ticket: {
    open: {
      label: 'Open',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)",
      dot: "var(--danger)"
    },
    in_progress: {
      label: 'In Progress',
      bg: "var(--brand-light)",
      color: "var(--brand-dark)",
      dot: "var(--brand)"
    },
    closed: {
      label: 'Resolved',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    waiting: {
      label: 'Waiting',
      bg: "var(--purple-bg)",
      color: "var(--purple-text)",
      dot: "var(--purple)"
    }
  },
  contract: {
    active: {
      label: 'Active',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    expired: {
      label: 'Expired',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)"
    },
    draft: {
      label: 'Draft',
      bg: "var(--bg)",
      color: "var(--text-body)"
    },
    pending_signature: {
      label: 'Pending Sign',
      bg: "var(--warning-bg)",
      color: "var(--warning-text)",
      dot: "var(--warning)"
    }
  },
  amc: {
    active: {
      label: 'Active',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    expiring: {
      label: 'Expiring',
      bg: "var(--warning-bg)",
      color: "var(--warning-text)",
      dot: "var(--warning)"
    },
    expired: {
      label: 'Expired',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)"
    }
  },
  quotation: {
    sent: {
      label: 'Sent',
      bg: "var(--info-bg)",
      color: "var(--info-text)",
      dot: "var(--info)"
    },
    approved: {
      label: 'Approved',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    expired: {
      label: 'Expired',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)"
    },
    draft: {
      label: 'Draft',
      bg: "var(--bg)",
      color: "var(--text-body)"
    }
  },
  reminder: {
    upcoming: {
      label: 'Upcoming',
      bg: "var(--warning-bg)",
      color: "var(--warning-text)",
      dot: "var(--warning)"
    },
    done: {
      label: 'Done',
      bg: "var(--success-bg)",
      color: "var(--success-text)",
      dot: "var(--success)"
    },
    overdue: {
      label: 'Overdue',
      bg: "var(--danger-bg)",
      color: "var(--danger-text)",
      dot: "var(--danger)"
    }
  }
};
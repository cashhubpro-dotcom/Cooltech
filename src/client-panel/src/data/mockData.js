// ─── Client Portal Mock Data ──────────────────────────────────────────────────
// Represents ONE logged-in client's data (e.g. Sunrise Hotel – C002)

export const LOGGED_IN_CLIENT = {
  id: 'C002',
  name: 'Sunrise Hotel',
  contact: 'Hotel Admin',
  email: 'admin@sunrise.com',
  phone: '9812345678',
  address: 'Hotel Circle, Pune – 411001',
  type: 'Commercial',
  units: 6,
  amc: true,
  totalJobs: 24,
  totalSpent: 98000,
  memberSince: 'Jan 2024',
  avatar: 'SH',
  color: "var(--info)",
  gst: '27AABCS1234C1ZX'
};
export const CLIENT_USERS = [{
  email: 'admin@sunrise.com',
  password: 'client123',
  name: 'Hotel Admin',
  client: 'C002'
}, {
  email: 'sharma@email.com',
  password: 'client123',
  name: 'Mr. Sharma',
  client: 'C001'
}, {
  email: 'anand@techpark.com',
  password: 'client123',
  name: 'Mr. Anand',
  client: 'C004'
}];
export const MY_JOBS = [{
  id: 'JOB-1041',
  type: 'AMC Visit',
  priority: 'normal',
  status: 'assigned',
  tech: 'Vijay S.',
  date: 'Mar 3, 2026',
  time: '11:30 AM',
  ac: 'Carrier VRF – 6 units',
  issue: 'Quarterly AMC service',
  amount: 12000
}, {
  id: 'JOB-1035',
  type: 'Repair',
  priority: 'high',
  status: 'completed',
  tech: 'Ramesh K.',
  date: 'Feb 24, 2026',
  time: '10:00 AM',
  ac: 'Carrier VRF – Unit 3',
  issue: 'Compressor noise, vibration',
  amount: 4800
}, {
  id: 'JOB-1028',
  type: 'Service',
  priority: 'normal',
  status: 'completed',
  tech: 'Vijay S.',
  date: 'Feb 10, 2026',
  time: '09:30 AM',
  ac: 'Carrier VRF – All units',
  issue: 'Routine service & cleaning',
  amount: 8000
}, {
  id: 'JOB-1019',
  type: 'AMC Visit',
  priority: 'normal',
  status: 'completed',
  tech: 'Arjun D.',
  date: 'Jan 15, 2026',
  time: '10:00 AM',
  ac: 'Carrier VRF – 6 units',
  issue: 'Q1 AMC inspection',
  amount: 12000
}, {
  id: 'JOB-1010',
  type: 'Installation',
  priority: 'normal',
  status: 'completed',
  tech: 'Ramesh K.',
  date: 'Dec 20, 2025',
  time: '08:00 AM',
  ac: 'Carrier VRF 12TR – New wing',
  issue: '2 additional units in new wing',
  amount: 38000
}, {
  id: 'JOB-1005',
  type: 'Repair',
  priority: 'normal',
  status: 'completed',
  tech: 'Vijay S.',
  date: 'Nov 30, 2025',
  time: '02:00 PM',
  ac: 'Carrier VRF – Unit 1',
  issue: 'Gas leak detected and fixed',
  amount: 3200
}];
export const MY_INVOICES = [{
  id: 'INV-2041',
  job: 'JOB-1041',
  amount: 12000,
  tax: 2160,
  total: 14160,
  date: 'Mar 3, 2026',
  due: 'Mar 13, 2026',
  status: 'pending',
  description: 'Quarterly AMC Visit – Q1 2026'
}, {
  id: 'INV-2033',
  job: 'JOB-1035',
  amount: 4800,
  tax: 864,
  total: 5664,
  date: 'Feb 25, 2026',
  due: 'Mar 7, 2026',
  status: 'paid',
  description: 'VRF Compressor Repair – Unit 3'
}, {
  id: 'INV-2025',
  job: 'JOB-1028',
  amount: 8000,
  tax: 1440,
  total: 9440,
  date: 'Feb 11, 2026',
  due: 'Feb 21, 2026',
  status: 'paid',
  description: 'Routine Service & Cleaning – All 6 Units'
}, {
  id: 'INV-2018',
  job: 'AMC-221',
  amount: 18000,
  tax: 3240,
  total: 21240,
  date: 'Jan 1, 2026',
  due: 'Jan 15, 2026',
  status: 'paid',
  description: 'AMC Annual Fee – Q1 Advance'
}, {
  id: 'INV-2001',
  job: 'JOB-1010',
  amount: 38000,
  tax: 6840,
  total: 44840,
  date: 'Dec 21, 2025',
  due: 'Jan 5, 2026',
  status: 'overdue',
  description: 'VRF Installation – New Wing (2 Units)'
}];
export const MY_PAYMENTS = [{
  id: 'PAY-089',
  invoice: 'INV-2033',
  amount: 5664,
  method: 'UPI',
  date: 'Feb 27, 2026',
  ref: 'UPI/1234567890',
  status: 'cleared'
}, {
  id: 'PAY-082',
  invoice: 'INV-2025',
  amount: 9440,
  method: 'Bank Transfer',
  date: 'Feb 20, 2026',
  ref: 'NEFT/9988776655',
  status: 'cleared'
}, {
  id: 'PAY-070',
  invoice: 'INV-2018',
  amount: 21240,
  method: 'Cheque',
  date: 'Jan 14, 2026',
  ref: 'CHQ/004521',
  status: 'cleared'
}];
export const MY_AMC = [{
  id: 'AMC-221',
  plan: 'Comprehensive',
  start: 'Jan 1, 2026',
  end: 'Dec 31, 2026',
  value: 72000,
  units: 6,
  visits: 4,
  done: 1,
  nextVisit: 'Apr 2026',
  status: 'active',
  coverage: ['Quarterly service visits', '24hr emergency response', 'Labour coverage', 'Parts – compressor & PCB', 'Gas top-up (1 refill/unit/year)']
}];
export const MY_QUOTATIONS = [{
  id: 'QT-0086',
  type: 'AMC',
  items: [{
    desc: 'Comprehensive AMC Renewal – 6 units',
    qty: 6,
    rate: 12000
  }, {
    desc: 'Emergency Call Charges – Waived',
    qty: 0,
    rate: 0
  }],
  subtotal: 72000,
  gst: 12960,
  total: 84960,
  created: 'Mar 1, 2026',
  valid: 'Mar 16, 2026',
  status: 'sent',
  notes: 'Renewal for 2026-27. Includes 4 visits/year per unit.'
}, {
  id: 'QT-0079',
  type: 'Installation',
  items: [{
    desc: 'Daikin VRF – 2 Additional Units',
    qty: 2,
    rate: 42000
  }, {
    desc: 'Installation & Piping',
    qty: 2,
    rate: 4500
  }],
  subtotal: 93000,
  gst: 16740,
  total: 109740,
  created: 'Feb 15, 2026',
  valid: 'Mar 2, 2026',
  status: 'approved',
  notes: 'For new banquet hall wing.'
}];
export const MY_CONTRACTS = [{
  id: 'CON-008',
  type: 'AMC',
  title: 'Comprehensive AMC – 6 Units',
  value: 72000,
  startDate: 'Jan 1, 2026',
  endDate: 'Dec 31, 2026',
  status: 'active',
  signed: true,
  signedDate: 'Dec 30, 2025',
  terms: 'Quarterly AMC visits. Emergency response within 6 hours. Full labour coverage.',
  autoRenew: true
}, {
  id: 'CON-004',
  type: 'AMC',
  title: 'AMC – 4 Units (Previous Year)',
  value: 48000,
  startDate: 'Jan 1, 2025',
  endDate: 'Dec 31, 2025',
  status: 'expired',
  signed: true,
  signedDate: 'Dec 28, 2024',
  terms: 'Annual maintenance. 4 visits/year.',
  autoRenew: false
}];
export const MY_TICKETS = [{
  id: 'TKT-038',
  subject: 'Unit 2 – Unusual Noise & Poor Cooling',
  category: 'breakdown',
  priority: 'high',
  status: 'in_progress',
  created: 'Mar 2, 2026 3:00 PM',
  updated: 'Mar 3, 2026 9:00 AM',
  assignedTo: 'Ramesh Kumar',
  messages: [{
    from: 'Sunrise Hotel',
    time: 'Mar 2, 3:00 PM',
    msg: 'Unit 2 in Room 204 is making loud noise and not cooling below 26°C. Guests are complaining.',
    isClient: true
  }, {
    from: 'CoolTech Support',
    time: 'Mar 2, 3:45 PM',
    msg: 'Noted! We\'ve assigned this to Ramesh Kumar. He will visit on Mar 3 morning. Please keep the unit running.',
    isClient: false
  }, {
    from: 'Sunrise Hotel',
    time: 'Mar 3, 8:00 AM',
    msg: 'Is the technician on the way? Guest check-in is at 2 PM.',
    isClient: true
  }, {
    from: 'CoolTech Support',
    time: 'Mar 3, 9:00 AM',
    msg: 'Yes! Ramesh is heading there now. ETA ~10:30 AM. We\'ll update you once he\'s on site.',
    isClient: false
  }]
}, {
  id: 'TKT-031',
  subject: 'Request for Annual Service Report – 2025',
  category: 'general',
  priority: 'low',
  status: 'closed',
  created: 'Jan 5, 2026 11:00 AM',
  updated: 'Jan 7, 2026 4:00 PM',
  assignedTo: 'Support Team',
  messages: [{
    from: 'Sunrise Hotel',
    time: 'Jan 5, 11:00 AM',
    msg: 'Please share the full service report for all 6 units for the year 2025.',
    isClient: true
  }, {
    from: 'CoolTech Support',
    time: 'Jan 6, 10:00 AM',
    msg: 'The report has been prepared. Please find attached: 2025 Annual Service Summary for Sunrise Hotel.',
    isClient: false
  }, {
    from: 'Sunrise Hotel',
    time: 'Jan 7, 9:00 AM',
    msg: 'Received. Thank you!',
    isClient: true
  }]
}];
export const MY_REMINDERS = [{
  id: 'REM-012',
  type: 'AMC Renewal',
  unit: 'All 6 AC Units',
  date: 'Dec 31, 2026',
  status: 'upcoming',
  note: 'AMC contract expires. Renewal quote will be sent 30 days in advance.'
}, {
  id: 'REM-010',
  type: 'Quarterly Visit',
  unit: 'All 6 AC Units – Q2',
  date: 'Apr 15, 2026',
  status: 'upcoming',
  note: 'Scheduled Q2 AMC visit. Technician will call before arrival.'
}, {
  id: 'REM-007',
  type: 'Filter Cleaning',
  unit: 'Lobby Unit + Room 101',
  date: 'Mar 20, 2026',
  status: 'upcoming',
  note: 'Filter cleaning due. Can be done during next AMC visit.'
}, {
  id: 'REM-004',
  type: 'Gas Refill',
  unit: 'Unit 2 (Room 204)',
  date: 'Feb 28, 2026',
  status: 'done',
  note: 'R-410A gas refill completed during last service visit.'
}, {
  id: 'REM-001',
  type: 'Quarterly Visit',
  unit: 'All 6 AC Units – Q1',
  date: 'Jan 15, 2026',
  status: 'done',
  note: 'Q1 2026 AMC visit completed by Arjun Das.'
}];
export const MY_DOCUMENTS = [{
  id: 'DOC-011',
  name: 'AMC Contract 2026',
  type: 'Contract',
  size: '245 KB',
  date: 'Dec 30, 2025',
  icon: '📝'
}, {
  id: 'DOC-010',
  name: 'Invoice INV-2018 – Q1 Advance',
  type: 'Invoice',
  size: '120 KB',
  date: 'Jan 1, 2026',
  icon: '💰'
}, {
  id: 'DOC-009',
  name: 'Service Report – Q1 2026',
  type: 'Report',
  size: '380 KB',
  date: 'Jan 20, 2026',
  icon: '📊'
}, {
  id: 'DOC-008',
  name: 'Quotation QT-0079 – New Units',
  type: 'Quotation',
  size: '98 KB',
  date: 'Feb 15, 2026',
  icon: '📄'
}, {
  id: 'DOC-007',
  name: 'Invoice INV-2025 – Feb Service',
  type: 'Invoice',
  size: '115 KB',
  date: 'Feb 11, 2026',
  icon: '💰'
}, {
  id: 'DOC-006',
  name: 'Annual Service Summary – 2025',
  type: 'Report',
  size: '540 KB',
  date: 'Jan 7, 2026',
  icon: '📊'
}, {
  id: 'DOC-005',
  name: 'Warranty Certificate – Carrier VRF',
  type: 'Warranty',
  size: '210 KB',
  date: 'Dec 21, 2024',
  icon: '🛡'
}, {
  id: 'DOC-004',
  name: 'Installation Report – 2024',
  type: 'Report',
  size: '620 KB',
  date: 'Jan 10, 2025',
  icon: '📊'
}];
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
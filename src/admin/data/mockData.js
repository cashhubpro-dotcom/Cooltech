// ─── Mock Data & Status Maps ─────────────────────────────────────────────────
// All static data and configuration used across the app.
// In production, replace each array with a real API call.
// e.g.  export const JOBS = await fetch('/api/jobs').then(r => r.json())

// ─── Inline color tokens (avoids importing COLORS from tokens) ───────────────
const BRAND = "#0EA5E9";
const BRAND_DARK = "#0284C7";
const BRAND_LIGHT = "#E0F2FE";
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

/* ══════════════════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════════════════ */

export const JOBS = [{
  id: "JOB-1042",
  customer: "Sharma Residency",
  address: "42 MG Road, Bengaluru",
  type: "Service",
  priority: "high",
  status: "in_progress",
  tech: "Ramesh K.",
  date: "Mar 3, 2026",
  time: "10:00 AM",
  ac: "Samsung 1.5T Split",
  issue: "Not cooling, gas leak suspected",
  amount: 1800,
  created: "Mar 1"
}, {
  id: "JOB-1041",
  customer: "Sunrise Hotel",
  address: "Hotel Circle, Pune",
  type: "AMC Visit",
  priority: "normal",
  status: "assigned",
  tech: "Vijay S.",
  date: "Mar 3, 2026",
  time: "11:30 AM",
  ac: "Carrier VRF – 6 units",
  issue: "Quarterly AMC service",
  amount: 12000,
  created: "Mar 2"
}, {
  id: "JOB-1040",
  customer: "Meera Iyer",
  address: "12 Lake View, Chennai",
  type: "Installation",
  priority: "normal",
  status: "completed",
  tech: "Arjun D.",
  date: "Mar 2, 2026",
  time: "09:00 AM",
  ac: "Daikin 2T Inverter",
  issue: "New installation – bedroom",
  amount: 4500,
  created: "Feb 28"
}, {
  id: "JOB-1039",
  customer: "TechPark Ltd.",
  address: "IT Park, Hyderabad",
  type: "Repair",
  priority: "urgent",
  status: "new",
  tech: "Unassigned",
  date: "Mar 3, 2026",
  time: "—",
  ac: "Mitsubishi VRF 10HP",
  issue: "Complete shutdown – server room",
  amount: 8500,
  created: "Mar 3"
}, {
  id: "JOB-1038",
  customer: "Patel Villa",
  address: "63 Palm Avenue, Ahmedabad",
  type: "Service",
  priority: "normal",
  status: "completed",
  tech: "Ramesh K.",
  date: "Mar 1, 2026",
  time: "02:00 PM",
  ac: "Voltas 1T Window",
  issue: "Annual cleaning and gas refill",
  amount: 900,
  created: "Feb 29"
}, {
  id: "JOB-1037",
  customer: "City Mall",
  address: "Ring Road, Indore",
  type: "Repair",
  priority: "high",
  status: "invoiced",
  tech: "Vijay S.",
  date: "Feb 29, 2026",
  time: "10:00 AM",
  ac: "LG Cassette 2T × 4",
  issue: "Compressor failure – Unit C2",
  amount: 22000,
  created: "Feb 28"
}];
export const CUSTOMERS = [{
  id: "C001",
  name: "Sharma Residency",
  phone: "9876543210",
  email: "sharma@email.com",
  address: "42 MG Road, Bengaluru",
  type: "Residential",
  units: 2,
  amc: true,
  totalJobs: 8,
  totalSpent: 18400,
  lastService: "Mar 1, 2026"
}, {
  id: "C002",
  name: "Sunrise Hotel",
  phone: "9812345678",
  email: "admin@sunrise.com",
  address: "Hotel Circle, Pune",
  type: "Commercial",
  units: 6,
  amc: true,
  totalJobs: 24,
  totalSpent: 98000,
  lastService: "Mar 3, 2026"
}, {
  id: "C003",
  name: "Meera Iyer",
  phone: "9988776655",
  email: "meera@gmail.com",
  address: "12 Lake View, Chennai",
  type: "Residential",
  units: 1,
  amc: false,
  totalJobs: 3,
  totalSpent: 6200,
  lastService: "Mar 2, 2026"
}, {
  id: "C004",
  name: "TechPark Ltd.",
  phone: "9900112233",
  email: "fm@techpark.com",
  address: "IT Park, Hyderabad",
  type: "Commercial",
  units: 4,
  amc: true,
  totalJobs: 15,
  totalSpent: 142000,
  lastService: "Mar 3, 2026"
}, {
  id: "C005",
  name: "Patel Villa",
  phone: "9765432100",
  email: "patel@gmail.com",
  address: "63 Palm Ave, Ahmedabad",
  type: "Residential",
  units: 3,
  amc: false,
  totalJobs: 5,
  totalSpent: 9800,
  lastService: "Mar 1, 2026"
}, {
  id: "C006",
  name: "City Mall",
  phone: "9821234567",
  email: "ops@citymall.com",
  address: "Ring Road, Indore",
  type: "Commercial",
  units: 12,
  amc: true,
  totalJobs: 31,
  totalSpent: 310000,
  lastService: "Feb 29, 2026"
}];
export const TECHNICIANS = [{
  id: "T01",
  name: "Ramesh Kumar",
  phone: "9871234567",
  email: "ramesh@cooltech.com",
  role: "Senior Technician",
  status: "busy",
  rating: 4.8,
  jobs: 3,
  completed: 248,
  area: "Bengaluru North",
  skills: ["VRF", "Split", "Inverter", "AMC"],
  joinDate: "Jan 2022",
  salary: 32000,
  advance: 0
}, {
  id: "T02",
  name: "Vijay Singh",
  phone: "9862345678",
  email: "vijay@cooltech.com",
  role: "Senior Technician",
  status: "busy",
  rating: 4.6,
  jobs: 2,
  completed: 201,
  area: "Pune & PCMC",
  skills: ["Split", "Window", "Cassette"],
  joinDate: "Mar 2021",
  salary: 30000,
  advance: 5000
}, {
  id: "T03",
  name: "Arjun Das",
  phone: "9853456789",
  email: "arjun@cooltech.com",
  role: "Technician",
  status: "available",
  rating: 4.5,
  jobs: 0,
  completed: 134,
  area: "Chennai",
  skills: ["Split", "VRF", "Installation"],
  joinDate: "Jun 2023",
  salary: 25000,
  advance: 0
}, {
  id: "T04",
  name: "Suresh Yadav",
  phone: "9844567890",
  email: "suresh@cooltech.com",
  role: "Junior Technician",
  status: "available",
  rating: 4.2,
  jobs: 0,
  completed: 87,
  area: "Hyderabad",
  skills: ["Split", "Window"],
  joinDate: "Jan 2024",
  salary: 20000,
  advance: 2000
}, {
  id: "T05",
  name: "Kishore Naik",
  phone: "9835678901",
  email: "kishore@cooltech.com",
  role: "Technician",
  status: "off",
  rating: 4.4,
  jobs: 0,
  completed: 156,
  area: "Ahmedabad",
  skills: ["Split", "Inverter", "Cassette"],
  joinDate: "Sep 2022",
  salary: 26000,
  advance: 0
}];
export const AMC_CONTRACTS = [{
  id: "AMC-221",
  customer: "Sunrise Hotel",
  units: 6,
  plan: "Comprehensive",
  start: "Jan 2026",
  end: "Dec 2026",
  value: 72000,
  visits: 4,
  done: 1,
  nextVisit: "Apr 2026",
  status: "active"
}, {
  id: "AMC-218",
  customer: "TechPark Ltd.",
  units: 4,
  plan: "Comprehensive",
  start: "Feb 2026",
  end: "Jan 2027",
  value: 48000,
  visits: 4,
  done: 0,
  nextVisit: "May 2026",
  status: "active"
}, {
  id: "AMC-215",
  customer: "City Mall",
  units: 12,
  plan: "Premium",
  start: "Jan 2026",
  end: "Dec 2026",
  value: 180000,
  visits: 12,
  done: 2,
  nextVisit: "Apr 2026",
  status: "active"
}, {
  id: "AMC-212",
  customer: "Sharma Residency",
  units: 2,
  plan: "Basic",
  start: "Jan 2026",
  end: "Dec 2026",
  value: 9600,
  visits: 2,
  done: 0,
  nextVisit: "Jul 2026",
  status: "active"
}, {
  id: "AMC-208",
  customer: "Dr. Nair Clinic",
  units: 3,
  plan: "Comprehensive",
  start: "Jan 2026",
  end: "Dec 2026",
  value: 27000,
  visits: 4,
  done: 1,
  nextVisit: "May 2026",
  status: "active"
}, {
  id: "AMC-186",
  customer: "Galaxy Towers",
  units: 8,
  plan: "Basic",
  start: "Nov 2025",
  end: "Oct 2026",
  value: 32000,
  visits: 2,
  done: 2,
  nextVisit: "Oct 2026",
  status: "expiring"
}];
export const INVOICES = [{
  id: "INV-2042",
  job: "JOB-1037",
  customer: "City Mall",
  amount: 22000,
  tax: 3960,
  total: 25960,
  date: "Mar 2, 2026",
  status: "paid",
  due: "Mar 12"
}, {
  id: "INV-2041",
  job: "JOB-1040",
  customer: "Meera Iyer",
  amount: 4500,
  tax: 810,
  total: 5310,
  date: "Mar 2, 2026",
  status: "pending",
  due: "Mar 12"
}, {
  id: "INV-2040",
  job: "JOB-1038",
  customer: "Patel Villa",
  amount: 900,
  tax: 162,
  total: 1062,
  date: "Mar 1, 2026",
  status: "paid",
  due: "Mar 11"
}, {
  id: "INV-2039",
  job: "AMC-215",
  customer: "City Mall",
  amount: 15000,
  tax: 2700,
  total: 17700,
  date: "Feb 28, 2026",
  status: "overdue",
  due: "Feb 28"
}, {
  id: "INV-2038",
  job: "JOB-1036",
  customer: "Dr. Nair Clinic",
  amount: 1500,
  tax: 270,
  total: 1770,
  date: "Feb 28, 2026",
  status: "paid",
  due: "Mar 10"
}];
export const INVENTORY = [{
  id: "INV-001",
  name: "R-32 Refrigerant",
  category: "Refrigerant",
  sku: "REF-R32",
  qty: 24,
  unit: "Cylinder",
  reorder: 10,
  cost: 2800,
  supplier: "RefriTech"
}, {
  id: "INV-002",
  name: "R-410A Refrigerant",
  category: "Refrigerant",
  sku: "REF-R410A",
  qty: 18,
  unit: "Cylinder",
  reorder: 8,
  cost: 3200,
  supplier: "RefriTech"
}, {
  id: "INV-003",
  name: "Split AC Filter 1T",
  category: "Filter",
  sku: "FIL-SP1T",
  qty: 45,
  unit: "Piece",
  reorder: 20,
  cost: 120,
  supplier: "FilterPro"
}, {
  id: "INV-004",
  name: "Split AC Filter 1.5T",
  category: "Filter",
  sku: "FIL-SP15T",
  qty: 8,
  unit: "Piece",
  reorder: 20,
  cost: 150,
  supplier: "FilterPro"
}, {
  id: "INV-005",
  name: "Capacitor 25µF",
  category: "Electrical",
  sku: "ELC-CAP25",
  qty: 30,
  unit: "Piece",
  reorder: 15,
  cost: 85,
  supplier: "ElecWorld"
}, {
  id: "INV-006",
  name: "Copper Pipe 1/4\"",
  category: "Piping",
  sku: "PIP-CU14",
  qty: 120,
  unit: "Meter",
  reorder: 50,
  cost: 65,
  supplier: "CopperCo"
}, {
  id: "INV-007",
  name: "Compressor Oil",
  category: "Lubricant",
  sku: "LUB-COMP",
  qty: 8,
  unit: "Litre",
  reorder: 5,
  cost: 320,
  supplier: "OilMax"
}];
export const QUOTATIONS = [{
  id: "QT-0088",
  customer: "Galaxy Towers",
  contact: "Mr. Pankaj",
  phone: "9900881122",
  type: "Installation",
  items: [{
    desc: "Daikin 1.5T Inverter Split",
    qty: 3,
    rate: 42000
  }, {
    desc: "Installation & Piping",
    qty: 3,
    rate: 3500
  }, {
    desc: "5yr AMC – Basic",
    qty: 3,
    rate: 2800
  }],
  subtotal: 144900,
  gst: 26082,
  total: 170982,
  created: "Mar 2, 2026",
  valid: "Mar 17, 2026",
  status: "sent",
  notes: ""
}, {
  id: "QT-0087",
  customer: "Meera Iyer",
  contact: "Ms. Meera",
  phone: "9988776655",
  type: "Service",
  items: [{
    desc: "Split AC Service & Gas Refill",
    qty: 1,
    rate: 1200
  }, {
    desc: "R-32 Refrigerant (1 Cyl)",
    qty: 1,
    rate: 2800
  }],
  subtotal: 4000,
  gst: 720,
  total: 4720,
  created: "Feb 28, 2026",
  valid: "Mar 14, 2026",
  status: "approved",
  notes: ""
}, {
  id: "QT-0086",
  customer: "TechPark Ltd.",
  contact: "Mr. Anand",
  phone: "9900112233",
  type: "AMC",
  items: [{
    desc: "Comprehensive AMC – 4 units",
    qty: 4,
    rate: 12000
  }, {
    desc: "Quarterly Visit Charges",
    qty: 4,
    rate: 0
  }],
  subtotal: 48000,
  gst: 8640,
  total: 56640,
  created: "Feb 25, 2026",
  valid: "Mar 12, 2026",
  status: "approved",
  notes: ""
}, {
  id: "QT-0085",
  customer: "New Client Co.",
  contact: "Mr. Rajan",
  phone: "9811223344",
  type: "Installation",
  items: [{
    desc: "Carrier 2T Cassette",
    qty: 2,
    rate: 58000
  }, {
    desc: "Installation",
    qty: 2,
    rate: 5000
  }],
  subtotal: 126000,
  gst: 22680,
  total: 148680,
  created: "Feb 20, 2026",
  valid: "Mar 7, 2026",
  status: "expired",
  notes: ""
}, {
  id: "QT-0084",
  customer: "Anand Bakery",
  contact: "Mr. Anand",
  phone: "9855443322",
  type: "Repair",
  items: [{
    desc: "Compressor Replacement 1T",
    qty: 1,
    rate: 8500
  }, {
    desc: "Labour",
    qty: 1,
    rate: 800
  }],
  subtotal: 9300,
  gst: 1674,
  total: 10974,
  created: "Mar 1, 2026",
  valid: "Mar 16, 2026",
  status: "draft",
  notes: ""
}];
export const ATTENDANCE_DATA = {
  "Ramesh Kumar": {
    T01: ["P", "P", "P", "P", "P", "H", "H", "P", "P", "P", "P", "P", "H", "H", "P", "P", "P", "P", "A", "H", "H", "P", "P", "P", "P", "P", "H", "H", "P", "P", "P"]
  }
};
export const ALL_ATTENDANCE = [{
  techId: "T01",
  name: "Ramesh Kumar",
  dates: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "H",
    7: "H",
    8: "P",
    9: "P",
    10: "P",
    11: "P",
    12: "P",
    13: "H",
    14: "H",
    15: "P",
    16: "P",
    17: "P",
    18: "P",
    19: "A",
    20: "H",
    21: "H",
    22: "P",
    23: "P",
    24: "P",
    25: "P",
    26: "P",
    27: "H",
    28: "H",
    29: "P",
    30: "P",
    31: "P"
  },
  presentDays: 23,
  absentDays: 1,
  halfDays: 0,
  leaves: 0,
  holidays: 7
}, {
  techId: "T02",
  name: "Vijay Singh",
  dates: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "H",
    7: "H",
    8: "P",
    9: "P",
    10: "P",
    11: "P",
    12: "P",
    13: "H",
    14: "H",
    15: "P",
    16: "L",
    17: "L",
    18: "P",
    19: "P",
    20: "H",
    21: "H",
    22: "P",
    23: "P",
    24: "P",
    25: "P",
    26: "P",
    27: "H",
    28: "H",
    29: "P",
    30: "P",
    31: "P"
  },
  presentDays: 21,
  absentDays: 0,
  halfDays: 0,
  leaves: 2,
  holidays: 7
}, {
  techId: "T03",
  name: "Arjun Das",
  dates: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "H",
    7: "H",
    8: "P",
    9: "A",
    10: "P",
    11: "P",
    12: "P",
    13: "H",
    14: "H",
    15: "P",
    16: "P",
    17: "P",
    18: "P",
    19: "P",
    20: "H",
    21: "H",
    22: "P",
    23: "P",
    24: "HD",
    25: "P",
    26: "P",
    27: "H",
    28: "H",
    29: "P",
    30: "P",
    31: "P"
  },
  presentDays: 21,
  absentDays: 1,
  halfDays: 1,
  leaves: 0,
  holidays: 7
}, {
  techId: "T04",
  name: "Suresh Yadav",
  dates: {
    1: "P",
    2: "P",
    3: "P",
    4: "A",
    5: "A",
    6: "H",
    7: "H",
    8: "P",
    9: "P",
    10: "P",
    11: "P",
    12: "P",
    13: "H",
    14: "H",
    15: "P",
    16: "P",
    17: "P",
    18: "P",
    19: "P",
    20: "H",
    21: "H",
    22: "P",
    23: "P",
    24: "P",
    25: "P",
    26: "P",
    27: "H",
    28: "H",
    29: "P",
    30: "P",
    31: "P"
  },
  presentDays: 22,
  absentDays: 2,
  halfDays: 0,
  leaves: 0,
  holidays: 7
}, {
  techId: "T05",
  name: "Kishore Naik",
  dates: {
    1: "P",
    2: "P",
    3: "P",
    4: "P",
    5: "P",
    6: "H",
    7: "H",
    8: "P",
    9: "P",
    10: "P",
    11: "P",
    12: "P",
    13: "H",
    14: "H",
    15: "P",
    16: "P",
    17: "P",
    18: "P",
    19: "P",
    20: "H",
    21: "H",
    22: "P",
    23: "P",
    24: "P",
    25: "P",
    26: "P",
    27: "H",
    28: "H",
    29: "P",
    30: "P",
    31: "P"
  },
  presentDays: 24,
  absentDays: 0,
  halfDays: 0,
  leaves: 0,
  holidays: 7
}];
export const SALARY_DATA = [{
  techId: "T01",
  name: "Ramesh Kumar",
  basic: 32000,
  hra: 6400,
  travel: 2000,
  incentive: 4800,
  gross: 45200,
  pf: 1920,
  advance: 0,
  deduction: 1920,
  net: 43280,
  status: "paid",
  month: "Feb 2026",
  jobsDone: 31
}, {
  techId: "T02",
  name: "Vijay Singh",
  basic: 30000,
  hra: 6000,
  travel: 2000,
  incentive: 3600,
  gross: 41600,
  pf: 1800,
  advance: 5000,
  deduction: 6800,
  net: 34800,
  status: "paid",
  month: "Feb 2026",
  jobsDone: 24
}, {
  techId: "T03",
  name: "Arjun Das",
  basic: 25000,
  hra: 5000,
  travel: 1500,
  incentive: 2000,
  gross: 33500,
  pf: 1500,
  advance: 0,
  deduction: 1500,
  net: 32000,
  status: "pending",
  month: "Feb 2026",
  jobsDone: 18
}, {
  techId: "T04",
  name: "Suresh Yadav",
  basic: 20000,
  hra: 4000,
  travel: 1500,
  incentive: 1200,
  gross: 26700,
  pf: 1200,
  advance: 2000,
  deduction: 3200,
  net: 23500,
  status: "pending",
  month: "Feb 2026",
  jobsDone: 12
}, {
  techId: "T05",
  name: "Kishore Naik",
  basic: 26000,
  hra: 5200,
  travel: 2000,
  incentive: 3000,
  gross: 36200,
  pf: 1560,
  advance: 0,
  deduction: 1560,
  net: 34640,
  status: "paid",
  month: "Feb 2026",
  jobsDone: 22
}];
export const COMPLAINTS = [{
  id: "CMP-041",
  customer: "TechPark Ltd.",
  tech: "Ramesh K.",
  job: "JOB-1032",
  date: "Mar 1, 2026",
  category: "Quality",
  severity: "high",
  desc: "AC repaired last week is still not cooling properly. Technician did not check properly.",
  status: "open",
  resolution: ""
}, {
  id: "CMP-040",
  customer: "Sunrise Hotel",
  tech: "Vijay S.",
  job: "JOB-1028",
  date: "Feb 28, 2026",
  category: "Behaviour",
  severity: "medium",
  desc: "Technician arrived 2 hours late without informing. Caused disruption to hotel operations.",
  status: "in_progress",
  resolution: "Warning issued to technician. Apology sent."
}, {
  id: "CMP-039",
  customer: "Meera Iyer",
  tech: "Arjun D.",
  job: "JOB-1025",
  date: "Feb 25, 2026",
  category: "Billing",
  severity: "low",
  desc: "Charged for parts that were not replaced. Need invoice correction.",
  status: "resolved",
  resolution: "Invoice corrected. Refund of ₹500 issued."
}, {
  id: "CMP-038",
  customer: "Patel Villa",
  tech: "Ramesh K.",
  job: "JOB-1020",
  date: "Feb 20, 2026",
  category: "Quality",
  severity: "medium",
  desc: "Gas refill not done properly. AC stopped cooling within 3 days.",
  status: "resolved",
  resolution: "Free re-service done. Gas refilled again."
}, {
  id: "CMP-037",
  customer: "City Mall",
  tech: "Vijay S.",
  job: "JOB-1015",
  date: "Feb 15, 2026",
  category: "Delay",
  severity: "low",
  desc: "Technician scheduled for 10AM, arrived at 2PM. No communication given.",
  status: "closed",
  resolution: "Feedback noted. Process improved."
}];
export const EXPENSES = [{
  id: "EXP-101",
  category: "Fuel",
  tech: "Ramesh K.",
  desc: "Fuel reimbursement – Bengaluru North round trips",
  date: "Mar 3, 2026",
  amount: 850,
  receipt: true,
  status: "approved"
}, {
  id: "EXP-102",
  category: "Tools",
  tech: "Arjun D.",
  desc: "Leak detector tool purchase",
  date: "Mar 2, 2026",
  amount: 4200,
  receipt: true,
  status: "approved"
}, {
  id: "EXP-103",
  category: "Fuel",
  tech: "Vijay S.",
  desc: "Fuel – Pune route, 3 jobs",
  date: "Mar 2, 2026",
  amount: 620,
  receipt: true,
  status: "pending"
}, {
  id: "EXP-104",
  category: "Miscellaneous",
  tech: "Suresh Y.",
  desc: "Auto fare – client site, no vehicle available",
  date: "Mar 1, 2026",
  amount: 280,
  receipt: false,
  status: "pending"
}, {
  id: "EXP-105",
  category: "Parts",
  tech: "Ramesh K.",
  desc: "Emergency capacitor purchase – local market",
  date: "Feb 29, 2026",
  amount: 95,
  receipt: true,
  status: "approved"
}, {
  id: "EXP-106",
  category: "Training",
  tech: "Kishore N.",
  desc: "VRF advanced course – online certification",
  date: "Feb 28, 2026",
  amount: 3500,
  receipt: true,
  status: "approved"
}, {
  id: "EXP-107",
  category: "Fuel",
  tech: "Kishore N.",
  desc: "Fuel – Ahmedabad monthly",
  date: "Feb 28, 2026",
  amount: 1100,
  receipt: true,
  status: "approved"
}, {
  id: "EXP-108",
  category: "Office",
  tech: "Admin",
  desc: "Printer cartridge + stationery",
  date: "Feb 27, 2026",
  amount: 780,
  receipt: true,
  status: "approved"
}];
export const LEADS = [{
  id: "LD-088",
  name: "Horizon Apartments",
  contact: "Mr. Kapoor",
  phone: "9911223344",
  email: "kapoor@horizon.com",
  address: "Whitefield, Bengaluru",
  type: "Residential",
  units: 8,
  source: "Referral",
  stage: "negotiation",
  value: 64000,
  lastContact: "Mar 2, 2026",
  notes: "Wants AMC + installation for 8 units. Price negotiation ongoing.",
  assignedTo: "Rajesh P.",
  created: "Feb 20, 2026",
  score: 82,
  temp: "hot",
  calls: 4,
  emails: 2,
  visits: 1
}, {
  id: "LD-087",
  name: "Wellness Clinic",
  contact: "Dr. Priya",
  phone: "9922334455",
  email: "drpriya@well.com",
  address: "Koramangala, Bengaluru",
  type: "Commercial",
  units: 3,
  source: "Google Ad",
  stage: "proposal_sent",
  value: 28000,
  lastContact: "Mar 1, 2026",
  notes: "Sent comprehensive AMC proposal. Awaiting reply.",
  assignedTo: "Rajesh P.",
  created: "Feb 22, 2026",
  score: 65,
  temp: "warm",
  calls: 2,
  emails: 3,
  visits: 0
}, {
  id: "LD-086",
  name: "GreenPark Residency",
  contact: "Mr. Gupta",
  phone: "9933445566",
  email: "gupta@gp.com",
  address: "Electronic City, Bengaluru",
  type: "Residential",
  units: 2,
  source: "Walk-in",
  stage: "follow_up",
  value: 9000,
  lastContact: "Feb 28, 2026",
  notes: "Called twice. Customer interested but delayed decision.",
  assignedTo: "Rekha S.",
  created: "Feb 25, 2026",
  score: 41,
  temp: "warm",
  calls: 2,
  emails: 0,
  visits: 0
}, {
  id: "LD-085",
  name: "Cafe Mocha",
  contact: "Mr. Thomas",
  phone: "9944556677",
  email: "thomas@mocha.com",
  address: "Indiranagar, Bengaluru",
  type: "Commercial",
  units: 2,
  source: "Instagram",
  stage: "new",
  value: 12000,
  lastContact: "Mar 3, 2026",
  notes: "Initial enquiry via DM. Needs installation + AMC.",
  assignedTo: "Unassigned",
  created: "Mar 3, 2026",
  score: 18,
  temp: "cold",
  calls: 0,
  emails: 0,
  visits: 0
}, {
  id: "LD-084",
  name: "Sterling Software",
  contact: "Ms. Nisha",
  phone: "9955667788",
  email: "nisha@sterling.com",
  address: "Manyata, Bengaluru",
  type: "Commercial",
  units: 6,
  source: "LinkedIn",
  stage: "won",
  value: 72000,
  lastContact: "Mar 2, 2026",
  notes: "Deal closed! AMC signed for 6 units.",
  assignedTo: "Rajesh P.",
  created: "Feb 10, 2026",
  score: 95,
  temp: "hot",
  calls: 6,
  emails: 4,
  visits: 2
}, {
  id: "LD-083",
  name: "Sun Palace Hotel",
  contact: "Mr. Ravi",
  phone: "9966778899",
  email: "ravi@sun.com",
  address: "MG Road, Bengaluru",
  type: "Commercial",
  units: 12,
  source: "Cold Call",
  stage: "lost",
  value: 120000,
  lastContact: "Feb 15, 2026",
  notes: "Went with competitor. Price was issue.",
  assignedTo: "Rekha S.",
  created: "Jan 30, 2026",
  score: 12,
  temp: "cold",
  calls: 3,
  emails: 2,
  visits: 1
}];
export const LEAD_ACTIVITIES = {
  "LD-088": [{
    date: "Mar 2",
    type: "call",
    by: "Rajesh P.",
    note: "Long call – 35 min. Price negotiation. Offered 5% discount on AMC. Positive."
  }, {
    date: "Feb 28",
    type: "whatsapp",
    by: "Rajesh P.",
    note: "Sent updated quote PDF and installation timeline via WhatsApp."
  }, {
    date: "Feb 25",
    type: "visit",
    by: "Rajesh P.",
    note: "Site visit done. Measured all 8 rooms. Photos sent to team."
  }, {
    date: "Feb 22",
    type: "email",
    by: "Admin",
    note: "Sent initial AMC brochure and price list."
  }, {
    date: "Feb 20",
    type: "call",
    by: "Rajesh P.",
    note: "First contact. Lead from referral by Mr. Sharma. Very interested."
  }],
  "LD-087": [{
    date: "Mar 1",
    type: "email",
    by: "Rajesh P.",
    note: "Sent comprehensive AMC proposal (₹28,000). Awaiting reply."
  }, {
    date: "Feb 26",
    type: "call",
    by: "Rajesh P.",
    note: "Discussed AMC plan options. Dr. Priya wants Comprehensive plan."
  }, {
    date: "Feb 22",
    type: "call",
    by: "Admin",
    note: "Initial call. Enquiry from Google Ad. 3 commercial units."
  }],
  "LD-086": [{
    date: "Feb 28",
    type: "call",
    by: "Rekha S.",
    note: "Second call. Mr. Gupta said he needs 2 more weeks to decide."
  }, {
    date: "Feb 25",
    type: "call",
    by: "Rekha S.",
    note: "First call. Walk-in enquiry. Interested in service + AMC."
  }],
  "LD-085": [{
    date: "Mar 3",
    type: "whatsapp",
    by: "Admin",
    note: "Initial reply to Instagram DM. Sent service menu PDF."
  }],
  "LD-084": [{
    date: "Mar 2",
    type: "email",
    by: "Admin",
    note: "Contract signed! AMC for 6 units confirmed. ₹72,000 paid."
  }, {
    date: "Feb 28",
    type: "call",
    by: "Rajesh P.",
    note: "Final negotiation call. Ms. Nisha agreed to full AMC."
  }, {
    date: "Feb 25",
    type: "visit",
    by: "Rajesh P.",
    note: "Second visit. Demo of AMC process shown on site."
  }, {
    date: "Feb 18",
    type: "email",
    by: "Rajesh P.",
    note: "Sent Comprehensive AMC proposal for 6 units."
  }, {
    date: "Feb 14",
    type: "visit",
    by: "Rajesh P.",
    note: "First site visit. Met Ms. Nisha and IT head."
  }, {
    date: "Feb 10",
    type: "call",
    by: "Rajesh P.",
    note: "First contact via LinkedIn connection."
  }]
};
export const CONTRACTS = [{
  id: "CON-012",
  customer: "Sterling Software",
  contact: "Ms. Nisha",
  phone: "9955667788",
  email: "nisha@sterling.com",
  type: "AMC",
  title: "Annual Maintenance Contract – 6 AC Units",
  value: 72000,
  startDate: "Mar 5, 2026",
  endDate: "Mar 4, 2027",
  status: "active",
  signed: true,
  signedDate: "Mar 2, 2026",
  signatories: ["Ms. Nisha (Client)", "Admin (CoolTech)"],
  terms: "Quarterly service visits. 24hr emergency response. Parts coverage on compressor.",
  linkedLead: "LD-084",
  linkedAMC: "AMC-221",
  clauses: 4,
  autoRenew: true
}, {
  id: "CON-011",
  customer: "City Mall",
  contact: "Mr. Ops",
  phone: "9821234567",
  email: "ops@citymall.com",
  type: "AMC",
  title: "Premium AMC – 12 Units (Annual)",
  value: 180000,
  startDate: "Jan 1, 2026",
  endDate: "Dec 31, 2026",
  status: "active",
  signed: true,
  signedDate: "Dec 28, 2025",
  signatories: ["Mr. Ops (Client)", "Admin (CoolTech)"],
  terms: "Monthly visits. Full parts coverage. 4hr SLA for emergencies.",
  linkedLead: "",
  linkedAMC: "AMC-215",
  clauses: 6,
  autoRenew: true
}, {
  id: "CON-010",
  customer: "TechPark Ltd.",
  contact: "Mr. Anand",
  phone: "9900112233",
  email: "anand@techpark.com",
  type: "AMC",
  title: "Comprehensive AMC – 4 Units + VRF",
  value: 56640,
  startDate: "Feb 1, 2026",
  endDate: "Jan 31, 2027",
  status: "active",
  signed: true,
  signedDate: "Jan 30, 2026",
  signatories: ["Mr. Anand (Client)", "Admin (CoolTech)"],
  terms: "Quarterly visits. Compressor warranty coverage. Server room priority response.",
  linkedLead: "",
  linkedAMC: "AMC-218",
  clauses: 5,
  autoRenew: false
}, {
  id: "CON-009",
  customer: "Horizon Apartments",
  contact: "Mr. Kapoor",
  phone: "9911223344",
  email: "kapoor@horizon.com",
  type: "Installation",
  title: "8 Unit VRF Installation & 1Yr AMC",
  value: 170982,
  startDate: "",
  endDate: "",
  status: "draft",
  signed: false,
  signedDate: "",
  signatories: [],
  terms: "Installation within 25 days. 1yr comprehensive warranty. AMC auto-renews.",
  linkedLead: "LD-088",
  linkedAMC: "",
  clauses: 7,
  autoRenew: true
}, {
  id: "CON-008",
  customer: "Sunrise Hotel",
  contact: "Admin",
  phone: "9812345678",
  email: "admin@sunrise.com",
  type: "AMC",
  title: "Comprehensive AMC – 6 Units",
  value: 72000,
  startDate: "Jan 1, 2026",
  endDate: "Dec 31, 2026",
  status: "active",
  signed: true,
  signedDate: "Dec 30, 2025",
  signatories: ["Hotel Admin (Client)", "Admin (CoolTech)"],
  terms: "Quarterly AMC visits. Emergency response within 6 hours.",
  linkedLead: "",
  linkedAMC: "AMC-221",
  clauses: 4,
  autoRenew: true
}, {
  id: "CON-007",
  customer: "Galaxy Towers",
  contact: "Mr. Pankaj",
  phone: "9900881122",
  email: "pankaj@galaxy.com",
  type: "Installation",
  title: "8 Unit Installation Contract",
  value: 170982,
  startDate: "Mar 1, 2026",
  endDate: "Mar 31, 2026",
  status: "pending_signature",
  signed: false,
  signedDate: "",
  signatories: ["Mr. Pankaj (Client) – PENDING", "Admin (CoolTech) ✓"],
  terms: "Delivery in 4 weeks. Payment: 50% advance, 50% on completion.",
  linkedLead: "",
  linkedAMC: "",
  clauses: 5,
  autoRenew: false
}];
export const TICKETS = [{
  id: "TKT-041",
  customer: "TechPark Ltd.",
  contact: "Mr. Anand",
  phone: "9900112233",
  email: "anand@techpark.com",
  subject: "VRF System Not Starting – Server Room",
  category: "breakdown",
  priority: "critical",
  status: "open",
  created: "Mar 3, 2026 9:00 AM",
  updated: "Mar 3, 2026 9:45 AM",
  assignedTo: "Ramesh Kumar",
  job: "JOB-1039",
  messages: [{
    from: "TechPark Ltd.",
    time: "9:00 AM",
    msg: "URGENT: Our server room VRF has completely stopped. Server temps rising. Need immediate help!",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "9:15 AM",
    msg: "We have received your request. Ramesh Kumar is being dispatched immediately. ETA by 2PM after current job.",
    isClient: false
  }, {
    from: "TechPark Ltd.",
    time: "9:20 AM",
    msg: "Please hurry. Server room temp is at 28°C and rising. This is critical.",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "9:45 AM",
    msg: "Understood. We have escalated priority. Ramesh will head directly after current job at Sharma Residency. ETA ~1:30PM.",
    isClient: false
  }],
  sla: "4hr",
  slaBreach: false
}, {
  id: "TKT-040",
  customer: "Sunrise Hotel",
  contact: "Mr. Front Desk",
  phone: "9812345678",
  email: "admin@sunrise.com",
  subject: "AMC Visit Rescheduling Request",
  category: "scheduling",
  priority: "low",
  status: "resolved",
  created: "Feb 28, 2026",
  updated: "Mar 1, 2026",
  assignedTo: "Admin",
  job: "",
  messages: [{
    from: "Sunrise Hotel",
    time: "Feb 28 2:00 PM",
    msg: "We need to reschedule our March AMC visit to April 10 as we have a hotel event.",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "Feb 28 4:00 PM",
    msg: "Of course! We have rescheduled your AMC visit to April 10, 2026. You will receive a confirmation shortly.",
    isClient: false
  }],
  sla: "24hr",
  slaBreach: false
}, {
  id: "TKT-039",
  customer: "Meera Iyer",
  contact: "Ms. Meera",
  phone: "9988776655",
  email: "meera@gmail.com",
  subject: "Newly Installed AC Making Rattling Noise",
  category: "quality",
  priority: "medium",
  status: "in_progress",
  created: "Mar 2, 2026",
  updated: "Mar 3, 2026",
  assignedTo: "Arjun Das",
  job: "JOB-1040",
  messages: [{
    from: "Meera Iyer",
    time: "Mar 2 6:00 PM",
    msg: "The new AC installed today is making a rattling noise when running. Please check.",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "Mar 2 7:00 PM",
    msg: "We are sorry to hear this. Arjun Das who did the installation will call you tomorrow morning to schedule a revisit.",
    isClient: false
  }, {
    from: "Meera Iyer",
    time: "Mar 3 9:00 AM",
    msg: "OK. Please let him come today if possible.",
    isClient: true
  }, {
    from: "Arjun Das",
    time: "Mar 3 9:30 AM",
    msg: "Hi Ms. Meera, I will visit by 4PM today to check and fix the rattling. It is likely the front panel clip.",
    isClient: false
  }],
  sla: "12hr",
  slaBreach: false
}, {
  id: "TKT-038",
  customer: "City Mall",
  contact: "Mr. Ops",
  phone: "9821234567",
  email: "ops@citymall.com",
  subject: "Invoice Discrepancy – INV-2039",
  category: "billing",
  priority: "medium",
  status: "resolved",
  created: "Feb 27, 2026",
  updated: "Feb 28, 2026",
  assignedTo: "Admin",
  job: "",
  messages: [{
    from: "City Mall",
    time: "Feb 27 11:00 AM",
    msg: "The invoice INV-2039 shows ₹17,700 but our PO was for ₹15,000 only. Please clarify.",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "Feb 28 10:00 AM",
    msg: "Apologies for confusion. The additional ₹2,700 is 18% GST on the service amount. We have sent a detailed breakup to your email.",
    isClient: false
  }],
  sla: "24hr",
  slaBreach: false
}, {
  id: "TKT-037",
  customer: "Patel Villa",
  contact: "Mr. Patel",
  phone: "9765432100",
  email: "patel@gmail.com",
  subject: "Gas Leak After Service – Need Re-check",
  category: "quality",
  priority: "high",
  status: "open",
  created: "Mar 1, 2026",
  updated: "Mar 1, 2026",
  assignedTo: "Ramesh Kumar",
  job: "JOB-1038",
  messages: [{
    from: "Patel Villa",
    time: "Mar 1 5:00 PM",
    msg: "AC serviced today but it stopped cooling after 3 hours. Possible gas leak again.",
    isClient: true
  }, {
    from: "CoolTech Support",
    time: "Mar 1 6:00 PM",
    msg: "We sincerely apologise. This will be treated as a priority. Ramesh will revisit tomorrow free of charge.",
    isClient: false
  }],
  sla: "8hr",
  slaBreach: false
}];
export const TKT_CATEGORIES = {
  breakdown: {
    label: "Breakdown",
    color: "var(--danger)",
    bg: "var(--danger-bg)"
  },
  quality: {
    label: "Quality",
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  billing: {
    label: "Billing",
    color: "var(--purple)",
    bg: "var(--purple-bg)"
  },
  scheduling: {
    label: "Scheduling",
    color: "var(--info)",
    bg: "var(--info-bg)"
  },
  general: {
    label: "General",
    color: "var(--text-muted)",
    bg: "var(--bg)"
  }
};
export const TKT_PRIORITY = {
  critical: {
    label: "Critical",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  high: {
    label: "High",
    color: "var(--brand)",
    bg: "var(--brand-light)"
  },
  medium: {
    label: "Medium",
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  low: {
    label: "Low",
    color: "var(--text-muted)",
    bg: "var(--bg)"
  }
};
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
    bg: "var(--bg)"
  }
};
export const RECRUITMENT = [{
  id: "REC-001",
  role: "Senior Technician – VRF Specialist",
  department: "Field",
  openings: 2,
  type: "Full-time",
  location: "Bengaluru",
  salary: "₹35,000–₹42,000/mo",
  posted: "Feb 20, 2026",
  deadline: "Mar 20, 2026",
  status: "active",
  applicants: [{
    name: "Deepak Mehta",
    phone: "9800111222",
    email: "deepak@gmail.com",
    exp: "6 yrs",
    skills: ["VRF", "Split", "Inverter"],
    applied: "Mar 1",
    stage: "interview",
    notes: "Very strong on VRF. References checked."
  }, {
    name: "Sunil Rao",
    phone: "9800222333",
    email: "sunil@gmail.com",
    exp: "4 yrs",
    skills: ["Split", "AMC"],
    applied: "Feb 28",
    stage: "shortlisted",
    notes: "Good attitude. Needs VRF training."
  }, {
    name: "Praveen Joshi",
    phone: "9800333444",
    email: "praveen@gmail.com",
    exp: "3 yrs",
    skills: ["Split", "Window"],
    applied: "Feb 25",
    stage: "applied",
    notes: "Entry level. Consider for junior role."
  }]
}, {
  id: "REC-002",
  role: "Service Coordinator (Office)",
  department: "Admin",
  openings: 1,
  type: "Full-time",
  location: "Bengaluru (WFO)",
  salary: "₹18,000–₹22,000/mo",
  posted: "Mar 1, 2026",
  deadline: "Mar 25, 2026",
  status: "active",
  applicants: [{
    name: "Anita Sharma",
    phone: "9800444555",
    email: "anita@gmail.com",
    exp: "2 yrs",
    skills: ["CRM", "Scheduling", "MS Office"],
    applied: "Mar 2",
    stage: "shortlisted",
    notes: "Good communication. Was at competitor firm."
  }, {
    name: "Rohan Desai",
    phone: "9800555666",
    email: "rohan@gmail.com",
    exp: "1 yr",
    skills: ["Excel", "Customer Support"],
    applied: "Mar 3",
    stage: "applied",
    notes: "Fresh, enthusiastic. Would need training."
  }]
}, {
  id: "REC-003",
  role: "Junior Technician – Split AC",
  department: "Field",
  openings: 3,
  type: "Full-time",
  location: "Multiple (Bengaluru, Pune)",
  salary: "₹18,000–₹22,000/mo",
  posted: "Feb 15, 2026",
  deadline: "Mar 15, 2026",
  status: "closed",
  applicants: [{
    name: "Manoj Kumar",
    phone: "9800666777",
    email: "manoj@gmail.com",
    exp: "2 yrs",
    skills: ["Split", "Window"],
    applied: "Feb 18",
    stage: "hired",
    notes: "Hired. Joining Mar 15."
  }, {
    name: "Akhil Singh",
    phone: "9800777888",
    email: "akhil@gmail.com",
    exp: "1.5 yrs",
    skills: ["Split"],
    applied: "Feb 20",
    stage: "rejected",
    notes: "Did not clear skill test."
  }]
}];
export const PURCHASE_ORDERS = [{
  id: "PO-0042",
  supplier: "RefriTech Pvt Ltd",
  items: [{
    name: "R-32 Refrigerant",
    qty: 10,
    rate: 2800,
    total: 28000
  }, {
    name: "R-410A Refrigerant",
    qty: 6,
    rate: 3200,
    total: 19200
  }],
  subtotal: 47200,
  gst: 8496,
  total: 55696,
  orderDate: "Mar 1, 2026",
  expectedDate: "Mar 5, 2026",
  status: "received",
  payStatus: "paid",
  notes: "Urgent order – stock running low"
}, {
  id: "PO-0041",
  supplier: "FilterPro Industries",
  items: [{
    name: "Split AC Filter 1.5T",
    qty: 50,
    rate: 150,
    total: 7500
  }, {
    name: "Split AC Filter 1T",
    qty: 40,
    rate: 120,
    total: 4800
  }],
  subtotal: 12300,
  gst: 2214,
  total: 14514,
  orderDate: "Feb 28, 2026",
  expectedDate: "Mar 3, 2026",
  status: "received",
  payStatus: "paid",
  notes: ""
}, {
  id: "PO-0040",
  supplier: "ElecWorld Distributors",
  items: [{
    name: "Capacitor 25µF",
    qty: 30,
    rate: 85,
    total: 2550
  }, {
    name: "Capacitor 35µF",
    qty: 20,
    rate: 95,
    total: 1900
  }],
  subtotal: 4450,
  gst: 801,
  total: 5251,
  orderDate: "Mar 2, 2026",
  expectedDate: "Mar 6, 2026",
  status: "ordered",
  payStatus: "pending",
  notes: ""
}, {
  id: "PO-0039",
  supplier: "CopperCo Metals",
  items: [{
    name: "Copper Pipe 1/4\"",
    qty: 100,
    rate: 65,
    total: 6500
  }, {
    name: "Copper Pipe 3/8\"",
    qty: 60,
    rate: 90,
    total: 5400
  }],
  subtotal: 11900,
  gst: 2142,
  total: 14042,
  orderDate: "Feb 25, 2026",
  expectedDate: "Feb 28, 2026",
  status: "received",
  payStatus: "paid",
  notes: ""
}, {
  id: "PO-0038",
  supplier: "OilMax Lubricants",
  items: [{
    name: "Compressor Oil",
    qty: 10,
    rate: 320,
    total: 3200
  }],
  subtotal: 3200,
  gst: 576,
  total: 3776,
  orderDate: "Mar 3, 2026",
  expectedDate: "Mar 7, 2026",
  status: "draft",
  payStatus: "pending",
  notes: "Need to confirm quantity"
}];
export const SUPPLIERS = [{
  id: "SUP-01",
  name: "RefriTech Pvt Ltd",
  contact: "Mr. Reddy",
  phone: "9811001100",
  email: "sales@refritech.com",
  address: "Industrial Area, Pune",
  category: "Refrigerant",
  rating: 4.8,
  totalOrders: 24,
  totalValue: 542000,
  lastOrder: "Mar 1, 2026",
  paymentTerms: "30 days",
  status: "active"
}, {
  id: "SUP-02",
  name: "FilterPro Industries",
  contact: "Ms. Kavya",
  phone: "9822002200",
  email: "orders@filterpro.com",
  address: "Peenya, Bengaluru",
  category: "Filter",
  rating: 4.5,
  totalOrders: 18,
  totalValue: 186000,
  lastOrder: "Feb 28, 2026",
  paymentTerms: "15 days",
  status: "active"
}, {
  id: "SUP-03",
  name: "ElecWorld Distributors",
  contact: "Mr. Salim",
  phone: "9833003300",
  email: "elecworld@dist.com",
  address: "SP Road, Bengaluru",
  category: "Electrical",
  rating: 4.3,
  totalOrders: 31,
  totalValue: 98000,
  lastOrder: "Mar 2, 2026",
  paymentTerms: "Immediate",
  status: "active"
}, {
  id: "SUP-04",
  name: "CopperCo Metals",
  contact: "Mr. Joshi",
  phone: "9844004400",
  email: "supply@copperco.in",
  address: "Bhiwandi, Mumbai",
  category: "Piping",
  rating: 4.6,
  totalOrders: 16,
  totalValue: 224000,
  lastOrder: "Feb 25, 2026",
  paymentTerms: "45 days",
  status: "active"
}, {
  id: "SUP-05",
  name: "OilMax Lubricants",
  contact: "Mr. Mishra",
  phone: "9855005500",
  email: "oilmax@lube.com",
  address: "Taloja MIDC, Navi Mumbai",
  category: "Lubricant",
  rating: 4.1,
  totalOrders: 9,
  totalValue: 32000,
  lastOrder: "Mar 3, 2026",
  paymentTerms: "Immediate",
  status: "active"
}, {
  id: "SUP-06",
  name: "ToolZone Pro",
  contact: "Ms. Anjali",
  phone: "9866006600",
  email: "toolzone@pro.com",
  address: "HSR Layout, Bengaluru",
  category: "Tools",
  rating: 4.4,
  totalOrders: 7,
  totalValue: 58000,
  lastOrder: "Jan 15, 2026",
  paymentTerms: "15 days",
  status: "inactive"
}];
export const ASSETS = [{
  id: "AST-01",
  name: "Mahindra Bolero",
  assetType: "Vehicle",
  subType: "Service Van",
  regNo: "KA01AB1234",
  year: 2022,
  assignedTo: "Ramesh Kumar",
  lastService: "Jan 15, 2026",
  nextService: "Jul 15, 2026",
  insurance: "Dec 2026",
  fuel: "Diesel",
  km: 42800,
  status: "active",
  value: 850000
}, {
  id: "AST-02",
  name: "Tata Ace Mini Truck",
  assetType: "Vehicle",
  subType: "Parts Delivery",
  regNo: "KA01CD5678",
  year: 2021,
  assignedTo: "Office",
  lastService: "Feb 1, 2026",
  nextService: "Aug 1, 2026",
  insurance: "Nov 2026",
  fuel: "Petrol",
  km: 68200,
  status: "active",
  value: 600000
}, {
  id: "AST-03",
  name: "Honda Activa – 1",
  assetType: "Vehicle",
  subType: "Bike",
  regNo: "KA01EF9012",
  year: 2023,
  assignedTo: "Vijay Singh",
  lastService: "Feb 20, 2026",
  nextService: "Aug 20, 2026",
  insurance: "Jan 2027",
  fuel: "Petrol",
  km: 11400,
  status: "active",
  value: 95000
}, {
  id: "AST-04",
  name: "Honda Activa – 2",
  assetType: "Vehicle",
  subType: "Bike",
  regNo: "KA01GH3456",
  year: 2023,
  assignedTo: "Arjun Das",
  lastService: "Feb 20, 2026",
  nextService: "Aug 20, 2026",
  insurance: "Feb 2027",
  fuel: "Petrol",
  km: 8700,
  status: "active",
  value: 95000
}, {
  id: "AST-05",
  name: "VacuMaster Pro",
  assetType: "Equipment",
  subType: "Vacuum Pump",
  regNo: "—",
  year: 2023,
  assignedTo: "Ramesh Kumar",
  lastService: "Jan 10, 2026",
  nextService: "Jul 10, 2026",
  insurance: "—",
  fuel: "—",
  km: 0,
  status: "active",
  value: 28000
}, {
  id: "AST-06",
  name: "Digital Manifold Gauge Set",
  assetType: "Equipment",
  subType: "Testing Tool",
  regNo: "—",
  year: 2022,
  assignedTo: "Vijay Singh",
  lastService: "Dec 1, 2025",
  nextService: "Jun 1, 2026",
  insurance: "—",
  fuel: "—",
  km: 0,
  status: "maintenance",
  value: 22000
}, {
  id: "AST-07",
  name: "Nitrogen Pressure Tester",
  assetType: "Equipment",
  subType: "Testing Tool",
  regNo: "—",
  year: 2021,
  assignedTo: "Arjun Das",
  lastService: "Nov 15, 2025",
  nextService: "May 15, 2026",
  insurance: "—",
  fuel: "—",
  km: 0,
  status: "active",
  value: 15000
}];
export const WARRANTIES = [{
  id: "WR-101",
  customer: "Sharma Residency",
  unit: "Samsung 1.5T Split – Bedroom",
  brand: "Samsung",
  model: "AR18AY3YAWK",
  serial: "SAM2023BLR001",
  installDate: "Jan 10, 2024",
  warrantyEnd: "Jan 10, 2026",
  type: "Compressor",
  status: "expired",
  extendedAMC: true,
  tech: "Ramesh K."
}, {
  id: "WR-102",
  customer: "Meera Iyer",
  unit: "Daikin 2T Inverter",
  brand: "Daikin",
  model: "FTXS50BVMA",
  serial: "DAI2026CHN007",
  installDate: "Mar 2, 2026",
  warrantyEnd: "Mar 2, 2028",
  type: "Comprehensive",
  status: "active",
  extendedAMC: false,
  tech: "Arjun D."
}, {
  id: "WR-103",
  customer: "TechPark Ltd.",
  unit: "Mitsubishi VRF 10HP",
  brand: "Mitsubishi",
  model: "PUHY-P250",
  serial: "MIT2024HYD012",
  installDate: "Jun 1, 2024",
  warrantyEnd: "Jun 1, 2027",
  type: "Compressor",
  status: "active",
  extendedAMC: true,
  tech: "Ramesh K."
}, {
  id: "WR-104",
  customer: "Sunrise Hotel",
  unit: "Carrier VRF – Indoor 1",
  brand: "Carrier",
  model: "42VFC025",
  serial: "CAR2023PUN005",
  installDate: "Mar 15, 2023",
  warrantyEnd: "Mar 15, 2025",
  type: "Parts & Labour",
  status: "expired",
  extendedAMC: true,
  tech: "Vijay S."
}, {
  id: "WR-105",
  customer: "City Mall",
  unit: "LG Cassette 2T – Unit C1",
  brand: "LG",
  model: "UT30WC",
  serial: "LG2024IND020",
  installDate: "Sep 10, 2024",
  warrantyEnd: "Sep 10, 2026",
  type: "Comprehensive",
  status: "active",
  extendedAMC: false,
  tech: "Vijay S."
}, {
  id: "WR-106",
  customer: "Patel Villa",
  unit: "Voltas 1T Window",
  brand: "Voltas",
  model: "123V DZW",
  serial: "VOL2021AHM009",
  installDate: "Apr 5, 2021",
  warrantyEnd: "Apr 5, 2023",
  type: "Parts Only",
  status: "expired",
  extendedAMC: false,
  tech: "Kishore N."
}];
export const FEEDBACK = [{
  id: "FB-088",
  job: "JOB-1040",
  customer: "Meera Iyer",
  tech: "Arjun D.",
  date: "Mar 2, 2026",
  rating: 5,
  category: "Installation",
  comment: "Excellent work! Very clean installation, no mess left behind. Arjun was polite and professional. AC working perfectly.",
  recommend: true,
  resolved: true
}, {
  id: "FB-087",
  job: "JOB-1038",
  customer: "Patel Villa",
  tech: "Ramesh K.",
  date: "Mar 1, 2026",
  rating: 4,
  category: "Service",
  comment: "Good service. Gas refill done properly. Took slightly longer than expected but overall satisfied.",
  recommend: true,
  resolved: true
}, {
  id: "FB-086",
  job: "JOB-1037",
  customer: "City Mall",
  tech: "Vijay S.",
  date: "Feb 29, 2026",
  rating: 3,
  category: "Repair",
  comment: "Compressor was replaced but technician didn't explain the issue clearly. Work quality was fine though.",
  recommend: true,
  resolved: true
}, {
  id: "FB-085",
  job: "JOB-1036",
  customer: "Dr. Nair Clinic",
  tech: "Arjun D.",
  date: "Feb 28, 2026",
  rating: 5,
  category: "AMC Visit",
  comment: "Always on time, thorough cleaning done. Very happy with CoolTech's AMC service. Been 2 years now!",
  recommend: true,
  resolved: true
}, {
  id: "FB-084",
  job: "JOB-1035",
  customer: "Sunrise Hotel",
  tech: "Vijay S.",
  date: "Feb 25, 2026",
  rating: 2,
  category: "Repair",
  comment: "Technician arrived 1.5 hours late. No prior intimation. The repair was done but the delay caused inconvenience to our guests.",
  recommend: false,
  resolved: false
}, {
  id: "FB-083",
  job: "JOB-1034",
  customer: "TechPark Ltd.",
  tech: "Ramesh K.",
  date: "Feb 20, 2026",
  rating: 4,
  category: "AMC Visit",
  comment: "Good service as usual. All units serviced properly. Minor issue with Unit 3 was also addressed proactively.",
  recommend: true,
  resolved: true
}];
export const NOTICES = [{
  id: "NT-012",
  title: "New Service Rate Card – Effective April 2026",
  type: "Policy",
  priority: "high",
  author: "Admin",
  date: "Mar 3, 2026",
  content: "Updated pricing for all service categories effective April 1, 2026. Gas refill rates increased by 8%. Please inform customers during quotation. Full rate card attached.",
  target: "all",
  pinned: true,
  read: []
}, {
  id: "NT-011",
  title: "Public Holiday – Holi on March 14",
  type: "Holiday",
  priority: "normal",
  author: "Admin",
  date: "Mar 2, 2026",
  content: "The office and field operations will remain closed on March 14, 2026 (Holi). All scheduled jobs have been rescheduled to March 15. Please inform your assigned customers.",
  target: "all",
  pinned: false,
  read: ["T01", "T02"]
}, {
  id: "NT-010",
  title: "Mandatory Safety Training – March 10",
  type: "Training",
  priority: "high",
  author: "Admin",
  date: "Feb 28, 2026",
  content: "All technicians must attend the compressor safety and VRF handling refresher training on March 10 at 10 AM at the office. Certificate will be issued. Attendance is mandatory.",
  target: "technicians",
  pinned: true,
  read: ["T03"]
}, {
  id: "NT-009",
  title: "February Performance Recognition",
  type: "Achievement",
  priority: "normal",
  author: "Admin",
  date: "Feb 28, 2026",
  content: "Congratulations to Ramesh Kumar for completing 31 jobs in February – highest this month! Arjun Das received the best customer rating (4.8★). Keep up the great work!",
  target: "all",
  pinned: false,
  read: ["T01", "T02", "T03", "T04", "T05"]
}, {
  id: "NT-008",
  title: "New Inventory System – Log all parts used",
  type: "Operational",
  priority: "normal",
  author: "Admin",
  date: "Feb 25, 2026",
  content: "From March 1, all technicians must log parts used on every job via the mobile app before closing the job. This is mandatory for proper inventory tracking and billing.",
  target: "technicians",
  pinned: false,
  read: ["T01", "T03", "T05"]
}];
export const REVENUE_MONTHLY = [{
  m: "Oct",
  v: 148000
}, {
  m: "Nov",
  v: 162000
}, {
  m: "Dec",
  v: 195000
}, {
  m: "Jan",
  v: 178000
}, {
  m: "Feb",
  v: 203000
}, {
  m: "Mar",
  v: 91000
}];
export const INIT_CLOCK_SESSIONS = [{
  id: "CS-002",
  date: "Mar 2, 2026",
  day: "Yesterday",
  user: "Admin",
  inTime: "09:08 AM",
  outTime: "06:14 PM",
  breakMins: 45,
  workedMins: 501,
  status: "complete"
}, {
  id: "CS-003",
  date: "Mar 1, 2026",
  day: "Sat",
  user: "Admin",
  inTime: "10:00 AM",
  outTime: "04:30 PM",
  breakMins: 30,
  workedMins: 360,
  status: "complete"
}, {
  id: "CS-004",
  date: "Feb 28, 2026",
  day: "Fri",
  user: "Admin",
  inTime: "09:05 AM",
  outTime: "06:45 PM",
  breakMins: 60,
  workedMins: 520,
  status: "complete"
}, {
  id: "CS-005",
  date: "Feb 27, 2026",
  day: "Thu",
  user: "Admin",
  inTime: "09:00 AM",
  outTime: "06:30 PM",
  breakMins: 45,
  workedMins: 525,
  status: "complete"
}, {
  id: "CS-006",
  date: "Feb 26, 2026",
  day: "Wed",
  user: "Admin",
  inTime: "08:55 AM",
  outTime: "06:00 PM",
  breakMins: 30,
  workedMins: 515,
  status: "complete"
}];
export const TEAM_CLOCK = [{
  name: "Ramesh Kumar",
  role: "Sr. Technician",
  status: "in",
  inTime: "08:45 AM",
  location: "Bengaluru North"
}, {
  name: "Vijay Singh",
  role: "Sr. Technician",
  status: "in",
  inTime: "09:10 AM",
  location: "Pune & PCMC"
}, {
  name: "Arjun Das",
  role: "Technician",
  status: "in",
  inTime: "09:30 AM",
  location: "Chennai"
}, {
  name: "Suresh Yadav",
  role: "Jr. Technician",
  status: "out",
  inTime: "—",
  location: "—"
}, {
  name: "Kishore Naik",
  role: "Technician",
  status: "leave",
  inTime: "—",
  location: "On Leave"
}];
export const SM_CHANNELS = [{
  id: "fb",
  name: "Facebook",
  handle: "@CoolTechACServices",
  followers: 3840,
  icon: "f",
  color: "#1877F2",
  bg: "#EFF6FF",
  posts: 12,
  reach: 18400,
  leads: 14,
  rating: 4.3,
  connected: true
}, {
  id: "ig",
  name: "Instagram",
  handle: "@cooltech_ac",
  followers: 2210,
  icon: "ig",
  color: "#E1306C",
  bg: "#FDF2F8",
  posts: 28,
  reach: 31200,
  leads: 8,
  rating: 0,
  connected: true
}, {
  id: "wa",
  name: "WhatsApp Business",
  handle: "+91 98765 43210",
  followers: 1640,
  icon: "wa",
  color: "#25D366",
  bg: "#F0FDF4",
  posts: 0,
  reach: 1640,
  leads: 22,
  rating: 0,
  connected: true
}, {
  id: "gm",
  name: "Google My Business",
  handle: "CoolTech AC Services",
  followers: 0,
  icon: "g",
  color: "#EA4335",
  bg: "#FEF2F2",
  posts: 0,
  reach: 0,
  leads: 31,
  rating: 4.4,
  connected: true
}, {
  id: "yt",
  name: "YouTube",
  handle: "CoolTech AC Tips",
  followers: 890,
  icon: "yt",
  color: "#FF0000",
  bg: "#FEF2F2",
  posts: 6,
  reach: 24600,
  leads: 3,
  rating: 0,
  connected: false
}];
export const SM_POSTS = [{
  id: "SP-012",
  title: "Summer AC Service Offer – 20% Off",
  type: "Promotion",
  status: "published",
  channels: ["fb", "ig"],
  scheduledAt: "Mar 1, 2026 · 10:00 AM",
  reach: 4820,
  likes: 142,
  comments: 38,
  shares: 27,
  leads: 6,
  image: "🌞",
  caption: "Beat the heat! Get 20% off on AC service this summer. Book now! ☎️ 98765 43210 #ACSummer #CoolTech"
}, {
  id: "SP-011",
  title: "AC Maintenance Tips – Infographic",
  type: "Educational",
  status: "published",
  channels: ["fb", "ig"],
  scheduledAt: "Feb 28, 2026 · 12:00 PM",
  reach: 3210,
  likes: 98,
  comments: 14,
  shares: 41,
  leads: 2,
  image: "🔧",
  caption: "5 signs your AC needs immediate service. Share to help a friend! #ACTips #AirConditioning"
}, {
  id: "SP-010",
  title: "Customer Testimonial – City Mall",
  type: "Testimonial",
  status: "published",
  channels: ["fb"],
  scheduledAt: "Feb 25, 2026 · 11:00 AM",
  reach: 2180,
  likes: 64,
  comments: 9,
  shares: 12,
  leads: 3,
  image: "⭐",
  caption: "Another happy commercial client! City Mall trusts CoolTech for all 12 units. #CustomerLove"
}, {
  id: "SP-009",
  title: "AMC Package Offer – Spring 2026",
  type: "Promotion",
  status: "scheduled",
  channels: ["fb", "ig", "wa"],
  scheduledAt: "Mar 5, 2026 · 09:00 AM",
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  leads: 0,
  image: "📋",
  caption: "Our AMC plans start at just ₹4,800/year per AC. Peace of mind guaranteed! #AMC #ACService"
}, {
  id: "SP-008",
  title: "Diwali Discount Announcement",
  type: "Promotion",
  status: "scheduled",
  channels: ["ig", "wa"],
  scheduledAt: "Mar 8, 2026 · 06:00 PM",
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  leads: 0,
  image: "🪔",
  caption: "Celebrate Holi with cool air! 15% discount on installation this week only. Limited slots!"
}, {
  id: "SP-007",
  title: "How to Clean AC Filters – Video",
  type: "Educational",
  status: "draft",
  channels: ["yt", "ig"],
  scheduledAt: "—",
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  leads: 0,
  image: "🎬",
  caption: "Step-by-step AC filter cleaning guide. Save money, breathe clean! Like & Subscribe!"
}, {
  id: "SP-006",
  title: "VRF System Explainer Post",
  type: "Educational",
  status: "draft",
  channels: ["fb"],
  scheduledAt: "—",
  reach: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  leads: 0,
  image: "❄️",
  caption: "What is a VRF system? Why do commercial properties prefer it? Read on..."
}];
export const SM_CAMPAIGNS = [{
  id: "CMP-05",
  name: "Summer Service Drive 2026",
  goal: "Bookings",
  budget: 15000,
  spent: 8200,
  channels: ["fb", "ig"],
  startDate: "Mar 1",
  endDate: "Mar 31",
  impressions: 48200,
  reach: 31400,
  clicks: 842,
  leads: 34,
  conversions: 18,
  revenue: 82000,
  status: "active"
}, {
  id: "CMP-04",
  name: "AMC Renewal Campaign – Feb",
  goal: "AMC Sign-ups",
  budget: 8000,
  spent: 8000,
  channels: ["fb", "wa"],
  startDate: "Feb 1",
  endDate: "Feb 28",
  impressions: 22100,
  reach: 15800,
  clicks: 412,
  leads: 21,
  conversions: 9,
  revenue: 43200,
  status: "completed"
}, {
  id: "CMP-03",
  name: "Installation Offer – New Homes",
  goal: "Leads",
  budget: 10000,
  spent: 10000,
  channels: ["fb", "ig"],
  startDate: "Jan 15",
  endDate: "Feb 15",
  impressions: 38600,
  reach: 24900,
  clicks: 680,
  leads: 28,
  conversions: 11,
  revenue: 99000,
  status: "completed"
}, {
  id: "CMP-02",
  name: "Google Ads – Emergency Repair",
  goal: "Calls",
  budget: 5000,
  spent: 3400,
  channels: ["gm"],
  startDate: "Feb 15",
  endDate: "Mar 15",
  impressions: 12400,
  reach: 12400,
  clicks: 224,
  leads: 38,
  conversions: 22,
  revenue: 68000,
  status: "active"
}, {
  id: "CMP-01",
  name: "Brand Awareness – Local Area",
  goal: "Followers",
  budget: 3000,
  spent: 3000,
  channels: ["fb", "ig"],
  startDate: "Dec 1",
  endDate: "Dec 31",
  impressions: 56000,
  reach: 41000,
  clicks: 320,
  leads: 8,
  conversions: 3,
  revenue: 14000,
  status: "completed"
}];
export const WA_TEMPLATES = [{
  id: "WT-01",
  name: "Job Confirmation",
  trigger: "On job assignment",
  message: "Dear {customer_name}, your AC {service_type} has been confirmed for {date} at {time}. Our technician {tech_name} will arrive. CoolTech AC – 98765 43210",
  sent: 248,
  delivered: 246,
  read: 231,
  clicks: 0,
  status: "active"
}, {
  id: "WT-02",
  name: "Service Completion",
  trigger: "On job complete",
  message: "Hello {customer_name}! Your AC service is done. Invoice: ₹{amount}. Pay online: {payment_link}. Thank you for choosing CoolTech! ⭐ Rate us: {review_link}",
  sent: 201,
  delivered: 200,
  read: 188,
  clicks: 142,
  status: "active"
}, {
  id: "WT-03",
  name: "AMC Renewal Reminder",
  trigger: "30 days before expiry",
  message: "Hi {customer_name}, your CoolTech AMC ({contract_id}) expires on {end_date}. Renew now and get 10% off! Reply YES or call 98765 43210.",
  sent: 87,
  delivered: 86,
  read: 74,
  clicks: 52,
  status: "active"
}, {
  id: "WT-04",
  name: "Summer Promotion Blast",
  trigger: "Manual / Campaign",
  message: "🌞 Summer is here! Get 20% OFF AC service this month. Book before {expiry_date}. Limited slots! Reply BOOK or call now. CoolTech AC Services.",
  sent: 1640,
  delivered: 1608,
  read: 1124,
  clicks: 284,
  status: "active"
}, {
  id: "WT-05",
  name: "Payment Due Reminder",
  trigger: "3 days before invoice due",
  message: "Reminder: Invoice #{invoice_id} of ₹{amount} is due on {due_date}. Pay via UPI: cooltech@upi or call us. CoolTech AC Services.",
  sent: 42,
  delivered: 41,
  read: 36,
  clicks: 28,
  status: "active"
}, {
  id: "WT-06",
  name: "Overdue Payment Alert",
  trigger: "On invoice overdue",
  message: "⚠️ Dear {customer_name}, invoice #{invoice_id} (₹{amount}) is overdue. Please clear by {date} to avoid service suspension. CoolTech AC Services.",
  sent: 18,
  delivered: 18,
  read: 14,
  clicks: 6,
  status: "active"
}];
export const GOOGLE_REVIEWS = [{
  id: "GR-01",
  author: "Priya M.",
  rating: 5,
  date: "Mar 2, 2026",
  text: "Excellent service! Ramesh came on time, fixed the gas leak in an hour. Very professional and affordable. Highly recommend CoolTech!",
  replied: true,
  reply: "Thank you Priya! We're glad Ramesh could help quickly. See you for the next service!"
}, {
  id: "GR-02",
  author: "Sunset Hotel GM",
  rating: 4,
  date: "Feb 28, 2026",
  text: "Good service team. They handle all 6 of our ACs under AMC. Reliable and responsive. Minor delay on one visit but otherwise excellent.",
  replied: true,
  reply: "Thank you for the kind words! We noted the delay and have improved scheduling. Your business means a lot to us."
}, {
  id: "GR-03",
  author: "Rajiv Sharma",
  rating: 5,
  date: "Feb 22, 2026",
  text: "Got 2 ACs installed. Very neat work, clean wiring and pipework. Price was fair. Will definitely use again for servicing.",
  replied: false,
  reply: ""
}, {
  id: "GR-04",
  author: "Anonymous",
  rating: 2,
  date: "Feb 18, 2026",
  text: "Technician arrived late and didn't explain what was done. The repair didn't last long either. Expected better from a known company.",
  replied: true,
  reply: "We sincerely apologise for this experience. We've addressed this with our team. Please contact us directly and we'll make it right."
}, {
  id: "GR-05",
  author: "Dr. Suresh Nair",
  rating: 5,
  date: "Feb 15, 2026",
  text: "Been with CoolTech for 3 years. Best AC service in the city. Arjun is always thorough and my clinic is always comfortable.",
  replied: true,
  reply: "Dr. Nair, thank you for your loyalty! It's always a pleasure serving your clinic. We'll keep up the good work!"
}, {
  id: "GR-06",
  author: "Meena Gupta",
  rating: 4,
  date: "Feb 10, 2026",
  text: "Quick response to emergency call. AC was not working at night and they sent a technician next morning. Good service.",
  replied: false,
  reply: ""
}];
export const CONTENT_LIBRARY = [{
  id: "CL-01",
  name: "Summer Offer Banner",
  type: "Image",
  format: "JPG",
  size: "2.1 MB",
  tags: ["Summer", "Offer", "Promotion"],
  channels: ["fb", "ig"],
  used: 4,
  created: "Feb 20, 2026",
  preview: "🌞"
}, {
  id: "CL-02",
  name: "AC Filter Cleaning Infographic",
  type: "Infographic",
  format: "PNG",
  size: "3.4 MB",
  tags: ["Tips", "Educational", "Filter"],
  channels: ["fb", "ig"],
  used: 2,
  created: "Feb 18, 2026",
  preview: "🔧"
}, {
  id: "CL-03",
  name: "AMC Package Flyer",
  type: "Image",
  format: "PDF",
  size: "1.2 MB",
  tags: ["AMC", "Offer", "Flyer"],
  channels: ["wa", "fb"],
  used: 6,
  created: "Feb 10, 2026",
  preview: "📋"
}, {
  id: "CL-04",
  name: "Installation Process Video",
  type: "Video",
  format: "MP4",
  size: "48 MB",
  tags: ["Installation", "Process", "Video"],
  channels: ["yt", "ig"],
  used: 1,
  created: "Feb 5, 2026",
  preview: "🎬"
}, {
  id: "CL-05",
  name: "Customer Testimonial - City Mall",
  type: "Image",
  format: "JPG",
  size: "1.8 MB",
  tags: ["Testimonial", "Commercial", "Customer"],
  channels: ["fb", "ig"],
  used: 1,
  created: "Jan 28, 2026",
  preview: "⭐"
}, {
  id: "CL-06",
  name: "Holi Offer Creative",
  type: "Image",
  format: "PNG",
  size: "2.6 MB",
  tags: ["Festival", "Offer", "Seasonal"],
  channels: ["ig", "wa"],
  used: 0,
  created: "Mar 1, 2026",
  preview: "🪔"
}, {
  id: "CL-07",
  name: "VRF Explainer Carousel",
  type: "Carousel",
  format: "PNG",
  size: "5.1 MB",
  tags: ["VRF", "Educational", "Commercial"],
  channels: ["ig", "fb"],
  used: 0,
  created: "Mar 2, 2026",
  preview: "❄️"
}, {
  id: "CL-08",
  name: "CoolTech Logo Pack",
  type: "Brand Asset",
  format: "ZIP",
  size: "4.2 MB",
  tags: ["Logo", "Brand", "Identity"],
  channels: ["all"],
  used: 18,
  created: "Jan 1, 2026",
  preview: "🏷"
}];
export const SM_WEEKLY = [{
  day: "Mon",
  posts: 2,
  reach: 4200,
  leads: 3
}, {
  day: "Tue",
  posts: 1,
  reach: 2100,
  leads: 1
}, {
  day: "Wed",
  posts: 3,
  reach: 6800,
  leads: 5
}, {
  day: "Thu",
  posts: 1,
  reach: 1900,
  leads: 2
}, {
  day: "Fri",
  posts: 2,
  reach: 5100,
  leads: 4
}, {
  day: "Sat",
  posts: 3,
  reach: 7400,
  leads: 6
}, {
  day: "Sun",
  posts: 1,
  reach: 3200,
  leads: 2
}];
export const LEAD_STAGES = {
  new: {
    label: "New Lead",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  follow_up: {
    label: "Follow Up",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  proposal_sent: {
    label: "Proposal Sent",
    bg: "var(--purple-bg)",
    color: "var(--purple-text)",
    dot: "var(--purple)"
  },
  negotiation: {
    label: "Negotiation",
    bg: "var(--brand-light)",
    color: "var(--brand-dark)",
    dot: "var(--brand)"
  },
  won: {
    label: "Won",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  lost: {
    label: "Lost",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  }
};
export const PO_STATUS = {
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
export const PAYMENT_DATA = [{
  id: "PAY-101",
  invoice: "INV-2042",
  customer: "City Mall",
  amount: 25960,
  method: "Bank Transfer",
  date: "Mar 3, 2026",
  ref: "NEFT8821",
  status: "received"
}, {
  id: "PAY-100",
  invoice: "INV-2040",
  customer: "Patel Villa",
  amount: 1062,
  method: "UPI",
  date: "Mar 1, 2026",
  ref: "UPI4421",
  status: "received"
}, {
  id: "PAY-099",
  invoice: "INV-2038",
  customer: "Dr. Nair Clinic",
  amount: 1770,
  method: "Cash",
  date: "Mar 1, 2026",
  ref: "CASH",
  status: "received"
}, {
  id: "PAY-098",
  invoice: "INV-2041",
  customer: "Meera Iyer",
  amount: 5310,
  method: "Cheque",
  date: "—",
  ref: "—",
  status: "pending"
}, {
  id: "PAY-097",
  invoice: "INV-2039",
  customer: "City Mall",
  amount: 17700,
  method: "—",
  date: "—",
  ref: "—",
  status: "overdue"
}];
export const PRICE_ITEMS = [{
  id: "PRC-01",
  category: "Service",
  name: "Split AC Service (1T)",
  price: 499,
  gst: 18,
  total: 589,
  unit: "per visit",
  active: true
}, {
  id: "PRC-02",
  category: "Service",
  name: "Split AC Service (1.5T)",
  price: 599,
  gst: 18,
  total: 707,
  unit: "per visit",
  active: true
}, {
  id: "PRC-03",
  category: "Service",
  name: "Split AC Service (2T)",
  price: 699,
  gst: 18,
  total: 825,
  unit: "per visit",
  active: true
}, {
  id: "PRC-04",
  category: "Gas Refill",
  name: "R-32 Gas Refill",
  price: 2800,
  gst: 18,
  total: 3304,
  unit: "per cylinder",
  active: true
}, {
  id: "PRC-05",
  category: "Gas Refill",
  name: "R-410A Gas Refill",
  price: 3200,
  gst: 18,
  total: 3776,
  unit: "per cylinder",
  active: true
}, {
  id: "PRC-06",
  category: "Installation",
  name: "Split AC Installation (1T–2T)",
  price: 3500,
  gst: 18,
  total: 4130,
  unit: "per unit",
  active: true
}, {
  id: "PRC-07",
  category: "Installation",
  name: "Cassette AC Installation",
  price: 5000,
  gst: 18,
  total: 5900,
  unit: "per unit",
  active: true
}, {
  id: "PRC-08",
  category: "Repair",
  name: "Compressor Replacement (1T)",
  price: 8500,
  gst: 18,
  total: 10030,
  unit: "per job",
  active: true
}, {
  id: "PRC-09",
  category: "Repair",
  name: "PCB Repair",
  price: 1800,
  gst: 18,
  total: 2124,
  unit: "per job",
  active: true
}, {
  id: "PRC-10",
  category: "AMC",
  name: "Basic AMC – 1 Unit/Year",
  price: 4800,
  gst: 18,
  total: 5664,
  unit: "per year",
  active: true
}, {
  id: "PRC-11",
  category: "AMC",
  name: "Comprehensive AMC – 1 Unit/Year",
  price: 7200,
  gst: 18,
  total: 8496,
  unit: "per year",
  active: true
}, {
  id: "PRC-12",
  category: "AMC",
  name: "Premium AMC – 1 Unit/Year",
  price: 12000,
  gst: 18,
  total: 14160,
  unit: "per year",
  active: false
}];
export const REMINDERS_DATA = [{
  id: "REM-041",
  customer: "Sharma Residency",
  phone: "9876543210",
  type: "AMC Service Due",
  dueDate: "Apr 5, 2026",
  lastService: "Jan 5, 2026",
  ac: "Samsung 1.5T",
  status: "upcoming",
  sent: false
}, {
  id: "REM-040",
  customer: "TechPark Ltd.",
  phone: "9900112233",
  type: "AMC Service Due",
  dueDate: "May 1, 2026",
  lastService: "Feb 1, 2026",
  ac: "Mitsubishi VRF",
  status: "upcoming",
  sent: true
}, {
  id: "REM-039",
  customer: "Sunrise Hotel",
  phone: "9812345678",
  type: "Gas Refill Check",
  dueDate: "Mar 15, 2026",
  lastService: "Sep 15, 2025",
  ac: "Carrier VRF",
  status: "due_soon",
  sent: false
}, {
  id: "REM-038",
  customer: "Meera Iyer",
  phone: "9988776655",
  type: "Annual Service",
  dueDate: "Mar 5, 2026",
  lastService: "Mar 2, 2025",
  ac: "Daikin 2T",
  status: "overdue",
  sent: false
}, {
  id: "REM-037",
  customer: "Galaxy Towers",
  phone: "9900881122",
  type: "AMC Renewal",
  dueDate: "Oct 31, 2026",
  lastService: "Nov 1, 2025",
  ac: "8 units",
  status: "upcoming",
  sent: true
}, {
  id: "REM-036",
  customer: "City Mall",
  phone: "9821234567",
  type: "Filter Cleaning",
  dueDate: "Apr 1, 2026",
  lastService: "Jan 1, 2026",
  ac: "LG Cassette 2T",
  status: "due_soon",
  sent: false
}];
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
export const LEAVE_DATA = [{
  id: "LV-021",
  tech: "Ramesh Kumar",
  techId: "T01",
  type: "Casual Leave",
  from: "Mar 10, 2026",
  to: "Mar 10, 2026",
  days: 1,
  reason: "Family function",
  status: "approved",
  approvedBy: "Admin"
}, {
  id: "LV-020",
  tech: "Vijay Singh",
  techId: "T02",
  type: "Sick Leave",
  from: "Mar 8, 2026",
  to: "Mar 9, 2026",
  days: 2,
  reason: "Fever and cold",
  status: "approved",
  approvedBy: "Admin"
}, {
  id: "LV-019",
  tech: "Arjun Das",
  techId: "T03",
  type: "Casual Leave",
  from: "Mar 15, 2026",
  to: "Mar 15, 2026",
  days: 1,
  reason: "Personal work",
  status: "pending",
  approvedBy: "—"
}, {
  id: "LV-018",
  tech: "Suresh Yadav",
  techId: "T04",
  type: "Earned Leave",
  from: "Mar 20, 2026",
  to: "Mar 22, 2026",
  days: 3,
  reason: "Travel",
  status: "pending",
  approvedBy: "—"
}, {
  id: "LV-017",
  tech: "Kishore Naik",
  techId: "T05",
  type: "Sick Leave",
  from: "Feb 5, 2026",
  to: "Feb 6, 2026",
  days: 2,
  reason: "Medical",
  status: "approved",
  approvedBy: "Admin"
}];
export const LEAVE_BALANCE = {
  T01: {
    casual: 8,
    sick: 6,
    earned: 12
  },
  T02: {
    casual: 9,
    sick: 5,
    earned: 12
  },
  T03: {
    casual: 9,
    sick: 6,
    earned: 11
  },
  T04: {
    casual: 10,
    sick: 7,
    earned: 12
  },
  T05: {
    casual: 10,
    sick: 4,
    earned: 12
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
export const PERF_DATA = [{
  techId: "T01",
  name: "Ramesh Kumar",
  jobsDone: 31,
  target: 28,
  rating: 4.8,
  complaints: 0,
  onTime: 96,
  revenue: 84000,
  incentive: 4800,
  rank: 1,
  trend: [28, 30, 33, 29, 31]
}, {
  techId: "T02",
  name: "Vijay Singh",
  jobsDone: 24,
  target: 25,
  rating: 4.6,
  complaints: 1,
  onTime: 89,
  revenue: 62000,
  incentive: 3600,
  rank: 2,
  trend: [28, 30, 33, 29, 31]
}, {
  techId: "T03",
  name: "Arjun Das",
  jobsDone: 18,
  target: 20,
  rating: 4.5,
  complaints: 0,
  onTime: 94,
  revenue: 48000,
  incentive: 2000,
  rank: 3,
  trend: [28, 30, 33, 29, 31]
}, {
  techId: "T04",
  name: "Suresh Yadav",
  jobsDone: 12,
  target: 15,
  rating: 4.2,
  complaints: 0,
  onTime: 85,
  revenue: 28000,
  incentive: 1200,
  rank: 5,
  trend: [28, 30, 33, 29, 31]
}, {
  techId: "T05",
  name: "Kishore Naik",
  jobsDone: 22,
  target: 20,
  rating: 4.4,
  complaints: 0,
  onTime: 91,
  revenue: 54000,
  incentive: 3000,
  rank: 4,
  trend: [28, 30, 33, 29, 31]
}];
export const GASLOG_DATA = [{
  id: "GAS-088",
  job: "JOB-1042",
  tech: "Ramesh K.",
  customer: "Sharma Residency",
  date: "Mar 3, 2026",
  gasType: "R-32",
  cylinders: 1,
  kgUsed: 0.8,
  reason: "Gas leak – refill",
  certification: "F-Gas Cert #RK-2022",
  compliant: true
}, {
  id: "GAS-087",
  job: "JOB-1040",
  tech: "Arjun D.",
  customer: "Meera Iyer",
  date: "Mar 2, 2026",
  gasType: "R-32",
  cylinders: 1,
  kgUsed: 1.0,
  reason: "New installation",
  certification: "F-Gas Cert #AD-2023",
  compliant: true
}, {
  id: "GAS-086",
  job: "JOB-1038",
  tech: "Ramesh K.",
  customer: "Patel Villa",
  date: "Mar 1, 2026",
  gasType: "R-410A",
  cylinders: 1,
  kgUsed: 0.6,
  reason: "Annual refill",
  certification: "F-Gas Cert #RK-2022",
  compliant: true
}, {
  id: "GAS-085",
  job: "JOB-1037",
  tech: "Vijay S.",
  customer: "City Mall",
  date: "Feb 29, 2026",
  gasType: "R-32",
  cylinders: 2,
  kgUsed: 1.8,
  reason: "Compressor replacement",
  certification: "F-Gas Cert #VS-2021",
  compliant: true
}, {
  id: "GAS-084",
  job: "JOB-1035",
  tech: "Vijay S.",
  customer: "Sunrise Hotel",
  date: "Feb 25, 2026",
  gasType: "R-410A",
  cylinders: 1,
  kgUsed: 0.9,
  reason: "Routine refill",
  certification: "F-Gas Cert #VS-2021",
  compliant: true
}];
export const TASKS_DATA = [{
  id: "TSK-041",
  title: "Follow up with Galaxy Towers for AMC renewal",
  assignedTo: "Rajesh P.",
  due: "Mar 5, 2026",
  priority: "high",
  status: "todo",
  category: "Sales"
}, {
  id: "TSK-040",
  title: "Process February salary for all technicians",
  assignedTo: "Admin",
  due: "Mar 5, 2026",
  priority: "urgent",
  status: "in_progress",
  category: "HR"
}, {
  id: "TSK-039",
  title: "Order R-32 refrigerant stock",
  assignedTo: "Admin",
  due: "Mar 4, 2026",
  priority: "high",
  status: "done",
  category: "Operations"
}, {
  id: "TSK-038",
  title: "Resolve TechPark complaint CMP-041",
  assignedTo: "Ramesh K.",
  due: "Mar 4, 2026",
  priority: "urgent",
  status: "in_progress",
  category: "Service"
}, {
  id: "TSK-037",
  title: "Update price list for April 2026",
  assignedTo: "Admin",
  due: "Mar 10, 2026",
  priority: "normal",
  status: "todo",
  category: "Admin"
}, {
  id: "TSK-036",
  title: "Send AMC renewal reminder to City Mall",
  assignedTo: "Rekha S.",
  due: "Mar 8, 2026",
  priority: "normal",
  status: "todo",
  category: "Sales"
}, {
  id: "TSK-035",
  title: "Submit GST return for February",
  assignedTo: "Admin",
  due: "Mar 20, 2026",
  priority: "high",
  status: "todo",
  category: "Finance"
}, {
  id: "TSK-034",
  title: "Collect overdue invoice INV-2039",
  assignedTo: "Rekha S.",
  due: "Mar 3, 2026",
  priority: "urgent",
  status: "done",
  category: "Finance"
}];
export const TASK_STATUS_MAP = {
  todo: {
    label: "To Do",
    bg: "var(--bg)",
    color: "var(--text-body)"
  },
  in_progress: {
    label: "In Progress",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  done: {
    label: "Done",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  }
};
export const KANBAN_COLS = [{
  id: "new",
  label: "New",
  color: "#3B82F6",
  bg: "#EFF6FF",
  count: JOBS.filter(j => j.status === "new").length
}, {
  id: "assigned",
  label: "Assigned",
  color: "#10B981",
  bg: "#ECFDF5",
  count: JOBS.filter(j => j.status === "assigned").length
}, {
  id: "in_progress",
  label: "In Progress",
  color: "#F59E0B",
  bg: "#FFFBEB",
  count: JOBS.filter(j => j.status === "in_progress").length
}, {
  id: "completed",
  label: "Completed",
  color: "#22C55E",
  bg: "#F0FDF4",
  count: JOBS.filter(j => j.status === "completed").length
}, {
  id: "invoiced",
  label: "Invoiced",
  color: "#8B5CF6",
  bg: "#F5F3FF",
  count: JOBS.filter(j => j.status === "invoiced").length
}];
export const PRIORITY_COLOR = {
  urgent: "var(--danger)",
  high: "var(--brand)",
  normal: "var(--text-muted)",
  low: "var(--text-faint)"
};
export const CHAT_CHANNELS = [{
  id: "general",
  label: "General",
  icon: "💬",
  unread: 0
}, {
  id: "techs",
  label: "Technicians",
  icon: "🔧",
  unread: 3
}, {
  id: "sales",
  label: "Sales & CRM",
  icon: "🎯",
  unread: 1
}, {
  id: "alerts",
  label: "Urgent Alerts",
  icon: "🚨",
  unread: 2
}, {
  id: "accounts",
  label: "Accounts",
  icon: "💰",
  unread: 0
}];
export const CHAT_MESSAGES = {
  general: [{
    id: 1,
    from: "Admin",
    time: "9:02 AM",
    msg: "Good morning team! Today we have 4 jobs. Please check the schedule.",
    self: true
  }, {
    id: 2,
    from: "Ramesh Kumar",
    time: "9:05 AM",
    msg: "Good morning! On my way to Sharma Residency now.",
    self: false
  }, {
    id: 3,
    from: "Vijay Singh",
    time: "9:08 AM",
    msg: "Confirmed. Heading to Sunrise Hotel for AMC.",
    self: false
  }, {
    id: 4,
    from: "Admin",
    time: "9:15 AM",
    msg: "Ramesh – please carry extra R-32 cylinders. Gas leak suspected at Sharma.",
    self: true
  }, {
    id: 5,
    from: "Ramesh Kumar",
    time: "9:17 AM",
    msg: "Got it. Picked up 2 cylinders from the store.",
    self: false
  }, {
    id: 6,
    from: "Arjun Das",
    time: "10:30 AM",
    msg: "Installation at Meera Iyer's place done. All good. She's very happy!",
    self: false
  }, {
    id: 7,
    from: "Admin",
    time: "10:32 AM",
    msg: "Great work Arjun 👍 Please upload site photos.",
    self: true
  }],
  techs: [{
    id: 1,
    from: "Admin",
    time: "8:00 AM",
    msg: "Technicians – tomorrow is inventory check. Please return all unused parts.",
    self: true
  }, {
    id: 2,
    from: "Kishore Naik",
    time: "8:45 AM",
    msg: "Sure sir. I have 1 R-32 cylinder unused from last week.",
    self: false
  }, {
    id: 3,
    from: "Suresh Yadav",
    time: "9:00 AM",
    msg: "I need a new vacuum pump. Old one is making noise.",
    self: false
  }, {
    id: 4,
    from: "Admin",
    time: "9:02 AM",
    msg: "Noted Suresh. Will raise a PO today.",
    self: true
  }],
  sales: [{
    id: 1,
    from: "Rajesh P.",
    time: "11:00 AM",
    msg: "Horizon Apartments meeting confirmed for tomorrow 3PM. ₹64K potential deal!",
    self: false
  }, {
    id: 2,
    from: "Admin",
    time: "11:03 AM",
    msg: "Excellent! Prepare the AMC brochure and pricing sheet.",
    self: true
  }],
  alerts: [{
    id: 1,
    from: "System",
    time: "9:00 AM",
    msg: "🚨 URGENT: TechPark Ltd. JOB-1039 – Server room AC down. High priority!",
    self: false
  }, {
    id: 2,
    from: "Admin",
    time: "9:01 AM",
    msg: "Assigning Ramesh after Sharma job. ETA 2PM.",
    self: true
  }, {
    id: 3,
    from: "System",
    time: "Mar 2, 9:00 AM",
    msg: "⚠️ INV-2039 overdue. City Mall ₹17,700 pending since Feb 28.",
    self: false
  }],
  accounts: [{
    id: 1,
    from: "Admin",
    time: "Mar 1",
    msg: "Salary processed for Ramesh and Vijay for Feb.",
    self: true
  }, {
    id: 2,
    from: "Admin",
    time: "Mar 2",
    msg: "GST filing due on Mar 20. Please compile all invoices.",
    self: true
  }]
};
export const TIME_LOGS = [{
  id: "TL-001",
  tech: "Ramesh Kumar",
  job: "JOB-1042",
  customer: "Sharma Residency",
  type: "Service",
  date: "Mar 3, 2026",
  start: "10:00",
  end: "12:30",
  hrs: 2.5,
  notes: "Gas leak fix + refill",
  billable: true
}, {
  id: "TL-002",
  tech: "Vijay Singh",
  job: "JOB-1041",
  customer: "Sunrise Hotel",
  type: "AMC Visit",
  date: "Mar 3, 2026",
  start: "11:30",
  end: "14:00",
  hrs: 2.5,
  notes: "Quarterly AMC – 6 units serviced",
  billable: true
}, {
  id: "TL-003",
  tech: "Arjun Das",
  job: "JOB-1040",
  customer: "Meera Iyer",
  type: "Installation",
  date: "Mar 2, 2026",
  start: "09:00",
  end: "13:30",
  hrs: 4.5,
  notes: "Full installation + testing",
  billable: true
}, {
  id: "TL-004",
  tech: "Ramesh Kumar",
  job: "JOB-1038",
  customer: "Patel Villa",
  type: "Service",
  date: "Mar 1, 2026",
  start: "14:00",
  end: "15:45",
  hrs: 1.75,
  notes: "Annual cleaning + gas check",
  billable: true
}, {
  id: "TL-005",
  tech: "Vijay Singh",
  job: "JOB-1037",
  customer: "City Mall",
  type: "Repair",
  date: "Feb 29, 2026",
  start: "10:00",
  end: "16:00",
  hrs: 6.0,
  notes: "Compressor replacement – LG C2",
  billable: true
}, {
  id: "TL-006",
  tech: "Suresh Yadav",
  job: "—",
  customer: "—",
  type: "Training",
  date: "Mar 2, 2026",
  start: "09:00",
  end: "13:00",
  hrs: 4.0,
  notes: "VRF system training",
  billable: false
}, {
  id: "TL-007",
  tech: "Kishore Naik",
  job: "—",
  customer: "—",
  type: "Admin",
  date: "Mar 1, 2026",
  start: "08:30",
  end: "09:30",
  hrs: 1.0,
  notes: "Inventory count & stock update",
  billable: false
}, {
  id: "TL-008",
  tech: "Arjun Das",
  job: "JOB-1039",
  customer: "TechPark Ltd.",
  type: "Repair",
  date: "Mar 3, 2026",
  start: "14:30",
  end: "17:00",
  hrs: 2.5,
  notes: "VRF diagnosis – pending parts",
  billable: true
}];
export const PROJECTS = [{
  id: "PRJ-001",
  name: "Galaxy Towers – 8 Unit Installation",
  customer: "Galaxy Towers",
  contact: "Mr. Pankaj",
  value: 170982,
  budget: 185000,
  spent: 42000,
  status: "active",
  phase: "procurement",
  start: "Mar 1, 2026",
  end: "Mar 25, 2026",
  lead: "Ramesh Kumar",
  milestones: [{
    label: "Site Survey",
    done: true,
    date: "Mar 1"
  }, {
    label: "Quotation Approved",
    done: true,
    date: "Mar 2"
  }, {
    label: "Equipment Procurement",
    done: true,
    date: "Mar 5"
  }, {
    label: "Electrical Work",
    done: false,
    date: "Mar 10"
  }, {
    label: "Unit Installation",
    done: false,
    date: "Mar 18"
  }, {
    label: "Testing & Commissioning",
    done: false,
    date: "Mar 22"
  }, {
    label: "Handover & AMC Sign",
    done: false,
    date: "Mar 25"
  }],
  tags: ["Installation", "AMC", "VRF"],
  notes: "8-unit VRF system. Working with building electrical contractor for cabling."
}, {
  id: "PRJ-002",
  name: "TechPark Ltd. – Server Room Overhaul",
  customer: "TechPark Ltd.",
  contact: "Mr. Anand",
  value: 56640,
  budget: 60000,
  spent: 8500,
  status: "active",
  phase: "diagnosis",
  start: "Mar 3, 2026",
  end: "Mar 12, 2026",
  lead: "Ramesh Kumar",
  milestones: [{
    label: "Emergency Diagnosis",
    done: false,
    date: "Mar 3"
  }, {
    label: "Parts Order",
    done: false,
    date: "Mar 4"
  }, {
    label: "Repair & Testing",
    done: false,
    date: "Mar 9"
  }, {
    label: "AMC Contract Execution",
    done: false,
    date: "Mar 12"
  }],
  tags: ["Repair", "VRF", "Urgent"],
  notes: "Server room criticality – must maintain at least 1 working unit at all times."
}, {
  id: "PRJ-003",
  name: "City Mall – Compressor Upgrade Q1",
  customer: "City Mall",
  contact: "Mr. Ops",
  value: 180000,
  budget: 200000,
  spent: 162000,
  status: "completed",
  phase: "handover",
  start: "Jan 15, 2026",
  end: "Feb 29, 2026",
  lead: "Vijay Singh",
  milestones: [{
    label: "Survey & Planning",
    done: true,
    date: "Jan 15"
  }, {
    label: "New Compressors Delivered",
    done: true,
    date: "Jan 20"
  }, {
    label: "Phase 1 – Wing A",
    done: true,
    date: "Feb 5"
  }, {
    label: "Phase 2 – Wing B",
    done: true,
    date: "Feb 20"
  }, {
    label: "Final Testing",
    done: true,
    date: "Feb 27"
  }, {
    label: "Invoice & Handover",
    done: true,
    date: "Feb 29"
  }],
  tags: ["Replacement", "Cassette", "AMC"],
  notes: "Full compressor upgrade across 12 cassette units. Project completed on budget."
}];
export const PHASE_MAP = {
  procurement: {
    label: "Procurement",
    color: "var(--info)"
  },
  diagnosis: {
    label: "Diagnosis",
    color: "var(--warning)"
  },
  installation: {
    label: "Installation",
    color: "var(--purple)"
  },
  testing: {
    label: "Testing",
    color: "var(--success)"
  },
  handover: {
    label: "Handover",
    color: "var(--success)"
  },
  planning: {
    label: "Planning",
    color: "var(--text-muted)"
  }
};
export const PROJ_STATUS_MAP = {
  active: {
    label: "Active",
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  completed: {
    label: "Completed",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  paused: {
    label: "On Hold",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  }
};
export const TEMP_CFG = {
  hot: {
    icon: "🔥",
    color: "var(--danger)",
    bg: "var(--danger-bg)",
    label: "Hot"
  },
  warm: {
    icon: "🌤",
    color: "var(--warning)",
    bg: "var(--warning-bg)",
    label: "Warm"
  },
  cold: {
    icon: "❄",
    color: "var(--info)",
    bg: "var(--info-bg)",
    label: "Cold"
  }
};
export const ACT_ICONS = {
  call: "📞",
  email: "📧",
  whatsapp: "💬",
  visit: "🚗",
  note: "📝"
};
export const CON_STATUS = {
  draft: {
    label: "Draft",
    bg: "var(--bg)",
    color: "var(--text-body)"
  },
  pending_signature: {
    label: "Pending Signature",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  active: {
    label: "Active",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  expired: {
    label: "Expired",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
export const STAGE_STEPS = ["applied", "shortlisted", "interview", "offer", "hired", "rejected"];
export const STAGE_CFG = {
  applied: {
    label: "Applied",
    color: "var(--info)",
    bg: "var(--info-bg)"
  },
  shortlisted: {
    label: "Shortlisted",
    color: "var(--purple)",
    bg: "var(--purple-bg)"
  },
  interview: {
    label: "Interview",
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  offer: {
    label: "Offer Sent",
    color: BRAND,
    bg: BRAND_LIGHT
  },
  hired: {
    label: "Hired ✓",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  rejected: {
    label: "Rejected",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
export const DISPATCH_DATA = [{
  techId: "T01",
  name: "Ramesh Kumar",
  phone: "9871234567",
  status: "busy",
  area: "Bengaluru North",
  lat: 12.97,
  lng: 77.59,
  currentJob: {
    id: "JOB-1042",
    customer: "Sharma Residency",
    type: "Service",
    address: "42 MG Road, Bengaluru",
    startTime: "10:00 AM",
    eta: "12:30 PM",
    priority: "high"
  },
  nextJob: {
    id: "JOB-1039",
    customer: "TechPark Ltd.",
    type: "Repair",
    address: "IT Park, Hyderabad",
    priority: "urgent"
  },
  vehicle: "Mahindra Bolero – KA01AB1234",
  battery: 78,
  lastUpdate: "9:48 AM"
}, {
  techId: "T02",
  name: "Vijay Singh",
  phone: "9862345678",
  status: "busy",
  area: "Pune & PCMC",
  lat: 18.52,
  lng: 73.85,
  currentJob: {
    id: "JOB-1041",
    customer: "Sunrise Hotel",
    type: "AMC Visit",
    address: "Hotel Circle, Pune",
    startTime: "11:30 AM",
    eta: "02:00 PM",
    priority: "normal"
  },
  nextJob: null,
  vehicle: "Honda Activa – KA01EF9012",
  battery: 55,
  lastUpdate: "9:52 AM"
}, {
  techId: "T03",
  name: "Arjun Das",
  phone: "9853456789",
  status: "available",
  area: "Chennai",
  lat: 13.08,
  lng: 80.27,
  currentJob: null,
  nextJob: {
    id: "JOB-1039",
    customer: "TechPark Ltd.",
    type: "Repair",
    address: "IT Park, Hyderabad",
    priority: "urgent"
  },
  vehicle: "Honda Activa – KA01GH3456",
  battery: 92,
  lastUpdate: "9:55 AM"
}, {
  techId: "T04",
  name: "Suresh Yadav",
  phone: "9844567890",
  status: "available",
  area: "Hyderabad",
  lat: 17.38,
  lng: 78.48,
  currentJob: null,
  nextJob: null,
  vehicle: "—",
  battery: 64,
  lastUpdate: "9:40 AM"
}, {
  techId: "T05",
  name: "Kishore Naik",
  phone: "9835678901",
  status: "off",
  area: "Ahmedabad",
  lat: 23.02,
  lng: 72.57,
  currentJob: null,
  nextJob: null,
  vehicle: "—",
  battery: 100,
  lastUpdate: "8:00 AM"
}];
export const NOTIF_DATA = [{
  id: 1,
  type: "urgent",
  icon: "🚨",
  title: "TechPark Ltd. – Server room VRF down",
  body: "JOB-1039 created as urgent. No technician assigned yet. Immediate action needed.",
  time: "9:00 AM",
  read: false,
  action: "assign",
  module: "jobs"
}, {
  id: 2,
  type: "ticket",
  icon: "🎫",
  title: "New support ticket from Meera Iyer",
  body: "AC rattling noise reported after installation. TKT-039 created and assigned to Arjun Das.",
  time: "9:05 AM",
  read: false,
  action: "view",
  module: "tickets"
}, {
  id: 3,
  type: "payment",
  icon: "💰",
  title: "Invoice overdue – City Mall (₹17,700)",
  body: "INV-2039 is now 3 days overdue. Follow up required immediately.",
  time: "9:00 AM",
  read: false,
  action: "view",
  module: "invoices"
}, {
  id: 4,
  type: "lead",
  icon: "🎯",
  title: "New lead from Instagram – Cafe Mocha",
  body: "LD-085 created. 2 commercial units, installation + AMC. Value: ₹12,000. Unassigned.",
  time: "8:30 AM",
  read: true,
  action: "view",
  module: "leads"
}, {
  id: 5,
  type: "contract",
  icon: "✍",
  title: "Galaxy Towers awaiting e-signature",
  body: "CON-007 sent but Mr. Pankaj has not signed yet. Follow up to close ₹1.71L contract.",
  time: "8:15 AM",
  read: true,
  action: "view",
  module: "contracts"
}, {
  id: 6,
  type: "amc",
  icon: "📋",
  title: "AMC-186 expiring in 45 days",
  body: "Galaxy Towers Basic AMC expires Oct 2026. Start renewal conversation now.",
  time: "8:00 AM",
  read: true,
  action: "renew",
  module: "amc"
}, {
  id: 7,
  type: "inventory",
  icon: "📦",
  title: "Low stock: Split AC Filter 1.5T",
  body: "Only 8 units remaining (reorder point: 20). Consider raising a purchase order.",
  time: "Yesterday 6:00 PM",
  read: true,
  action: "order",
  module: "inventory"
}, {
  id: 8,
  type: "feedback",
  icon: "⭐",
  title: "5-star review from Meera Iyer",
  body: "Job JOB-1040 rated 5/5. 'Excellent work, very clean installation.' — Arjun Das.",
  time: "Yesterday 4:00 PM",
  read: true,
  action: "view",
  module: "feedback"
}, {
  id: 9,
  type: "complaint",
  icon: "💬",
  title: "Complaint resolved – CMP-039 (Meera Iyer)",
  body: "Invoice correction done. Refund of ₹500 issued. Customer confirmed satisfaction.",
  time: "Yesterday 2:00 PM",
  read: true,
  action: "view",
  module: "complaints"
}, {
  id: 10,
  type: "salary",
  icon: "💵",
  title: "Salary for Feb processed",
  body: "₹1,78,220 disbursed to 5 technicians. Arjun Das and Suresh Yadav marked pending.",
  time: "Mar 1, 2026",
  read: true,
  action: "view",
  module: "salary"
}];
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
    color: BRAND,
    bg: BRAND_LIGHT
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
export const PORTAL_CLIENTS = [{
  id: "C002",
  name: "Sunrise Hotel",
  contact: "Hotel Admin",
  email: "admin@sunrise.com",
  avatar: "SH",
  color: "#3B82F6"
}, {
  id: "C004",
  name: "TechPark Ltd.",
  contact: "Mr. Anand",
  email: "anand@techpark.com",
  avatar: "TP",
  color: "#8B5CF6"
}, {
  id: "C001",
  name: "Sharma Residency",
  contact: "Mr. Sharma",
  email: "sharma@email.com",
  avatar: "SR",
  color: BRAND
}];
export const POST_STATUS = {
  published: {
    label: "Published",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  scheduled: {
    label: "Scheduled",
    bg: "var(--info-bg)",
    color: "var(--info-text)",
    dot: "var(--info)"
  },
  draft: {
    label: "Draft",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
export const POST_TYPES = {
  Promotion: {
    color: "var(--brand)",
    bg: "var(--brand-light)"
  },
  Educational: {
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  Testimonial: {
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  Offer: {
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  Update: {
    color: "var(--text-muted)",
    bg: "var(--bg)"
  }
};
// ─── Aliases for backward-compat imports ─────────────────────────────────────
export const jobs = JOBS;
export const clockSessions = INIT_CLOCK_SESSIONS;

// ─── Additional lowercase aliases ─────────────────────────────────────────────
export const quotations = QUOTATIONS;
export const invoices = INVOICES;
export const complaints = COMPLAINTS;
export const tickets = TICKETS;
export const leads = LEADS;
export const technicians = TECHNICIANS;
export const customers = CUSTOMERS;
export const contracts = CONTRACTS;
export const amcContracts = AMC_CONTRACTS;
export const chatChannels = CHAT_CHANNELS;
export const chatMessages = CHAT_MESSAGES;
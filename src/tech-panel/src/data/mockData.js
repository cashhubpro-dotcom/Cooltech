export const TECH_USERS = [
  { id: 'T01', email: 'ramesh@cooltech.com', password: 'tech123', name: 'Ramesh Kumar' },
  { id: 'T02', email: 'vijay@cooltech.com',  password: 'tech123', name: 'Vijay Sharma' },
  { id: 'T03', email: 'arjun@cooltech.com',  password: 'tech123', name: 'Arjun Patel'  },
];
export const LOGGED_IN_TECH = {
  id: 'T01', name: 'Ramesh Kumar', role: 'Senior Technician', area: 'Andheri West',
  phone: '9876543210', email: 'ramesh@cooltech.com', avatar: 'RK',
  rating: 4.8, jobsDone: 342, status: 'busy', joinDate: 'Mar 2021', salary: 32000,
  skills: ['Split AC', 'Cassette AC', 'VRF Systems', 'Gas Charging', 'PCB Repair'],
  certifications: ['BEE Star Rating Certified', 'R-32 Handling', 'Electrical Safety'],
};
export const MY_JOBS = [
  { id: 'JOB-1041', customer: 'Priya Mehta', address: 'Andheri West', phone: '9876500001', ac: '1.5T Split', type: 'Repair', priority: 'high', status: 'in_progress', date: 'Mar 3, 2026', time: '10:00 AM', amount: 1800, issue: 'Not cooling', parts: ['R-32 Gas'], notes: 'Customer prefers morning slots.', checklist: [{ item: 'Check gas pressure', done: true }, { item: 'Clean filters', done: true }, { item: 'Test cooling', done: false }] },
  { id: 'JOB-1042', customer: 'Rahul Shah', address: 'Juhu', phone: '9876500002', ac: '2T Cassette', type: 'Service', priority: 'normal', status: 'assigned', date: 'Mar 3, 2026', time: '02:00 PM', amount: 1200, issue: 'Annual service', parts: [], notes: '', checklist: [{ item: 'Clean unit', done: false }, { item: 'Check drain', done: false }] },
  { id: 'JOB-1039', customer: 'Sunita Rao', address: 'Bandra', phone: '9876500003', ac: '1T Split', type: 'AMC Visit', priority: 'normal', status: 'completed', date: 'Mar 2, 2026', time: '11:00 AM', amount: 0, issue: 'Quarterly AMC', parts: [], notes: '', checklist: [{ item: 'Inspect unit', done: true }] },
  { id: 'JOB-1043', customer: 'Deepak Joshi', address: 'Goregaon', phone: '9876500004', ac: '1.5T Split', type: 'Installation', priority: 'urgent', status: 'assigned', date: 'Mar 5, 2026', time: '09:00 AM', amount: 3500, issue: 'New installation', parts: ['Copper pipe', 'Drain pipe'], notes: 'Wall drilling required.', checklist: [{ item: 'Mount bracket', done: false }, { item: 'Connect pipes', done: false }, { item: 'Gas charging', done: false }] },
  { id: 'JOB-1038', customer: 'Kavita Nair', address: 'Malad', phone: '9876500005', ac: '1.5T Split', type: 'Repair', priority: 'high', status: 'invoiced', date: 'Feb 28, 2026', time: '03:00 PM', amount: 2200, issue: 'Compressor noise', parts: ['Capacitor 25µF'], notes: '', checklist: [{ item: 'Replace capacitor', done: true }, { item: 'Test run', done: true }] },
];
export const TODAY_SCHEDULE = [
  { time: '09:00 AM', customer: 'Travel to Andheri', address: '', type: 'Break', status: 'break' },
  { time: '10:00 AM', customer: 'Priya Mehta', address: 'Andheri West', type: 'Repair', status: 'in_progress' },
  { time: '01:00 PM', customer: 'Lunch Break', address: '', type: 'Break', status: 'break' },
  { time: '02:00 PM', customer: 'Rahul Shah', address: 'Juhu', type: 'Service', status: 'assigned' },
];
export const MY_AMC_VISITS = [
  { id: 'AMC-201', customer: 'Sharma Residence', address: 'Versova', phone: '9876500010', units: 3, plan: 'Gold AMC', status: 'active', nextVisit: 'Mar 10, 2026', done: 2, total: 4, notes: 'Gate code: 4521' },
  { id: 'AMC-202', customer: 'Blue Star Office', address: 'Andheri East', phone: '9876500011', units: 8, plan: 'Platinum AMC', status: 'expiring', nextVisit: 'Mar 15, 2026', done: 3, total: 4, notes: '' },
];
export const MY_ATTENDANCE = {
  month: 'March 2026', presentDays: 2, absentDays: 0, halfDays: 0, holidays: 0,
  dates: { 1: 'H', 2: 'P', 3: 'P' },
};
export const CLOCK_RECORDS = [
  { date: 'Mar 2', clockIn: '09:05 AM', clockOut: '06:30 PM', hours: '9h 25m' },
  { date: 'Mar 3', clockIn: '09:12 AM', clockOut: null, hours: null },
];
export const MY_EXPENSES = [
  { id: 'EXP-501', category: 'Fuel', desc: 'Petrol for Andheri trip', date: 'Mar 2, 2026', job: 'JOB-1039', receipt: true, amount: 450, status: 'approved' },
  { id: 'EXP-502', category: 'Parts', desc: 'Capacitor purchased locally', date: 'Mar 3, 2026', job: 'JOB-1041', receipt: true, amount: 320, status: 'pending' },
  { id: 'EXP-503', category: 'Food', desc: 'Lunch during field duty', date: 'Mar 2, 2026', job: '', receipt: false, amount: 180, status: 'pending' },
];
export const MY_PARTS_REQUESTS = [
  { id: 'REQ-301', part: 'R-32 Refrigerant Cylinder', qty: 1, unit: 'Cylinder', job: 'JOB-1041', date: 'Mar 3, 2026', urgent: true, status: 'approved' },
  { id: 'REQ-302', part: 'Split AC Filter 1.5T', qty: 2, unit: 'Piece', job: '', date: 'Mar 2, 2026', urgent: false, status: 'pending' },
];
export const MY_LEAVES = [
  { id: 'LV-101', type: 'Casual Leave', from: 'Feb 14, 2026', to: 'Feb 14, 2026', days: 1, reason: 'Personal work', status: 'approved', appliedOn: 'Feb 10, 2026', rejectReason: null },
  { id: 'LV-102', type: 'Sick Leave', from: 'Jan 20, 2026', to: 'Jan 21, 2026', days: 2, reason: 'Fever', status: 'approved', appliedOn: 'Jan 20, 2026', rejectReason: null },
  { id: 'LV-103', type: 'Earned Leave', from: 'Mar 20, 2026', to: 'Mar 22, 2026', days: 3, reason: 'Family function', status: 'pending', appliedOn: 'Mar 1, 2026', rejectReason: null },
];
export const LEAVE_BALANCE = {
  casual: { total: 12, used: 1, balance: 11 },
  sick:   { total: 12, used: 2, balance: 10 },
  earned: { total: 15, used: 0, balance: 15 },
};
export const MY_SALARY = [
  { month: 'Feb 2026', basic: 32000, hra: 8000, travel: 2000, incentive: 3500, gross: 45500, pf: 1920, advance: 0, deduction: 1920, net: 43580, jobsDone: 38, rating: 4.8, status: 'paid' },
  { month: 'Jan 2026', basic: 32000, hra: 8000, travel: 2000, incentive: 2800, gross: 44800, pf: 1920, advance: 0, deduction: 1920, net: 42880, jobsDone: 35, rating: 4.7, status: 'paid' },
  { month: 'Dec 2025', basic: 32000, hra: 8000, travel: 2000, incentive: 4000, gross: 46000, pf: 1920, advance: 0, deduction: 1920, net: 44080, jobsDone: 41, rating: 4.9, status: 'paid' },
  { month: 'Mar 2026', basic: 32000, hra: 8000, travel: 2000, incentive: 0,    gross: null,  pf: 0,    advance: 0, deduction: 0,    net: null,  jobsDone: null, rating: null, status: 'pending' },
];
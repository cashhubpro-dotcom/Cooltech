import mongoose from 'mongoose';

// ─── Standard checklist used for every AMC visit. Centralised here so the
// technician controller and (eventually) an admin settings screen share one
// source of truth instead of each hardcoding their own copy. ──────────────────
export const AMC_CHECKLIST_TEMPLATE = [
  'Inspect all AC units',
  'Check refrigerant pressure',
  'Clean evaporator & condenser coils',
  'Check electrical connections',
  'Test cooling performance (temp delta)',
  'Clean / replace filters',
  'Record any abnormalities',
  'Get customer signature',
];

const checklistItemSchema = new mongoose.Schema({
  label:   { type: String, required: true },
  checked: { type: Boolean, default: false },
}, { _id: false });

// One entry per scheduled visit (1..visits). Kept as an embedded array rather
// than a separate collection — the count is small and bounded (2-4/year), and
// it lets a technician's checklist/report live right next to the contract it
// belongs to, same pattern as `acDetails` below.
const visitLogSchema = new mongoose.Schema({
  visitNumber:   { type: Number, required: true },
  status:        { type: String, enum: ['pending', 'completed'], default: 'pending' },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  checklist:     {
    type: [checklistItemSchema],
    default: () => AMC_CHECKLIST_TEMPLATE.map((label) => ({ label, checked: false })),
  },
  reportText:  { type: String, default: '' },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: true });

const amcSchema = new mongoose.Schema({
  amcId:        { type: String, unique: true },
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String },
  units:        { type: Number, default: 1 },
  plan:         { type: String, enum: ['Basic', 'Comprehensive', 'Premium'], default: 'Basic' },
  start:        { type: Date, required: true },
  end:          { type: Date, required: true },
  value:        { type: Number, default: 0 },
  visits:       { type: Number, default: 2 },
  done:         { type: Number, default: 0 },
  nextVisit:    { type: Date },
  status:       { type: String, enum: ['active', 'expiring', 'expired', 'cancelled'], default: 'active' },
  notes:        { type: String },
  acDetails:    [{ brand: String, model: String, type: String, serial: String }],

  // ── Technician assignment + per-visit history (new) ───────────────────────
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  visitLog:           { type: [visitLogSchema], default: [] },

  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date },
}, { timestamps: true });

amcSchema.pre('save', async function (next) {
  if (this.isNew && !this.amcId) {
    const last = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNum = 201;
    if (last?.amcId) {
      const parsed = parseInt(last.amcId.split('-')[1], 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    let candidate = `AMC-${nextNum}`;
    while (await this.constructor.exists({ amcId: candidate })) {
      nextNum += 1;
      candidate = `AMC-${nextNum}`;
    }
    this.amcId = candidate;
  }
  next();
});

// Lazily backfills visitLog to `visits` entries, marking the first `done` of
// them completed. Needed because contracts can be created/edited through the
// admin CRUD factory, which has no idea visitLog exists — so it's never
// assumed to already be correct. Call this before any technician read/write
// that touches visit-level data. No-op once the log already matches `visits`.
amcSchema.methods.ensureVisitLog = function () {
  const target = Math.max(this.visits || 0, 1);
  if (this.visitLog.length === target) return this;

  const existingByNumber = new Map(this.visitLog.map((v) => [v.visitNumber, v]));
  const rebuilt = [];
  for (let n = 1; n <= target; n++) {
    if (existingByNumber.has(n)) {
      rebuilt.push(existingByNumber.get(n));
    } else {
      rebuilt.push({
        visitNumber: n,
        status: n <= this.done ? 'completed' : 'pending',
        checklist: AMC_CHECKLIST_TEMPLATE.map((label) => ({ label, checked: n <= this.done })),
      });
    }
  }
  this.visitLog = rebuilt;
  return this;
};

export default mongoose.model('AMC', amcSchema);
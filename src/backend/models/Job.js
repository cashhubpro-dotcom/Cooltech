import mongoose from 'mongoose';
import ChecklistTemplate from './ChecklistTemplate.js';

const jobSchema = new mongoose.Schema({
  jobId:      { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  customerName: { type: String },
  address:    { type: String },
  type:       { type: String, enum: ['Service', 'Installation', 'Repair', 'AMC Visit', 'Inspection'], default: 'Service' },
  priority:   { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  status:     { type: String, enum: ['new', 'assigned', 'in_progress', 'completed', 'invoiced', 'cancelled'], default: 'new' },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:   { type: String, default: 'Unassigned' },
  scheduledDate: { type: Date },
  scheduledTime: { type: String },
  completedAt:{ type: Date },
  ac:         { type: String },
  issue:      { type: String },
  remarks:    { type: String },
  rating:        { type: Number, min: 1, max: 5 },
  ratingComment: { type: String },
  rescheduleRequest: {
    requestedDate: Date,
    requestedTime: String,
    reason:        String,
    status:        { type: String, enum: ['pending', 'approved', 'rejected'] },
  },
  cancelledBy: { type: String, enum: ['admin', 'client'] },
  amount:     { type: Number, default: 0 },

  // ── Parts used ──────────────────────────────────────────────────────────
  // `inventoryItem` is optional — set only when the technician picks the
  // part from stock (via GET /api/technician/me/inventory) rather than
  // typing a custom/non-stock part name. Only parts with this set get
  // deducted from Inventory on job completion.
  parts: [{
    name:          { type: String, required: true },
    qty:           { type: Number, required: true },
    cost:          { type: Number, required: true },
    inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', default: null },
  }],

  // ── Checklist ────────────────────────────────────────────────────────────
  // Seeded from ChecklistTemplate on job creation (see pre('save') below).
  // `addedBy: 'technician'` items are ones added on-site and are the only
  // ones a technician is allowed to delete — template items are permanent.
  checklist: [{
    item:    { type: String, required: true },
    done:    { type: Boolean, default: false },
    addedBy: { type: String, enum: ['template', 'technician'], default: 'template' },
  }],

  photos:     [String],
  signature:  { type: String },
  amc:        { type: mongoose.Schema.Types.ObjectId, ref: 'AMC' },
  quotation:  { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  invoice:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

jobSchema.pre('save', async function (next) {
  if (!this.jobId) {
    const count = await mongoose.model('Job').countDocuments();
    this.jobId = `JOB-${1000 + count + 1}`;
  }

  // Seed the checklist from the matching template exactly once, on creation.
  // If a caller already sent a checklist explicitly (e.g. a future "admin
  // sets a custom checklist" flow), don't override it.
  if (this.isNew && this.checklist.length === 0) {
    const template = await ChecklistTemplate.findOne({ jobType: this.type });
    if (template?.items?.length) {
      this.checklist = template.items.map(item => ({ item, done: false, addedBy: 'template' }));
    }
  }

  next();
});

export default mongoose.model('Job', jobSchema);
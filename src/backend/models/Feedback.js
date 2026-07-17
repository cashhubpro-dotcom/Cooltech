// models/Feedback.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedbackId:   { type: String, unique: true },        // FB-1001

  // ── Linked records ────────────────────────────────────────────────────────
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  job:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:       { type: String },                      // "JOB-1040"
  technician:   { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:     { type: String },

  // ── Feedback content ──────────────────────────────────────────────────────
  rating:       { type: Number, min: 1, max: 5, required: true },
  comment:      { type: String, default: '' },
  category:     { type: String, enum: ['Service','Repair','Installation','AMC Visit','Inspection'], default: 'Service' },
  recommend:    { type: Boolean, default: true },
  date:         { type: String },                      // display string e.g. "Mar 2, 2026"

  // ── Reply ─────────────────────────────────────────────────────────────────
  replied:      { type: Boolean, default: false },
  reply:        { type: String },
  repliedAt:    { type: Date },
  repliedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Follow-up (for negative feedback) ────────────────────────────────────
  resolved:     { type: Boolean, default: true },       // false = needs follow-up
  followUpNote: { type: String },
  followUpAt:   { type: Date },

  // ── Soft delete ───────────────────────────────────────────────────────────
  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date },
}, { timestamps: true });

// Auto-generate feedbackId like FB-1001
feedbackSchema.pre('save', async function (next) {
  if (!this.isNew || this.feedbackId) return next();
  const count      = await mongoose.model('Feedback').countDocuments();
  this.feedbackId  = `FB-${1000 + count + 1}`;
  // Auto mark resolved=false for ratings <= 2
  if (this.rating <= 2) this.resolved = false;
  next();
});

export default mongoose.model('Feedback', feedbackSchema);
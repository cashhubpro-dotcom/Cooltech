import mongoose from 'mongoose';

// ── Parts Request (technician → warehouse) ─────────────────────────────────
// Created by a technician (Technician Panel → Inventory / Parts Request page),
// approved/rejected by admin (Admin Panel → Parts Requests page).
// `partName` / `unit` are denormalized snapshots taken at creation time so the
// request still reads correctly even if the linked Inventory item is later
// renamed or soft-deleted.
const partRequestSchema = new mongoose.Schema({
  reqId:      { type: String, unique: true },

  part:       { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  partName:   { type: String, required: true },
  unit:       { type: String, default: 'Piece' },

  qty:        { type: Number, required: true, min: 1 },

  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },

  // Free-text job code (e.g. "JOB-1041") — not a hard ref, matches how it's
  // displayed in the technician UI mockup (dash when empty).
  linkedJob:  { type: String, default: '' },

  urgent:     { type: Boolean, default: false },
  notes:      { type: String, default: '' },

  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  decidedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  decidedAt:  { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

partRequestSchema.pre('save', async function (next) {
  if (!this.reqId) {
    const count = await mongoose.model('PartRequest').countDocuments();
    this.reqId = `REQ-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('PartRequest', partRequestSchema);
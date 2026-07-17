import mongoose from 'mongoose';

// models/Payroll.js
const payrollRunSchema = new mongoose.Schema({
  runId:       { type: String, unique: true },
  technician:  { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:    { type: String },
  period:      { type: String, required: true },
  cycle:       { type: String, enum: ['Monthly', 'Weekly', 'Bi-weekly', 'Quarterly', 'Custom'], required: true },
  basic:       { type: Number, default: 0 },
  hra:         { type: Number, default: 0 },
  travel:      { type: Number, default: 0 },
  incentive:   { type: Number, default: 0 },

  // ── NEW — optional, defaulted so existing generate() calls don't break ──
  uniformAllw: { type: Number, default: 0 },
  toolAllw:    { type: Number, default: 0 },
  overtime:    { type: Number, default: 0 },
  tds:         { type: Number, default: 0 },
  lop:         { type: Number, default: 0 },        // loss-of-pay amount
  presentDays: { type: Number, default: null },      // null = attendance not linked yet
  totalDays:   { type: Number, default: null },       // working days in the period
  absentDays:  { type: Number, default: 0 },

  gross:       { type: Number, default: 0 },   // basic + hra + travel + incentive (+ new fields once wired in)
  pf:          { type: Number, default: 0 },
  advance:     { type: Number, default: 0 },
  net:         { type: Number, default: 0 },   // gross - pf - advance - lop - tds
  paymentMode: { type: String },
  cutoffDate:  { type: Date },
  status:      { type: String, enum: ['draft', 'generated', 'paid'], default: 'generated' },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

payrollRunSchema.index({ technician: 1, period: 1 }, { unique: true });

payrollRunSchema.pre('save', async function (next) {
  if (!this.runId) {
    const count = await mongoose.model('PayrollRun').countDocuments();
    this.runId = `PR-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('PayrollRun', payrollRunSchema);
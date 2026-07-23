import mongoose from 'mongoose';

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

  uniformAllw: { type: Number, default: 0 },
  toolAllw:    { type: Number, default: 0 },
  expense:     { type: Number, default: 0 },   // ← NEW — wired to "Expense claims" checkbox
  overtime:    { type: Number, default: 0 },   // ← wired to "Add timelogs to salary" checkbox
  tds:         { type: Number, default: 0 },
  lop:         { type: Number, default: 0 },   // ← wired to "Use attendance" checkbox
  presentDays: { type: Number, default: null },
  totalDays:   { type: Number, default: null },
  absentDays:  { type: Number, default: 0 },

  gross:       { type: Number, default: 0 },
  pf:          { type: Number, default: 0 },
  advance:     { type: Number, default: 0 },
  net:         { type: Number, default: 0 },
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
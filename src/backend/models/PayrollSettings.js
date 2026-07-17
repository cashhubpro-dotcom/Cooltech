// models/PayrollSettings.js
import mongoose from 'mongoose';

const payrollSettingsSchema = new mongoose.Schema({
  // Salary structure defaults
  hraPercent:        { type: Number, default: 20 },   // % of basic
  travelDefault:      { type: Number, default: 2000 }, // flat amount
  pfPercent:          { type: Number, default: 6 },    // % of basic

  // ── NEW — backs computeRows()'s overtime/uniform/tool calculation ────────
  overtimeRatePerHour:    { type: Number, default: 0 },    // ₹/hour; 0 = overtime pay disabled until you set this
  uniformAllowanceDefault:{ type: Number, default: 500 },  // flat monthly ₹, overridable per-technician — matches the ₹500 used across your admin salary mock data
  toolAllowanceDefault:   { type: Number, default: 800 },  // flat monthly ₹, overridable per-technician — matches the ₹800 used across your admin salary mock data

  // Advance recovery rule
  advanceRecoveryMode: {
    type: String,
    enum: ['full', 'percent_cap'],
    default: 'full',
  },
  advanceRecoveryCapPercent: { type: Number, default: 50 }, // used only if mode = percent_cap

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Singleton helper — always fetch/create the one settings doc
payrollSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

export default mongoose.model('PayrollSettings', payrollSettingsSchema);
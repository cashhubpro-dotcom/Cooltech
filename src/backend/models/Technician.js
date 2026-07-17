import mongoose from 'mongoose';

const technicianSchema = new mongoose.Schema({
  techId:     { type: String, unique: true },
  name:       { type: String, required: true },
  phone:      { type: String, required: true },
  email:      { type: String, lowercase: true },
  role:       { type: String, default: 'Technician' },
  status:     { type: String, enum: ['available', 'busy', 'off', 'on_leave'], default: 'available' },
  rating:     { type: Number, default: 4.0, min: 0, max: 5 },
  jobs:       { type: Number, default: 0 },
  completed:  { type: Number, default: 0 },
  jobsTarget: { type: Number, default: 0 },
  area:       { type: String },
  skills:     [String],
  certifications: [String],
  joinDate:   { type: Date },
  salary:     { type: Number, default: 0 },
  advance:    { type: Number, default: 0 },
  address:    { type: String },
  idProof:    { type: String },
  bankAccount:{ type: String },
  ifsc:       { type: String },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  salary:      { type: Number, default: 0 },   
  hra:         { type: Number, default: null }, 
  travel:      { type: Number, default: null }, 
  pfPercent:   { type: Number, default: 6 },     
  advance:     { type: Number, default: 0 },
  uniformAllw: { type: Number, default: null },  // ← NEW — null = use PayrollSettings default, same override pattern as hra/travel
  toolAllw:    { type: Number, default: null },  // ← NEW
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
}, { timestamps: true });

// models/Technician.js — replace the method
technicianSchema.methods.getSalaryStructure = function (settings) {
  const basic = this.salary || 0;
  const hra = this.hra != null ? this.hra : Math.round(basic * (settings.hraPercent / 100));
  const travel = this.travel != null ? this.travel : settings.travelDefault;
  const pfPercent = this.pfPercent != null ? this.pfPercent : settings.pfPercent;
  const pf = Math.round((basic * pfPercent) / 100);
  // NEW — same override-then-fallback shape as hra/travel above. Falls back
  // to 0 (not just settings-missing-safe, but literally 0) if you haven't
  // added uniformAllowanceDefault/toolAllowanceDefault to PayrollSettings
  // yet — nothing breaks, it just pays ₹0 until that's added.
  const uniformAllw = this.uniformAllw != null ? this.uniformAllw : (settings.uniformAllowanceDefault || 0);
  const toolAllw    = this.toolAllw    != null ? this.toolAllw    : (settings.toolAllowanceDefault || 0);
  return { basic, hra, travel, pf, uniformAllw, toolAllw };
};

technicianSchema.pre('save', async function (next) {
  if (!this.techId) {
    const count = await mongoose.model('Technician').countDocuments();
    this.techId = `T${String(count + 1).padStart(2, '0')}`;
  }
  next();
});

export default mongoose.model('Technician', technicianSchema);
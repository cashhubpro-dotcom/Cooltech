// models/User.js  — fully updated (adds settings fields on top of profile fields)
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const activitySchema = new mongoose.Schema({
  action:    { type: String, required: true },
  dot:       { type: String, default: '#EA580C' },
  createdAt: { type: Date,   default: Date.now },
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  device:    { type: String },                     // "Chrome on Windows 11"
  location:  { type: String },                     // "Bengaluru, IN"
  ip:        { type: String },
  token:     { type: String },                     // hashed JWT token id
  createdAt: { type: Date, default: Date.now },
  lastSeen:  { type: Date, default: Date.now },
}, { _id: true });

const loginHistorySchema = new mongoose.Schema({
  status:    { type: String, enum: ['success', 'failed'], required: true },
  device:    { type: String },
  ip:        { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

// ─── Main schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({

  // ── Existing core fields (unchanged) ──────────────────────────────────────
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role:     { type: String, enum: ['admin', 'manager', 'technician', 'viewer', 'client'], default: 'viewer' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', default: null },
  phone:    { type: String },
  avatar:   { type: String },
  isActive: { type: Boolean, default: true },
  passwordResetToken:   String,
  passwordResetExpires: Date,

  // ── Profile fields (from previous step) ───────────────────────────────────
  empId:          { type: String, unique: true, sparse: true },
  location:       { type: String, default: '' },
  department:     { type: String, default: 'Management' },
  joined:         { type: String, default: '' },
  roleLevel:      { type: String, default: 'L5' },
  bio:            { type: String, default: '' },
  permissions:    { type: [String], default: ['View All Modules', 'Create Work Orders', 'Manage Technicians', 'Access Finance', 'Edit Customers', 'Configure Settings', 'Export Reports', 'Manage Users', 'Approve Quotations'] },
  recentActivity: { type: [activitySchema], default: [] },

  // ── Notification settings (Notifications tab) ─────────────────────────────
  notifications: {
    jobAssigned:     { type: Boolean, default: true  },
    newQuotation:    { type: Boolean, default: true  },
    invoiceOverdue:  { type: Boolean, default: true  },
    technicianAlert: { type: Boolean, default: false },
    dailySummary:    { type: Boolean, default: true  },
    smsAlerts:       { type: Boolean, default: false },
    emailDigest:     { type: Boolean, default: true  },
    browserPush:     { type: Boolean, default: false },
  },

  // ── Appearance / Regional settings (Appearance tab) ───────────────────────
  preferences: {
    theme:    { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'en-IN' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
  },

  // ── Security (Security tab) ───────────────────────────────────────────────
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret:  { type: String, select: false },   // TOTP secret (future)
  activeSessions:   { type: [sessionSchema],      default: [] },
  loginHistory:     { type: [loginHistorySchema], default: [] },

}, { timestamps: true });

// ─── Pre-save hooks ───────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (this.isNew && !this.empId) {
    const count = await mongoose.model('User').countDocuments();
    this.empId  = `EMP-${String(count + 1).padStart(3, '0')}`;
  }
  if (this.isNew && !this.joined) {
    this.joined = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.twoFactorSecret;
  return obj;
};

userSchema.methods.logActivity = async function (action, dot = '#EA580C') {
  this.recentActivity.unshift({ action, dot, createdAt: new Date() });
  if (this.recentActivity.length > 20) this.recentActivity = this.recentActivity.slice(0, 20);
  await this.save();
};

// Keep only last 5 login history entries
userSchema.methods.addLoginHistory = async function (status, device, ip) {
  this.loginHistory.unshift({ status, device, ip, createdAt: new Date() });
  if (this.loginHistory.length > 5) this.loginHistory = this.loginHistory.slice(0, 5);
  await this.save();
};

export default mongoose.model('User', userSchema);
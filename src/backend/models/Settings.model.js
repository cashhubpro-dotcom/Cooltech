import mongoose from "mongoose";

// ── Notification toggle ───────────────────────────────────────────────────────
const NotifToggleSchema = new mongoose.Schema(
  { label: { type: String, required: true }, enabled: { type: Boolean, default: true } },
  { _id: false }
);

// ── Role & Permission ─────────────────────────────────────────────────────────
const RoleSchema = new mongoose.Schema(
  {
    role:        { type: String, required: true },        // "Super Admin" | "Manager" | ...
    permissions: { type: [String], default: [] },         // ["invoices.view","jobs.create", ...]
  },
  { _id: false }
);

// ── Admin user ────────────────────────────────────────────────────────────────
const AdminUserSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    email: { type: String, required: true },
    role:  { type: String, default: "Manager" },
  },
  { _id: false }
);

// ── SMS automation toggle ─────────────────────────────────────────────────────
const SmsToggleSchema = new mongoose.Schema(
  {
    key:     { type: String, required: true },   // internal key e.g. "jobAssignment"
    label:   { type: String },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

// ── Integration ───────────────────────────────────────────────────────────────
const IntegrationSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    connected: { type: Boolean, default: false },
    apiKey:    { type: String, default: "" },
    meta:      { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

// ── Backup log entry ──────────────────────────────────────────────────────────
const BackupLogSchema = new mongoose.Schema(
  {
    triggeredAt: { type: Date, default: Date.now },
    triggeredBy: { type: String, default: "Admin" },
    status:      { type: String, enum: ["success", "failed"], default: "success" },
    sizeKB:      { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Master settings document ──────────────────────────────────────────────────
const SettingsSchema = new mongoose.Schema(
  {
    // Only ever one document per DB — enforced by this fixed key
    _settingsKey: { type: String, default: "global", unique: true },

    // ── Tab: Company ──────────────────────────────────────────────────────────
    company: {
      name:    { type: String, default: "CoolTech AC Services" },
      owner:   { type: String, default: "" },
      phone:   { type: String, default: "" },
      email:   { type: String, default: "" },
      address: { type: String, default: "" },
      gstNo:   { type: String, default: "" },
      logoUrl: { type: String, default: "" },   // stores uploaded logo path / URL
    },

    // ── Tab: GST & Tax ────────────────────────────────────────────────────────
    gst: {
      gstin:         { type: String, default: "" },
      gstRate:       { type: Number, default: 18 },
      pan:           { type: String, default: "" },
      hsnCode:       { type: String, default: "" },
      invoiceFooter: { type: String, default: "" },
    },

    // ── Tab: Notifications ────────────────────────────────────────────────────
    notifications: {
      toggles: { type: [NotifToggleSchema], default: [] },
    },

    // ── Tab: Roles & Permissions ──────────────────────────────────────────────
    rolesPermissions: {
      roles:      { type: [RoleSchema],     default: [] },
      adminUsers: { type: [AdminUserSchema], default: [] },
    },

    // ── Tab: SMS / WhatsApp ───────────────────────────────────────────────────
    sms: {
      toggles:          { type: [SmsToggleSchema], default: [] },
      jobAssignTemplate: { type: String, default: "" },
      completionTemplate:{ type: String, default: "" },
      invoiceTemplate:   { type: String, default: "" },
      amcTemplate:       { type: String, default: "" },
      paymentTemplate:   { type: String, default: "" },
    },

    // ── Tab: Appearance ───────────────────────────────────────────────────────
    appearance: {
      brandColor:    { type: String, default: "#EA580C" },
      sidebarStyle:  { type: String, enum: ["dark", "light", "auto"], default: "dark" },
      dateFormat:    { type: String, default: "DD MMM, YYYY" },
      currency:      { type: String, default: "INR" },
      currencySymbol:{ type: String, default: "₹" },
    },

    // ── Tab: Integrations ─────────────────────────────────────────────────────
    integrations: { type: [IntegrationSchema], default: [] },

    // ── Tab: Backup ───────────────────────────────────────────────────────────
    backup: {
      frequency:       { type: String, enum: ["daily","weekly","manual"], default: "daily" },
      lastBackupAt:    { type: Date,   default: null },
      nextBackupAt:    { type: Date,   default: null },
      storageUsedKB:   { type: Number, default: 0 },
      storageLimitKB:  { type: Number, default: 10 * 1024 * 1024 }, // 10 GB
      logs:            { type: [BackupLogSchema], default: [] },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Settings = mongoose.model("Settings", SettingsSchema);
export default Settings;
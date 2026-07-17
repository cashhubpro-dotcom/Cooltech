import express    from "express";
import multer     from "multer";
import path       from "path";
import fs         from "fs";
import Settings   from "../models/Settings.model.js";

const router = express.Router();

// ── async wrapper ─────────────────────────────────────────────────────────────
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── ensure the single settings document always exists ─────────────────────────
async function getOrCreate() {
  let doc = await Settings.findOne({ _settingsKey: "global" });
  if (!doc) {
    doc = await Settings.create({ _settingsKey: "global" });
  }
  return doc;
}

// ── multer setup for logo uploads ─────────────────────────────────────────────
const uploadDir = "uploads/logos";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `company-logo-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },          // 2 MB
  fileFilter: (_req, file, cb) => {
    /\.(jpg|jpeg|png|webp|svg)$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error("Only image files are allowed"));
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// GET  /api/settings          — full settings document (all tabs)
// ═════════════════════════════════════════════════════════════════════════════
router.get("/", wrap(async (_req, res) => {
  const doc = await getOrCreate();
  res.json({ success: true, data: doc });
}));

// ═════════════════════════════════════════════════════════════════════════════
// GET  /api/settings/:tab     — single tab (company | gst | notifications …)
// ═════════════════════════════════════════════════════════════════════════════
const VALID_TABS = [
  "company", "gst", "notifications", "rolesPermissions",
  "sms", "appearance", "integrations", "backup",
];

router.get("/:tab", wrap(async (req, res) => {
  const { tab } = req.params;
  if (!VALID_TABS.includes(tab))
    return res.status(400).json({ success: false, message: `Unknown tab: ${tab}` });

  const doc = await getOrCreate();
  res.json({ success: true, data: doc[tab] });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/company
// Body: { name, owner, phone, email, address, gstNo }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/company", wrap(async (req, res) => {
  const allowed = ["name", "owner", "phone", "email", "address", "gstNo"];
  const update  = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[`company.${k}`] = req.body[k]; });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.company });
}));

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/settings/company/logo   (multipart/form-data, field: "logo")
// ═════════════════════════════════════════════════════════════════════════════
router.post("/company/logo", upload.single("logo"), wrap(async (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });

  const logoUrl = `/${uploadDir}/${req.file.filename}`;
  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: { "company.logoUrl": logoUrl } },
    { new: true, upsert: true }
  );
  res.json({ success: true, logoUrl, data: doc.company });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/gst
// Body: { gstin, gstRate, pan, hsnCode, invoiceFooter }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/gst", wrap(async (req, res) => {
  const allowed = ["gstin", "gstRate", "pan", "hsnCode", "invoiceFooter"];
  const update  = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[`gst.${k}`] = req.body[k]; });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.gst });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/notifications
// Body: { toggles: [{ label, enabled }, …] }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/notifications", wrap(async (req, res) => {
  const { toggles } = req.body;
  if (!Array.isArray(toggles))
    return res.status(400).json({ success: false, message: "toggles must be an array" });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: { "notifications.toggles": toggles } },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.notifications });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/rolesPermissions
// Body: { roles: [{role, permissions}], adminUsers: [{name,email,role}] }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/rolesPermissions", wrap(async (req, res) => {
  const { roles, adminUsers } = req.body;
  const update = {};
  if (roles)      update["rolesPermissions.roles"]      = roles;
  if (adminUsers) update["rolesPermissions.adminUsers"] = adminUsers;

  if (!Object.keys(update).length)
    return res.status(400).json({ success: false, message: "Nothing to update" });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.rolesPermissions });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/sms
// Body: { toggles, jobAssignTemplate, completionTemplate, … }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/sms", wrap(async (req, res) => {
  const allowed = [
    "toggles", "jobAssignTemplate", "completionTemplate",
    "invoiceTemplate", "amcTemplate", "paymentTemplate",
  ];
  const update = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[`sms.${k}`] = req.body[k]; });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.sms });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/appearance
// Body: { brandColor, sidebarStyle, dateFormat, currency, currencySymbol }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/appearance", wrap(async (req, res) => {
  const allowed = ["brandColor", "sidebarStyle", "dateFormat", "currency", "currencySymbol"];
  const update  = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[`appearance.${k}`] = req.body[k]; });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.appearance });
}));

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/settings/integrations
// Body: { integrations: [{ name, connected, apiKey, meta }] }
// ─ or ─
// PATCH /api/settings/integrations/:name   (toggle one integration)
// Body: { connected, apiKey, meta }
// ═════════════════════════════════════════════════════════════════════════════
router.patch("/integrations", wrap(async (req, res) => {
  const { integrations } = req.body;
  if (!Array.isArray(integrations))
    return res.status(400).json({ success: false, message: "integrations must be an array" });

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: { integrations } },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.integrations });
}));

router.patch("/integrations/:name", wrap(async (req, res) => {
  // Toggle / update a single integration by name
  const { name } = req.params;
  const { connected, apiKey, meta } = req.body;

  // Try to update existing array element
  let doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global", "integrations.name": name },
    {
      $set: {
        ...(connected !== undefined && { "integrations.$.connected": connected }),
        ...(apiKey    !== undefined && { "integrations.$.apiKey":    apiKey    }),
        ...(meta      !== undefined && { "integrations.$.meta":      meta      }),
      },
    },
    { new: true }
  );

  // If integration not in array yet, push it
  if (!doc) {
    doc = await Settings.findOneAndUpdate(
      { _settingsKey: "global" },
      { $push: { integrations: { name, connected: connected ?? false, apiKey: apiKey ?? "", meta: meta ?? {} } } },
      { new: true, upsert: true }
    );
  }

  res.json({ success: true, data: doc.integrations.find(i => i.name === name) });
}));

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/settings/backup/trigger
// Simulates / logs a manual backup trigger
// ═════════════════════════════════════════════════════════════════════════════
router.post("/backup/trigger", wrap(async (req, res) => {
  const { triggeredBy = "Admin", sizeKB = 0 } = req.body;
  const now  = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);   // next in 24 h

  const logEntry = { triggeredAt: now, triggeredBy, status: "success", sizeKB };

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    {
      $set:  { "backup.lastBackupAt": now, "backup.nextBackupAt": next, "backup.storageUsedKB": sizeKB },
      $push: { "backup.logs": { $each: [logEntry], $slice: -50 } },   // keep last 50 log entries
    },
    { new: true, upsert: true }
  );
  res.json({ success: true, message: "Backup triggered", data: doc.backup });
}));

// PATCH /api/settings/backup   — update frequency / storage limit
router.patch("/backup", wrap(async (req, res) => {
  const { frequency, storageLimitKB } = req.body;
  const update = {};
  if (frequency)      update["backup.frequency"]      = frequency;
  if (storageLimitKB) update["backup.storageLimitKB"] = storageLimitKB;

  const doc = await Settings.findOneAndUpdate(
    { _settingsKey: "global" },
    { $set: update },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: doc.backup });
}));

// ── route-level error handler ─────────────────────────────────────────────────
router.use((err, _req, res, _next) => {
  console.error("[Settings Route Error]", err);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

export default router;
import mongoose from 'mongoose';

// ── Notice Board ──────────────────────────────────────────────────────────────
const noticeSchema = new mongoose.Schema({
  noticeId:   { type: String, unique: true },
  title:      { type: String, required: true },
  content:    { type: String, required: true },
  category:   { type: String, default: 'General' }, // open string - no enum restriction
  priority:   { type: String, default: 'medium' }, // open string
  postedBy:   { type: String },
  postedByUser:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt:  { type: Date },
  isPinned:   { type: Boolean, default: false },
  attachments:[{ name: String, url: String }],
  readBy:     [{ userId: mongoose.Schema.Types.ObjectId, readAt: Date }],
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

noticeSchema.pre('save', async function (next) {
  if (!this.noticeId) {
    const count = await mongoose.model('Notice').countDocuments();
    this.noticeId = `NOT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const Notice = mongoose.model('Notice', noticeSchema);

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title:      { type: String, required: true },
  message:    { type: String },
  type:       { type: String, default: 'system' },
  icon:       { type: String },
  link:       { type: String },
  isRead:     { type: Boolean, default: false },
  readAt:     { type: Date },
  sourceId:   { type: String },
  sourceModel:{ type: String },
}, { timestamps: true });
export const Notification = mongoose.model('Notification', notificationSchema);

// ── Recruitment ───────────────────────────────────────────────────────────────
// const recruitmentSchema = new mongoose.Schema({
//   appId:      { type: String, unique: true },
//   name:       { type: String, required: true },
//   phone:      { type: String },
//   email:      { type: String, lowercase: true },
//   position:   { type: String, required: true },
//   department: { type: String, default: 'Technical' },
//   experience: { type: Number, default: 0 },
//   skills:     [String],
//   source:     { type: String, default: 'Other' },
//   stage:      { type: String, default: 'applied' },
//   resumeUrl:  { type: String },
//   notes:      { type: String },
//   interviewDate: { type: Date },
//   offerAmount:{ type: Number },
//   hiredDate:  { type: Date },
//   rejectionReason: { type: String },
//   rating:     { type: Number, min: 1, max: 5 },
//   isDeleted:  { type: Boolean, default: false },
//   deletedAt:  { type: Date, default: null },
// }, { timestamps: true });

// recruitmentSchema.pre('save', async function (next) {
//   if (!this.appId) {
//     const count = await mongoose.model('Recruitment').countDocuments();
//     this.appId = `APP-${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });
// export const Recruitment = mongoose.model('Recruitment', recruitmentSchema);

// ── Performance ───────────────────────────────────────────────────────────────
const performanceSchema = new mongoose.Schema({
  perfId:     { type: String, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:   { type: String },
  period:     { type: String, required: true }, // e.g. "Apr 2026"
  jobsCompleted: { type: Number, default: 0 },
  jobsTarget: { type: Number, default: 0 },
  avgRating:  { type: Number, default: 0 },
  complaints: { type: Number, default: 0 },
  punctualityScore: { type: Number, default: 0 },
  qualityScore:{ type: Number, default: 0 },
  customerSatisfaction: { type: Number, default: 0 },
  overallScore:{ type: Number, default: 0 },
  grade:      { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'B' },
  reviewNotes:{ type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  goals:      [{ goal: String, achieved: Boolean }],
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

performanceSchema.pre('save', async function (next) {
  if (!this.perfId) {
    const count = await mongoose.model('Performance').countDocuments();
    this.perfId = `PRF-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const Performance = mongoose.model('Performance', performanceSchema);

// ── AdvanceIncentive ──────────────────────────────────────────────────────────
const advanceIncentiveSchema = new mongoose.Schema({
  recordId:   { type: String, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:   { type: String },
  type:       { type: String, required: true },
  amount:     { type: Number, required: true },
  reason:     { type: String },
  date:       { type: Date, default: Date.now },
  month:      { type: String },
  status:     { type: String, enum: ['pending', 'approved', 'paid', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

advanceIncentiveSchema.pre('save', async function (next) {
  if (!this.recordId) {
    const count = await mongoose.model('AdvanceIncentive').countDocuments();
    this.recordId = `ADV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const AdvanceIncentive = mongoose.model('AdvanceIncentive', advanceIncentiveSchema);

// ── GasLog ────────────────────────────────────────────────────────────────────
const gasLogSchema = new mongoose.Schema({
  logId:      { type: String, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:   { type: String },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:     { type: String },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:{ type: String },
  gasType:    { type: String, default: 'R-32' },
  quantity:   { type: Number, required: true },
  unit:       { type: String, default: 'kg' },
  operation:  { type: String, default: 'charge' },
  pressure:   { type: Number },
  temperature:{ type: Number },
  date:       { type: Date, default: Date.now },
  certNumber: { type: String },
  notes:      { type: String },

  // ── ADD: Job & Equipment ──
  acUnit:        { type: String },        // AC Unit / Equipment identifier
  cylinders:     { type: Number, default: 0 },

  // ── ADD: Gas Usage detail ──
  kgRecovered:    { type: Number, default: null },
  kgRemaining:    { type: Number, default: null }, // remaining in cylinder
  pressureBefore: { type: Number, default: null },
  pressureAfter:  { type: Number, default: null },
  gwp:            { type: Number, default: null },  // Global Warming Potential value

  // ── ADD: Compliance ──
  leakTestDone:   { type: Boolean, default: null },
  leakTest:       { type: Boolean, default: null }, // true = pass, false = fail
  regulation:     { type: String },                  // e.g. "EU F-Gas Regulation 517/2014"
  disposalMethod: { type: String },
  supervisor:     { type: String },                  // sign-off name
  compliant:      { type: Boolean, default: true },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

gasLogSchema.pre('save', async function (next) {
  if (!this.logId) {
    const count = await mongoose.model('GasLog').countDocuments();
    this.logId = `GAS-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const GasLog = mongoose.model('GasLog', gasLogSchema);

// ── GasPurchase ──────────────────────────────────────────────────────────────
const gasPurchaseSchema = new mongoose.Schema({
  purchaseId:  { type: String, unique: true },
  gasType:     { type: String, required: true, default: 'R-32' },
  supplier:    { type: String, required: true, trim: true },
  cylinders:   { type: Number, default: 0, min: 0 },
  kgPurchased: { type: Number, required: true, min: 0 },
  costPerKg:   { type: Number, required: true, min: 0 },
  totalCost:   { type: Number },
  invoiceNo:   { type: String, trim: true },
  purchaseDate:{ type: Date, required: true, default: Date.now },
  notes:       { type: String, trim: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });

gasPurchaseSchema.pre('save', async function (next) {
  if (!this.purchaseId) {
    const count = await mongoose.model('GasPurchase').countDocuments();
    this.purchaseId = `PUR-${String(count + 1).padStart(4, '0')}`;
  }
  this.totalCost = +(this.kgPurchased * this.costPerKg).toFixed(2);
  next();
});

gasPurchaseSchema.pre('findOneAndUpdate', function (next) {
  const u = this.getUpdate();
  if (u.kgPurchased != null && u.costPerKg != null) {
    u.totalCost = +(u.kgPurchased * u.costPerKg).toFixed(2);
  }
  next();
});

gasPurchaseSchema.index({ gasType: 1, purchaseDate: -1 });
export const GasPurchase = mongoose.model('GasPurchase', gasPurchaseSchema);

// ── GasPriceRate ─────────────────────────────────────────────────────────────
// Append-only: "current price" for a gasType = most recent effectiveFrom row.
const gasPriceRateSchema = new mongoose.Schema({
  gasType:      { type: String, required: true, index: true },
  pricePerKg:   { type: Number, required: true, min: 0 },
  effectiveFrom:{ type: Date, default: Date.now },
  updatedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note:         { type: String, trim: true },
}, { timestamps: true });

gasPriceRateSchema.index({ gasType: 1, effectiveFrom: -1 });
export const GasPriceRate = mongoose.model('GasPriceRate', gasPriceRateSchema);

// ── Warranty ──────────────────────────────────────────────────────────────────
const warrantySchema = new mongoose.Schema({
  warrantyId: { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:{ type: String, required: true },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:     { type: String },
  product:    { type: String, required: true },
  brand:      { type: String },
  model:      { type: String },
  serial:     { type: String },
  type:       { type: String, default: 'AC Unit' },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  status:     { type: String, enum: ['active', 'expired', 'claimed', 'void'], default: 'active' },
  claimsCount:{ type: Number, default: 0 },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

warrantySchema.pre('save', async function (next) {
  if (!this.warrantyId) {
    const count = await mongoose.model('Warranty').countDocuments();
    this.warrantyId = `WRT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const Warranty = mongoose.model('Warranty', warrantySchema);

// ── Project ───────────────────────────────────────────────────────────────────
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
  completedDate: { type: Date },
});
 
const projectSchema = new mongoose.Schema({
  projectId:   { type: String, unique: true },
  name:        { type: String, required: true },
  description: { type: String },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:{ type: String },
  status:      { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  startDate:   { type: Date },
  endDate:     { type: Date },
  budget:      { type: Number, default: 0 },
  spent:       { type: Number, default: 0 },
  progress:    { type: Number, default: 0, min: 0, max: 100 },
  milestones:  [milestoneSchema],
  team:        [{ type: String }],
  tags:        [String],
  manager:     { type: String },
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });
 
projectSchema.pre('save', async function (next) {
  if (!this.projectId) {
    const count = await mongoose.model('Project').countDocuments();
    this.projectId = `PRJ-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
 
export const Project = mongoose.model('Project', projectSchema);

// ── CustomerType ─────────────────────────────────────────────────────────────
const customerTypeSchema = new mongoose.Schema({
  typeId:     { type: String, unique: true },
  name:       { type: String, required: true, unique: true },
  description:{ type: String },
  color:      { type: String, default: '#6366f1' },
  discount:   { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

customerTypeSchema.pre('save', async function (next) {
  if (!this.typeId) {
    const count = await mongoose.model('CustomerType').countDocuments();
    this.typeId = `CT-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
export const CustomerType = mongoose.model('CustomerType', customerTypeSchema);

// ── LeadSource ────────────────────────────────────────────────────────────────
const leadSourceSchema = new mongoose.Schema({
  sourceId:   { type: String, unique: true },
  name:       { type: String, required: true, unique: true },
  description:{ type: String },
  channel:    { type: String, default: 'Other' },
  cost:       { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
  leadsCount: { type: Number, default: 0 },
  conversions:{ type: Number, default: 0 },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

leadSourceSchema.pre('save', async function (next) {
  if (!this.sourceId) {
    const count = await mongoose.model('LeadSource').countDocuments();
    this.sourceId = `LS-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
export const LeadSource = mongoose.model('LeadSource', leadSourceSchema);

// ── ContractType ──────────────────────────────────────────────────────────────
const contractTypeSchema = new mongoose.Schema({
  typeId:     { type: String, unique: true },
  name:       { type: String, required: true, unique: true },
  description:{ type: String },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });
 
contractTypeSchema.pre('save', async function (next) {
  if (!this.typeId) {
    const count = await mongoose.model('ContractType').countDocuments();
    this.typeId = `CTY-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
export const ContractType = mongoose.model('ContractType', contractTypeSchema);
 
// ── ContractPlan ──────────────────────────────────────────────────────────────
const contractPlanSchema = new mongoose.Schema({
  planId:     { type: String, unique: true },
  name:       { type: String, required: true, unique: true },
  description:{ type: String },
  isActive:   { type: Boolean, default: true },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });
 
contractPlanSchema.pre('save', async function (next) {
  if (!this.planId) {
    const count = await mongoose.model('ContractPlan').countDocuments();
    this.planId = `CPL-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});
export const ContractPlan = mongoose.model('ContractPlan', contractPlanSchema);

// ── Campaign ──────────────────────────────────────────────────────────────────
const campaignSchema = new mongoose.Schema({
  campaignId: { type: String, unique: true },
  name:       { type: String, required: true },
  type:       { type: String, default: 'Email' },
  status:     { type: String, enum: ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'], default: 'draft' },
  audience:   { type: String },
  subject:    { type: String },
  content:    { type: String },
  scheduledAt:{ type: Date },
  sentAt:     { type: Date },
  targetCount:{ type: Number, default: 0 },
  sentCount:  { type: Number, default: 0 },
  openCount:  { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  budget:     { type: Number, default: 0 },
  tags:       [String],
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

campaignSchema.pre('save', async function (next) {
  if (!this.campaignId) {
    const count = await mongoose.model('Campaign').countDocuments();
    this.campaignId = `CAM-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const Campaign = mongoose.model('Campaign', campaignSchema);

// ── Review ────────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  reviewId:   { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName:{ type: String, required: true },
  platform:   { type: String, default: 'Google' },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String },
  response:   { type: String },
  respondedAt:{ type: Date },
  date:       { type: Date, default: Date.now },
  isPublic:   { type: Boolean, default: true },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

reviewSchema.pre('save', async function (next) {
  if (!this.reviewId) {
    const count = await mongoose.model('Review').countDocuments();
    this.reviewId = `REV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const Review = mongoose.model('Review', reviewSchema);

// ── PostSchedule ──────────────────────────────────────────────────────────────
const postScheduleSchema = new mongoose.Schema({
  postId:      { type: String, unique: true },
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  caption:     { type: String },                        // ← ADD (alias of content for UI)
  type:        { type: String, default: 'Update' },     // ← ADD (Promotion/Tips/etc)
  platforms:   [{ type: String }],
  mediaUrls:   [String],
  tags:        [String],
  status:      { type: String, enum: ['draft', 'scheduled', 'published', 'failed'], default: 'draft' },
  scheduledAt: { type: Date },
  publishedAt: { type: Date },
  reach:       { type: Number, default: 0 },
  likes:       { type: Number, default: 0 },
  comments:    { type: Number, default: 0 },
  shares:      { type: Number, default: 0 },
  leads:       { type: Number, default: 0 },            // ← ADD
  statusNote:  { type: String },                        // ← ADD (for status modal note)
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date, default: null },
}, { timestamps: true });

postScheduleSchema.pre('save', async function (next) {
  if (!this.postId) {
    const count = await mongoose.model('PostSchedule').countDocuments();
    this.postId = `PST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const PostSchedule = mongoose.model('PostSchedule', postScheduleSchema);

// ── ACErrorCode ───────────────────────────────────────────────────────────────
const acErrorCodeSchema = new mongoose.Schema({
  codeId:     { type: String, unique: true },
  code:       { type: String, required: true },
  brand:      { type: String },
  description:{ type: String, required: true },
  cause:      { type: String },
  solution:   { type: String },
  severity:   { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
  category:   { type: String, enum: ['Electrical', 'Refrigerant', 'Communication', 'Sensor', 'Mechanical', 'Other'], default: 'Other' },
  tags:       [String],
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

acErrorCodeSchema.pre('save', async function (next) {
  if (!this.codeId) {
    const count = await mongoose.model('ACErrorCode').countDocuments();
    this.codeId = `EC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const ACErrorCode = mongoose.model('ACErrorCode', acErrorCodeSchema);

// ── LookupTable ───────────────────────────────────────────────────────────────
const lookupTableSchema = new mongoose.Schema({
  category:   { type: String, required: true }, // e.g. 'department', 'skill', 'area', 'shift'
  value:      { type: String, required: true },
  label:      { type: String },
  order:      { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

lookupTableSchema.index({ category: 1, value: 1 }, { unique: true });
export const LookupTable = mongoose.model('LookupTable', lookupTableSchema);

// ── ContentLibrary ────────────────────────────────────────────────────────────
const contentLibrarySchema = new mongoose.Schema({
  contentId:  { type: String, unique: true },
  title:      { type: String, required: true },
  type:       { type: String, default: 'template' },
  category:   { type: String },
  url:        { type: String },
  content:    { type: String },
  tags:       [String],
  usageCount: { type: Number, default: 0 },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

contentLibrarySchema.pre('save', async function (next) {
  if (!this.contentId) {
    const count = await mongoose.model('ContentLibrary').countDocuments();
    this.contentId = `CON-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});
export const ContentLibrary = mongoose.model('ContentLibrary', contentLibrarySchema);

// ── WhatsAppMessage ───────────────────────────────────────────────────────────
const whatsappMessageSchema = new mongoose.Schema({
  msgId:      { type: String, unique: true },
  recipient:  { type: String, required: true },
  recipientName:{ type: String },
  phone:      { type: String, required: true },
  template:   { type: String },
  message:    { type: String, required: true },
  status:     { type: String, enum: ['queued', 'sent', 'delivered', 'read', 'failed'], default: 'queued' },
  sentAt:     { type: Date },
  deliveredAt:{ type: Date },
  readAt:     { type: Date },
  campaign:   { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date, default: null },
}, { timestamps: true });

whatsappMessageSchema.pre('save', async function (next) {
  if (!this.msgId) {
    const count = await mongoose.model('WhatsAppMessage').countDocuments();
    this.msgId = `WA-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});
export const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsappMessageSchema);
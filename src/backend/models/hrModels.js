import mongoose from 'mongoose';

// ── Attendance ────────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:   { type: String },
  date:       { type: Date, required: true },
  status:     { type: String, enum: ['present', 'absent', 'half_day', 'holiday', 'on_leave'], default: 'present' },
  clockIn:    { type: Date },
  clockOut:   { type: Date },
  hoursWorked:{ type: Number, default: 0 },
  notes:      { type: String },
}, { timestamps: true });

attendanceSchema.index({ technician: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);

// ── Leave ─────────────────────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
  leaveId:    { type: String, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:   { type: String },
  type:       { type: String, enum: ['sick', 'casual', 'earned', 'unpaid', 'emergency'], default: 'casual' },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  days:       { type: Number, default: 1 },
  reason:     { type: String },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:      { type: String },
}, { timestamps: true });

leaveSchema.pre('save', async function (next) {
  if (!this.leaveId) {
    const count = await mongoose.model('Leave').countDocuments();
    this.leaveId = `LV-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Leave = mongoose.model('Leave', leaveSchema);

// ── Salary ────────────────────────────────────────────────────────────────────
const salarySchema = new mongoose.Schema({
  salaryId:   { type: String, unique: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
  techName:   { type: String },
  month:      { type: String, required: true }, // e.g. "Mar 2026"
  basic:      { type: Number, default: 0 },
  hra:        { type: Number, default: 0 },
  travel:     { type: Number, default: 0 },
  incentive:  { type: Number, default: 0 },
  overtime:   { type: Number, default: 0 },
  gross:      { type: Number, default: 0 },
  pf:         { type: Number, default: 0 },
  advance:    { type: Number, default: 0 },
  deduction:  { type: Number, default: 0 },
  net:        { type: Number, default: 0 },
  jobsDone:   { type: Number, default: 0 },
  presentDays:{ type: Number, default: 0 },
  status:     { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paidAt:     { type: Date },
  notes:      { type: String },
}, { timestamps: true });

salarySchema.pre('save', async function (next) {
  if (!this.salaryId) {
    const count = await mongoose.model('Salary').countDocuments();
    this.salaryId = `SAL-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Salary = mongoose.model('Salary', salarySchema);

// ── Purchase Order ────────────────────────────────────────────────────────────
const purchaseOrderSchema = new mongoose.Schema({
  poId:       { type: String, unique: true },
  supplier:   { type: String, required: true },
  items:      [{ itemId: String, name: String, qty: Number, rate: Number, amount: Number }],
  subtotal:   { type: Number, default: 0 },
  tax:        { type: Number, default: 0 },
  total:      { type: Number, default: 0 },
  status:     { type: String, enum: ['draft', 'sent', 'confirmed', 'received', 'cancelled'], default: 'draft' },
  orderedAt:  { type: Date },
  expectedAt: { type: Date },
  receivedAt: { type: Date },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

purchaseOrderSchema.pre('save', async function (next) {
  if (!this.poId) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    this.poId = `PO-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

// ── Supplier ──────────────────────────────────────────────────────────────────
const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, unique: true },
  name:       { type: String, required: true },
  contact:    { type: String },
  phone:      { type: String },
  email:      { type: String, lowercase: true },
  address:    { type: String },
  category:   { type: String },
  gstin:      { type: String },
  paymentTerms: { type: String },
  rating:     { type: Number, default: 3 },
  status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },   // ← added
  deletedAt:  { type: Date },                       // ← added
}, { timestamps: true });

supplierSchema.pre('save', async function (next) {
  if (!this.supplierId) {
    const count = await mongoose.model('Supplier').countDocuments();
    this.supplierId = `SUP-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Supplier = mongoose.model('Supplier', supplierSchema);

// ── Asset ─────────────────────────────────────────────────────────────────────
const assetSchema = new mongoose.Schema({
  assetId:     { type: String, unique: true },
  name:        { type: String, required: true },

  // Drives which extra fields apply / which tab it shows under
  assetType:   { type: String, enum: ['Vehicle', 'Equipment'], required: true, default: 'Equipment' },
  subType:     { type: String }, // e.g. "Service Van" / "Bike" (vehicle) · "Vacuum Pump" (equipment)

  regNo:       { type: String },  // vehicle registration number
  serial:      { type: String },  // equipment serial number
  year:        { type: Number },
  fuel:        { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'N/A'], default: 'N/A' },
  km:          { type: Number, default: 0 }, // current odometer (vehicles)

  value:       { type: Number, default: 0 }, // purchase / book value
  purchaseDate:{ type: Date },

  insuranceExpiry: { type: Date }, // vehicle
  warrantyExpiry:  { type: Date }, // equipment

  lastServiceDate: { type: Date },
  nextServiceDate: { type: Date },

  assignedTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:    { type: String, default: 'Office' }, // denormalized display name

  status:      { type: String, enum: ['active', 'maintenance', 'inactive', 'retired'], default: 'active' },
  notes:       { type: String },
  isDeleted:   { type: Boolean, default: false },
}, { timestamps: true });

assetSchema.pre('save', async function (next) {
  if (!this.assetId) {
    const count = await mongoose.model('Asset').countDocuments();
    this.assetId = `AST-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Asset = mongoose.model('Asset', assetSchema);

// ── Contract ──────────────────────────────────────────────────────────────────
const contractSchema = new mongoose.Schema({
  contractId: { type: String, unique: true },
  customer: { type: String, required: true },
  contact:    { type: String },
  phone:      { type: String },
  email:      { type: String },
  type:       { type: String, enum: ['AMC', 'Installation', 'Service', 'Other'], default: 'AMC' },
  title:      { type: String, required: true },
  value:      { type: Number, default: 0 },
  startDate:  { type: Date },
  endDate:    { type: Date },
  status:     { type: String, enum: ['draft', 'pending_signature', 'active', 'expired', 'cancelled'], default: 'draft' },
  signed:     { type: Boolean, default: false },
  signedDate: { type: Date },
  signatories:[String],
  terms:      { type: String },
  clauses:    { type: Number, default: 0 },
  autoRenew:  { type: Boolean, default: false },
  linkedLead: { type: String},
  linkedAMC:  { type: String},
  plan:               { type: String },
officePhone:        { type: String },
currency:           { type: String, default: 'INR (₹)' },
paymentTerms:       { type: String },
visitsPerYear:      { type: Number },
acUnitsCovered:     { type: Number },
acBrand:            { type: String },
acCapacity:         { type: String },
assignedTechnician: { type: String },
noDueDate:          { type: Boolean, default: false },
con_street:         { type: String },
con_city:           { type: String },
con_state:          { type: String },
con_pincode:        { type: String },
con_country:        { type: String },
altAddress:         { type: String },
internalNotes:      { type: String },
clauseList:    [{ text: String, addedAt: { type: Date, default: Date.now }, addedBy: String }],
nextVisitDate: { type: Date },
auditLog: [{
  action: String,
  detail: String,
  by:     String,
  at:     { type: Date, default: Date.now },}],
  document:   { type: String },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

contractSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

contractSchema.pre('save', async function (next) {
  if (this.isNew && !this.contractId) {
    const last = await this.constructor.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNum = 1;
    if (last?.contractId) {
      const parsed = parseInt(last.contractId.split('-')[1], 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
    let candidate = `CON-${String(nextNum).padStart(3, '0')}`;
    while (await this.constructor.exists({ contractId: candidate })) {
      nextNum += 1;
      candidate = `CON-${String(nextNum).padStart(3, '0')}`;
    }
    this.contractId = candidate;
  }
  next();
});

export const Contract = mongoose.model('Contract', contractSchema);

// ── Reminder ──────────────────────────────────────────────────────────────────
// Shared by two features:
//  - Admin CRM "Service Reminders" page (AC service/AMC due tracking, ac/sent)
//  - Client portal "My Reminders" (title/description shown to the client,
//    status is a workflow state — pending/done/snoozed — urgency is always
//    computed live from dueDate, never trusted from storage)
const reminderSchema = new mongoose.Schema({
  reminderId:  { type: String, unique: true },
  title:       { type: String, required: true },
  description: { type: String },
  dueDate:     { type: Date, required: true },
  lastService: { type: Date },
  type:        { type: String, default: 'custom' }, // freeform: e.g. "Annual Service", "AMC Renewal"
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:      { type: String, enum: ['pending', 'done', 'snoozed'], default: 'pending' },
  sent:        { type: Boolean, default: false }, // SMS/WhatsApp reminder sent flag
  ac:          { type: String, default: '' },     // AC unit description
  assignedTo:  { type: String },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  lead:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  isDeleted:   { type: Boolean, default: false },
  deletedAt:   { type: Date },
}, { timestamps: true });

reminderSchema.pre('save', async function (next) {
  if (!this.reminderId) {
    const count = await mongoose.model('Reminder').countDocuments();
    this.reminderId = `REM-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const Reminder = mongoose.model('Reminder', reminderSchema);

// ── Service (Price List) ──────────────────────────────────────────────────────
const serviceSchema = new mongoose.Schema({
  serviceId:  { type: String, unique: true },
  name:       { type: String, required: true },
  category:   { type: String, enum: ['Service', 'Installation', 'Repair', 'AMC', 'Parts', 'Other'], default: 'Service' },
  description:{ type: String },
  price:      { type: Number, required: true },
  unit:       { type: String, default: 'per visit' },
  gstRate:    { type: Number, default: 18 },
  isActive:   { type: Boolean, default: true },
  // ── Catalogue extras, used by the Services page ──
  acType:     { type: String, default: 'All Types' },
  duration:   { type: String, default: '' },
  warranty:   { type: String, default: '' },
  includes:   { type: String, default: '' },
  checklist:  [{ type: String }],
  tools:      [{ type: String }],
  popular:    { type: Boolean, default: false },
}, { timestamps: true });

serviceSchema.pre('save', async function (next) {
  if (!this.serviceId) {
    const count = await mongoose.model('Service').countDocuments();
    this.serviceId = `SVC-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Service = mongoose.model('Service', serviceSchema);

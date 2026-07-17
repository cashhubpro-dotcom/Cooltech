import mongoose from 'mongoose';

// ── Payment ──────────────────────────────────────────────────────────────────
// const paymentSchema = new mongoose.Schema({
//   paymentId:  { type: String, unique: true },
//   invoice:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
//   invoiceRef: { type: String },
//   customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
//   customerName: { type: String },
//   amount:     { type: Number, required: true },
//   method:     { type: String, enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'], default: 'cash' },
//   reference:  { type: String },
//   date:       { type: Date, default: Date.now },
//   notes:      { type: String },
// }, { timestamps: true });

// paymentSchema.pre('save', async function (next) {
//   if (!this.paymentId) {
//     const count = await mongoose.model('Payment').countDocuments();
//     this.paymentId = `PAY-${String(count + 1).padStart(4, '0')}`;
//   }
//   next();
// });

// export const Payment = mongoose.model('Payment', paymentSchema);

// ── Expense ───────────────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  expenseId:    { type: String, unique: true },
  category:     { type: String, enum: ['Fuel', 'Tools', 'Parts', 'Miscellaneous', 'Training', 'Office', 'Other'], default: 'Other' },
  technician:   { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:     { type: String },
  job:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
  customerName: { type: String, default: '' },
  description:  { type: String, required: true },
  amount:       { type: Number, required: true },
  date:         { type: Date, default: Date.now },
  receipt:      { type: Boolean, default: false },
  receiptUrl:   { type: String },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:        { type: String },
  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date },
}, { timestamps: true });
 
expenseSchema.pre('save', async function (next) {
  if (!this.expenseId) {
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseId = `EXP-${100 + count + 1}`;
  }
  next();
});
 
export const Expense = mongoose.model('Expense', expenseSchema);

// ── Inventory ────────────────────────────────────────────────────────────────
const inventorySchema = new mongoose.Schema({
  itemId:     { type: String, unique: true },
  name:       { type: String, required: true },
  category:   { type: String, enum: ['Refrigerant', 'Filter', 'Electrical', 'Piping', 'Lubricant', 'Tool', 'Other'], default: 'Other' },
  sku:        { type: String },
  qty:        { type: Number, default: 0 },
  unit:       { type: String, default: 'Piece' },
  reorderLevel: { type: Number, default: 5 },
  cost:       { type: Number, default: 0 },
  supplier:   { type: String },
  location:   { type: String },
  notes:      { type: String },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

inventorySchema.pre('save', async function (next) {
  if (!this.itemId) {
    const count = await mongoose.model('Inventory').countDocuments();
    this.itemId = `ITEM-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Inventory = mongoose.model('Inventory', inventorySchema);

// ── Lead ──────────────────────────────────────────────────────────────────────
const activitySchema = new mongoose.Schema({
  date:   { type: Date, default: Date.now },
  type:   { type: String, enum: ['call', 'email', 'whatsapp', 'visit', 'note'], default: 'note' },
  by:     { type: String },
  note:   { type: String },
});

const leadSchema = new mongoose.Schema({
  leadId:     { type: String, unique: true },
  name:       { type: String, required: true },
  contact:    { type: String },
  phone:      { type: String },
  email:      { type: String, lowercase: true },
  address:    { type: String },
  type:       { type: String, enum: ['Residential', 'Commercial', 'Industrial'], default: 'Residential' },
  units:      { type: Number, default: 1 },
  source:     { type: String, enum: ['Referral', 'Google Ad', 'Walk-in', 'Instagram', 'LinkedIn', 'Cold Call', 'Website', 'Other'], default: 'Other' },
  stage:      { type: String, enum: ['new', 'follow_up', 'proposal_sent', 'negotiation', 'won', 'lost'], default: 'new' },
  value:      { type: Number, default: 0 },
  score:      { type: Number, default: 0, min: 0, max: 100 },
  temp:       { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
  assignedTo: { type: String },
  notes:      { type: String },
  activities: [activitySchema],
  calls:      { type: Number, default: 0 },
  emails:     { type: Number, default: 0 },
  visits:     { type: Number, default: 0 },
  lastContact:{ type: Date },
  convertedTo:{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

leadSchema.pre('save', async function (next) {
  if (!this.leadId) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadId = `LD-${String(80 + count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Lead = mongoose.model('Lead', leadSchema);

// ── Complaint ─────────────────────────────────────────────────────────────────
const complaintSchema = new mongoose.Schema({
  complaintId:{ type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  techName:   { type: String },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:     { type: String },
  category:   { type: String, enum: ['Quality', 'Behaviour', 'Billing', 'Delay', 'Other'], default: 'Other' },
  severity:   { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  description:{ type: String, required: true },
  status:     { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  resolution: { type: String },
  resolvedAt: { type: Date },
targetResolutionDate:  { type: Date },
internalNotes:          { type: String },
customerCommunication:  { type: String },
compensation:           { type: String },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `CMP-${String(30 + count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Complaint = mongoose.model('Complaint', complaintSchema);

// ── Ticket ────────────────────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  from:    { type: String },
  time:    { type: Date, default: Date.now },
  msg:     { type: String },
  isClient:{ type: Boolean, default: false },
});

const ticketSchema = new mongoose.Schema({
  ticketId:   { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  contact:    { type: String },
  phone:      { type: String },
  email:      { type: String },
  subject:    { type: String, required: true },
  category:   { type: String, enum: ['breakdown', 'scheduling', 'billing', 'query', 'complaint', 'other'], default: 'query' },
  priority:   { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:     { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: String },
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  messages:   [messageSchema],
  sla:        { type: String },
  slaBreach:  { type: Boolean, default: false },
  resolvedAt: { type: Date },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true });

ticketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `TKT-${String(30 + count + 1).padStart(3, '0')}`;
  }
  next();
});

export const Ticket = mongoose.model('Ticket', ticketSchema);

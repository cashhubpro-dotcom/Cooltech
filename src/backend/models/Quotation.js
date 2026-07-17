import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  quotId:     { type: String, unique: true },
  customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  contact:    { type: String },
  phone:      { type: String },
  type:       { type: String, enum: ['Service', 'Installation', 'Repair', 'AMC', 'Other'], default: 'Service' },
  items:      [{ desc: String, qty: Number, rate: Number, amount: Number }],
  subtotal:   { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },
  gst:        { type: Number, default: 0 },
  taxPercent: { type: Number },
  total:      { type: Number, default: 0 },
  validUntil: { type: Date },
  status:     { type: String, enum: ['draft', 'sent', 'approved', 'rejected', 'expired'], default: 'draft' },
  notes:      { type: String },
  terms:      { type: String },
  template:   { type: String, enum: ['alisha', 'generic'], default: 'alisha' },
  fields:     [{ label: String, value: String }], // arbitrary label/value pairs found on an imported document (e.g. "Delivery Within", "PO Number") that don't map to a fixed column — lets the generic template adapt to any uploaded layout
  isDeleted:  { type: Boolean, default: false },
  deletedAt:  { type: Date },
  statusNote: { type: String },
  address: { type: String },
email:   { type: String },
}, { timestamps: true });

quotationSchema.pre('save', async function (next) {
  if (!this.quotId) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotId = `QT-${String(80 + count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Quotation', quotationSchema);

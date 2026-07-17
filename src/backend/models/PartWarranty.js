import mongoose from 'mongoose';

export const PART_TYPES = [
  'Compressor', 'PCB Board', 'Capacitor', 'Fan Motor',
  'Gas Charge', 'IDU/ODU Coil', 'Remote', 'Sensor', 'Other',
];

export const WARRANTY_TYPES = ['Manufacturer', 'Dealer', 'AMC covered', 'Extended'];

const partWarrantySchema = new mongoose.Schema(
  {
    // Auto-generated display ID, e.g. PWR-0001 — set in the pre-save hook below
    partWarrantyId: { type: String, unique: true, index: true },

    // Customer this part warranty belongs to (denormalized name kept alongside
    // the ref so the list view never has to wait on a populate to render).
    customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, default: '' },

    // The AC unit (from the existing Warranty collection) this part is installed in.
    linkedUnit:      { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
    linkedUnitLabel: { type: String, default: '' }, // e.g. "WRT-0001 — Ankit Patel"

    partType: { type: String, enum: PART_TYPES, required: true },

    brand:  { type: String, default: '' },
    model:  { type: String, default: '' },
    serial: { type: String, default: '' },

    startDate: { type: Date }, // install date
    endDate:   { type: Date, required: true }, // warranty end date

    type:   { type: String, enum: WARRANTY_TYPES, default: 'Manufacturer' }, // warranty type
    status: { type: String, enum: ['active', 'expired'], default: 'active' },

    claimsCount: { type: Number, default: 0 },
    notes:       { type: String, default: '' },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Auto-generate PWR-0001-style display IDs ────────────────────────────────
partWarrantySchema.pre('save', async function (next) {
  if (this.isNew && !this.partWarrantyId) {
    const Model = this.constructor;
    const last = await Model.findOne({}).sort({ createdAt: -1 }).select('partWarrantyId');
    let nextNum = 1;
    if (last?.partWarrantyId) {
      const match = last.partWarrantyId.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.partWarrantyId = `PWR-${String(nextNum).padStart(4, '0')}`;
  }
  next();
});

// ── Auto-flip status to expired once endDate has passed ─────────────────────
partWarrantySchema.pre('save', function (next) {
  if (this.endDate && new Date(this.endDate) < new Date() && this.status !== 'expired') {
    this.status = 'expired';
  }
  next();
});

const PartWarranty = mongoose.model('PartWarranty', partWarrantySchema);

export default PartWarranty;
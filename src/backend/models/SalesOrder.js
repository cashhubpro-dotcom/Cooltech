import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const salesOrderSchema = new mongoose.Schema(
  {
    soId: { type: String, unique: true }, // human-readable e.g. "SO-0092"
    customer: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date },

    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    payStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },

    notes: { type: String, default: '' },

    // ── Set via "Mark Shipped" modal ─────────────────────────────────────
    shippedDate: { type: Date },
    carrier: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    shippedNotes: { type: String, default: '' },

    // ── Set via "Mark Paid" modal ────────────────────────────────────────
    paidAmount: { type: Number },
    paymentMethod: { type: String, default: '' },
    paymentRef: { type: String, default: '' },
    paymentDate: { type: Date },
    paymentNotes: { type: String, default: '' },

    // ── Set via "Update Status" modal ────────────────────────────────────
    statusDate: { type: Date },
    statusNotes: { type: String, default: '' },

    deletedAt: { type: Date, default: null }, // soft delete
  },
  { timestamps: true }
);

// Auto-generate soId like "SO-0001" if not supplied
salesOrderSchema.pre('validate', async function (next) {
  if (this.soId) return next();
  const Model = this.constructor;
  const last = await Model.findOne({}, {}, { sort: { createdAt: -1 } });
  let nextNum = 1;
  if (last?.soId) {
    const match = last.soId.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  this.soId = `SO-${String(nextNum).padStart(4, '0')}`;
  next();
});

export default mongoose.model('SalesOrder', salesOrderSchema);
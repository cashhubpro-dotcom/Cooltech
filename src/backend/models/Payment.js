import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, unique: true }, // auto: PAY-101, PAY-102, ...

    // NEW — the only addition needed for the client portal. Points at your
    // Customer model, using the SAME id stored on User.customer (which
    // clientOnly already guarantees is present on any req.user with
    // role: 'client'). NOT required at the schema level — admin's payment
    // creation/mark-paid/payment-link/generic update routes never set this
    // directly, so a hard requirement broke them the same way it did on
    // Invoice. Auto-resolved via the hook below instead. Do NOT scope the
    // client portal by the `customer` string below — strings can
    // collide/typo and leak one client's data to another.
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },

    // NEW — the missing link. Payment.invoice (below) is just display text;
    // this is the real ObjectId that lets verify()/the webhook flip the
    // matching Invoice to paid once this Payment is marked received.
    invoiceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null, index: true },

    invoice:  { type: String, required: true },
    customer: { type: String, required: true },
    amount:   { type: Number, required: true },

    method: {
      type: String,
      enum: ['UPI', 'Cash', 'Cheque', 'Bank Transfer', 'Credit Card', 'Razorpay', '—'],
      default: '—',
    },

    // Actual received-date (Date), display formatting happens on the frontend.
    paidAt: { type: Date, default: null },

    ref: { type: String, default: '—' },

    status: {
      type: String,
      enum: ['pending', 'received', 'overdue'],
      default: 'pending',
    },

    gateway: { type: String, default: null }, // 'Razorpay' | null (manual)
    payLink: { type: String, default: null }, // Razorpay Payment Link URL

    // Razorpay tracking
    razorpayOrderId:      { type: String, default: null },
    razorpayPaymentId:    { type: String, default: null },
    razorpaySignature:    { type: String, default: null },
    razorpayPaymentLinkId:{ type: String, default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// NEW — auto-resolves `client` for any write path that doesn't set it
// directly (admin's Record Payment, mark-paid, payment-link, generic
// createCRUD update). Runs in pre('validate') for symmetry with
// Invoice.model.js, even though `client` isn't a required field here —
// keeps this working unchanged if you ever do tighten it later.
paymentSchema.pre('validate', async function (next) {
  if (!this.client && this.customer) {
    try {
      const Customer = mongoose.model('Customer'); // relies on models/Customer.js already being imported somewhere (it is, in invoice.routes.js)
      const match = await Customer.findOne({
        name: new RegExp(`^${this.customer.trim()}$`, 'i'),
        isDeleted: { $ne: true },
      });
      if (match) this.client = match._id;
    } catch (err) {
      console.warn('[Payment] could not auto-resolve client:', err.message);
    }
  }
  next();
});

// Same resolution for updates via findByIdAndUpdate/findOneAndUpdate,
// which — same as Invoice.model.js — skip document-level pre('validate')
// entirely. Defensive: createCRUD's generic PUT may or may not go
// through this path, but this costs nothing if it doesn't apply.
paymentSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  const setBlock = update?.$set || update || {};
  if (!setBlock.client && setBlock.customer) {
    try {
      const Customer = mongoose.model('Customer');
      const match = await Customer.findOne({
        name: new RegExp(`^${setBlock.customer.trim()}$`, 'i'),
        isDeleted: { $ne: true },
      });
      if (match) this.set({ client: match._id });
    } catch (err) {
      console.warn('[Payment] could not auto-resolve client on update:', err.message);
    }
  }
  next();
});

// Auto-generate paymentId like PAY-101, continuing from the highest existing number.
paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentId) {
    const last = await this.constructor
      .findOne({ paymentId: { $regex: /^PAY-\d+$/ } })
      .sort({ createdAt: -1 })
      .lean();

    let nextNum = 101;
    if (last?.paymentId) {
      const n = parseInt(last.paymentId.split('-')[1], 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    this.paymentId = `PAY-${nextNum}`;
  }
  next();
});

// NEW — fast path for "my payments" queries + status/method filtering in the portal
paymentSchema.index({ client: 1, status: 1, createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
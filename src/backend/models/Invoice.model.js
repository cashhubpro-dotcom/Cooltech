// models/Invoice.model.js
// Place at: src/backend/models/Invoice.model.js
// Your project uses ESM — so this uses import/export

import mongoose from "mongoose";

const ItemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    qty:  { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    // Default changed from 18 → 0: line items no longer carry any assumed
    // tax at all. GST now only ever comes from an Additional Charge
    // explicitly labeled "GST" (see ChargeSchema below) — never a silent
    // per-item default.
    gst:  { type: Number, default: 0 },
    // Reference to the GstCategory active when this line was billed — kept
    // for audit/history (so you can see which tax category applied), even
    // if that category's rate changes later. Not required: legacy invoices
    // created before this field existed simply have it as null.
    gstCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GstCategory", default: null },
  },
  { _id: false }
);

// Additional Charges (delivery, installation labour, etc.) — separate from
// line items because they're often taxed differently or not at all. Selected
// on the frontend via a per-charge GST dropdown (defaults to no GST).
const ChargeSchema = new mongoose.Schema(
  {
    label:  { type: String, default: "" },
    amount: { type: Number, default: 0 },
    gst:    { type: Number, default: 0 },
    gstCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "GstCategory", default: null },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, trim: true , unique: true},
    invoiceNumber: { type: String, default: null },  // ← accept but don't index
    invoiceId:     { type: String, default: null, default: undefined, },  // ← accept but don't index

    // NEW — the only addition needed for the client portal. Points at the
    // SAME Customer id stored on User.customer (clientOnly already
    // guarantees it's present on any req.user with role: 'client'). NOT
    // required at the schema level — your admin's CreateInvoicePage never
    // sends this field, so a hard requirement broke every admin invoice
    // save. It's auto-resolved from customerId (or a name lookup against
    // Customer, same as resolveCustomerId() below) in the hooks further
    // down instead. Do NOT scope the client portal by the `customer`
    // string below.
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true, default: null },
    customer:  { type: String, default: "", required: true, trim: true },
    // Billing contact snapshot from CreateInvoicePage — sent by the frontend
    // on every save but silently dropped before, since none of these were
    // declared on the schema (Mongoose strict mode strips unknown fields).
    billToAddress: { type: String, default: "" },
    billToContact: { type: String, default: "" },
    billToPhone:   { type: String, default: "" },
    billToEmail:   { type: String, default: "" },
    subject:   { type: String, default: "",    trim: true },
    date:      { type: String, default: "" },   // "YYYY-MM-DD"
    dueDate:   { type: String, default: "" },
    status:    { type: String, enum: ["draft", "saved", "paid", "pending", "credited"], default: "pending" },
    paid:      { type: Boolean, default: false },
    notes:     { type: String, default: "" },
    terms:     { type: String, default: "" },
    items:     { type: [ItemSchema], default: [] },
    additionalCharges: { type: [ChargeSchema], default: [] },

    // Computed totals — stored for fast list queries
    subtotal:  { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 }, // sum of additionalCharges' base amounts (pre-tax)
    gstAmount: { type: Number, default: 0 },    // tax from items AND additionalCharges combined
    total:     { type: Number, default: 0 },
    isDeleted:  { type: Boolean, default: false },
deletedAt:  { type: Date,    default: null  },
deletedBy:  { type: String,  default: null  },
module:     { type: String,  default: "Invoices" },
  },
  {
    timestamps: true,  // adds createdAt + updatedAt automatically
    versionKey: false,
  }
);

// NEW — fast path for "my invoices" queries in the client portal
InvoiceSchema.index({ client: 1, status: 1, createdAt: -1 });

// NEW — auto-resolves `client` so admin writes that never set it directly
// (CreateInvoicePage, the generic PUT route, etc.) don't break. Runs in
// pre('validate'), which fires BEFORE Mongoose checks any `required`
// constraint — a pre('save') hook would run too late for that purpose.
InvoiceSchema.pre("validate", async function (next) {
  if (!this.client) {
    try {
      if (this.customerId) {
        this.client = this.customerId;
      } else if (this.customer) {
        const Customer = mongoose.model("Customer"); // relies on models/Customer.js having been imported somewhere already (it is — invoice.routes.js does this)
        const match = await Customer.findOne({
          name: new RegExp(`^${this.customer.trim()}$`, "i"),
          isDeleted: { $ne: true },
        });
        if (match) this.client = match._id;
      }
    } catch (err) {
      console.warn("[Invoice] could not auto-resolve client:", err.message);
    }
  }
  next();
});

// Auto-compute totals before every save
InvoiceSchema.pre("save", function (next) {
  const sub      = this.items.reduce((s, it) => s + it.qty * it.rate, 0);
  const itemsGst = this.items.reduce((s, it) => s + it.qty * it.rate * (it.gst / 100), 0);
  const charges  = (this.additionalCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const chargesGst = (this.additionalCharges || []).reduce((s, c) => s + (c.amount || 0) * ((c.gst || 0) / 100), 0);
  this.subtotal     = parseFloat(sub.toFixed(2));
  this.extraCharges = parseFloat(charges.toFixed(2));
  this.gstAmount     = parseFloat((itemsGst + chargesGst).toFixed(2));
  this.total         = parseFloat((sub + charges + itemsGst + chargesGst).toFixed(2));
  next();
});

// Also recompute on findOneAndUpdate
InvoiceSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const items   = update?.items || update?.$set?.items;
  const charges = update?.additionalCharges || update?.$set?.additionalCharges;
  if (items || charges) {
    const itemList    = items || [];
    const chargeList  = charges || [];
    const sub         = itemList.reduce((s, it) => s + it.qty * it.rate, 0);
    const itemsGst    = itemList.reduce((s, it) => s + it.qty * it.rate * (it.gst / 100), 0);
    const chargesBase = chargeList.reduce((s, c) => s + (c.amount || 0), 0);
    const chargesGst  = chargeList.reduce((s, c) => s + (c.amount || 0) * ((c.gst || 0) / 100), 0);
    this.set({
      subtotal:     parseFloat(sub.toFixed(2)),
      extraCharges: parseFloat(chargesBase.toFixed(2)),
      gstAmount:    parseFloat((itemsGst + chargesGst).toFixed(2)),
      total:        parseFloat((sub + chargesBase + itemsGst + chargesGst).toFixed(2)),
    });
  }

  // NEW — same client auto-resolution as pre('validate'), but for the
  // findByIdAndUpdate path (routes/invoice.routes.js PUT /:id), which
  // never runs document-level pre('validate')/pre('save') hooks at all.
  const setBlock = update?.$set || update || {};
  if (!setBlock.client) {
    try {
      let clientId = setBlock.customerId;
      if (!clientId && setBlock.customer) {
        const Customer = mongoose.model("Customer");
        const match = await Customer.findOne({
          name: new RegExp(`^${setBlock.customer.trim()}$`, "i"),
          isDeleted: { $ne: true },
        });
        clientId = match?._id || null;
      }
      if (clientId) this.set({ client: clientId });
    } catch (err) {
      console.warn("[Invoice] could not auto-resolve client on update:", err.message);
    }
  }

  next();
});

const Invoice = mongoose.model("Invoice", InvoiceSchema);
export default Invoice;
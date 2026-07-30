// models/CreditNote.model.js
import mongoose from "mongoose";

const CreditNoteSchema = new mongoose.Schema(
  {
    creditNoteId: { type: String, required: true, unique: true }, // CN-###

    invoice:   { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    invoiceNo: { type: String, required: true }, // denormalized for fast list rendering, mirrors invoiceNo at time of conversion

    customer:   { type: String, default: "" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },

    subtotal:  { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total:     { type: Number, required: true },

    reason: { type: String, default: "" },
    status: { type: String, enum: ["issued", "cancelled"], default: "issued" },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

// Auto-increment CN-### the same way you'd expect from your other ID patterns
CreditNoteSchema.pre("validate", async function (next) {
  if (this.isNew && !this.creditNoteId) {
    const CreditNote = mongoose.model("CreditNote");
    const last = await CreditNote.findOne({}).sort({ createdAt: -1 });
    const lastNum = last?.creditNoteId ? parseInt(last.creditNoteId.replace("CN-", ""), 10) : 0;
    this.creditNoteId = `CN-${String(lastNum + 1).padStart(3, "0")}`;
  }
  next();
});

const CreditNote = mongoose.model("CreditNote", CreditNoteSchema);
export default CreditNote;
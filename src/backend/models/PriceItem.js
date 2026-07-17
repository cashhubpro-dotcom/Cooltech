import mongoose from "mongoose";

// Auto-generate PRC-01, PRC-02 style IDs
const generatePriceId = async () => {
  const count = await PriceItem.countDocuments();
  const next = count + 1;
  return `PRC-${String(next).padStart(2, "0")}`;
};

export const VALID_CATEGORIES = ["Service", "Gas Refill", "Installation", "Repair", "AMC", "Other"];
export const VALID_UNITS = ["per visit", "per cylinder", "per unit", "per hour", "per kg", "per set", "per year", "per month", "per day"];
export const VALID_GST = [0, 5, 12, 18, 28];

const priceItemSchema = new mongoose.Schema(
  {
    priceId: {
      type: String,
      unique: true,
    },

    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: VALID_CATEGORIES,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}`,
      },
      default: "Service",
    },

    unit: {
      type: String,
      required: [true, "Unit is required"],
      enum: {
        values: VALID_UNITS,
        message: `Unit must be one of: ${VALID_UNITS.join(", ")}`,
      },
      default: "per visit",
    },

    price: {
      type: Number,
      required: [true, "Price (ex-GST) is required"],
      min: [0, "Price cannot be negative"],
    },

    gstPercent: {
      type: Number,
      required: [true, "GST % is required"],
      enum: {
        values: VALID_GST,
        message: `GST % must be one of: ${VALID_GST.join(", ")}`,
      },
      default: 18,
    },

    totalInclGst: {
      type: Number,
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive"],
        message: 'Status must be "Active" or "Inactive"',
      },
      default: "Active",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save hook ─────────────────────────────────────────
priceItemSchema.pre("save", async function (next) {
  this.totalInclGst = parseFloat(
    (this.price * (1 + this.gstPercent / 100)).toFixed(2)
  );

  if (this.isNew && !this.priceId) {
    this.priceId = await generatePriceId();
  }

  next();
});

// ── Indexes ───────────────────────────────────────────────
priceItemSchema.index({ name: "text" });
priceItemSchema.index({ category: 1 });
priceItemSchema.index({ status: 1 });

const PriceItem = mongoose.model("PriceItem", priceItemSchema);

export default PriceItem;
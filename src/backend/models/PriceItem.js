import mongoose from "mongoose";
import { PriceItemCategory, PriceItemUnit } from "./optionSetModels.js";

// Auto-generate PRC-01, PRC-02 style IDs
const generatePriceId = async () => {
  const count = await PriceItem.countDocuments();
  const next = count + 1;
  return `PRC-${String(next).padStart(2, "0")}`;
};

// Kept as fallback/legacy exports in case anything else still imports these —
// no longer used for schema validation below (see category / unit fields).
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
      default: "Service",
      validate: {
        validator: async (value) =>
          !!(await PriceItemCategory.exists({ name: value, isActive: true, isDeleted: false })),
        message: (props) => `"${props.value}" is not a valid Category`,
      },
    },

    unit: {
      type: String,
      required: [true, "Unit is required"],
      default: "per visit",
      validate: {
        validator: async (value) =>
          !!(await PriceItemUnit.exists({ name: value, isActive: true, isDeleted: false })),
        message: (props) => `"${props.value}" is not a valid Unit`,
      },
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
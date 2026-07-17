// models/GstCategory.js
import mongoose from 'mongoose';

const GstCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: '',
    },
    hsn: {
      type: String,
      trim: true,
      default: '',
    },
    rate: {
      type: Number,
      required: [true, 'GST rate is required'],
      min: [0, 'Rate cannot be negative'],
      max: [28, 'Rate cannot exceed 28%'],
    },
    supplyType: {
      type: String,
      enum: ['intra', 'inter'],
      default: 'intra',
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notification: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Fast lookup of active categories, most-recently-effective first
GstCategorySchema.index({ status: 1, effectiveFrom: -1 });

export default mongoose.model('GstCategory', GstCategorySchema);
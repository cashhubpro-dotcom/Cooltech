// models/GstHistory.js
import mongoose from 'mongoose';

const GstHistorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GstCategory',
      required: true,
    },
    categoryName: {
      // snapshot so history reads correctly even if the category is later renamed/deleted
      type: String,
      required: true,
    },
    oldRate: {
      type: Number,
      default: null, // null = this entry represents a brand-new category being created
    },
    newRate: {
      type: Number,
      required: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    notification: {
      type: String,
      trim: true,
      default: '',
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedOn: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

GstHistorySchema.index({ changedOn: -1 });

export default mongoose.model('GstHistory', GstHistorySchema);
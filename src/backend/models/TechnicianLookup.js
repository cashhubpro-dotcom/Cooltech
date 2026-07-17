// models/TechnicianLookup.js
// One document per option per category.
// Categories: role | department | employmentType | reportingTo | vehicleType | bank

import mongoose from 'mongoose';

const technicianLookupSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['role', 'department', 'employmentType', 'reportingTo', 'vehicleType', 'bank'],
  },
  value:    { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  order:    { type: Number,  default: 0 },
}, { timestamps: true });

// No two entries with same category+value
technicianLookupSchema.index({ category: 1, value: 1 }, { unique: true });

export const TechnicianLookup = mongoose.model('TechnicianLookup', technicianLookupSchema);
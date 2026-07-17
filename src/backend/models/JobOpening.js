// server/models/JobOpening.js
import mongoose from 'mongoose';
import {
  STAGES,
  DEPARTMENTS,
  JOB_TYPES,
  SOURCES,
  URGENCY_LEVELS,
  JOB_STATUSES,
} from '../constants/recruitmentEnums.js';

const { Schema } = mongoose;

// ── Applicant (embedded subdocument — lives inside a JobOpening's pipeline) ──
const ApplicantSchema = new Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, trim: true, default: '' },
    phone:          { type: String, trim: true, default: '' },
    experience:     { type: Number, default: 0, min: 0 },
    currentRole:    { type: String, trim: true, default: '' },
    expectedSalary: { type: Number, default: 0, min: 0 },
    source:         { type: String, enum: SOURCES, default: 'Referral' },
    resumeLink:     { type: String, trim: true, default: '' },
    skills:         { type: [String], default: [] },
    rating:         { type: Number, default: 0, min: 0, max: 5 },
    notes:          { type: String, default: '' },
    appliedOn:      { type: Date, default: Date.now },
    stage:          { type: String, enum: STAGES, default: 'Applied' },
  },
  { timestamps: true }
);

// ── Job opening ───────────────────────────────────────────────────────────
const JobOpeningSchema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    dept:        { type: String, enum: DEPARTMENTS, default: 'Technical' },
    type:        { type: String, enum: JOB_TYPES, default: 'Full-time' },
    location:    { type: String, trim: true, default: '' },
    openings:    { type: Number, default: 1, min: 1 },
    experience:  { type: String, trim: true, default: '' },
    salaryMin:   { type: Number, default: 0, min: 0 },
    salaryMax:   { type: Number, default: 0, min: 0 },
    urgency:     { type: String, enum: URGENCY_LEVELS, default: 'Normal' },
    deadline:    { type: String, default: '' }, // kept as plain string to match the date-input value from the form
    skills:      { type: [String], default: [] },
    description: { type: String, default: '' },
    status:      { type: String, enum: JOB_STATUSES, default: 'Active' },
    applicants:  { type: [ApplicantSchema], default: [] },

    // ── soft delete (createCRUD convention) ──────────────────────────────
    isDeleted:   { type: Boolean, default: false },
    deletedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

// Lightweight text index so createCRUD's `search` query param (title, dept)
// stays fast once you have a few hundred job openings.
JobOpeningSchema.index({ title: 'text', dept: 'text' });

export default mongoose.model('JobOpening', JobOpeningSchema);
// models/ChecklistTemplate.js
//
// Admin-editable set of default checklist items per Job.type. A new Job
// gets seeded from here automatically (see the pre('save') hook added to
// Job.js) — the technician can then add their own items on top of the
// template on-site, but can't delete a template item (only ones they added
// themselves). Mount with createCRUD the same way Technician/Job are, e.g.:
//
//   router.use('/checklist-templates', protect, adminOnly, createCRUD(ChecklistTemplate, {
//     searchFields: ['jobType'],
//   }));

import mongoose from 'mongoose';

const checklistTemplateSchema = new mongoose.Schema({
  jobType: {
    type: String,
    enum: ['Service', 'Installation', 'Repair', 'AMC Visit', 'Inspection'],
    unique: true,
    required: true,
  },
  items: [{ type: String, required: true }],
}, { timestamps: true });

export default mongoose.model('ChecklistTemplate', checklistTemplateSchema);
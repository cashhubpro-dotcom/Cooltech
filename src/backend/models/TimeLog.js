import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true },
    job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job',        default: null },
    type:       { type: String, required: true },
    customer:   { type: String, default: '—' },
    date:       { type: String, required: true },
    start:      { type: String, required: true },
    end:        { type: String, required: true },
    hrs:        { type: Number, required: true },
    billable:   { type: Boolean, default: false },
    notes:      { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('TimeLog', timeLogSchema);
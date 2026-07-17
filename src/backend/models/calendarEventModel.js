import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  eventId:   { type: String, unique: true },
  title:     { type: String, required: true },
  date:      { type: Date,   required: true },
  type:      { type: String, enum: ['task', 'job', 'meeting', 'holiday'], default: 'meeting' },
  desc:      { type: String, default: '' },
  source:    { type: String, enum: ['manual', 'task'], default: 'manual' }, // manual = user added, task = from task manager
  refId:     { type: String, default: '' }, // taskId if source=task
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

calendarEventSchema.pre('save', async function (next) {
  if (!this.eventId) {
    const count    = await mongoose.model('CalendarEvent').countDocuments();
    this.eventId   = `EVT-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('CalendarEvent', calendarEventSchema);
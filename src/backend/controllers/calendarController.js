import CalendarEvent from '../models/calendarEventModel.js';
import Task          from '../models/taskModel.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

const fmtDate = (d) => {
  if (!d) return null;
  try {
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  } catch { return null; }
};

const mapEvent = (e) => ({
  id:        e.eventId,
  _id:       e._id.toString(),
  title:     e.title,
  date:      fmtDate(e.date),
  type:      e.type,
  desc:      e.desc || '',
  source:    e.source,
  refId:     e.refId || '',
  createdAt: e.createdAt,
});

// GET /api/calendar?month=2026-05  — fetch manual events + tasks for a month
export const getEvents = async (req, res) => {
  try {
    const { month } = req.query; // e.g. "2026-05"

    let start, end;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end   = new Date(y, m, 1);      // first day of next month
    } else {
      // default: current month
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // fetch manual calendar events for this month
    const manualEvents = await CalendarEvent.find({
      isDeleted: false,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });

    // fetch tasks due this month (not done)
    const tasks = await Task.find({
      isDeleted: false,
      status:    { $ne: 'done' },
      due:       { $gte: start, $lt: end },
    }).sort({ due: 1 });

    const taskEvents = tasks.map(t => ({
      id:         `task-${t._id}`,
      _id:        t._id.toString(),
      title:      t.title,
      date:       fmtDate(t.due),
      type:       'task',
      desc:       `Assigned to: ${t.assignedTo}`,
      source:     'task',
      refId:      t.taskId,
      priority:   t.priority,
      assignedTo: t.assignedTo,
      status:     t.status,
    }));

    ok(res, {
      events:     manualEvents.map(mapEvent),
      taskEvents,
    });
  } catch (e) { err(res, e.message); }
};

// GET /api/calendar/all — fetch all events (no month filter)
export const getAllEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ isDeleted: false }).sort({ date: 1 });
    ok(res, events.map(mapEvent));
  } catch (e) { err(res, e.message); }
};

// POST /api/calendar — create manual event
export const createEvent = async (req, res) => {
  try {
    const { title, date, type, desc } = req.body;
    if (!title || !date) return err(res, 'title and date are required', 400);

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return err(res, 'Invalid date', 400);

    const event = await CalendarEvent.create({
      title, date: dateObj,
      type:   type  || 'meeting',
      desc:   desc  || '',
      source: 'manual',
    });

    ok(res, mapEvent(event), 201);
  } catch (e) { err(res, e.message); }
};

// PUT /api/calendar/:id — update event
export const updateEvent = async (req, res) => {
  try {
    const { title, date, type, desc } = req.body;
    const updateData = { title, type, desc };
    if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return err(res, 'Invalid date', 400);
      updateData.date = dateObj;
    }
    const event = await CalendarEvent.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!event) return err(res, 'Event not found', 404);
    ok(res, mapEvent(event));
  } catch (e) { err(res, e.message); }
};

// DELETE /api/calendar/:id — soft delete
export const deleteEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!event) return err(res, 'Event not found', 404);
    ok(res, { message: 'Event deleted' });
  } catch (e) { err(res, e.message); }
};

// GET /api/calendar/stats?month=2026-05
export const getStats = async (req, res) => {
  try {
    const { month } = req.query;
    let start, end;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      start = new Date(y, m - 1, 1);
      end   = new Date(y, m, 1);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const [meetings, jobs, tasks] = await Promise.all([
      CalendarEvent.countDocuments({ isDeleted: false, type: 'meeting', date: { $gte: start, $lt: end } }),
      CalendarEvent.countDocuments({ isDeleted: false, type: 'job',     date: { $gte: start, $lt: end } }),
      Task.countDocuments({ isDeleted: false, status: { $ne: 'done' }, due: { $gte: start, $lt: end } }),
    ]);

    ok(res, { meetings, jobs, tasks });
  } catch (e) { err(res, e.message); }
};
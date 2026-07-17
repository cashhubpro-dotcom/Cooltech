import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Task from '../models/taskModel.js';
import { classifyKind } from '../middleware/taskUpload.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname   = path.dirname(__filename);
const UPLOAD_DIR  = path.join(__dirname, '..', 'uploads', 'tasks');

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

// ─── Safe date formatter ───────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return null;
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

// ─── Activity log helper ────────────────────────────────────────────────────────
// Pushes one entry to task.activity. Caller is responsible for saving the doc.
const logActivity = (task, type, message, actor = 'Admin', meta = undefined) => {
  task.activity.push({ type, actor, message, meta, at: new Date() });
};

const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABEL = { urgent: 'Urgent', high: 'High', normal: 'Normal', low: 'Low' };

// ─── Shared task mapper ────────────────────────────────────────────────────────
const mapTask = (t) => ({
  id:         t.taskId,
  _id:        t._id.toString(),
  title:      t.title,
  category:   t.category,
  assignedTo: t.assignedTo,
  due:        fmtDate(t.due),
  priority:   t.priority,
  status:     t.status,
  notes:      t.notes || '',

  // NEW
  comments: (t.comments || []).map(c => ({
    _id:      c._id.toString(),
    author:   c.author,
    text:     c.text,
    at:       c.at,
    editedAt: c.editedAt || null,
  })).sort((a, b) => new Date(a.at) - new Date(b.at)),

  attachments: (t.attachments || []).map(a => ({
    _id:        a._id.toString(),
    fileName:   a.fileName,
    url:        a.url,
    mimeType:   a.mimeType,
    size:       a.size,
    kind:       a.kind,
    uploadedBy: a.uploadedBy,
    uploadedAt: a.uploadedAt,
  })).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),

  activity: (t.activity || []).map(a => ({
    _id:     a._id.toString(),
    type:    a.type,
    actor:   a.actor,
    message: a.message,
    meta:    a.meta,
    at:      a.at,
  })).sort((a, b) => new Date(b.at) - new Date(a.at)), // newest first, Trello-style

  createdAt:  t.createdAt,
  deletedAt:  t.deletedAt,
  deletedBy:  t.deletedBy,
  isDeleted:  t.isDeleted,
});

// GET /api/tasks?search=&status=&priority=&category=&page=1&limit=20
export const getTasks = async (req, res) => {
  try {
    const { search = '', status, priority, category, page = 1, limit = 20 } = req.query;
    const q = { isDeleted: false };

    if (search) q.$or = [
      { title:      { $regex: search, $options: 'i' } },
      { assignedTo: { $regex: search, $options: 'i' } },
      { category:   { $regex: search, $options: 'i' } },
      { taskId:     { $regex: search, $options: 'i' } },
    ];
    if (status   && status   !== 'all') q.status   = status;
    if (priority && priority !== 'all') q.priority = priority;
    if (category && category !== 'all') q.category = category;

    const total = await Task.countDocuments(q);
    const tasks = await Task.find(q)
      .sort({ createdAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json({
      success: true,
      data: tasks.map(mapTask),
      pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) },
    });
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/stats
export const getTaskStats = async (req, res) => {
  try {
    const [todo, in_progress, done, urgent] = await Promise.all([
      Task.countDocuments({ status: 'todo',        isDeleted: false }),
      Task.countDocuments({ status: 'in_progress', isDeleted: false }),
      Task.countDocuments({ status: 'done',        isDeleted: false }),
      Task.countDocuments({ status: { $ne: 'done' }, priority: 'urgent', isDeleted: false }),
    ]);
    ok(res, { todo, in_progress, done, urgent });
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/deleted
export const getDeletedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isDeleted: true }).sort({ deletedAt: -1 });
    ok(res, tasks.map(mapTask));
  } catch (e) { err(res, e.message); }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, category, assignedTo, due, priority, status, notes } = req.body;
    if (!title || !category || !assignedTo || !due)
      return err(res, 'title, category, assignedTo, due are required', 400);

    const dueDate = new Date(due);
    if (isNaN(dueDate.getTime())) return err(res, 'Invalid due date', 400);

    const task = new Task({
      title, category, assignedTo,
      due: dueDate,
      priority: priority || 'normal',
      status:   status   || 'todo',
      notes:    notes    || '',
    });

    // FIX/NEW: seed the activity log with a "created" entry so every task's
    // feed has a starting point, matching Trello's "X added this card" entry.
    logActivity(task, 'created', `created this task`, 'Admin');

    await task.save();
    ok(res, mapTask(task), 201);
  } catch (e) { err(res, e.message); }
};

// PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const { title, category, assignedTo, due, priority, status, notes } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return err(res, 'Task not found', 404);

    // ── Build a diff-aware activity trail before applying changes ──────────
    if (priority && priority !== task.priority) {
      logActivity(task, 'priority_change',
        `changed priority from ${PRIORITY_LABEL[task.priority]} to ${PRIORITY_LABEL[priority]}`,
        'Admin', { from: task.priority, to: priority });
    }
    if (status && status !== task.status) {
      logActivity(task, 'status_change',
        `moved this from ${STATUS_LABEL[task.status]} to ${STATUS_LABEL[status]}`,
        'Admin', { from: task.status, to: status });
    }
    if (title !== undefined && title !== task.title) {
      logActivity(task, 'edited', `renamed this task to "${title}"`, 'Admin');
    }
    if (assignedTo !== undefined && assignedTo !== task.assignedTo) {
      logActivity(task, 'edited', `reassigned this task to ${assignedTo}`, 'Admin');
    }

    if (title      !== undefined) task.title      = title;
    if (category   !== undefined) task.category   = category;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (priority   !== undefined) task.priority   = priority;
    if (status     !== undefined) task.status     = status;
    if (notes      !== undefined) task.notes      = notes;
    if (due) {
      const dueDate = new Date(due);
      if (isNaN(dueDate.getTime())) return err(res, 'Invalid due date', 400);
      task.due = dueDate;
    }

    await task.save();
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'done'].includes(status))
      return err(res, 'Invalid status', 400);

    const task = await Task.findById(req.params.id);
    if (!task) return err(res, 'Task not found', 404);

    if (status !== task.status) {
      logActivity(task, 'status_change',
        `moved this from ${STATUS_LABEL[task.status]} to ${STATUS_LABEL[status]}`,
        'Admin', { from: task.status, to: status });
    }
    task.status = status;
    await task.save();

    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id  — soft delete
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date(), deletedBy: 'Admin' },
      { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, { message: 'Task deleted' });
  } catch (e) { err(res, e.message); }
};

// PUT /api/tasks/:id/restore
export const restoreTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null, deletedBy: null },
      { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id/hard
export const hardDeleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return err(res, 'Task not found', 404);

    // also clean up any uploaded files belonging to this task
    (task.attachments || []).forEach(a => {
      const filePath = path.join(UPLOAD_DIR, path.basename(a.url));
      fs.unlink(filePath, () => {}); // best-effort, ignore errors
    });

    ok(res, { message: 'Task permanently deleted' });
  } catch (e) { err(res, e.message); }
};

// ══════════════════════════════════════════════════════════════════════════
// NEW: Comments
// ══════════════════════════════════════════════════════════════════════════

// POST /api/tasks/:id/comments   body: { text, author? }
export const addComment = async (req, res) => {
  try {
    const { text, author = 'Admin' } = req.body;
    if (!text || !text.trim()) return err(res, 'Comment text is required', 400);

    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) return err(res, 'Task not found', 404);

    const comment = { author, text: text.trim(), at: new Date() };
    task.comments.push(comment);
    logActivity(task, 'comment', `commented: "${text.trim().slice(0, 80)}${text.trim().length > 80 ? '…' : ''}"`, author);

    await task.save();
    ok(res, mapTask(task), 201);
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id/comments/:commentId
export const deleteComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) return err(res, 'Task not found', 404);

    task.comments = task.comments.filter(c => c._id.toString() !== req.params.commentId);
    await task.save();
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};

// ══════════════════════════════════════════════════════════════════════════
// NEW: Attachments (multer middleware runs before these in the route file)
// ══════════════════════════════════════════════════════════════════════════

// POST /api/tasks/:id/attachments   (multipart/form-data, field name: "file")
export const addAttachment = async (req, res) => {
  try {
    if (!req.file) return err(res, 'No file uploaded', 400);

    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) {
      // clean up the file we just saved since the task doesn't exist
      fs.unlink(req.file.path, () => {});
      return err(res, 'Task not found', 404);
    }

    const kind = classifyKind(req.file.mimetype);
    const attachment = {
      fileName:   req.file.originalname,
      storedName: req.file.filename,
      url:        `/uploads/tasks/${req.file.filename}`,
      mimeType:   req.file.mimetype,
      size:       req.file.size,
      kind,
      uploadedBy: req.body.uploadedBy || 'Admin',
      uploadedAt: new Date(),
    };

    task.attachments.push(attachment);
    logActivity(task, 'attachment_added', `attached ${kind} "${req.file.originalname}"`, attachment.uploadedBy, { fileName: req.file.originalname, kind });

    await task.save();
    ok(res, mapTask(task), 201);
  } catch (e) { err(res, e.message); }
};

// DELETE /api/tasks/:id/attachments/:attachmentId
export const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.isDeleted) return err(res, 'Task not found', 404);

    const attachment = task.attachments.find(a => a._id.toString() === req.params.attachmentId);
    if (!attachment) return err(res, 'Attachment not found', 404);

    // remove file from disk (best-effort)
    const filePath = path.join(UPLOAD_DIR, attachment.storedName);
    fs.unlink(filePath, () => {});

    task.attachments = task.attachments.filter(a => a._id.toString() !== req.params.attachmentId);
    logActivity(task, 'attachment_removed', `removed attachment "${attachment.fileName}"`, 'Admin');

    await task.save();
    ok(res, mapTask(task));
  } catch (e) { err(res, e.message); }
};
import express from 'express';
import {
  getTasks, getTaskStats, getDeletedTasks, getTaskById,
  createTask, updateTask, updateTaskStatus,
  deleteTask, restoreTask, hardDeleteTask,
  addComment, deleteComment,
  addAttachment, deleteAttachment,
} from '../controllers/taskController.js';
import { taskUpload } from '../middleware/taskUpload.middleware.js';

const router = express.Router();

// ── existing routes (unchanged) ────────────────────────────────────────────────
router.get('/stats',         getTaskStats);
router.get('/deleted',       getDeletedTasks);    // ← before /:id
router.get('/',              getTasks);
router.get('/:id',           getTaskById);
router.post('/',             createTask);
router.put('/:id',           updateTask);
router.patch('/:id/status',  updateTaskStatus);
router.delete('/:id',        deleteTask);
router.put('/:id/restore',   restoreTask);
router.delete('/:id/hard',   hardDeleteTask);

// ── NEW: comments ───────────────────────────────────────────────────────────────
router.post('/:id/comments',                addComment);
router.delete('/:id/comments/:commentId',   deleteComment);

// ── NEW: attachments ─────────────────────────────────────────────────────────────
// taskUpload.single('file') expects the frontend to send FormData with a
// field named "file" — see taskApi.uploadAttachment() in api.js
router.post('/:id/attachments',                  taskUpload.single('file'), addAttachment);
router.delete('/:id/attachments/:attachmentId',  deleteAttachment);

export default router;
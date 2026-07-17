import express from 'express';
import {
  getChannels, createChannel, deleteChannel,
  getMessages, sendMessage, deleteMessage,
  markRead, clearUnread, getChatStats, getOrCreateDM, getDeletedChannels, getDeletedMessages,
  restoreChannel, restoreMessage,
  hardDeleteChannel, hardDeleteMessage,
} from '../controllers/chatController.js';

const router = express.Router();

// stats
router.get('/stats', getChatStats);

// ── messages — deleted MUST be before /:channel ───────
router.get('/messages/deleted',           getDeletedMessages);  // ← FIRST
router.get('/messages/:channel',          getMessages);         // ← AFTER

// ── channels — deleted MUST be before /:id ────────────
router.get('/channels/deleted',           getDeletedChannels);  // ← FIRST
router.get('/channels',                   getChannels);
router.post('/channels/dm',               getOrCreateDM);
router.post('/channels',                  createChannel);
router.put('/channels/:id/restore',       restoreChannel);
router.delete('/channels/:id/hard',       hardDeleteChannel);
router.delete('/channels/:id',            deleteChannel);
router.patch('/channels/:id/clear-unread', clearUnread);

router.post('/messages',                  sendMessage);
router.put('/messages/:id/restore',       restoreMessage);
router.delete('/messages/:id/hard',       hardDeleteMessage);
router.delete('/messages/:id',            deleteMessage);
router.patch('/messages/:id/read',        markRead);

export default router;
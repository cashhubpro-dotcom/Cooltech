import express from "express";
import { status, chats, messages, send, sendMediaMessage, logout } from "../controllers/whatsappController.js";

const router = express.Router();

router.get("/status", status);
router.get("/chats", chats);
router.get("/chats/:chatId/messages", messages);
router.post("/chats/:chatId/send", send);
router.post("/chats/:chatId/send-media", sendMediaMessage);
router.post("/logout", logout);

export default router;
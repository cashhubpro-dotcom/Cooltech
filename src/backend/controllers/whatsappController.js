import {
  getStatus,
  listChats,
  getMessages,
  sendMessage,
  sendMedia,
  logoutWhatsApp,
} from "../services/whatsappService.js";

export const status = (req, res) => {
  res.json({ success: true, data: getStatus() });
};

export const chats = async (req, res) => {
  try {
    const data = await listChats();
    res.json({ success: true, data });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message }); // 409 = not connected yet
  }
};

export const messages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit } = req.query;
    const data = await getMessages(decodeURIComponent(chatId), limit ? +limit : 50);
    res.json({ success: true, data });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

export const send = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "text is required" });
    const data = await sendMessage(decodeURIComponent(chatId), text);
    res.json({ success: true, data });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

export const sendMediaMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { dataUrl, filename, caption } = req.body;
    if (!dataUrl || !filename) return res.status(400).json({ success: false, message: "dataUrl and filename are required" });
    const data = await sendMedia(decodeURIComponent(chatId), dataUrl, filename, caption || "");
    res.json({ success: true, data });
  } catch (e) {
    res.status(409).json({ success: false, message: e.message });
  }
};

export const logout = async (req, res) => {
  try {
    await logoutWhatsApp();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from "qrcode";
import fs from "fs";
import path from "path";

const CLIENT_ID = "cooltech-team";
const AUTH_DIR = path.resolve(".wwebjs_auth");
const CACHE_DIR = path.resolve(".wwebjs_cache");

let client = null;
let io = null;
let isRestarting = false; // guard against overlapping restarts

const state = {
  status: "disconnected",
  qrDataUrl: null,
  me: null,
};

function buildClient() {
  client = new Client({
    authStrategy: new LocalAuth({ clientId: CLIENT_ID }),
    puppeteer: {
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
  });

  client.on("loading_screen", (percent, message) => {
    console.log(`[whatsapp] loading: ${percent}% — ${message}`);
  });

  client.on("qr", async (qr) => {
    // QR is rendered in the admin panel (Team Chat page) via the wa:qr
    // socket event below — no need to also dump it to the terminal.
    console.log("[whatsapp] QR received — scan it from Team Chat in the admin panel");
    state.status = "qr";
    state.qrDataUrl = await qrcode.toDataURL(qr);
    io.emit("wa:qr", { qrDataUrl: state.qrDataUrl });
    io.emit("wa:status", { status: state.status });
  });

  client.on("authenticated", () => {
    console.log("[whatsapp] authenticated");
    state.status = "authenticated";
    io.emit("wa:status", { status: state.status });
  });

  client.on("auth_failure", (msg) => {
    console.error("[whatsapp] AUTH FAILURE:", msg);
    state.status = "disconnected";
    io.emit("wa:status", { status: state.status, error: msg });
  });

  client.on("ready", () => {
    console.log("[whatsapp] client ready");
    state.status = "ready";
    state.qrDataUrl = null;
    state.me = {
      number: client.info?.wid?.user,
      name: client.info?.pushname,
    };
    io.emit("wa:status", { status: state.status, me: state.me });
  });

  client.on("disconnected", async (reason) => {
    console.log("[whatsapp] disconnected:", reason);
    state.status = "disconnected";
    state.me = null;
    state.qrDataUrl = null;
    io.emit("wa:status", { status: state.status, reason });
    await cleanupAndRestart();
  });

  client.on("message", async (msg) => {
    try {
      const chat = await msg.getChat();
      io.emit("wa:message", {
        chatId: chat.id._serialized,
        chatName: chat.name || chat.id.user,
        isGroup: chat.isGroup,
        from: msg.from,
        fromMe: msg.fromMe,
        body: msg.body,
        timestamp: msg.timestamp,
        id: msg.id._serialized,
      });
    } catch (e) {
      console.error("[whatsapp] message handler failed:", e.message);
    }
  });

  client
    .initialize()
    .then(() => console.log("[whatsapp] initialize() resolved"))
    .catch((err) => {
      console.error("[whatsapp] initialize() FAILED:", err.message);
      state.status = "disconnected";
      state.qrDataUrl = null;
      io?.emit("wa:status", { status: state.status, error: err.message });

      // retry once after a delay instead of leaving the client permanently dead
      if (!isRestarting) {
        setTimeout(() => {
          console.log("[whatsapp] retrying initialize() after failure...");
          buildClient();
        }, 5000);
      }
    });
}

export function initWhatsApp(socketIoInstance) {
  io = socketIoInstance;
  console.log("[whatsapp] initializing client...");
  buildClient();
}

function rmDirSafe(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`[whatsapp] removed ${dir}`);
    }
  } catch (e) {
    console.warn(`[whatsapp] failed to remove ${dir}, retrying...`, e.message);
    setTimeout(() => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`[whatsapp] removed ${dir} on retry`);
      } catch (e2) {
        console.error(`[whatsapp] still failed to remove ${dir}:`, e2.message);
      }
    }, 1500);
  }
}

async function cleanupAndRestart() {
  if (isRestarting) {
    console.log("[whatsapp] restart already in progress, skipping duplicate call");
    return;
  }
  isRestarting = true;

  try {
    // 1. Fully tear down the old client/browser and WAIT for it
    if (client) {
      try {
        await client.destroy();
        console.log("[whatsapp] client.destroy() completed");
      } catch (e) {
        console.warn("[whatsapp] destroy() failed (continuing anyway):", e.message);
      }
    }

    // 2. Give Windows time to release chrome.exe's file locks before touching files
    await new Promise((r) => setTimeout(r, 3000));

    rmDirSafe(AUTH_DIR);
    rmDirSafe(CACHE_DIR);

    state.status = "disconnected";
    state.qrDataUrl = null;
    state.me = null;
    io?.emit("wa:status", { status: state.status });

    // 3. Relaunch after a short additional delay
    await new Promise((r) => setTimeout(r, 1500));

    console.log("[whatsapp] reinitializing client after logout...");
    buildClient();
  } catch (e) {
    // last-resort catch — guarantees this function NEVER throws up to the caller
    console.error("[whatsapp] cleanupAndRestart() failed unexpectedly:", e.message);
    state.status = "disconnected";
    io?.emit("wa:status", { status: state.status, error: e.message });
  } finally {
    isRestarting = false;
  }
}

export function getStatus() {
  return { status: state.status, qrDataUrl: state.qrDataUrl, me: state.me };
}

export async function listChats() {
  if (state.status !== "ready") throw new Error("WhatsApp not connected");
  const chats = await client.getChats();
  return chats
    .map((c) => ({
      id: c.id._serialized,
      name: c.name || c.id.user,
      isGroup: c.isGroup,
      unreadCount: c.unreadCount,
      lastMessage: c.lastMessage?.body || "",
      lastTimestamp: c.lastMessage?.timestamp || null,
    }))
    .sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));
}

const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export async function getMessages(chatId, limit = 50) {
  if (state.status !== "ready") throw new Error("WhatsApp not connected");
  const chat = await client.getChatById(chatId);
  const rawMessages = await chat.fetchMessages({ limit });

  const messages = await Promise.all(
    rawMessages.map(async (m) => {
      const base = {
        id: m.id._serialized,
        from: m.from,
        fromMe: m.fromMe,
        body: m.body,
        timestamp: m.timestamp,
        hasMedia: m.hasMedia,
        mediaType: m.type,
      };
      if (!m.hasMedia) return base;
      try {
        const media = await m.downloadMedia();
        if (!media) return base;
        const sizeBytes = Buffer.from(media.data, "base64").length;
        if (sizeBytes > MAX_MEDIA_BYTES) return { ...base, mediaTooLarge: true };
        return {
          ...base,
          mediaDataUrl: `data:${media.mimetype};base64,${media.data}`,
          mediaFilename: media.filename || null,
          mediaMimetype: media.mimetype,
        };
      } catch (e) {
        console.error("[whatsapp] media download failed:", e.message);
        return base;
      }
    })
  );

  return messages;
}

export async function sendMessage(chatId, text) {
  if (state.status !== "ready") throw new Error("WhatsApp not connected");
  const sent = await client.sendMessage(chatId, text);
  return { id: sent.id._serialized, from: sent.from, fromMe: true, body: sent.body, timestamp: sent.timestamp };
}

export async function sendMedia(chatId, dataUrl, filename, caption = "") {
  if (state.status !== "ready") throw new Error("WhatsApp not connected");
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) throw new Error("Invalid file data");
  const [, mimetype, base64] = match;
  const media = new MessageMedia(mimetype, base64, filename);
  const sent = await client.sendMessage(chatId, media, { caption });
  return {
    id: sent.id._serialized,
    from: sent.from,
    fromMe: true,
    body: sent.body || caption,
    timestamp: sent.timestamp,
    hasMedia: true,
    mediaDataUrl: dataUrl,
    mediaFilename: filename,
    mediaMimetype: mimetype,
  };
}

export async function logoutWhatsApp() {
  if (!client) return;
  try {
    await client.logout();
  } catch (e) {
    console.warn("[whatsapp] logout() threw (continuing with cleanup):", e.message);
  }
  await cleanupAndRestart();
}
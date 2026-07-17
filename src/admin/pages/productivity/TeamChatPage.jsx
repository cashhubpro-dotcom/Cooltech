import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE = API_URL.replace(/\/api\/?$/, "");
const socket = io(API_BASE, {
  autoConnect: true
});
const authHeaders = () => {
  // Matches the key used everywhere else in the app (see services/api.js)
  const token = localStorage.getItem("admin_token");
  return token ? {
    Authorization: `Bearer ${token}`
  } : {};
};
const EMOJIS = ["😀", "😂", "😍", "😎", "🙏", "👍", "👏", "🔥", "❤️", "🎉", "😢", "😡", "🤔", "💪", "✅", "❌", "📅", "📍", "☎️", "💼"];
const formatTime = unixSeconds => {
  if (!unixSeconds) return "";
  return new Date(unixSeconds * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};
const initialsOf = (name = "") => name.trim().charAt(0).toUpperCase() || "#";
const AVATAR_COLORS = ["var(--brand-whatsapp-accent)", "var(--x5b5fc7)", "var(--xd88c2b)", "var(--xc2516b)", "var(--x3b82c4)", "var(--purple)"];
const colorFor = (id = "") => AVATAR_COLORS[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const fileToDataUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const MediaBubbleContent = ({
  m
}) => {
  if (!m.hasMedia) return <div>{m.body}</div>;
  if (m.mediaTooLarge) {
    return <div className="ap-team-chat-page-1">📎 Attachment too large to preview</div>;
  }
  if (!m.mediaDataUrl) {
    return <div className="ap-team-chat-page-2">📎 {m.mediaType || "Attachment"}</div>;
  }
  if (m.mediaMimetype?.startsWith("image/")) {
    return <div>
        <img src={m.mediaDataUrl} alt={m.mediaFilename || "image"} className="ap-team-chat-page-3" />
        {m.body && <div className="ap-team-chat-page-4">{m.body}</div>}
      </div>;
  }
  if (m.mediaMimetype?.startsWith("video/")) {
    return <video src={m.mediaDataUrl} controls className="ap-team-chat-page-5" />;
  }
  if (m.mediaMimetype?.startsWith("audio/")) {
    return <audio src={m.mediaDataUrl} controls className="ap-team-chat-page-6" />;
  }
  return <a href={m.mediaDataUrl} download={m.mediaFilename || "file"} className="ap-team-chat-page-7">
      <span className="ap-team-chat-page-8">📄</span>
      <span className="ap-team-chat-page-9">{m.mediaFilename || "Download file"}</span>
    </a>;
};
const TeamChatPage = () => {
  const [waStatus, setWaStatus] = useState("disconnected");
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/whatsapp/status`, {
      headers: authHeaders()
    }).then(r => r.json()).then(res => {
      if (!res.success) {
        setError(res.message || "Failed to load WhatsApp status");
        return;
      }
      setWaStatus(res.data.status);
      setQrDataUrl(res.data.qrDataUrl);
      setMe(res.data.me);
      if (res.data.status === "ready") loadChats();
    }).catch(e => setError(e.message));
    socket.on("wa:qr", ({
      qrDataUrl
    }) => setQrDataUrl(qrDataUrl));
    socket.on("wa:status", ({
      status,
      me
    }) => {
      setWaStatus(status);
      if (status === "ready") {
        setQrDataUrl(null);
        if (me) setMe(me);
        loadChats();
      }
    });
    socket.on("wa:message", msg => {
      loadChats();
      if (msg.chatId === activeChatId) setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.off("wa:qr");
      socket.off("wa:status");
      socket.off("wa:message");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);
  const loadChats = () => {
    setLoadingChats(true);
    fetch(`${API_BASE}/api/whatsapp/chats`, {
      headers: authHeaders()
    }).then(r => r.json()).then(res => res.success ? setChats(res.data) : setError(res.message)).catch(e => setError(e.message)).finally(() => setLoadingChats(false));
  };
  const openChat = chatId => {
    setActiveChatId(chatId);
    setShowEmoji(false);
    setLoadingMessages(true);
    fetch(`${API_BASE}/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`, {
      headers: authHeaders()
    }).then(r => r.json()).then(res => res.success ? setMessages(res.data) : setError(res.message)).catch(e => setError(e.message)).finally(() => setLoadingMessages(false));
  };
  const sendMsg = () => {
    if (!input.trim() || !activeChatId) return;
    const text = input;
    setInput("");
    setShowEmoji(false);
    fetch(`${API_BASE}/api/whatsapp/chats/${encodeURIComponent(activeChatId)}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify({
        text
      })
    }).then(r => r.json()).then(res => {
      if (res.success) setMessages(prev => [...prev, {
        ...res.data,
        chatId: activeChatId
      }]);else setError(res.message);
    }).catch(e => setError(e.message));
  };
  const handleFilePick = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeChatId) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch(`${API_BASE}/api/whatsapp/chats/${encodeURIComponent(activeChatId)}/send-media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          dataUrl,
          filename: file.name,
          caption: ""
        })
      }).then(r => r.json());
      if (res.success) setMessages(prev => [...prev, {
        ...res.data,
        chatId: activeChatId
      }]);else setError(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };
  const activeChat = chats.find(c => c.id === activeChatId);

  // ── QR / connect screen ──
  if (waStatus !== "ready") {
    return <div className="ap-team-chat-page-10">
        <div className="ap-team-chat-page-11">Connect WhatsApp</div>
        {waStatus === "qr" && qrDataUrl ? <>
            <img src={qrDataUrl} alt="Scan with WhatsApp" className="ap-team-chat-page-12" />
            <div className="ap-team-chat-page-13">
              Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this code.
            </div>
          </> : <div className="ap-team-chat-page-14">
            {waStatus === "authenticated" ? "Authenticated — finishing setup…" : "Waiting for QR code…"}
          </div>}
        {error && <div className="ap-team-chat-page-15">{error}</div>}
      </div>;
  }

  // ── Real WhatsApp-styled chat UI ──
  return <div className="ap-team-chat-page-16">

      {/* Sidebar */}
      <div className="ap-team-chat-page-17">
        <div className="ap-team-chat-page-18">
          <div className="ap-team-chat-page-19">
            <div style={{
            background: colorFor(me?.number || "me")
          }} className="ap-team-chat-page-20">
              {initialsOf(me?.name)}
            </div>
            <div>
              <div className="ap-team-chat-page-21">{me?.name || "WhatsApp"}</div>
              <div className="ap-team-chat-page-22">{me?.number}</div>
            </div>
          </div>
        </div>

        <div className="ap-team-chat-page-23">
          <div className="ap-team-chat-page-24">
            <span className="ap-team-chat-page-25">🔍</span>
            <input placeholder="Search or start new chat" className="ap-team-chat-page-26" />
          </div>
        </div>

        <div className="ap-team-chat-page-27">
          {loadingChats && <div className="ap-team-chat-page-28">Loading chats…</div>}
          {chats.map(c => <div key={c.id} onClick={() => openChat(c.id)} style={{
          background: c.id === activeChatId ? "var(--x2a3942)" : "transparent"
        }} className="ap-team-chat-page-29">
              <div style={{
            background: colorFor(c.id)
          }} className="ap-team-chat-page-30">
                {initialsOf(c.name)}
              </div>
              <div className="ap-team-chat-page-31">
                <div className="ap-team-chat-page-32">
                  <span className="ap-team-chat-page-33">{c.name}</span>
                  <span className="ap-team-chat-page-34">{formatTime(c.lastTimestamp)}</span>
                </div>
                <div className="ap-team-chat-page-35">
                  <span className="ap-team-chat-page-36">{c.lastMessage}</span>
                  {c.unreadCount > 0 && <span className="ap-team-chat-page-37">{c.unreadCount}</span>}
                </div>
              </div>
            </div>)}
        </div>
      </div>

      {/* Active chat */}
      <div className="ap-team-chat-page-38">
        {!activeChatId ? <div className="ap-team-chat-page-39">
            Select a chat to start messaging
          </div> : <>
            <div className="ap-team-chat-page-40">
              <div style={{
            background: colorFor(activeChatId)
          }} className="ap-team-chat-page-41">
                {initialsOf(activeChat?.name)}
              </div>
              <div className="ap-team-chat-page-42">{activeChat?.name}</div>
            </div>

            <div className="ap-team-chat-page-43">
              {loadingMessages && <div className="ap-team-chat-page-44">Loading messages…</div>}
              {messages.map(m => <div key={m.id} style={{
            alignSelf: m.fromMe ? "flex-end" : "flex-start"
          }} className="ap-team-chat-page-45">
                  <div style={{
              background: m.fromMe ? "var(--x005c4b)" : "var(--x202c33)",
              borderRadius: m.fromMe ? "8px 0 8px 8px" : "0 8px 8px 8px"
            }} className="ap-team-chat-page-46">
                    <MediaBubbleContent m={m} />
                    <div className="ap-team-chat-page-47">{formatTime(m.timestamp)}</div>
                  </div>
                </div>)}
              <div ref={bottomRef} />
            </div>

            {showEmoji && <div className="ap-team-chat-page-48">
                {EMOJIS.map(e => <span key={e} onClick={() => setInput(prev => prev + e)} className="ap-team-chat-page-49">{e}</span>)}
              </div>}

            <div className="ap-team-chat-page-50">
              <span onClick={() => setShowEmoji(v => !v)} className="ap-team-chat-page-51">😊</span>
              <span onClick={() => fileInputRef.current?.click()} className="ap-team-chat-page-52">📎</span>
              <input ref={fileInputRef} type="file" onChange={handleFilePick} className="ap-team-chat-page-53" />
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()} placeholder="Type a message" className="ap-team-chat-page-54" />
              {uploading && <span className="ap-team-chat-page-55">Uploading…</span>}
              <button onClick={sendMsg} className="ap-team-chat-page-56">
                Send
              </button>
            </div>
          </>}
      </div>

      {error && <div className="ap-team-chat-page-57">
          {error}
        </div>}
    </div>;
};
export default TeamChatPage;
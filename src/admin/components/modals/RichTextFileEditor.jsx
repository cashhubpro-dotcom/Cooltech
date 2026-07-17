// RichTextEditor.jsx — drop-in replacement matching the screenshot UI exactly
// Usage: <RichTextEditor files={files} setFiles={setFiles} placeholder="..." />
// getValue={ref} optional — attach a ref to read innerHTML

import { useRef, useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';

// ─── Icon helpers (pure SVG, no deps) ────────────────────────────────────────
const Ic = ({
  d,
  size = 15,
  viewBox = "0 0 16 16",
  stroke = true,
  fill = false,
  children,
  ...rest
}) => <svg width={size} height={size} viewBox={viewBox} fill={fill ? "currentColor" : "none"} stroke={stroke ? "currentColor" : "none"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>;

// ─── Toolbar button ───────────────────────────────────────────────────────────
const Btn = ({
  title,
  active,
  onClick,
  children,
  style = {}
}) => <button title={title} onMouseDown={e => {
  e.preventDefault();
  onClick();
}} style={{
  background: active ? "var(--xea580c18)" : "transparent",
  color: active ? "var(--brand)" : "var(--text-body)",
  ...style
}} onMouseEnter={e => {
  if (!active) e.currentTarget.style.background = COLORS.bg;
}} onMouseLeave={e => {
  if (!active) e.currentTarget.style.background = "transparent";
}} className="ap-rich-text-file-editor-1">
    {children}
  </button>;

// ─── Separator ────────────────────────────────────────────────────────────────
const Sep = () => <div className="ap-rich-text-file-editor-2" />;

// ─── Color picker popup ───────────────────────────────────────────────────────
const COLORS_GRID = ["var(--text-h1)", "var(--text-body)", "var(--text-muted)", "var(--text-faint)", "var(--border)", "var(--white)", "var(--danger-text)", "var(--brand)", "var(--xca8a04)", "var(--success-text)", "var(--info-text)", "var(--purple-text)", "var(--danger-border)", "var(--xfcd34d)", "var(--x6ee7b7)", "var(--x93c5fd)", "var(--xc4b5fd)", "var(--xf9a8d4)"];
const ColorPicker = ({
  onPick,
  onClose
}) => <div onMouseDown={e => e.preventDefault()} className="ap-rich-text-file-editor-3">
    {COLORS_GRID.map(c => <button key={c} onMouseDown={e => {
    e.preventDefault();
    onPick(c);
    onClose();
  }} style={{
    background: c
  }} className="ap-rich-text-file-editor-4" />)}
  </div>;

// ─── Emoji picker (minimal) ───────────────────────────────────────────────────
const EMOJIS = ["😊", "😂", "👍", "❤️", "🔥", "✅", "⚠️", "📌", "📎", "🎯", "💡", "🔧", "📞", "📧", "🚗", "🏠", "💰", "📅"];
const EmojiPicker = ({
  onPick,
  onClose
}) => <div onMouseDown={e => e.preventDefault()} className="ap-rich-text-file-editor-5">
    {EMOJIS.map(em => <button key={em} onMouseDown={e => {
    e.preventDefault();
    onPick(em);
    onClose();
  }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"} className="ap-rich-text-file-editor-6">{em}</button>)}
  </div>;

// ─── RichTextEditor ───────────────────────────────────────────────────────────
const RichTextFileEditor = ({
  placeholder = "Describe the issue…",
  files = [],
  setFiles,
  minHeight = 100,
  getValueRef // optional: { current } → set to () => editorRef.current?.innerHTML
}) => {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeStates, setActiveStates] = useState({});

  // expose getValue
  useEffect(() => {
    if (getValueRef) getValueRef.current = () => editorRef.current?.innerHTML ?? "";
  }, [getValueRef]);
  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    updateActive();
  };
  const updateActive = () => {
    setActiveStates({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull")
    });
  };
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };
  const insertImage = () => {
    const url = prompt("Image URL:");
    if (url) exec("insertImage", url);
  };
  const insertTable = () => {
    const html = `<table border="1" style="border-collapse:collapse;width:100%;font-size:13px;">
      <tr><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td></tr>
      <tr><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td><td style="padding:6px 8px;border:1px solid #ccc;">&nbsp;</td></tr>
    </table><p></p>`;
    exec("insertHTML", html);
  };
  const handleFiles = e => {
    const newFiles = Array.from(e.target.files);
    setFiles?.(prev => [...prev, ...newFiles]);
    e.target.value = "";
  };
  const removeFile = i => setFiles?.(prev => prev.filter((_, j) => j !== i));
  const formatSize = bytes => bytes > 1024 * 1024 ? (bytes / 1024 / 1024).toFixed(1) + " MB" : Math.round(bytes / 1024) + " KB";
  const fileIcon = f => f.type.startsWith("image") ? "🖼" : f.type === "application/pdf" ? "📄" : "📎";
  const closeAllPopups = () => {
    setShowTextColor(false);
    setShowHighlight(false);
    setShowEmoji(false);
  };

  // close popups on outside click
  useEffect(() => {
    const handler = () => closeAllPopups();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const tb = COLORS.body;
  return <div className="ap-rich-text-file-editor-7">
      <div style={{
      border: `1.5px solid ${focused ? COLORS.brand : COLORS.border}`,
      boxShadow: focused ? "0 0 0 3px var(--xea580c18)" : "none"
    }} className="ap-rich-text-file-editor-8">

        {/* ── Toolbar ── */}
        <div className="ap-rich-text-file-editor-9">

          {/* Paragraph format */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => {
          exec("formatBlock", e.target.value);
        }} className="ap-rich-text-file-editor-10">
            <option value="p">Normal</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
            <option value="h4">Heading 3</option>
          </select>

          <Sep />

          {/* Lists */}
          <Btn title="Ordered list" active={activeStates.orderedList} onClick={() => exec("insertOrderedList")}>
            <Ic viewBox="0 0 16 16">
              <line x1="6" y1="4" x2="14" y2="4" /><line x1="6" y1="8" x2="14" y2="8" /><line x1="6" y1="12" x2="14" y2="12" />
              <text x="1" y="4.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">1.</text>
              <text x="1" y="8.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">2.</text>
              <text x="1" y="12.8" fontSize="4" fill={tb} stroke="none" fontFamily="sans-serif">3.</text>
            </Ic>
          </Btn>
          <Btn title="Bullet list" active={activeStates.unorderedList} onClick={() => exec("insertUnorderedList")}>
            <Ic viewBox="0 0 16 16">
              <circle cx="2.5" cy="4" r="1.2" fill={tb} stroke="none" /><line x1="5.5" y1="4" x2="14" y2="4" />
              <circle cx="2.5" cy="8" r="1.2" fill={tb} stroke="none" /><line x1="5.5" y1="8" x2="14" y2="8" />
              <circle cx="2.5" cy="12" r="1.2" fill={tb} stroke="none" /><line x1="5.5" y1="12" x2="14" y2="12" />
            </Ic>
          </Btn>

          <Sep />

          {/* Alignment */}
          <Btn title="Align left" active={activeStates.justifyLeft} onClick={() => exec("justifyLeft")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" /><line x1="1" y1="6.5" x2="10" y2="6.5" /><line x1="1" y1="10" x2="15" y2="10" /><line x1="1" y1="13.5" x2="10" y2="13.5" /></Ic>
          </Btn>
          <Btn title="Align center" active={activeStates.justifyCenter} onClick={() => exec("justifyCenter")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" /><line x1="4" y1="6.5" x2="12" y2="6.5" /><line x1="1" y1="10" x2="15" y2="10" /><line x1="4" y1="13.5" x2="12" y2="13.5" /></Ic>
          </Btn>
          <Btn title="Align right" active={activeStates.justifyRight} onClick={() => exec("justifyRight")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" /><line x1="6" y1="6.5" x2="15" y2="6.5" /><line x1="1" y1="10" x2="15" y2="10" /><line x1="6" y1="13.5" x2="15" y2="13.5" /></Ic>
          </Btn>
          <Btn title="Justify" active={activeStates.justifyFull} onClick={() => exec("justifyFull")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" /><line x1="1" y1="6.5" x2="15" y2="6.5" /><line x1="1" y1="10" x2="15" y2="10" /><line x1="1" y1="13.5" x2="15" y2="13.5" /></Ic>
          </Btn>

          <Sep />

          {/* Text formatting */}
          <Btn title="Bold" active={activeStates.bold} onClick={() => exec("bold")}>
            <strong className="ap-rich-text-file-editor-11">B</strong>
          </Btn>
          <Btn title="Italic" active={activeStates.italic} onClick={() => exec("italic")}>
            <em className="ap-rich-text-file-editor-12">I</em>
          </Btn>
          <Btn title="Underline" active={activeStates.underline} onClick={() => exec("underline")}>
            <u className="ap-rich-text-file-editor-13">U</u>
          </Btn>
          <Btn title="Strikethrough" active={activeStates.strikeThrough} onClick={() => exec("strikeThrough")}>
            <s className="ap-rich-text-file-editor-14">S</s>
          </Btn>

          <Sep />

          {/* Image */}
          <Btn title="Insert image" onClick={insertImage}>
            <Ic viewBox="0 0 16 16">
              <rect x="1" y="2" width="14" height="12" rx="1.5" />
              <circle cx="5.5" cy="6" r="1.5" />
              <path d="M1 11l4-4 3 3 2-2 5 5" />
            </Ic>
          </Btn>

          {/* Link */}
          <Btn title="Insert link" onClick={insertLink}>
            <Ic d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
          </Btn>

          {/* Table */}
          <Btn title="Insert table" onClick={insertTable}>
            <Ic viewBox="0 0 16 16" stroke={tb}>
              <rect x="1" y="1" width="14" height="14" rx="1" />
              <line x1="1" y1="5.5" x2="15" y2="5.5" />
              <line x1="1" y1="10" x2="15" y2="10" />
              <line x1="5.5" y1="5.5" x2="5.5" y2="15" />
              <line x1="10" y1="5.5" x2="10" y2="15" />
            </Ic>
          </Btn>

          <Sep />

          {/* Text color */}
          <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-file-editor-15">
            <Btn title="Text color" onClick={() => {
            setShowHighlight(false);
            setShowEmoji(false);
            setShowTextColor(v => !v);
          }}>
              <div className="ap-rich-text-file-editor-16">
                <span className="ap-rich-text-file-editor-17">A</span>
                <div className="ap-rich-text-file-editor-18" />
              </div>
            </Btn>
            {showTextColor && <ColorPicker onPick={c => exec("foreColor", c)} onClose={() => setShowTextColor(false)} />}
          </div>

          {/* Highlight */}
          <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-file-editor-19">
            <Btn title="Highlight color" onClick={() => {
            setShowTextColor(false);
            setShowEmoji(false);
            setShowHighlight(v => !v);
          }}>
              <div className="ap-rich-text-file-editor-20">
                <Ic viewBox="0 0 16 16" size={12}>
                  <path d="M3 13l2-2 6-6-2-2-6 6z" fill="#FCD34D" stroke="#CA8A04" strokeWidth="1" />
                  <line x1="2" y1="14" x2="14" y2="14" />
                </Ic>
                <div className="ap-rich-text-file-editor-21" />
              </div>
            </Btn>
            {showHighlight && <ColorPicker onPick={c => exec("hiliteColor", c)} onClose={() => setShowHighlight(false)} />}
          </div>

          <Sep />

          {/* Indent */}
          <Btn title="Indent" onClick={() => exec("indent")}>
            <Ic viewBox="0 0 16 16"><line x1="1" y1="3" x2="15" y2="3" /><line x1="5" y1="6.5" x2="15" y2="6.5" /><line x1="5" y1="10" x2="15" y2="10" /><line x1="1" y1="13.5" x2="15" y2="13.5" /><polyline points="1,6.5 3.5,8 1,9.5" /></Ic>
          </Btn>

          {/* Clear formatting */}
          <Btn title="Clear formatting" onClick={() => exec("removeFormat")}>
            <Ic viewBox="0 0 16 16">
              <path d="M4 3h8L9 8.5V12l-2 1V8.5z" /><line x1="2" y1="14" x2="7" y2="14" />
              <line x1="11" y1="3" x2="14" y2="6" strokeWidth="2" />
            </Ic>
          </Btn>
        </div>

        {/* ── Content area ── */}
        <div ref={editorRef} contentEditable suppressContentEditableWarning data-placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyUp={updateActive} onMouseUp={updateActive} style={{
        minHeight
      }} className="ap-rich-text-file-editor-22" />

        {/* ── Emoji button — bottom right inside editor ── */}
        <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-file-editor-23">
          <div className="ap-rich-text-file-editor-24">
            <Btn title="Insert emoji" onClick={() => {
            setShowTextColor(false);
            setShowHighlight(false);
            setShowEmoji(v => !v);
          }} className="ap-rich-text-file-editor-25">
              <span className="ap-rich-text-file-editor-26">🙂</span>
            </Btn>
            {showEmoji && <EmojiPicker onPick={em => {
            editorRef.current?.focus();
            exec("insertText", em);
          }} onClose={() => setShowEmoji(false)} />}
          </div>
        </div>
      </div>

      {/* ── Upload file row ── */}
      <div className="ap-rich-text-file-editor-27">
        <label className="ap-rich-text-file-editor-28">
          <Ic size={13} viewBox="0 0 14 14" strokeWidth="1.8">
            <path d="M2 10v2h10v-2" /><line x1="7" y1="2" x2="7" y2="9" /><polyline points="4.5,4.5 7,2 9.5,4.5" />
          </Ic>
          Upload File
          <input type="file" multiple hidden accept="image/*,.pdf,.mp4,.doc,.docx" onChange={handleFiles} ref={fileRef} />
        </label>
        <span className="ap-rich-text-file-editor-29">PDF, JPG, PNG, MP4 · max 10 MB</span>
      </div>

      {/* ── File chips ── */}
      {files.length > 0 && <div className="ap-rich-text-file-editor-30">
          {files.map((f, i) => <div key={i} className="ap-rich-text-file-editor-31">
              <span className="ap-rich-text-file-editor-32">{fileIcon(f)}</span>
              <span className="ap-rich-text-file-editor-33">{f.name}</span>
              <span className="ap-rich-text-file-editor-34">{formatSize(f.size)}</span>
              <button onClick={() => removeFile(i)} className="ap-rich-text-file-editor-35">✕</button>
            </div>)}
        </div>}

      {/* Placeholder CSS */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] table { border-collapse: collapse; width: 100%; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #D1D5DB; padding: 5px 8px; min-width: 60px; }
        [contenteditable] a { color: #2563EB; text-decoration: underline; }
      `}</style>
    </div>;
};
export default RichTextFileEditor;
import { useRef, useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
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
}} className="ap-rich-text-editor-no-file-1">
    {children}
  </button>;
const Sep = () => <div className="ap-rich-text-editor-no-file-2" />;
const COLORS_GRID = ["var(--text-h1)", "var(--text-body)", "var(--text-muted)", "var(--text-faint)", "var(--border)", "var(--white)", "var(--danger-text)", "var(--brand)", "var(--xca8a04)", "var(--success-text)", "var(--info-text)", "var(--purple-text)", "var(--danger-border)", "var(--xfcd34d)", "var(--x6ee7b7)", "var(--x93c5fd)", "var(--xc4b5fd)", "var(--xf9a8d4)"];
const ColorPicker = ({
  onPick,
  onClose
}) => <div onMouseDown={e => e.preventDefault()} className="ap-rich-text-editor-no-file-3">
    {COLORS_GRID.map(c => <button key={c} onMouseDown={e => {
    e.preventDefault();
    onPick(c);
    onClose();
  }} style={{
    background: c
  }} className="ap-rich-text-editor-no-file-4" />)}
  </div>;
const EMOJIS = ["😊", "😂", "👍", "❤️", "🔥", "✅", "⚠️", "📌", "📎", "🎯", "💡", "🔧", "📞", "📧", "🚗", "🏠", "💰", "📅"];
const EmojiPicker = ({
  onPick,
  onClose
}) => <div onMouseDown={e => e.preventDefault()} className="ap-rich-text-editor-no-file-5">
    {EMOJIS.map(em => <button key={em} onMouseDown={e => {
    e.preventDefault();
    onPick(em);
    onClose();
  }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"} className="ap-rich-text-editor-no-file-6">{em}</button>)}
  </div>;

// ─── Main component ───────────────────────────────────────────────────────────
const RichTextEditorNoFile = ({
  placeholder = "Type here…",
  minHeight = 90,
  getValueRef
}) => {
  const editorRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeStates, setActiveStates] = useState({});
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
      justifyRight: document.queryCommandState("justifyRight")
    });
  };
  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };
  useEffect(() => {
    const handler = () => {
      setShowTextColor(false);
      setShowHighlight(false);
      setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const tb = COLORS.body;
  return <div className="ap-rich-text-editor-no-file-7">
      <div style={{
      border: `1.5px solid ${focused ? COLORS.brand : COLORS.border}`,
      boxShadow: focused ? "0 0 0 3px var(--xea580c18)" : "none"
    }} className="ap-rich-text-editor-no-file-8">

        {/* ── Toolbar ── */}
        <div className="ap-rich-text-editor-no-file-9">

          {/* Format select */}
          <select onMouseDown={e => e.stopPropagation()} onChange={e => exec("formatBlock", e.target.value)} className="ap-rich-text-editor-no-file-10">
            <option value="p">Normal</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
            <option value="h4">Heading 3</option>
          </select>

          <Sep />

          {/* Bold / Italic / Underline / Strike */}
          <Btn title="Bold" active={activeStates.bold} onClick={() => exec("bold")}>
            <strong className="ap-rich-text-editor-no-file-11">B</strong>
          </Btn>
          <Btn title="Italic" active={activeStates.italic} onClick={() => exec("italic")}>
            <em className="ap-rich-text-editor-no-file-12">I</em>
          </Btn>
          <Btn title="Underline" active={activeStates.underline} onClick={() => exec("underline")}>
            <u className="ap-rich-text-editor-no-file-13">U</u>
          </Btn>
          <Btn title="Strikethrough" active={activeStates.strikeThrough} onClick={() => exec("strikeThrough")}>
            <s className="ap-rich-text-editor-no-file-14">S</s>
          </Btn>

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

          <Sep />

          {/* Link */}
          <Btn title="Insert link" onClick={insertLink}>
            <Ic d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
          </Btn>

          {/* Text color */}
          <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-editor-no-file-15">
            <Btn title="Text color" onClick={() => {
            setShowHighlight(false);
            setShowEmoji(false);
            setShowTextColor(v => !v);
          }}>
              <div className="ap-rich-text-editor-no-file-16">
                <span className="ap-rich-text-editor-no-file-17">A</span>
                <div className="ap-rich-text-editor-no-file-18" />
              </div>
            </Btn>
            {showTextColor && <ColorPicker onPick={c => exec("foreColor", c)} onClose={() => setShowTextColor(false)} />}
          </div>

          {/* Highlight */}
          <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-editor-no-file-19">
            <Btn title="Highlight" onClick={() => {
            setShowTextColor(false);
            setShowEmoji(false);
            setShowHighlight(v => !v);
          }}>
              <div className="ap-rich-text-editor-no-file-20">
                <Ic viewBox="0 0 16 16" size={12}>
                  <path d="M3 13l2-2 6-6-2-2-6 6z" fill="#FCD34D" stroke="#CA8A04" strokeWidth="1" />
                  <line x1="2" y1="14" x2="14" y2="14" />
                </Ic>
                <div className="ap-rich-text-editor-no-file-21" />
              </div>
            </Btn>
            {showHighlight && <ColorPicker onPick={c => exec("hiliteColor", c)} onClose={() => setShowHighlight(false)} />}
          </div>

          <Sep />

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
      }} className="ap-rich-text-editor-no-file-22" />

        {/* ── Emoji button ── */}
        <div onMouseDown={e => e.stopPropagation()} className="ap-rich-text-editor-no-file-23">
          <div className="ap-rich-text-editor-no-file-24">
            <Btn title="Insert emoji" onClick={() => {
            setShowTextColor(false);
            setShowHighlight(false);
            setShowEmoji(v => !v);
          }} className="ap-rich-text-editor-no-file-25">
              <span className="ap-rich-text-editor-no-file-26">🙂</span>
            </Btn>
            {showEmoji && <EmojiPicker onPick={em => {
            editorRef.current?.focus();
            exec("insertText", em);
          }} onClose={() => setShowEmoji(false)} />}
          </div>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] a { color: #2563EB; text-decoration: underline; }
      `}</style>
    </div>;
};
export default RichTextEditorNoFile;
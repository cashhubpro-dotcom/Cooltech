// ─── src/components/layout/MagicImportPanel.jsx ───────────────────────────────
const FEATURES_LEFT = ['Client name & contact', 'Rates & totals', 'Dates & validity'];
const FEATURES_RIGHT = ['Line items & quantities', 'Notes & terms', 'Job type & description'];
const MagicImportPanel = ({
  setPanelOpen,
  status,
  error,
  dragActive,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  handleFileSelect
}) => {
  const inputId = 'magic-import-file-input';
  return <div className="ap-magic-import-panel-1">
      {/* Header */}
      <div className="ap-magic-import-panel-2">
        <div className="ap-magic-import-panel-3">
          <div className="ap-magic-import-panel-4">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v9M5 5L8 2l3 3" stroke="#E65100" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12h12v2H2z" fill="#E65100" opacity=".4" />
            </svg>
          </div>
          <div>
            <div className="ap-magic-import-panel-5">
              Magic Import
              <span className="ap-magic-import-panel-6">AI</span>
            </div>
            <div className="ap-magic-import-panel-7">AI-powered quotation parser</div>
          </div>
        </div>
        <button onClick={() => setPanelOpen(false)} className="ap-magic-import-panel-8">
          ✕
        </button>
      </div>

      {/* Drop zone */}
      <label htmlFor={inputId} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} style={{
      cursor: status === 'uploading' ? "default" : "pointer",
      border: `2px dashed ${dragActive ? '#E65100' : '#FDBA74'}`,
      background: dragActive ? "var(--brand-light)" : "white"
    }} className="ap-magic-import-panel-9">
        <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileSelect} disabled={status === 'uploading'} className="ap-magic-import-panel-10" />

        {status === 'uploading' ? <>
            <div className="ap-magic-import-panel-11" />
            <div className="ap-magic-import-panel-12">Reading your document…</div>
            <div className="ap-magic-import-panel-13">This usually takes a few seconds</div>
            <style>{`@keyframes magic-import-spin { to { transform: rotate(360deg); } }`}</style>
          </> : <>
            <div className="ap-magic-import-panel-14">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v9M5 5L8 2l3 3" stroke="#E65100" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12h12v2H2z" fill="#E65100" opacity=".4" />
              </svg>
            </div>
            <div className="ap-magic-import-panel-15">Drop your quotation here</div>
            <div className="ap-magic-import-panel-16">
              or <span className="ap-magic-import-panel-17">browse files</span>
            </div>
            <div className="ap-magic-import-panel-18">
              {['PDF', 'JPG', 'PNG', 'WEBP'].map(t => <span key={t} className="ap-magic-import-panel-19">
                  {t}
                </span>)}
            </div>
          </>}
      </label>

      {error && <div className="ap-magic-import-panel-20">
          ⚠ {error}
        </div>}

      {/* Feature list */}
      <div className="ap-magic-import-panel-21">
        <div className="ap-magic-import-panel-22">
          {FEATURES_LEFT.map(f => <div key={f}>• {f}</div>)}
        </div>
        <div className="ap-magic-import-panel-23">
          {FEATURES_RIGHT.map(f => <div key={f}>• {f}</div>)}
        </div>
      </div>
    </div>;
};
export default MagicImportPanel;